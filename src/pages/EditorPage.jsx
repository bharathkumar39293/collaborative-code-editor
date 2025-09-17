import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Client from "../components/Client";
import Editor from "../components/Editor";
import Header from "../components/Header";
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

const EditorPage = () => {
  const LANGUAGE_TEMPLATES = {
    javascript: `// JavaScript template\nfunction main() {\n  console.log('Hello from JavaScript');\n}\n\nmain();\n`,
    python: `# Python template\ndef main():\n    print('Hello from Python')\n\nif __name__ == '__main__':\n    main()\n`,
    'text/x-java': `// Java template\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java");\n    }\n}\n`,
    'text/x-c++src': `// C++ template\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    cout << "Hello from C++" << endl;\n    return 0;\n}\n`,
    'text/plain': ``,
  };
  const [lang, setLang] = useRecoilState(language);
  const [theme, setTheme] = useRecoilState(cmtheme);

  const [clients, setClients] = useState([]);
  const socketRef = useRef(null);
  const codeRef = useRef(""); // Hold current code state
  const [externalCode, setExternalCode] = useState(""); // Trigger re-render on remote updates
  const initializedRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const location = useLocation();
  const { roomId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
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
        // Deduplicate by username to avoid showing the same person twice
        const uniqueByUsername = Array.from(
          clients.reduce((map, c) => {
            if (!map.has(c.username)) {
              map.set(c.username, c);
            }
            return map;
          }, new Map()).values()
        );
        setClients(uniqueByUsername);

        // Sync current code to the new client
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          code: codeRef.current,
          socketId,
        });
      });

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => prev.filter((client) => client.username !== username));
      });

      // Handle incoming code changes and update editor content
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null && code !== codeRef.current) {
          codeRef.current = code;
          setExternalCode(code);
        }
      });
    };
    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [location.state, navigate, roomId]);

  // Insert standard template code when language changes
  useEffect(() => {
    const template = LANGUAGE_TEMPLATES[lang];
    if (template === undefined || template === null) return;

    codeRef.current = template;
    setExternalCode(template);
    if (socketRef.current) {
      socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code: template });
    }
  }, [lang]);

  // Callback when user types code locally
  function onCodeChangeHandler(code) {
    codeRef.current = code;
    if (socketRef.current) {
      socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code });
    }
  }

  // Execute code based on selected language
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
          // Use Function constructor for safer execution
          const func = new Function(codeRef.current);
          const originalConsole = console.log;
          const logs = [];
          console.log = (...args) => logs.push(args.join(" "));
          func();
          console.log = originalConsole;
          result = logs.join("\n");
          break;
          
        case "python":
          // For Python, we'd need a backend service or WASM
          result = "Python execution requires backend service (not implemented yet)";
          break;
          
        case "text/x-java":
          result = "Java execution requires compilation service (not implemented yet)";
          break;
          
        case "text/x-c++src":
          result = "C++ execution requires compilation service (not implemented yet)";
          break;
          
        case "text/plain":
          result = "Plain text - no execution needed";
          break;
          
        default:
          result = "Language not supported for execution";
      }
      
      setOutput(result);
      toast.success("Code executed successfully");
    } catch (err) {
      setError(err.message);
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

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className="pageWrap">
      <Header
        roomId={roomId}
        connected={!!socketRef.current}
        onCopyRoomId={copyRoomId}
        onCopyInviteLink={copyInviteLink}
      />
      <div className="mainWrap">
        <div className="aside">
        <div className="asideInner">
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
          <div className="actions" style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button className="btn copyBtn" onClick={copyRoomId}>
              Copy Room ID
            </button>
            <button className="btn copyBtn" onClick={copyInviteLink}>
              Copy Invite Link
            </button>
          </div>
        </div>

        <label>
          Select Language:
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="seLang"
          >
            <option value="text/plain">Text</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="text/x-java">Java</option>
            <option value="text/x-c++src">C/C++</option>
          </select>
        </label>

        <label>
          Select Theme:
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="seLang"
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
        </label>
        </div>

        <div className="editorWrap">
          <Editor
            socketRef={socketRef}
            roomId={roomId}
            lang={lang}
            theme={theme}
            onCodeChange={onCodeChangeHandler}
            externalCode={externalCode}
          />
          <div className="executionPanel">
            <div className="executionControls">
              <button 
                className="btn runBtn" 
                onClick={executeCode}
                disabled={isRunning}
              >
                {isRunning ? "Running..." : "▶ Run Code"}
              </button>
              <span className="executionInfo">
                {lang === "javascript" ? "JavaScript (Browser)" : 
                 lang === "python" ? "Python (Backend needed)" :
                 lang === "text/x-java" ? "Java (Compilation needed)" :
                 lang === "text/x-c++src" ? "C++ (Compilation needed)" :
                 "Text Mode"}
              </span>
            </div>
            {(output || error) && (
              <div className="outputPanel">
                <div className="outputHeader">Output:</div>
                <pre className="outputContent">
                  {error ? `Error: ${error}` : output || "No output"}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
