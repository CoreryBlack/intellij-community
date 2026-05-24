import { useState } from "react";

type ToolWindow = "project" | "structure" | "commit" | "services";

interface Props {
  activeTool: ToolWindow;
  onSelectTool: (tool: ToolWindow) => void;
}

interface TreeNode {
  name: string; type: "file" | "dir" | "module"; ext?: string; children?: TreeNode[]; expanded?: boolean;
}

const TOOLS: { id: ToolWindow; label: string; letter: string }[] = [
  { id: "project", label: "Project", letter: "P" },
  { id: "structure", label: "Structure", letter: "S" },
  { id: "commit", label: "Commit", letter: "C" },
  { id: "services", label: "Services", letter: "v" },
];

const MOCK_TREE: TreeNode[] = [
  { name: "intellij-community", type: "module", expanded: true, children: [
    { name: "ide-ui", type: "dir", expanded: true, children: [
      { name: "src", type: "dir", expanded: true, children: [
        { name: "App.tsx", type: "file", ext: "tsx" },{ name: "main.tsx", type: "file", ext: "tsx" },
        { name: "pages", type: "dir", children: [
          { name: "WelcomeScreen.tsx", type: "file", ext: "tsx" },{ name: "MainLayout.tsx", type: "file", ext: "tsx" },
        ]},{ name: "components", type: "dir", children: [
          { name: "TopToolbar.tsx", type: "file", ext: "tsx" },{ name: "Sidebar.tsx", type: "file", ext: "tsx" },
          { name: "EditorArea.tsx", type: "file", ext: "tsx" },{ name: "StatusBar.tsx", type: "file", ext: "tsx" },
        ]},{ name: "styles", type: "dir", children: [
          { name: "theme.css", type: "file", ext: "css" },{ name: "global.css", type: "file", ext: "css" },
        ]},
      ]},
      { name: "src-tauri", type: "dir", children: [
        { name: "src", type: "dir", children: [{ name: "lib.rs", type: "file", ext: "rs" },{ name: "main.rs", type: "file", ext: "rs" }]},
        { name: "Cargo.toml", type: "file", ext: "toml" },{ name: "tauri.conf.json", type: "file", ext: "json" },
      ]},{ name: "package.json", type: "file", ext: "json" },
    ]},
    { name: "platform", type: "dir", children: [{ name: "core-api", type: "dir" },{ name: "compose", type: "dir" },{ name: "jewel", type: "dir" }]},
    { name: "native", type: "dir", children: [{ name: "XPlatLauncher", type: "dir" },{ name: "restarter", type: "dir" }]},
  ]},
];

const extColors: Record<string, string> = { tsx:"#3574F0", ts:"#3574F0", rs:"#DEA584", css:"#56B6C2", json:"#9876AA", toml:"#DF8842", md:"#499C54" };

function FileTreeNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(node.expanded ?? false);
  const [hovered, setHovered] = useState(false);
  const isDir = node.type === "dir" || node.type === "module";
  return (
    <div>
      <div
        onClick={() => isDir && setExpanded(!expanded)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display:"flex",alignItems:"center",gap:4,height:26,paddingLeft:4 + depth * 16,
          paddingRight:6,margin:"0 4px",borderRadius:"var(--ide-radius-sm)",cursor:"pointer",
          fontSize:"var(--ide-font-size-sm)",color:"var(--ide-text-primary)",
          background:hovered ? "var(--ide-bg-hover)" : "transparent",transition:"background 0.08s",
          marginBottom:1
        }}>
        {isDir && (
          <span style={{ width:12,fontSize:10,color:"var(--ide-text-disabled)",flexShrink:0,
            transform: expanded ? "rotate(90deg)" : "none", transition:"transform 0.12s",display:"inline-block" }}>▸</span>
        )}
        {node.type === "module" ? (
          <span style={{ width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",
            background:"var(--ide-accent-blue)",color:"white",borderRadius:"var(--ide-radius-xs)",
            fontSize:8,fontWeight:700,flexShrink:0 }}>M</span>
        ) : isDir ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill={expanded ? "#DCB439" : "var(--ide-text-secondary)"}><path d="M1.75 2.5a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h12.5a.75.75 0 0 0 .75-.75V5.5a.75.75 0 0 0-.75-.75H8.75a.75.75 0 0 1-.53-.22L7.03 3.28a.75.75 0 0 0-.53-.22H1.75z"/></svg>
        ) : (
          <span style={{ width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",
            background:extColors[String(node.ext)] || "#8C8F94",color:"white",borderRadius:2,
            fontSize:7,fontWeight:700,flexShrink:0 }}>
            {String(node.ext).slice(0,2).toUpperCase()}
          </span>
        )}
        <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{node.name}</span>
      </div>
      {isDir && expanded && node.children?.map((c,i) => <FileTreeNode key={i} node={c} depth={depth+1} />)}
    </div>
  );
}

export default function Sidebar({ activeTool, onSelectTool }: Props) {
  return (
    <div style={{
      width:"var(--ide-tool-window-width)",display:"flex",flexShrink:0,
      background:"var(--ide-bg-panel)",borderRight:"1px solid var(--ide-border-subtle)"
    }}>
      <div style={{
        width:36,display:"flex",flexDirection:"column",alignItems:"center",gap:1,
        padding:"6px 2px",flexShrink:0
      }}>
        {TOOLS.map(t => (
          <div key={t.id}
            style={{
              width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",
              borderRadius:"var(--ide-radius-sm)",cursor:"pointer",fontSize:"var(--ide-font-size-xs)",
              fontWeight:600,color:activeTool===t.id?"var(--ide-accent-blue)":"var(--ide-text-secondary)",
              background:activeTool===t.id?"var(--ide-bg-active)":"transparent",
              transition:"all 0.1s"
            }}
            onClick={() => onSelectTool(t.id)} title={t.label}>
            {t.letter}
          </div>
        ))}
        <div style={{ flex:1 }} />
        <div style={{
          width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",
          borderRadius:"var(--ide-radius-sm)",cursor:"pointer",color:"var(--ide-text-secondary)",fontSize:10
        }} title="Collapse">◀</div>
      </div>

      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{
          height:32,display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"0 8px",flexShrink:0,borderBottom:"1px solid var(--ide-border-subtle)"
        }}>
          <span style={{ fontSize:"var(--ide-font-size-xs)",fontWeight:600,color:"var(--ide-text-secondary)",textTransform:"uppercase",letterSpacing:0.5 }}>
            {TOOLS.find(t=>t.id===activeTool)?.label||"Project"}
          </span>
          <div style={{ display:"flex",gap:2 }}>
            <button style={{ width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",
              border:"none",background:"transparent",color:"var(--ide-text-secondary)",cursor:"pointer",
              borderRadius:"var(--ide-radius-xs)",fontSize:10,transition:"all 0.1s" }}>⊟</button>
            <button style={{ width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",
              border:"none",background:"transparent",color:"var(--ide-text-secondary)",cursor:"pointer",
              borderRadius:"var(--ide-radius-xs)",fontSize:10,transition:"all 0.1s" }}>⚙</button>
          </div>
        </div>
        <div style={{ flex:1,overflow:"auto",padding:"4px 0" }}>
          {activeTool === "project" && MOCK_TREE.map((n,i) => <FileTreeNode key={i} node={n} />)}
          {activeTool === "structure" && <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--ide-text-disabled)",fontSize:"var(--ide-font-size-sm)" }}>Structure view</div>}
          {activeTool === "commit" && <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--ide-text-disabled)",fontSize:"var(--ide-font-size-sm)" }}>No changes</div>}
          {activeTool === "services" && <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--ide-text-disabled)",fontSize:"var(--ide-font-size-sm)" }}>No services</div>}
        </div>
      </div>
    </div>
  );
}
