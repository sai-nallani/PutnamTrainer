"use client";
import React, { useEffect, useMemo, useState } from "react";

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
  return { r: 0, g: 0, b: 0 };
}
function rgbToHex(r: number, g: number, b: number) {
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(Math.round(r))}${toHex(Math.round(g))}${toHex(Math.round(b))}`;
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}
function hslToRgb(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (0 <= hp && hp < 1) { r = c; g = x; b = 0; }
  else if (1 <= hp && hp < 2) { r = x; g = c; b = 0; }
  else if (2 <= hp && hp < 3) { r = 0; g = c; b = x; }
  else if (3 <= hp && hp < 4) { r = 0; g = x; b = c; }
  else if (4 <= hp && hp < 5) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const m = l - c / 2;
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}
function hslToHex(h: number, s: number, l: number) {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}
function lerpHue(a: number, b: number, t: number) {
  let delta = ((b - a + 540) % 360) - 180;
  return (a + delta * t + 360) % 360;
}
function smoothstep(t: number) { return t * t * (3 - 2 * t); }
function mixHsl(hex1: string, hex2: string, t: number) {
  const a = hexToRgb(hex1); const b = hexToRgb(hex2);
  const A = rgbToHsl(a.r, a.g, a.b);
  const B = rgbToHsl(b.r, b.g, b.b);
  const tt = smoothstep(Math.min(1, Math.max(0, t)));
  const h = lerpHue(A.h, B.h, tt);
  const s = A.s + (B.s - A.s) * tt;
  const l = A.l + (B.l - A.l) * tt;
  return hslToHex(h, s, l);
}

export default function VisualPage() {
  const [scheme, setScheme] = useState<string>("Classic");
  const [themeScale, setThemeScale] = useState<number>(0);
  const [loaded, setLoaded] = useState(false);
  const [font, setFont] = useState<'serif' | 'sans'>('serif');
  const [bold, setBold] = useState<'true' | 'false'>('false');

  const SCHEMES = useMemo(() => ({
    Classic: {
      dark: { bg: '#111111', surface: '#181818', text: '#ffffff', accent: '#80bfff', border: '#333333' },
      light: { bg: '#fafafa', surface: '#ffffff', text: '#111111', accent: '#0a84ff', border: '#e5e5e5' }
    },
    Midnight: {
      dark: { bg: '#0f1220', surface: '#171a2a', text: '#e7ecff', accent: '#7aa2ff', border: '#2a2f4a' },
      light: { bg: '#edf1ff', surface: '#ffffff', text: '#0f1220', accent: '#3b6cff', border: '#d5dbff' }
    },
    Solarized: {
      dark: { bg: '#002b36', surface: '#073642', text: '#eee8d5', accent: '#b58900', border: '#0d3640' },
      light: { bg: '#fdf6e3', surface: '#ffffff', text: '#073642', accent: '#268bd2', border: '#e6dfc8' }
    },
    Sepia: {
      dark: { bg: '#1c1812', surface: '#2a241b', text: '#f0e7db', accent: '#d4a657', border: '#3a3328' },
      light: { bg: '#f7f2e7', surface: '#fffaf0', text: '#3b2f1a', accent: '#b8873a', border: '#e5dccb' }
    },
    Contrast: {
      dark: { bg: '#000000', surface: '#0e0e0e', text: '#ffffff', accent: '#00e5ff', border: '#444444' },
      light: { bg: '#ffffff', surface: '#ffffff', text: '#000000', accent: '#0066ff', border: '#000000' }
    }
  }), []);

  const DARK = useMemo(() => SCHEMES[scheme as keyof typeof SCHEMES].dark, [SCHEMES, scheme]);
  const LIGHT = useMemo(() => SCHEMES[scheme as keyof typeof SCHEMES].light, [SCHEMES, scheme]);

  useEffect(() => {
    try {
      const s = localStorage.getItem('pt-theme-scale');
      const cs = localStorage.getItem('pt-scheme');
  const f = localStorage.getItem('pt-font');
  const b = localStorage.getItem('pt-bold');
      const sn = s ? Number(s) : NaN;
      if (Number.isFinite(sn)) setThemeScale(Math.min(100, Math.max(0, sn)));
      if (cs && (cs in SCHEMES)) setScheme(cs);
  if (f === 'serif' || f === 'sans') setFont(f);
  if (b === 'true' || b === 'false') setBold(b);
    } catch {}
    setLoaded(true);
  }, [SCHEMES]);

  // Resync when window regains focus (if user changed appearance elsewhere)
  useEffect(() => {
    const onFocus = () => {
      try {
        const s = localStorage.getItem('pt-theme-scale');
        const cs = localStorage.getItem('pt-scheme');
  const f = localStorage.getItem('pt-font');
  const b = localStorage.getItem('pt-bold');
        const sn = s ? Number(s) : NaN;
        if (Number.isFinite(sn)) setThemeScale(Math.min(100, Math.max(0, sn)));
        if (cs && (cs in SCHEMES)) setScheme(cs);
  if (f === 'serif' || f === 'sans') setFont(f);
  if (b === 'true' || b === 'false') setBold(b);
      } catch {}
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [SCHEMES]);

  useEffect(() => {
    setRootVar('--pt-range-start', DARK.bg);
    setRootVar('--pt-range-end', LIGHT.bg);
  }, [DARK, LIGHT]);

  // Apply font and bold attributes and persist
  useEffect(() => {
    setRootAttr('data-font', font);
    if (loaded) localStorage.setItem('pt-font', font);
  }, [font, loaded]);
  useEffect(() => {
    setRootAttr('data-bold', bold);
    if (loaded) localStorage.setItem('pt-bold', bold);
  }, [bold, loaded]);

  useEffect(() => {
    const t = Math.min(100, Math.max(0, themeScale)) / 100;
    setRootVar('--pt-bg', mixHsl(DARK.bg, LIGHT.bg, t));
    setRootVar('--pt-surface', mixHsl(DARK.surface, LIGHT.surface, t));
    setRootVar('--pt-text', mixHsl(DARK.text, LIGHT.text, t));
    setRootVar('--pt-accent', mixHsl(DARK.accent, LIGHT.accent, t));
    setRootVar('--pt-border', mixHsl(DARK.border, LIGHT.border, t));
    setRootAttr('data-theme', t >= 0.5 ? 'light' : 'dark');
    if (loaded) localStorage.setItem('pt-theme-scale', String(themeScale));
  }, [themeScale, DARK, LIGHT, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem('pt-scheme', scheme);
  }, [scheme, loaded]);

  return (
    <div className="putnam-container" style={{ maxWidth: 900 }}>
      <h1 className="putnam-title">Appearance</h1>
      <div className="putnam-problem" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span className="pt-range-label">Font</span>
          <div className="pt-group" role="group" aria-label="Font family">
            <button
              className={`pt-btn ${font === 'serif' ? 'active' : ''}`}
              onClick={() => { setFont('serif'); try { localStorage.setItem('pt-font', 'serif'); } catch {} }}
              aria-pressed={font === 'serif'}
            >
              Serif
            </button>
            <button
              className={`pt-btn ${font === 'sans' ? 'active' : ''}`}
              onClick={() => { setFont('sans'); try { localStorage.setItem('pt-font', 'sans'); } catch {} }}
              aria-pressed={font === 'sans'}
            >
              Sans
            </button>
          </div>
          <label className="pt-checkbox" style={{ marginLeft: '0.25rem' }}>
            <input
              type="checkbox"
              checked={bold === 'true'}
              onChange={(e) => { const v = e.target.checked ? 'true' : 'false'; setBold(v); try { localStorage.setItem('pt-bold', v); } catch {} }}
            />
            <span>Bold</span>
          </label>
        </div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="pt-range-label">Scheme</span>
          <select
            className="putnam-select"
            value={scheme}
            onChange={(e) => { const v = e.target.value; setScheme(v); try { localStorage.setItem('pt-scheme', v); } catch {} }}
            aria-label="Color scheme"
          >
            {Object.keys(SCHEMES).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.7rem' }}>
          <span className="pt-range-label">Dark</span>
          <input
            className="pt-range"
            type="range"
            min={0}
            max={100}
            step={1}
            value={themeScale}
            onChange={(e) => { const v = Number(e.target.value); setThemeScale(v); try { localStorage.setItem('pt-theme-scale', String(v)); } catch {} }}
            aria-label="Theme (Dark to Light)"
          />
          <span className="pt-range-label">Light</span>
        </div>
      </div>
    </div>
  );
}
