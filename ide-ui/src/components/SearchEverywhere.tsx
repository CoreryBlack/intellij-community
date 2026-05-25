/**
 * @see com.intellij.ide.actions.SearchEverywhereAction
 * @see com.intellij.ide.actions.SearchEverywherePopup
 *
 * Search Everywhere — Double Shift / Ctrl+P / Ctrl+Shift+A
 * Shows a popup with search input and categorized results
 * Categories: All, Classes, Files, Symbols, Actions
 */

import { useState, useEffect, useRef } from "react";
import { useIdeStore } from "../store/ideStore";
import { findAction, formatShortcut, DEFAULT_KEYMAP } from "../services/keymap";

interface Props {
  onClose: () => void;
}

type SearchTab = "all" | "files" | "classes" | "symbols" | "actions";

interface SearchResult {
  icon: string;
  name: string;
  description: string;
  path?: string;
  action: () => void;
}

export default function SearchEverywhere({ onClose }: Props) {
  const { state, dispatch } = useIdeStore();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const r: SearchResult[] = [];

    if (tab === "all" || tab === "files") {
      const addDirEntries = (entries: typeof state.fileTree, prefix = "") => {
        for (const e of entries) {
          if (!e.is_dir && e.name.toLowerCase().includes(query.toLowerCase())) {
            r.push({
              icon: e.is_dir ? "📁" : "📄",
              name: e.name,
              description: prefix + e.name,
              path: e.path,
              action: () => {
                dispatch({ type: "HIDE_MODAL" });
                onClose();
              },
            });
          }
        }
      };
      addDirEntries(state.fileTree);
    }

    if (tab === "all" || tab === "actions") {
      for (const binding of DEFAULT_KEYMAP) {
        if (binding.action.toLowerCase().includes(query.toLowerCase())) {
          r.push({
            icon: "⚡",
            name: binding.action.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
            description: formatShortcut(binding),
            action: () => {
              dispatch({ type: "HIDE_MODAL" });
              onClose();
            },
          });
        }
      }
    }

    if (tab === "all" || tab === "classes") {
      r.push({
        icon: "☕",
        name: "AstralMonitorApplication",
        description: "com.corvertrack.monitor",
        action: () => { dispatch({ type: "HIDE_MODAL" }); onClose(); },
      });
    }

    setResults(r.slice(0, 20));
    setSelectedIdx(0);
  }, [query, tab, state.fileTree]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" && results[selectedIdx]) { results[selectedIdx].action(); return; }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [results, selectedIdx, onClose]);

  const TABS: { id: SearchTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "files", label: "Files" },
    { id: "classes", label: "Classes" },
    { id: "symbols", label: "Symbols" },
    { id: "actions", label: "Actions" },
  ];

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: "flex",
      justifyContent: "center",
      paddingTop: "15vh",
      background: "rgba(0,0,0,0.4)",
    }} onClick={onClose}>
      <div style={{
        width: 560,
        maxHeight: 480,
        background: "var(--ide-bg-popup)",
        border: "1px solid var(--ide-border)",
        borderRadius: "var(--ide-radius-lg)",
        boxShadow: "var(--ide-shadow-lg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }} onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderBottom: "1px solid var(--ide-border)",
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--ide-text-muted)" strokeWidth="1.3">
            <circle cx="6.5" cy="6.5" r="5" />
            <path d="M10 10l4.5 4.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search everywhere..."
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              color: "var(--ide-text-default)",
              fontSize: "var(--ide-font-size-md)",
              outline: "none",
            }}
          />
        </div>

        {/* Category tabs */}
        <div style={{
          display: "flex",
          gap: 0,
          padding: "0 8px",
          borderBottom: "1px solid var(--ide-border)",
        }}>
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "6px 12px",
                border: "none",
                background: "transparent",
                color: tab === t.id ? "var(--ide-text-default)" : "var(--ide-text-muted)",
                fontSize: "var(--ide-font-size-xs)",
                fontWeight: tab === t.id ? 600 : 400,
                cursor: "pointer",
                borderBottom: tab === t.id ? "2px solid var(--ide-accent-blue)" : "2px solid transparent",
                transition: "all var(--ide-transition-fast)",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflow: "auto", padding: "4px 0" }}>
          {results.length === 0 && (
            <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--ide-text-disabled)", fontSize: "var(--ide-font-size-sm)" }}>
              No results found
            </div>
          )}
          {results.map((r, i) => (
            <div key={i}
              onClick={r.action}
              onMouseEnter={() => setSelectedIdx(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 14px",
                cursor: "pointer",
                background: selectedIdx === i ? "var(--ide-bg-hover)" : "transparent",
                transition: "background var(--ide-transition-fast)",
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>{r.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--ide-font-size-sm)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                <div style={{ fontSize: "var(--ide-font-size-xs)", color: "var(--ide-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
