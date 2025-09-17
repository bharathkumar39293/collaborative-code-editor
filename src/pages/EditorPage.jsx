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
  const [lang, setLang] = useRecoilState(language);
  const [theme, setTheme] = useRecoilState(cmtheme);

  const [clients, setClients] = useState([]);
  const socketRef = useRef(null);
  const codeRef = useRef(""); // Hold current code state
  const [externalCode, setExternalCode] = useState(""); // Trigger re-render on remote updates
  const initializedRef = useRef(false);

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
        setClients(clients);

        // Sync current code to the new client
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          code: codeRef.current,
          socketId,
        });
      });

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => prev.filter((client) => client.socketId !== socketId));
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

  // Callback when user types code locally
  function onCodeChangeHandler(code) {
    codeRef.current = code;
    if (socketRef.current) {
      socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code });
    }
  }

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
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
