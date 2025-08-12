"use client";

import React, { useEffect, useMemo, useRef } from "react";

export interface NotesEditorProps {
  value: string;
  onChange: (next: string) => void;
  label?: string;
}

function escapeHtml(s: string) {
  return s
    .replaceAll(/&/g, "&amp;")
    .replaceAll(/</g, "&lt;")
    .replaceAll(/>/g, "&gt;");
}

export default function NotesEditor({ value, onChange, label = "Notes" }: NotesEditorProps) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const html = useMemo(() => {
    const escaped = escapeHtml(value || "");
    // Preserve newlines for readability; MathJax will still find $...$
    return escaped.replaceAll(/\n/g, "<br/>");
  }, [value]);

  // Typeset only the preview container when notes change (debounced via RAF)
  useEffect(() => {
    let raf = 0;
    raf = window.requestAnimationFrame(() => {
      try {
        if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
          if (previewRef.current) {
            // @ts-expect-error MathJax v4 accepts elements list
            window.MathJax.typesetPromise([previewRef.current]);
          }
        }
      } catch {}
    });
    return () => window.cancelAnimationFrame(raf);
  }, [html]);

  return (
    <div className="notes-editor">
      <label className="notes-label">{label}</label>
      <textarea
        className="notes-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder="Write your thoughts, partial solutions, or links..."
      />
      <div className="notes-preview" ref={previewRef} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
 