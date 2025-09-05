import React, { useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";
import { language, cmtheme } from "../atoms";
import ACTIONS from "../actions/Actions";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/monokai.css";
import "codemirror/theme/material.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/mode/clike/clike";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";

const Editor = ({ socketRef, roomId, onCodeChange, externalCode }) => {
  const editorRef = useRef(null);
  const lang = useRecoilValue(language);
  const editorTheme = useRecoilValue(cmtheme);

  // Flag to prevent echo update loops
  const isUpdatingFromExternal = useRef(false);

  useEffect(() => {
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

    editorRef.current.on("change", (instance, changes) => {
      const { origin } = changes;
      if (origin === "setValue") {
        // Ignore changes triggered by setValue to avoid loops
        return;
      }
      const code = instance.getValue();

      // Prevent emitting if we are updating from external code
      if (!isUpdatingFromExternal.current) {
        onCodeChange(code);
        if (socketRef.current) {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code });
        }
      }
    });

    return () => {
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

  // Update editor content when external code updates
  useEffect(() => {
    if (externalCode != null && editorRef.current) {
      if (externalCode !== editorRef.current.getValue()) {
        isUpdatingFromExternal.current = true;
        editorRef.current.setValue(externalCode);
        isUpdatingFromExternal.current = false;
      }
    }
  }, [externalCode]);

  return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
