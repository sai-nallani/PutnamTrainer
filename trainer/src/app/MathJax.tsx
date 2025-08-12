import React, { useEffect, useRef, useState } from 'react';


interface MathJaxProps {
  children: string;
}

function parseMathSegments(text: string) {
  // Split by display math first
  const displayRegex = /\$\$(.+?)\$\$/g;
  let segments: Array<{ type: 'text' | 'inline' | 'display', content: string }> = [];
  let lastIndex = 0;
  let match;
  while ((match = displayRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'display', content: match[1] });
    lastIndex = displayRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    text = text.slice(lastIndex);
    // Now split by inline math
    const inlineRegex = /\$(.+?)\$/g;
    let lastInline = 0;
    let inlineMatch;
    while ((inlineMatch = inlineRegex.exec(text)) !== null) {
      if (inlineMatch.index > lastInline) {
        segments.push({ type: 'text', content: text.slice(lastInline, inlineMatch.index) });
      }
      segments.push({ type: 'inline', content: inlineMatch[1] });
      lastInline = inlineRegex.lastIndex;
    }
    if (lastInline < text.length) {
      segments.push({ type: 'text', content: text.slice(lastInline) });
    }
  }
  return segments;
}

export default function MathJax({ children }: MathJaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const segments = parseMathSegments(children);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && window.MathJax && ref.current && typeof window.MathJax.typesetPromise === 'function') {
      window.MathJax.typesetPromise();
    }
  }, [children, mounted]);

  if (!mounted) {
    // SSR: render only plain text, no math markup
    return <span>{children}</span>;
  }

  return (
    <div ref={ref}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <span key={i}>{seg.content}</span>;
        if (seg.type === 'inline') return <span key={i} className="math-inline">{'$' + seg.content + '$'}</span>;
        if (seg.type === 'display') return <div key={i} className="math-display">{'$$' + seg.content + '$$'}</div>;
        return null;
      })}
    </div>
  );
}

