"use client";
import React, { useEffect, useState } from "react";
import { getProblemData, ProblemUserData } from "../idb";

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
              key: pdata.key,
            });
          }
        }
      }
      setHistory(result);
    }
    if (Object.keys(problemsData).length) loadAll();
  }, [problemsData]);

  return (
    <div style={{ maxWidth: 700, margin: "2em auto" }}>
      <h1>Problem History</h1>
      <p style={{ marginTop: '0.5rem', marginBottom: '0.75rem', color: 'var(--pt-text)', opacity: 0.8 }}>
        Tip: Click a problem to open it on the home page and view your notes.
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '60%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '20%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.25rem' }}>Problem</th>
            <th>Done</th>
            <th>Working</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item, i) => {
            const label = `${item.year} ${item.question}`;
            const href = `/?year=${encodeURIComponent(item.year)}&problem=${encodeURIComponent(item.question)}`;
            return (
              <tr key={i} style={{ borderBottom: '1px solid var(--pt-border)' }}>
                <td style={{ padding: '0.5rem 0.25rem' }}>
                  <a href={href} style={{ color: 'var(--pt-accent)', textDecoration: 'none' }}>{label}</a>
                </td>
                <td style={{ textAlign: 'center' }}>{item.done ? "✔️" : ""}</td>
                <td style={{ textAlign: 'center' }}>{item.working ? "🛠️" : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
