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

const EditorPage = () => {
  const [lang, setLang] = useRecoilState(language);
  const [them, setThem] = useRecoilState(cmtheme);

  const [clients, setClients] = useState([]);
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      const joinedHandler = ({ clients, username, socketId }) => {
        if (username !== location.state?.username) {
          toast.success(`${username} joined the room.`);
          console.log(`${username} joined`);
        }
        setClients(clients);
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          code: codeRef.current,
          socketId,
        });
      };

      const disconnectedHandler = ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => prev.filter((client) => client.socketId !== socketId));
      };

      socketRef.current.on(ACTIONS.JOINED, joinedHandler);
      socketRef.current.on(ACTIONS.DISCONNECTED, disconnectedHandler);

      // Store handlers so they can be used in cleanup
      socketRef.current._joinedHandler = joinedHandler;
      socketRef.current._disconnectedHandler = disconnectedHandler;
    };
    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.JOINED, socketRef.current._joinedHandler);
        socketRef.current.off(ACTIONS.DISCONNECTED, socketRef.current._disconnectedHandler);
        socketRef.current.disconnect();
      }
    };
  }, []);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to clipboard");
    } catch (err) {
      toast.error("Could not copy the Room ID");
      console.error(err);
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src="/logo.png" alt="logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>

        <label>
          Select Language:
          <select
            value={lang}
            onChange={(e) => {
              setLang(e.target.value);
              window.location.reload();
            }}
            className="seLang"
          >
            {/* options omitted for brevity, keep as in your original */}
          </select>
        </label>

        <label>
          Select Theme:
          <select
            value={them}
            onChange={(e) => {
              setThem(e.target.value);
            }}
            className="seLang"
          >
            {/* options omitted for brevity, keep as in your original */}
          </select>
        </label>

        <button className="btn copyBtn" onClick={copyRoomId}>
          Copy ROOM ID
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave
        </button>
      </div>

      <div className="editorWrap">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            console.log("on code change" + code);
            codeRef.current = code;
          }}
        />
      </div>
    </div>
  );
};

export default EditorPage;
