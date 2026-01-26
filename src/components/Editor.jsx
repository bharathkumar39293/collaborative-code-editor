import React, { useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { CodemirrorBinding } from "y-codemirror";
import { useRecoilValue } from "recoil";
import { language, cmtheme } from "../atoms";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/monokai.css";
import "codemirror/theme/material.css";
import "codemirror/theme/material-darker.css";
import "codemirror/theme/material-palenight.css";
import "codemirror/theme/dracula.css";
import "codemirror/theme/cobalt.css";
import "codemirror/theme/eclipse.css";
import "codemirror/theme/blackboard.css";
import "codemirror/theme/neo.css";
import "codemirror/theme/midnight.css";
import "codemirror/theme/rubyblue.css";
import "codemirror/theme/seti.css";
import "codemirror/theme/twilight.css";
import "codemirror/theme/nord.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/mode/clike/clike";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";

const Editor = ({ roomId, onCodeChange }) => {
  const editorRef = useRef(null);
  const lang = useRecoilValue(language);
  const editorTheme = useRecoilValue(cmtheme);

  useEffect(() => {
    // Initialize CodeMirror
    editorRef.current = Codemirror.fromTextArea(
      document.getElementById("realtimeEditor"),
      {
        mode: lang,
        theme: editorTheme,
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
      }
    );

    // Initialize Yjs
    const doc = new Y.Doc();

    // Construct WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_SOCKET_SERVER_URL
      ? new URL(import.meta.env.VITE_SOCKET_SERVER_URL).host
      : 'localhost:5000';
    const wsUrl = `${protocol}//${host}/yjs`;

    const provider = new WebsocketProvider(wsUrl, roomId, doc);

    const yText = doc.getText("codemirror");

    // Bind Yjs to CodeMirror
    const binding = new CodemirrorBinding(yText, editorRef.current, provider.awareness);

    // Listen for local changes to update parent state (for execution)
    editorRef.current.on("change", (instance) => {
      const code = instance.getValue();
      onCodeChange(code);
    });

    return () => {
      if (provider) {
        provider.disconnect();
        provider.destroy(); // Ensure refined cleanup
      }
      if (doc) {
        doc.destroy();
      }
      if (binding) {
        binding.destroy();
      }
      if (editorRef.current) {
        editorRef.current.toTextArea();
        editorRef.current = null;
      }
    };
  }, []); // Run only once on mount

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setOption("theme", editorTheme);
    }
  }, [editorTheme]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setOption("mode", lang);
    }
  }, [lang]);

  return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
