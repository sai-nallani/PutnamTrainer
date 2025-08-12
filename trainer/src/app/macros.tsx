"use client";
import React, { useEffect, useRef, useState } from "react";
import { getMacros, saveMacros } from "./idb";

async function validateTeX(tex: string): Promise<boolean> {
  if (!window.MathJax || !tex.trim()) return true;
  try {
    const div = document.createElement("div");
    div.style.display = "none";
    document.body.appendChild(div);
    div.innerHTML = `\\(${tex}\\)`;
    try {
      if (window.MathJax.typesetPromise) {
        await window.MathJax.typesetPromise();
      }
      document.body.removeChild(div);
      return true;
    } catch {
      document.body.removeChild(div);
      return false;
    }
  } catch {
    return false;
  }
}

export default function MacrosEditor() {
  const [macros, setMacros] = useState("");
  const [status, setStatus] = useState<string>("");
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getMacros().then((m) => setMacros(m ?? ""));
  }, []);

  useEffect(() => {
    if (!window.MathJax) return;
    if (previewRef.current) {
      previewRef.current.innerHTML = `\\(${macros}\\)`;
      if (window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
      }
    }
  }, [macros]);

  function parseMacros(str: string): Record<string, string> {
    // Parse lines like \newcommand{\R}{\mathbb{R}} into { R: "\\mathbb{R}" }
    const macros: Record<string, string> = {};
    const lines = str.split(/\n/);
    for (const line of lines) {
      const m = line.match(/\\newcommand\{\\(\w+)\}\{([^}]*)\}/);
      if (m) macros[m[1]] = m[2];
    }
    return macros;
  }

  const handleSave = async () => {
    if (!macros.trim()) {
      await saveMacros("");
      window.__PUTNAM_MACROS = {};
      setStatus("Macros cleared.");
      return;
    }
    const valid = await validateTeX(macros);
    if (valid) {
      await saveMacros(macros);
      window.__PUTNAM_MACROS = parseMacros(macros);
      setStatus("Macros saved!");
    } else {
      await saveMacros("");
      window.__PUTNAM_MACROS = {};
      setMacros("");
      setStatus("Invalid TeX. Macros cleared.");
    }
  };

  return (
    <div className="putnam-container" style={{ maxWidth: 600 }}>
      <h2 className="putnam-title">Edit LaTeX Macros (MathJax)</h2>
      <p style={{ color: "var(--pt-text)", marginBottom: "1rem" }}>
        Enter your custom LaTeX macros/preamble below. These will be placed in <code>\( ... \)</code> delimiters and used in all MathJax rendering. If your TeX is invalid, the macros will be cleared and a warning shown.
      </p>
      <textarea
        className="notes-input macros-input"
        value={macros}
        onChange={(e) => setMacros(e.target.value)}
        rows={4}
        style={{ marginBottom: "1rem" }}
        placeholder="e.g. \\newcommand{\\R}{\\mathbb{R}}"
      />
      <button className="putnam-button" onClick={handleSave} style={{ marginBottom: "1rem" }}>
        Save Macros
      </button>
      <div style={{ color: "var(--pt-accent)", minHeight: "1.5em" }}>{status}</div>
      <div className="notes-preview" ref={previewRef} style={{ marginTop: "1.5rem" }} />
    </div>
  );
}
