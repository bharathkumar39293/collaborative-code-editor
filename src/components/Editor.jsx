import React, { useEffect, useRef } from "react";
import { language, cmtheme } from "../atoms";
import { useRecoilValue } from "recoil";
import ACTIONS from "../actions/Actions";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/monokai.css";
import "codemirror/theme/material.css";
// Import all required language modes:
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/mode/clike/clike"; // C, C++, Java, etc.
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/scroll/simplescrollbars.css";

const Editor = ({ socketRef, roomId, onCodeChange }) => {
  const editorRef = useRef(null);
  const lang = useRecoilValue(language);
  const editorTheme = useRecoilValue(cmtheme);

  useEffect(() => {
    // Only run once; mode/theme can be changed via setOption
    editorRef.current = Codemirror.fromTextArea(
      document.getElementById("realtimeEditor"),
      {
        mode: lang, // Pass a string like "javascript" or "python"
        theme: editorTheme,
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
      }
    );

    editorRef.current.on("change", (instance, changes) => {
      const { origin } = changes;
      const code = instance.getValue();
      onCodeChange(code);
      if (origin !== "setValue") {
        socketRef.current.emit(ACTIONS.CODE_CHANGE, {
          roomId,
          code,
        });
      }
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea();
        editorRef.current = null;
      }
    };
  }, []); // Do NOT depend on lang/theme here

  // Dynamically update theme
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setOption("theme", editorTheme);
    }
  }, [editorTheme]);

  // Dynamically update language mode
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setOption("mode", lang);
    }
  }, [lang]);

  useEffect(() => {
    if (!socketRef.current) return;

    const handler = ({ code }) => {
      if (code !== null && editorRef.current) {
        editorRef.current.setValue(code);
      }
    };

    socketRef.current.on(ACTIONS.CODE_CHANGE, handler);

    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.CODE_CHANGE, handler);
      }
    };
  }, [socketRef]);

  return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
