import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { language, cmtheme } from "../atoms";
import { useRecoilState } from "recoil";
import ACTIONS from "../actions/Actions";
import { initSocket } from "../socket";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";
import { LANGUAGE_TEMPLATES } from "../constants/templates";
import Header from "../components/Header";

const EditorPage = () => {
  const [lang, setLang] = useRecoilState(language);
  const [theme, setTheme] = useRecoilState(cmtheme);

  const [clients, setClients] = useState([]);
  const socketRef = useRef(null);
  const codeRef = useRef("");
  const initializedRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const pyodideRef = useRef(null);
  const [pyodideLoading, setPyodideLoading] = useState(false);

  // ... (Keep existing EnsurePyodide and resolveApiBase functions same as before)
  async function ensurePyodide() {
    if (pyodideRef.current) return pyodideRef.current;
    setPyodideLoading(true);
    try {
      if (typeof window.loadPyodide !== 'function') {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      const pyodide = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' });
      pyodideRef.current = pyodide;
      return pyodide;
    } finally {
      setPyodideLoading(false);
    }
  }

  const resolveApiBase = () => {
    const envUrl = import.meta?.env?.VITE_SOCKET_SERVER_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim()) return envUrl.trim();
    if (typeof window !== 'undefined') {
      const { origin, hostname, port } = window.location;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (port === '5173') return 'http://localhost:5000';
        return origin;
      }
      return origin;
    }
    return '';
  };

  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      socketRef.current = await initSocket();

      if (!location.state || !location.state.username) {
        navigate("/");
        return;
      }

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("Socket connection error", e);
        toast.error("Socket connection failed, try again later.");
        navigate("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state.username,
      });

      socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
        if (username !== location.state.username) {
          toast.success(`${username} joined the room.`);
        }
        const uniqueBySocketId = Array.from(
          clients.reduce((map, c) => {
            if (!map.has(c.socketId)) map.set(c.socketId, c);
            return map;
          }, new Map()).values()
        );
        setClients(uniqueBySocketId);
      });

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => prev.filter((client) => client.socketId !== socketId));
      });
    };
    init();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [location.state, navigate, roomId]);

  useEffect(() => {
    const template = LANGUAGE_TEMPLATES[lang];
    if (template === undefined || template === null) return;
    codeRef.current = template;
    if (lang === 'python' && !pyodideRef.current) {
      ensurePyodide().catch((e) => toast.error('Failed to load Python runtime'));
    }
  }, [lang]);

  function onCodeChangeHandler(code) {
    codeRef.current = code;
  }

  const executeCode = async () => {
    if (!codeRef.current.trim()) {
      toast.error("No code to execute");
      return;
    }

    setIsRunning(true);
    setOutput("");
    setError("");

    try {
      let result = "";

      switch (lang) {
        case "javascript":
          const func = new Function(codeRef.current);
          const logs = [];
          const errs = [];
          const originalLog = console.log;
          const originalErr = console.error;
          try {
            console.log = (...args) => logs.push(args.map(String).join(" "));
            console.error = (...args) => errs.push(args.map(String).join(" "));
            func();
          } finally {
            console.log = originalLog;
            console.error = originalErr;
          }
          result = (errs.length ? `Error: ${errs.join("\n")}\n` : "") + (logs.join("\n"));
          break;

        case "python":
          const pyodide = await ensurePyodide();
          await pyodide.runPythonAsync(`
import sys, io, json, traceback
def __exec_and_capture(source):
    stdout, stderr = io.StringIO(), io.StringIO()
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = stdout, stderr
    try:
        exec(source, {"__name__": "__main__"})
    except Exception:
        traceback.print_exc()
    finally:
        sys.stdout, sys.stderr = old_out, old_err
    return json.dumps({"out": stdout.getvalue(), "err": stderr.getvalue()})
          `);
          const pyResultJson = await pyodide.runPythonAsync(`__exec_and_capture(${JSON.stringify(codeRef.current)})`);
          try {
            const parsed = JSON.parse(pyResultJson);
            result = parsed.out || (parsed.err ? `Error: ${parsed.err}` : "");
          } catch (e) {
            result = String(pyResultJson);
          }
          break;

        case "text/x-java":
        case "text/x-c++src":
        case "text/x-csrc":
          try {
            const apiBase = resolveApiBase();
            const resp = await fetch(`${apiBase}/api/run`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ language: lang, code: codeRef.current }),
            });
            const raw = await resp.text();
            let json;
            try { json = raw ? JSON.parse(raw) : null; } catch { json = null; }
            if (!resp.ok) {
              const errorMsg = json?.error || raw || 'Execution failed';
              const detail = json?.detail ? `\nDetails: ${json.detail}` : '';
              throw new Error(`${errorMsg}${detail}`);
            }
            const stdout = json?.stdout || '';
            const stderr = json?.stderr || '';
            const exitCode = json?.exitCode;
            let output = '';
            if (stderr) output += `Error: ${stderr}\n`;
            if (stdout) output += stdout;
            if (exitCode && exitCode !== 0 && !stderr) {
              output += `\nProgram exited with code ${exitCode}`;
            }
            result = output || 'No output';
          } catch (e) {
            result = `Error: ${e.message}`;
          }
          break;

        case "text/plain":
          result = "Plain text - no execution needed";
          break;

        default:
          result = "Language not supported for execution";
      }

      setOutput(result || "");
      setHasRun(true);
      toast.success("Code executed successfully");
    } catch (err) {
      setError(err.message);
      setHasRun(true);
      toast.error("Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied");
    } catch (e) {
      toast.error("Failed to copy Room ID");
    }
  }

  async function copyInviteLink() {
    try {
      const link = `${window.location.origin}/editor/${roomId}`;
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied");
    } catch (e) {
      toast.error("Failed to copy link");
    }
  }

  if (!location.state) return <Navigate to="/" />;

  return (
    <div className="flex-col" style={{ height: '100vh', width: '100vw', background: 'var(--bg-app)' }}>
      <Header
        roomId={roomId}
        connected={socketRef.current?.connected}
        onCopyRoomId={copyRoomId}
        onCopyInviteLink={copyInviteLink}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside className="glass-panel animate-fade" style={{
          width: 'var(--sidebar-width)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          gap: '24px',
          borderRight: '1px solid var(--border-light)',
          borderRadius: '0',
          zIndex: 10
        }}>
          {/* Controls */}
          <div className="flex-col gap-4">
            <div className="flex-col gap-2">
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Programming Language
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-main)',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <option value="text/plain">Text</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="text/x-java">Java</option>
                <option value="text/x-c++src">C/C++</option>
              </select>
            </div>

            <div className="flex-col gap-2">
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Editor Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-main)',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <option value="monokai">Monokai</option>
                <option value="material">Material</option>
                <option value="material-darker">Material Darker</option>
                <option value="material-palenight">Material Palenight</option>
                <option value="dracula">Dracula</option>
                <option value="twilight">Twilight</option>
                <option value="cobalt">Cobalt</option>
                <option value="eclipse">Eclipse</option>
                <option value="blackboard">Blackboard</option>
                <option value="neo">Neo</option>
                <option value="nord">Nord</option>
                <option value="seti">Seti</option>
                <option value="rubyblue">Ruby Blue</option>
                <option value="midnight">Midnight</option>
              </select>
            </div>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'var(--border-light)' }} />

          {/* Connected Users */}
          <div style={{ flex: 1, overflowY: 'auto' }} className="flex-col gap-3">
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Collaborators ({clients.length})
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', gap: '12px' }}>
              {clients.map((client) => (
                <Client key={client.socketId} username={client.username} />
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.2)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: '1.4' }}>
              Tip: Code is automatically saved and synced with everyone in the room.
            </p>
          </div>
        </aside>

        {/* Main Editor Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

          {/* Floating Execution Info */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '25px',
            zIndex: 10,
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}>
            <div className="glass-panel animate-slide-up" style={{ padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
              {lang === "javascript" ? "JS / Browser" :
                lang === "python" ? (pyodideLoading ? "Python / Loading..." : "Python / WebAssembly") :
                  lang === "text/x-java" ? "Java / Remote" :
                    lang === "text/x-c++src" ? "C++ / Docker Sandbox" :
                      "Text Editor"}
            </div>
            <button
              className="btn-primary"
              onClick={executeCode}
              disabled={isRunning || (lang === "python" && pyodideLoading)}
              style={{ padding: '8px 20px' }}
            >
              {isRunning ? "Running..." : "▶ Run"}
            </button>
          </div>

          {/* Editor */}
          <section style={{ flex: 1, overflow: 'hidden' }} className="animate-fade">
            <Editor
              socketRef={socketRef}
              roomId={roomId}
              lang={lang}
              theme={theme}
              onCodeChange={onCodeChangeHandler}
              username={location.state?.username}
            />
          </section>

          {/* Terminal / Output Panel */}
          {hasRun && (
            <section className="glass-panel animate-slide-up" style={{
              height: '35%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '0',
              borderTop: '2px solid var(--primary)',
              zIndex: 20
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 24px',
                borderBottom: '1px solid var(--border-light)',
                background: 'rgba(0,0,0,0.3)',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: error ? '#ef4444' : '#22c55e' }} />
                  <span style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Output Terminal
                  </span>
                </div>
                <button
                  onClick={() => setHasRun(false)}
                  className="btn-ghost"
                  style={{ padding: '4px 8px', borderRadius: '4px', border: 'none' }}
                >
                  ✕
                </button>
              </div>
              <pre style={{
                padding: '24px',
                margin: 0,
                flex: 1,
                overflow: 'auto',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px',
                lineHeight: '1.6',
                color: error ? '#f87171' : 'var(--text-main)',
                whiteSpace: 'pre-wrap',
                background: 'rgba(15, 23, 42, 0.5)'
              }}>
                {error ? `[ERROR]\n${error}` : output || "Program finished with no output."}
              </pre>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default EditorPage;
