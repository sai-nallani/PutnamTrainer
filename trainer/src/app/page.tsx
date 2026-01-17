"use client";
import React, { useState, useEffect, useRef } from "react";
import Script from 'next/script';
import { getProblemData, saveProblemData, getMacros } from './idb';
import MathJax from './MathJax';
import NotesEditor from './NotesEditor';



interface PutnamProblem {
  problem: string;
  question: string;
}

interface ProblemsData {
  [year: string]: PutnamProblem[];
}

export default function PutnamTrainer() {
  const [preamble, setPreamble] = useState("");
  useEffect(() => {
    fetch("/putnam_problems.json")
      .then((res) => res.json())
      .then((data: ProblemsData) => {
        setProblemsData(data);
        setLoading(false);
      });
    const reloadPreamble = () => {
      getMacros().then((m) => setPreamble(m ?? ""));
    };
    reloadPreamble();
    window.addEventListener('focus', reloadPreamble);
    return () => {
      window.removeEventListener('focus', reloadPreamble);
    };
  }, []);
  const [problemsData, setProblemsData] = useState<ProblemsData>({});
  const [year, setYear] = useState("2024");
  const [problemId, setProblemId] = useState("A1");
  const [loading, setLoading] = useState(true);
  const didInitFromStorage = useRef(false);
  const initFromQuery = useRef(false);
  const userInteracted = useRef(false);
  const restoringSelection = useRef(false);

  useEffect(() => {
    fetch("/putnam_problems.json")
      .then((res) => res.json())
      .then((data: ProblemsData) => {
        setProblemsData(data);
        setLoading(false);
      });
    // If arrived with query params, preselect year/problem once data loads
    try {
      const params = new URLSearchParams(window.location.search);
      const qYear = params.get('year');
      const qProblem = params.get('problem');
      if (qYear) setYear(qYear);
      if (qProblem) setProblemId(qProblem);
      if (qYear || qProblem) {
        initFromQuery.current = true;
        // mark as user interaction so pt-selected gets updated
        userInteracted.current = true;
      }
    } catch { }
  }, []);

  const years = Object.keys(problemsData).sort((a, b) => b.localeCompare(a));
  const problems = problemsData[year] || [];
  const problemOptions = problems.map((p: PutnamProblem) => p.question);
  const selectedProblem = problems.find(
    (p: PutnamProblem) => p.question === problemId
  );

  // IndexedDB-backed user data
  const [done, setDone] = useState(false);
  const [working, setWorking] = useState(false);
  const [notes, setNotes] = useState("");
  const notesSaveTimer = useRef<number | null>(null);

  // Load user data for current selection
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getProblemData(year, problemId);
        if (cancelled) return;
        setDone(!!data?.done);
        setWorking(!!data?.working);
        setNotes(data?.notes ?? "");
      } catch {
        setDone(false);
        setNotes("");
      }
    }
    if (year && problemId) load();
    return () => { cancelled = true; };
  }, [year, problemId]);

  // Save done flag immediately on change
  useEffect(() => {
    // avoid saving before problems are loaded and selection is valid
    if (!selectedProblem) return;
    saveProblemData(year, problemId, { done }).catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // Save working flag immediately on change
  useEffect(() => {
    if (!selectedProblem) return;
    saveProblemData(year, problemId, { working }).catch(() => { });
  }, [working]);

  // Debounce notes saving
  useEffect(() => {
    if (!selectedProblem) return;
    if (notesSaveTimer.current) window.clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = window.setTimeout(() => {
      saveProblemData(year, problemId, { notes }).catch(() => { });
    }, 400);
    return () => {
      if (notesSaveTimer.current) window.clearTimeout(notesSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, year, problemId]);

  // One-time restore of last selection from localStorage once data is loaded
  useEffect(() => {
    if (didInitFromStorage.current) return;
    if (initFromQuery.current) return; // do not override URL-selected problem
    if (!Object.keys(problemsData).length) return;
    didInitFromStorage.current = true;
    try {
      const raw = localStorage.getItem('pt-selected');
      if (!raw) return;
      const saved = JSON.parse(raw) as { year?: string; problemId?: string };
      if (!saved || !saved.year) return;
      if (!problemsData[saved.year]) return;
      const list = problemsData[saved.year] || [];
      const pid = (saved.problemId ?? "");
      const exists = pid ? list.some(p => p.question === pid) : false;
      restoringSelection.current = true;
      // set problem first (if exists) then year to trigger consistent dropdown state
      if (exists) setProblemId(pid);
      setYear(saved.year);
      // release restoring flag soon after state updates
      setTimeout(() => { restoringSelection.current = false; }, 0);
    } catch { }
  }, [problemsData]);

  // Randomizer options state
  const [optionsOpen, setOptionsOpen] = useState(false);
  // Year range
  const yearNums = years.map(y => Number(y)).filter(n => !isNaN(n)).sort((a, b) => a - b);
  const minYear = yearNums[0] ?? 2000;
  const maxYear = yearNums[yearNums.length - 1] ?? 2024;
  const [yearRange, setYearRange] = useState<[number, number]>([minYear, maxYear]);
  // Question number checkboxes
  const [selectedQns, setSelectedQns] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  const handleRandom = () => {
    // Filter years by range
    const yearsList = years.filter(y => {
      const yn = Number(y);
      return yn >= yearRange[0] && yn <= yearRange[1];
    });
    if (!yearsList.length) return;
    // Filter problems by selected question numbers (ignore A/B)
    const filtered: Array<{ year: string; question: string }> = [];
    for (const y of yearsList) {
      const plist = problemsData[y] || [];
      for (const p of plist) {
        const m = p.question.match(/([AB])([1-6])/);
        if (m) {
          const num = Number(m[2]);
          if (selectedQns.includes(num)) {
            filtered.push({ year: y, question: p.question });
          }
        }
      }
    }
    if (!filtered.length) return;
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    setYear(pick.year);
    setProblemId(pick.question);
  };

  useEffect(() => {
    if (restoringSelection.current) return;
    if (!problemOptions.length) return;
    if (!problemOptions.includes(problemId)) {
      setProblemId(problemOptions[0]);
    }
  }, [year, problemOptions]);

  // Persist selection to localStorage after user interaction to avoid overwriting saved defaults on first load
  useEffect(() => {
    if (!Object.keys(problemsData).length) return;
    if (!userInteracted.current) return;
    try {
      localStorage.setItem('pt-selected', JSON.stringify({ year, problemId }));
    } catch { }
  }, [year, problemId, problemsData]);

  useEffect(() => {
    try {
      if (window.MathJax) {
        window.MathJax.typesetPromise?.();
      }
    } catch (err) {
      console.error(err);
      window.location.reload();
    }
  }, [selectedProblem]);

  if (loading) return <div className="loader">Loading problems...</div>;

  return (
    <div className="putnam-container">
      <Script id="mathjax-config" strategy="afterInteractive">
        {`window.MathJax = {
  tex: {
    inlineMath: {'[+]': [['$', '$']]}
  },
  startup: {
    ready() {
      MathJax.startup.defaultReady();
      const {STATE} = MathJax._.core.MathItem;
      MathJax.tex2mml(String.raw\`
              ${preamble}
            \`);
    }
  }
};`}
      </Script>
      <Script
        src="https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js"
        strategy="afterInteractive"
      />

      <h1 className="putnam-title">Putnam Trainer</h1>
      <div className="putnam-controls" style={{ position: 'relative' }}>
        <label>
          Year:
          <select
            value={year}
            onChange={(e) => { userInteracted.current = true; setYear(e.target.value); }}
            className="putnam-select"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label>
          Problem:
          <select
            value={problemId}
            onChange={(e) => { userInteracted.current = true; setProblemId(e.target.value); }}
            className="putnam-select"
          >
            {problemOptions.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </label>
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <button type="button" className="putnam-button" onClick={handleRandom} disabled={loading} style={{ paddingRight: '2.1em', position: 'relative' }}>
            Random
            <span
              aria-label="Randomizer options"
              role="button"
              tabIndex={0}
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                fontSize: '1.1em',
                color: 'var(--pt-text)',
                opacity: 0.7,
                outline: 'none',
                userSelect: 'none'
              }}
              onClick={e => { e.stopPropagation(); setOptionsOpen(o => !o); }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOptionsOpen(o => !o);
                }
              }}
            >
              ▼
            </span>
          </button>
          {optionsOpen && (
            <div className="randomizer-options" style={{ position: 'absolute', top: '2.5rem', right: 0, background: 'var(--pt-surface)', border: '1px solid var(--pt-border)', borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.12)', padding: '1rem', zIndex: 100, width: 'max-content', maxWidth: 'calc(100vw - 2rem)' }}>
              <div style={{ marginBottom: '0.7rem' }}>
                <strong style={{ color: 'var(--pt-text)' }}>Question Number</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', marginTop: '0.7rem' }}>
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <label key={num} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.97rem', color: 'var(--pt-text)' }}>
                      <input
                        type="checkbox"
                        checked={selectedQns.includes(num)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedQns([...selectedQns, num]);
                          } else {
                            setSelectedQns(selectedQns.filter(n => n !== num));
                          }
                        }}
                      />
                      {num}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '0.7rem' }}>
                <strong style={{ color: 'var(--pt-text)' }}>Year Range</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.7rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--pt-text)', fontSize: '0.97rem', minWidth: '2rem' }}>Min</span>
                    <input
                      type="range"
                      min={minYear}
                      max={maxYear}
                      value={yearRange[0]}
                      onChange={e => setYearRange([Number(e.target.value), yearRange[1]])}
                      style={{ accentColor: 'var(--pt-accent)', flex: 1, minWidth: 80 }}
                    />
                    <span style={{ color: 'var(--pt-accent)', fontWeight: 600, minWidth: '2.5rem' }}>{yearRange[0]}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--pt-text)', fontSize: '0.97rem', minWidth: '2rem' }}>Max</span>
                    <input
                      type="range"
                      min={minYear}
                      max={maxYear}
                      value={yearRange[1]}
                      onChange={e => setYearRange([yearRange[0], Number(e.target.value)])}
                      style={{ accentColor: 'var(--pt-accent)', flex: 1, minWidth: 80 }}
                    />
                    <span style={{ color: 'var(--pt-accent)', fontWeight: 600, minWidth: '2.5rem' }}>{yearRange[1]}</span>
                  </div>
                </div>
              </div>
              <button type="button" className="putnam-button" style={{ marginTop: '0.5rem', width: '100%' }} onClick={() => setOptionsOpen(false)}>Close</button>
            </div>
          )}
        </span>
      </div>
      <div className="putnam-problem">
        <h2 className="putnam-problem-title">{year} {problemId}</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label className="pt-checkbox" style={{ marginRight: '1.5em' }}>
            <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} />
            <span>Done</span>
          </label>
          <label className="pt-checkbox">
            <input type="checkbox" checked={working} onChange={(e) => setWorking(e.target.checked)} />
            <span>Working</span>
          </label>
        </div>
        {selectedProblem ? (
          <div>{selectedProblem.problem}</div>
        ) : (
          <p>No problem found.</p>
        )}
        <div style={{ marginTop: '1rem' }}>
          <NotesEditor value={notes} onChange={setNotes} />
        </div>
      </div>
    </div>
  );
}
