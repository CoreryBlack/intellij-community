import { useState, useRef, useEffect } from "react";

interface Props {
  projectName: string;
  onBackToWelcome: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

interface MenuItem { label: string; shortcut?: string; }

type MenuId = "file" | "edit" | "view" | "navigate" | "code" | "build" | "run" | "tools" | "vcs" | "help";

const MENUS: Record<MenuId, (MenuItem | "---")[]> = {
  file: [{ label: "New...", shortcut: "Alt+Insert" },{ label: "Open...", shortcut: "Ctrl+O" },"---",{ label: "Settings...", shortcut: "Ctrl+Alt+S" },"---",{ label: "Close Project" }],
  edit: [{ label: "Undo", shortcut: "Ctrl+Z" },{ label: "Redo", shortcut: "Ctrl+Shift+Z" },"---",{ label: "Cut", shortcut: "Ctrl+X" },{ label: "Copy", shortcut: "Ctrl+C" },{ label: "Paste", shortcut: "Ctrl+V" }],
  view: [{ label: "Recent Files...", shortcut: "Ctrl+E" },"---",{ label: "Quick Switch Scheme...", shortcut: "Ctrl+`" }],
  navigate: [{ label: "Search Everywhere...", shortcut: "Double Shift" },{ label: "Class...", shortcut: "Ctrl+N" },{ label: "File...", shortcut: "Ctrl+Shift+N" }],
  code: [{ label: "Reformat Code", shortcut: "Ctrl+Alt+L" },{ label: "Optimize Imports", shortcut: "Ctrl+Alt+O" }],
  build: [{ label: "Build Project", shortcut: "Ctrl+F9" },{ label: "Rebuild Project" }],
  run: [{ label: "Run...", shortcut: "Shift+F10" },{ label: "Debug...", shortcut: "Shift+F9" }],
  tools: [{ label: "Tasks & Contexts" },{ label: "Diff & Merge" }],
  vcs: [{ label: "Commit...", shortcut: "Ctrl+K" },{ label: "Push...", shortcut: "Ctrl+Shift+K" }],
  help: [{ label: "Find Action...", shortcut: "Ctrl+Shift+A" },"---",{ label: "About" }],
};

export default function TopToolbar({ projectName, onBackToWelcome, theme, onToggleTheme }: Props) {
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const menuBtn = (s: React.CSSProperties = {}) => ({
    display:"flex",alignItems:"center",justifyContent:"center",
    height:28,minWidth:28,padding:"0 8px",border:"none",
    background:"var(--ide-button-secondary-bg)",color:"var(--ide-text-primary)",
    cursor:"pointer",borderRadius:"var(--ide-radius-sm)",fontSize:"var(--ide-font-size-sm)",
    fontWeight:500 as const,transition:"background 0.12s",gap:4,...s,
  })

  return (
    <div style={{ height:"var(--ide-toolbar-height)",display:"flex",alignItems:"center",background:"var(--ide-bg-toolbar)",borderBottom:"1px solid var(--ide-border-subtle)",padding:"0 8px",flexShrink:0,gap:6 }}
      ref={menuRef}>
      {/* Left group */}
      <div style={{ display:"flex",alignItems:"center",gap:4 }}>
        <button style={menuBtn({})} onClick={onBackToWelcome} title="Main menu">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="3" width="14" height="2" rx="1"/>
            <rect x="1" y="7" width="14" height="2" rx="1"/>
            <rect x="1" y="11" width="14" height="2" rx="1"/>
          </svg>
        </button>
        <div style={{ position:"relative" }}>
          <button style={{ ...menuBtn(), fontWeight:600,fontSize:"var(--ide-font-size-md)" }}
            onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}>{projectName}</button>
          {openMenu === "file" && (
            <div style={{ position:"absolute",top:"100%",left:0,marginTop:4,minWidth:240,
              background:"var(--ide-bg-popup)",border:"1px solid var(--ide-border)",
              borderRadius:"var(--ide-radius-md)",boxShadow:"0 8px 24px rgba(0,0,0,0.4)",
              padding:"4px 0",zIndex:1000 }}>
              {MENUS.file.map((item,i) => item === "---"
                ? <div key={i} style={{ height:1,background:"var(--ide-border)",margin:"4px 10px" }} />
                : <div key={item.label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"6px 24px 6px 12px",fontSize:"var(--ide-font-size-sm)",cursor:"pointer",
                    color:"var(--ide-text-primary)",transition:"background 0.08s" }}
                    onClick={() => setOpenMenu(null)}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = "var(--ide-accent-blue)"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--ide-text-primary)"; }}>
                  <span>{item.label}</span>
                  {item.shortcut && <span style={{ fontSize:"var(--ide-font-size-xs)",color:"var(--ide-text-disabled)",marginLeft:24 }}>{item.shortcut}</span>}
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ width:1,height:20,background:"var(--ide-border)",margin:"0 4px" }} />
      </div>

      {/* Center - run config */}
      <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:2 }}>
        <button style={{ ...menuBtn(),color:"var(--ide-accent-green)" }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2v12l10-6z"/></svg> Run
        </button>
        <button style={menuBtn()}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5 2h1v12H5zM10 2h1v12h-1zM2 2h2v12H2zM12 2h2v12h-2z"/></svg> Debug
        </button>
      </div>

      {/* Right group */}
      <div style={{ display:"flex",alignItems:"center",gap:4 }}>
        <button style={menuBtn()}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2zM2 7h8v2H2zM3 1h1v13H3z"/></svg>
        </button>
        <button style={menuBtn()} onClick={onToggleTheme} title="Toggle theme">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            {theme === "dark"
              ? <path d="M8 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 1zm0 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm6.25-2.75a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5h1.5zM8 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13z"/>
              : <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.45 0 .89-.065a.77.77 0 0 1 .67.665c-.125 3.401-2.938 6.127-6.396 6.127A6.68 6.68 0 0 1 3.3 16.64 6.7 6.7 0 0 1 .278 6.465C.278 3.005 3.018.24 6 .278z"/>}
          </svg>
        </button>
        <button style={{ ...menuBtn(),background:"var(--ide-button-primary-bg)",color:"white" }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Search
        </button>
      </div>
    </div>
  );
}
