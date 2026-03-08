import React, { useState, useMemo, useEffect } from "react";

function levenshtein(a, b) {
  if (!a) return b.length;
  if (!b) return a.length;
  const v0 = Array(b.length + 1).fill(0);
  const v1 = Array(b.length + 1).fill(0);
  for (let i = 0; i < v0.length; i++) v0[i] = i;
  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const c = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + c);
    }
    for (let j = 0; j < v0.length; j++) v0[j] = v1[j];
  }
  return v1[b.length];
}

export default function DicewarePhraseCard({ onSubmit }) {
  const [dicewords, setDicewords] = useState([]);
  const [committed, setCommitted] = useState([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    fetch("/diceware.txt")
      .then(r => r.text())
      .then(t =>
        setDicewords(
          t.split("\n")
            .map(l => l.trim().split(/\s+/))
            .filter(p => p.length === 2)
            .map(p => p[1])
        )
      );
  }, []);

  const suggestions = useMemo(() => {
    if (draft.length < 1) return [];
    return dicewords
      .map(w => {
        let s = w.startsWith(draft) ? 0 : w.includes(draft) ? 2 : 5;
        return { w, s: s + levenshtein(draft, w) };
      })
      .sort((a, b) => a.s - b.s)
      .slice(0, 5)
      .map(x => x.w);
  }, [draft, dicewords]);

  function accept(word) {
    if (committed.length >= 4) return;
    setCommitted(v => [...v, word]);
    setDraft("");
    document.getElementById("type")?.focus();
  }

  return (
    <div className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50">
      <div className="glass-card p-6 rounded-2xl text-white">
        <h3 className="text-2xl font-semibold mb-4 text-center">
          Session access Phrase
        </h3>
        <p className="text-sm font-normal text-cyan-200 mb-4 text-center">
          Setup and Remember for this session. <br /> You may generate a new phrase on
          every login.
        </p>

        <input
          value={[...committed, draft].join(" ")}
          onChange={e =>
            setDraft(
              e.target.value
                .toLowerCase()
                .replace(/[^a-z\s]/g, "")
                .split(" ")
                .pop()
            )
          }
        onKeyDown={e => {
        if (e.key === " " || e.key === "Enter") {
            const w = draft.trim();
            if (
            w &&
            committed.length < 4 &&
            (suggestions.includes(w) || dicewords.includes(w))
            ) {
            e.preventDefault();
            setCommitted(c => [...c, w]);
            setDraft("");
            return;
            }
            e.preventDefault();
        }

        if (e.key === "Backspace" && draft === "" && committed.length) {
            e.preventDefault();
            setCommitted(c => c.slice(0, -1));
        }
        }}

          id="type"
          autoComplete="off"
          spellCheck={false}
          placeholder="type your phrase…"
          className="w-full px-4 py-2 rounded-2xl bg-slate-900 outline-none"
        />

        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => accept(s)}
              className="px-3 py-1 text-sm rounded-xl bg-slate-800 hover:bg-slate-700"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-2 text-xs opacity-70">
          Words: {committed.length} / 4
        </div>

        <button
          disabled={committed.length < 4}
          onClick={() => onSubmit(committed)}
          className="mt-4 w-full py-2 rounded border border-cyan-400 disabled:opacity-40"
        >
          Use Phrase
        </button>
      </div>
    </div>
  );
}