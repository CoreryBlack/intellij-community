type ToolWindow = "project" | "search" | "git" | "run" | "structure";

interface Props {
  activeTool: ToolWindow;
  onSelectTool: (tool: ToolWindow) => void;
}

const TOOLS: { id: ToolWindow; icon: string; title: string }[] = [
  { id: "project", icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 2.5a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h12.5a.75.75 0 0 0 .75-.75V5.5a.75.75 0 0 0-.75-.75H8.75a.75.75 0 0 1-.53-.22L7.03 3.28a.75.75 0 0 0-.53-.22H1.75z"/></svg>`, title: "Project (Alt+1)" },
  { id: "search", icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.3"/><path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>`, title: "Search (Shift+Shift)" },
  { id: "git", icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C5.8 0 4 1.8 4 4c0 1.5.8 2.8 2 3.5V15h4V7.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4zm0 1.5c1.4 0 2.5 1.1 2.5 2.5S9.4 7.5 8 7.5 5.5 6.4 5.5 5 6.6 2.5 8 2.5z"/></svg>`, title: "Git (Alt+9)" },
  { id: "run", icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2v12l10-6z"/></svg>`, title: "Run (Alt+4)" },
  { id: "structure", icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="12" height="3" rx="1"/><rect x="2" y="7" width="5" height="3" rx="1"/><rect x="9" y="7" width="5" height="3" rx="1"/><rect x="2" y="12" width="12" height="2" rx="1"/></svg>`, title: "Structure (Alt+7)" },
];

export default function ToolButtonStrip({ activeTool, onSelectTool }: Props) {
  return (
    <div style={{
      width:40,display:"flex",flexDirection:"column",alignItems:"center",
      padding:"4px 3px",flexShrink:0,gap:1,
      background:"var(--ide-bg-panel)",borderRight:"1px solid var(--ide-border-subtle)"
    }}>
      {TOOLS.map(t => (
        <button key={t.id}
          dangerouslySetInnerHTML={{ __html: t.icon }}
          style={{
            width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",
            border:"none",borderRadius:"var(--ide-radius-md)",cursor:"pointer",
            color:activeTool===t.id ? "var(--ide-accent-blue)" : "var(--ide-text-secondary)",
            background:activeTool===t.id ? "var(--ide-bg-active)" : "transparent",
            transition:"all 0.12s",padding:0,
          }}
          onClick={() => onSelectTool(t.id)} title={t.title} />
      ))}
      <div style={{ flex:1 }} />
      <button style={{
        width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",
        border:"none",borderRadius:"var(--ide-radius-md)",cursor:"pointer",
        color:"var(--ide-text-disabled)",background:"transparent",
        fontSize:13,transition:"all 0.12s"
      }} title="Collapse Sidebar">◀</button>
    </div>
  );
}
