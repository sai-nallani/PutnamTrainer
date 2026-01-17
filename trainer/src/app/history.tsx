"use client";
import React, { useEffect, useState } from "react";
import { getProblemData, ProblemUserData } from "./idb";

interface HistoryItem extends ProblemUserData {
  year: string;
  question: string;
}

export default function ProblemHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [problemsData, setProblemsData] = useState<Record<string, any[]>>({});
  useEffect(() => {
    fetch("/putnam_problems.json")
      .then((res) => res.json())
      .then((data) => setProblemsData(data));
  }, []);
  useEffect(() => {
    async function loadAll() {
      const result: HistoryItem[] = [];
      for (const year of Object.keys(problemsData)) {
        for (const p of problemsData[year]) {
          const pdata = await getProblemData(year, p.question);
          if (pdata && (pdata.done || pdata.working || (pdata.notes && pdata.notes.trim() !== ""))) {
            result.push({
              year,
              question: p.question,
              problemId: pdata.problemId,
              done: pdata.done,
              working: pdata.working,
              notes: pdata.notes,
              updatedAt: pdata.updatedAt,
              key: pdata.key
            });
          }
        }
      }
      setHistory(result);
    }
    if (Object.keys(problemsData).length) loadAll();
  }, [problemsData]);
  return (
    <div className="putnam-container">
      <h1 className="putnam-title">Problem History</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: "100%", borderCollapse: "collapse", color: 'var(--pt-text)', minWidth: 400 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--pt-border)' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Year</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Problem</th>
              <th style={{ padding: '0.5rem', textAlign: 'center' }}>Done</th>
              <th style={{ padding: '0.5rem', textAlign: 'center' }}>Working</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--pt-border)' }}>
                <td style={{ padding: '0.5rem' }}>
                  <a href={`/?year=${item.year}&problem=${item.question}`} style={{ color: 'var(--pt-accent)', textDecoration: 'none' }}>{item.year}</a>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <a href={`/?year=${item.year}&problem=${item.question}`} style={{ color: 'var(--pt-accent)', textDecoration: 'none' }}>{item.question}</a>
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.done ? "✔️" : ""}</td>
                <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.working ? "🛠️" : ""}</td>
                <td style={{ padding: '0.5rem', fontSize: '0.9rem' }}>{item.notes ? item.notes.slice(0, 40) + (item.notes.length > 40 ? '...' : '') : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {history.length === 0 && (
        <p style={{ color: 'var(--pt-text)', textAlign: 'center', marginTop: '2rem' }}>
          No problems marked yet. Start solving problems and mark them as done or working!
        </p>
      )}
    </div>
  );
}
