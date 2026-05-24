import { useState, useRef, useEffect } from "react";

interface Props {
  projectName: string;
  onBackToWelcome: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

interface MenuItem { label: string; shortcut?: string; icon?: string }

type MenuId = "file" | "edit" | "view" | "navigate" | "code" | "build" | "run" | "tools" | "vcs" | "help";

const MENUS: Record<MenuId, (MenuItem | "---")[]> = {
  file: [{ label: "New...", shortcut: "Alt+Insert", icon: "📄" },{ label: "Open...", shortcut: "Ctrl+O", icon: "📂" },"---",{ label: "Settings...", shortcut: "Ctrl+Alt+S", icon: "⚙" },"---",{ label: "Close Project", icon: "✕" }],
  edit: [{ label: "Undo", shortcut: "Ctrl+Z" },{ label: "Redo", shortcut: "Ctrl+Shift+Z" },"---",{ label: "Cut", shortcut: "Ctrl+X" },{ label: "Copy", shortcut: "Ctrl+C" },{ label: "Paste", shortcut: "Ctrl+V" }],
  view: [{ label: "Tool Windows" },"---",{ label: "Recent Files...", shortcut: "Ctrl+E" }],
  navigate: [{ label: "Search Everywhere...", shortcut: "Double Shift" },{ label: "Class...", shortcut: "Ctrl+N" },{ label: "File...", shortcut: "Ctrl+Shift+N" },{ label: "Line...", shortcut: "Ctrl+G" }],
  code: [{ label: "Reformat Code", shortcut: "Ctrl+Alt+L" },{ label: "Optimize Imports", shortcut: "Ctrl+Alt+O" }],
  build: [{ label: "Build Project", shortcut: "Ctrl+F9" },{ label: "Rebuild Project" }],
  run: [{ label: "Run...", shortcut: "Shift+F10" },{ label: "Debug...", shortcut: "Shift+F9" }],
  tools: [{ label: "VCS Operations" },{ label: "Tasks & Contexts" }],
  vcs: [{ label: "Commit...", shortcut: "Ctrl+K" },{ label: "Push...", shortcut: "Ctrl+Shift+K" },{ label: "Pull..." },{ label: "Update Project..." }],
  help: [{ label: "Find Action...", shortcut: "Ctrl+Shift+A" },"---",{ label: "Keyboard Shortcuts", shortcut: "Ctrl+K Ctrl+S" },"---",{ label: "About" }],
};

export interface OpenTab {
  name: string; path: string; lang: string; modified: boolean;
}

export const DEFAULT_TABS: OpenTab[] = [
  { name:"UserControllerImpl.java", path:"src/main/java/com/corvertrack/monitor/controller/UserControllerImpl.java", lang:"java", modified:false },
  { name:"PortalsControllerImpl.java", path:"src/main/java/com/corvertrack/monitor/controller/PortalsControllerImpl.java", lang:"java", modified:false },
  { name:"AstralMonitorApplication.java", path:"src/main/java/com/corvertrack/monitor/AstralMonitorApplication.java", lang:"java", modified:true },
];

export default function TopToolbar({ projectName, onBackToWelcome, theme, onToggleTheme }: Props) {
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const iconBtn = (children: React.ReactNode, s: React.CSSProperties = {}) => ({
    display:"flex",alignItems:"center",justifyContent:"center",
    width:30,height:28,border:"none",background:"transparent",
    color:"var(--ide-text-secondary)",cursor:"pointer",
    borderRadius:"var(--ide-radius-sm)",transition:"all 0.12s",...s,
  })

  return (
    <div style={{ height:"var(--ide-toolbar-height)",display:"flex",alignItems:"center",background:"var(--ide-bg-toolbar)",borderBottom:"1px solid var(--ide-border-subtle)",padding:"0 6px",flexShrink:0,gap:2 }}
        ref={menuRef}>

      {/* ===== Left: Menu + Project Name + Version ===== */}
      <div style={{ display:"flex",alignItems:"center",gap:2,flexShrink:0 }}>
        <button style={iconBtn(<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3" width="12" height="2" rx="1"/><rect x="2" y="7" width="12" height="2" rx="1"/><rect x="2" y="11" width="12" height="2" rx="1"/></svg>)}
          onClick={onBackToWelcome} title="Main menu" />

        <div style={{ position:"relative" }}>
          <button style={{
            display:"flex",alignItems:"center",gap:3,height:28,padding:"0 8px",
            border:"none",background:"transparent",color:"var(--ide-text-primary)",
            cursor:"pointer",borderRadius:"var(--ide-radius-sm)",
            fontSize:"var(--ide-font-size-md)",fontWeight:600,transition:"background 0.12s"
          }}
            onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}>
            <span>{projectName}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ color:"var(--ide-text-disabled)" }}><path d="M2 3l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {openMenu === "file" && (
            <div style={{ position:"absolute",top:"100%",left:0,marginTop:4,minWidth:220,
              background:"var(--ide-bg-popup)",border:"1px solid var(--ide-border)",
              borderRadius:"var(--ide-radius-lg)",boxShadow:"0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)",
              padding:"4px 0",zIndex:1000 }}>
              {MENUS.file.map((item,i) => item === "---"
                ? <div key={i} style={{ height:1,background:"var(--ide-border-subtle)",margin:"4px 12px" }} />
                : <div key={item.label} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:24,
                    padding:"5px 16px 5px 10px",fontSize:"var(--ide-font-size-sm)",cursor:"pointer",
                    color:"var(--ide-text-primary)",transition:"all 0.08s" }}
                    onClick={() => setOpenMenu(null)}
                    onMouseOver={e => { const el=e.currentTarget; el.style.background="var(--ide-accent-blue)"; el.style.color="#fff"; }}
                    onMouseOut={e => { const el=e.currentTarget; el.style.background="transparent"; el.style.color="var(--ide-text-primary)"; }}>
                  <span style={{ display:"flex",alignItems:"center",gap:6 }}>{item.icon && <span>{item.icon}</span>}{item.label}</span>
                  {item.shortcut && <span style={{ fontSize:"var(--ide-font-size-xs)",color:"inherit",opacity:0.7 }}>{item.shortcut}</span>}
                </div>
              )}
            </div>
          )}
        </div>

        <span style={{ fontSize:"var(--ide-font-size-xs)",color:"var(--ide-text-disabled)",padding:"0 4px",fontWeight:500 }}>v1.0</span>

        <div style={{ width:1,height:18,background:"var(--ide-border-subtle)",margin:"0 4px" }} />
      </div>

      {/* ===== Center: File Tabs (Islands-style inline tabs) ===== */}
      <div style={{ flex:1,display:"flex",alignItems:"flex-end",height:"100%",overflow:"hidden",margin:"0 4px" }}>
        {/* Tabs rendered by parent via children pattern - placeholder for now */}
        <div id="toolbar-tabs-slot" style={{ display:"flex",alignItems:"flex-end",height:"100%",gap:1 }} />
      </div>

      {/* ===== Right: Branch + VCS + Actions ===== */}
      <div style={{ display:"flex",alignItems:"center",gap:1,flexShrink:0 }}>
        <button style={{
          display:"flex",alignItems:"center",gap:4,height:26,padding:"0 8px",
          border:"1px solid var(--ide-border)",borderRadius:"var(--ide-radius-md)",
          background:"transparent",color:"var(--ide-text-primary)",cursor:"pointer",
          fontSize:"var(--ide-font-size-xs)",fontWeight:500,transition:"all 0.12s"
        }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="var(--ide-accent-orange)"><path d="M8 0C5.8 0 4 1.8 4 4c0 1.5.8 2.8 2 3.5V15h4V7.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4zm0 1.5c1.4 0 2.5 1.1 2.5 2.5S9.4 7.5 8 7.5 5.5 6.4 5.5 5 6.6 2.5 8 2.5z"/></svg>
          AstralApplication
          <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" style={{ color:"var(--ide-text-disabled)" }}><path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        <button style={iconBtn(<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17h8v-3.26C13.81 12.47 15 10.38 15 8a7 7 0 0 0-7-7zM4 9H2V7h2v2zm3 3H5v-2h2v2zm0-3H5V7h2v2zm3 3H8v-2h2v2zm0-3H8V7h2v2zm3 3h-2v-2h2v2zm0-3h-2V7h2v2z"/></svg>)} title="Commit" />

        <button style={iconBtn(<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13 7L8 2 3 7h2v6h6V7h2z"/></svg>)} title="Push" />

        <button style={iconBtn(<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 9l5-5 5 5H11v6H5V9H3z"/></svg>)} title="Pull" />

        <button style={iconBtn(<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a1 1 0 0 1 1 1v4h4a1 1 0 0 1 0 2H9v4a1 1 0 0 1-2 0V9H3a1 1 0 0 1 0-2h4V3a1 1 0 0 1 1-1z"/></svg>)} title="New" />

        <div style={{ width:1,height:18,background:"var(--ide-border-subtle)",margin:"0 3px" }} />

        <button style={iconBtn(<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zM7.25 5.5h1.5v5h-1.5z"/></svg>)}
          onClick={onToggleTheme} title="Toggle theme" />

        <button style={iconBtn(<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.3"/><path d="M10 10l4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>)}
          title="Search Everywhere (Double Shift)" />

        <button style={iconBtn(<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M7.5 1a.75.75 0 0 1 .75.75v.78A6.5 6.5 0 0 1 14 8h-.78a.75.75 0 0 1-1.5 0H14a6.5 6.5 0 0 1-5.75 6.47v.78a.75.75 0 0 1-1.5 0v-.78A6.5 6.5 0 0 1 1 8h.78a.75.75 0 0 1 1.5 0H1a6.5 6.5 0 0 1 5.75-6.47v-.78A.75.75 0 0 1 7.5 1z"/></svg>)} title="Project Settings" />
      </div>
    </div>
  );
}
