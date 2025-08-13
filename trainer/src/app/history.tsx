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
    <div style={{ maxWidth: 700, margin: "2em auto" }}>
      <h1>Problem History</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Year</th>
            <th>Problem</th>
            <th>Done</th>
            <th>Working</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item, i) => (
            <tr key={i}>
              <td>{item.year}</td>
              <td>{item.question}</td>
              <td>{item.done ? "✔️" : ""}</td>
              <td>{item.working ? "🛠️" : ""}</td>
              <td>{item.notes ? item.notes.slice(0, 40) : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
