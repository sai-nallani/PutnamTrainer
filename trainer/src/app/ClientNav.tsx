"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

//

function setRootAttr(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(name, value);
}

function setRootVar(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(name, value);
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  if (h.length === 6) {
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }
  // fallback
  return { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(Math.round(r))}${toHex(Math.round(g))}${toHex(Math.round(b))}`;
}

function mix(hex1: string, hex2: string, t: number) {
  const a = hexToRgb(hex1);
  const b = hexToRgb(hex2);
  const r = a.r + (b.r - a.r) * t;
  const g = a.g + (b.g - a.g) * t;
  const bl = a.b + (b.b - a.b) * t;
  return rgbToHex(r, g, bl);
}

export default function ClientNav() {
  // Use SSR-stable defaults; update from localStorage after mount to avoid hydration mismatch
  const [theme, setTheme] = useState<string>("dark");
  const [font, setFont] = useState<string>("serif");
  const [bold, setBold] = useState<string>("false");
  const [themeScale, setThemeScale] = useState<number>(0);

  const DARK = useMemo(() => ({
    bg: '#111111',
    surface: '#181818',
    text: '#ffffff',
    accent: '#80bfff',
    border: '#333333',
  }), []);
  const LIGHT = useMemo(() => ({
    bg: '#fafafa',
    surface: '#ffffff',
    text: '#111111',
    accent: '#0a84ff',
    border: '#e5e5e5',
  }), []);

  // After mount, load saved prefs and apply
  useEffect(() => {
    try {
      const t = localStorage.getItem('pt-theme');
      const f = localStorage.getItem('pt-font');
      const b = localStorage.getItem('pt-bold');
      const s = localStorage.getItem('pt-theme-scale');
      if (t === 'light' || t === 'dark') setTheme(t);
      if (f === 'serif' || f === 'sans') setFont(f);
      if (b === 'true' || b === 'false') setBold(b);
      const sn = s ? Number(s) : NaN;
      if (Number.isFinite(sn)) setThemeScale(Math.min(100, Math.max(0, sn)));
    } catch {}
  }, []);

  useEffect(() => {
    setRootAttr("data-theme", theme);
    localStorage.setItem("pt-theme", theme);
  }, [theme]);

  useEffect(() => {
    setRootAttr("data-font", font);
    localStorage.setItem("pt-font", font);
  }, [font]);

  useEffect(() => {
    setRootAttr("data-bold", bold);
    localStorage.setItem("pt-bold", bold);
  }, [bold]);

  // Apply gradient theme based on themeScale [0..100]
  useEffect(() => {
    const t = Math.min(100, Math.max(0, themeScale)) / 100;
    // Update variables progressively
    setRootVar('--pt-bg', mix(DARK.bg, LIGHT.bg, t));
    setRootVar('--pt-surface', mix(DARK.surface, LIGHT.surface, t));
    setRootVar('--pt-text', mix(DARK.text, LIGHT.text, t));
    setRootVar('--pt-accent', mix(DARK.accent, LIGHT.accent, t));
    setRootVar('--pt-border', mix(DARK.border, LIGHT.border, t));
    // Keep a coarse theme attribute for compatibility
    setRootAttr('data-theme', t >= 0.5 ? 'light' : 'dark');
    localStorage.setItem('pt-theme-scale', String(themeScale));
  }, [themeScale, DARK, LIGHT]);

  return (
    <nav className="pt-navbar">
      <div className="pt-navbar-inner">
  <Link href="/" className="pt-brand" style={{ textDecoration: 'none', color: 'inherit' }}>Putnam Trainer</Link>
        <div className="pt-controls">
          <div className="pt-group" role="group" aria-label="Font family">
            <button
              className={`pt-btn ${font === "serif" ? "active" : ""}`}
              onClick={() => setFont("serif")}
              aria-pressed={font === "serif"}
            >
              Serif
            </button>
            <button
              className={`pt-btn ${font === "sans" ? "active" : ""}`}
              onClick={() => setFont("sans")}
              aria-pressed={font === "sans"}
            >
              Sans
            </button>
          </div>

          <label className="pt-checkbox">
            <input
              type="checkbox"
              checked={bold === "true"}
              onChange={(e) => setBold(e.target.checked ? "true" : "false")}
            />
            <span>Bold</span>
          </label>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="pt-range-label">Dark</span>
            <input
              className="pt-range"
              type="range"
              min={0}
              max={100}
              step={1}
              value={themeScale}
              onChange={(e) => setThemeScale(Number(e.target.value))}
              aria-label="Theme (Dark to Light)"
            />
            <span className="pt-range-label">Light</span>
          </div>
          <Link href="/macros" className="putnam-button" style={{ fontWeight: 700, marginLeft: '0.5rem' }}>
            Edit LaTeX Macros
          </Link>
        </div>
      </div>
    </nav>
  );
}
