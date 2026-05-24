import { useState } from "react";

type ToolWindow = "project" | "search" | "git" | "run" | "structure";

interface Props {
  activeTool: ToolWindow;
  onSelectTool: (tool: ToolWindow) => void;
}

interface TreeNode {
  name: string; type: "file" | "dir" | "module" | "root"; ext?: string; children?: TreeNode[]; expanded?: boolean;
}

const TOOLS: { id: ToolWindow; icon: string; title: string }[] = [
  { id: "project", icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 2.5a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h12.5a.75.75 0 0 0 .75-.75V5.5a.75.75 0 0 0-.75-.75H8.75a.75.75 0 0 1-.53-.22L7.03 3.28a.75.75 0 0 0-.53-.22H1.75z"/></svg>`, title: "Project (Alt+1)" },
  { id: "search", icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.3"/><path d="M10 10l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>`, title: "Search (Shift+Shift)" },
  { id: "git", icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C5.8 0 4 1.8 4 4c0 1.5.8 2.8 2 3.5V15h4V7.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4zm0 1.5c1.4 0 2.5 1.1 2.5 2.5S9.4 7.5 8 7.5 5.5 6.4 5.5 5 6.6 2.5 8 2.5z"/></svg>`, title: "Git (Alt+9)" },
  { id: "run", icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2v12l10-6z"/></svg>`, title: "Run (Alt+4)" },
  { id: "structure", icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="12" height="3" rx="1"/><rect x="2" y="7" width="5" height="3" rx="1"/><rect x="9" y="7" width="5" height="3" rx="1"/><rect x="2" y="12" width="12" height="2" rx="1"/></svg>`, title: "Structure (Alt+7)" },
];

const MOCK_TREE: TreeNode[] = [
  { name: "AstralLight", type: "root", expanded: true, children: [
    { name: ".idea", type: "dir", expanded: false, children: [] },
    { name: ".mvn", type: "dir", children: [] },
    { name: "src", type: "dir", expanded: true, children: [
      { name: "main", type: "dir", expanded: true, children: [
        { name: "java", type: "dir", expanded: true, children: [
          { name: "com", type: "dir", expanded: true, children: [
            { name: "corvertrack", type: "dir", expanded: true, children: [
              { name: "monitor", type: "dir", expanded: true, children: [
                { name: "controller", type: "dir", expanded: true, children: [
                  { name: "UserControllerImpl.java", type: "file", ext: "java" },
                  { name: "PortalsControllerImpl.java", type: "file", ext: "java" },
                ]},
                { name: "AstralMonitorApplication.java", type: "file", ext: "java" },
              ]},
            ]},
          ]},
        ]},
        { name: "resources", type: "dir", children: [] },
      ]},
      { name: "test", type: "dir", children: [] },
    ]},
    { name: "pom.xml", type: "file", ext: "xml" },
    { name: "README.md", type: "file", ext: "md" },
  ]},
];

function FileTreeNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(node.expanded ?? false);
  const [hovered, setHovered] = useState(false);
  const isDir = node.type === "dir" || node.type === "root";
  const isRoot = node.type === "root";

  return (
    <div>
      <div
        onClick={() => isDir && setExpanded(!expanded)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display:"flex",alignItems:"center",gap:5,height:24,paddingLeft:8 + depth * 16,
          paddingRight:8,margin:"0 4px",borderRadius:"var(--ide-radius-sm)",cursor:"pointer",
          fontSize:"var(--ide-font-size-sm)",color: isRoot ? "var(--ide-text-primary)" : "var(--ide-text-primary)",
          background:hovered ? "var(--ide-bg-hover)" : "transparent",
          transition:"background 0.08s",fontWeight: isRoot ? 600 : 400
        }}>
        {/* Chevron */}
        {isDir && (
          <span style={{
            width:14,fontSize:9,color:"var(--ide-text-disabled)",flexShrink:0,
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition:"transform 0.15s ease",display:"inline-flex",
            alignItems:"center",justifyContent:"center"
          }}>▸</span>
        )}
        {!isDir && <span style={{ width:14,flexShrink:0 }} />}

        {/* Icon */}
        {isRoot ? (
          <span style={{
            width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",
            background:"linear-gradient(135deg, #3871E1, #8060DB)",color:"#fff",
            borderRadius:4,fontSize:8,fontWeight:700,flexShrink:0,textTransform:"uppercase"
          }}>A</span>
        ) : isDir ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill={expanded ? "#DCB439" : "var(--ide-text-disabled)"} style={{ flexShrink:0 }}>
            <path d="M1.75 2.5a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h12.5a.75.75 0 0 0 .75-.75V5.5a.75.75 0 0 0-.75-.75H8.75a.75.75 0 0 1-.53-.22L7.03 3.28a.75.75 0 0 0-.53-.22H1.75z"/>
          </svg>
        ) : (
          <span style={{
            width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",
            flexShrink:0,fontSize:9
          }}>
            {node.ext === "java" && <span style={{ color:"#F89820" }}>☕</span>}
            {node.ext === "xml" && <span style={{ color:"#C94A47" }}>📋</span>}
            {node.ext === "md" && <span style={{ color:"#499C54" }}>📝</span>}
            {!["java","xml","md"].includes(String(node.ext)) && <span style={{ color:"#8C8F94" }}>📄</span>}
          </span>
        )}

        {/* Name */}
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
      {/* ===== Tool Window Button Strip ===== */}
      <div style={{
        width:40,display:"flex",flexDirection:"column",alignItems:"center",
        padding:"4px 3px",flexShrink:0,gap:1,
        background:"var(--ide-bg-panel)"
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

      {/* ===== Tool Window Content Panel ===== */}
      <div style={{
        flex:1,display:"flex",flexDirection:"column",overflow:"hidden",
        minWidth:0,background:"var(--ide-bg-panel)"
      }}>
        {/* Header */}
        <div style={{
          height:34,display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"0 10px",flexShrink:0,borderBottom:"1px solid var(--ide-border-subtle)",
          gap:8
        }}>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <span style={{
              fontSize:"var(--ide-font-size-xs)",fontWeight:600,color:"var(--ide-text-primary)",
              textTransform:"uppercase",letterSpacing:0.6
            }}>
              {TOOLS.find(t=>t.id===activeTool)?.title?.split(" ")[0] || "Project"}
            </span>
          </div>
          <div style={{ display:"flex",gap:1 }}>
            <button style={{
              width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",
              border:"none",background:"transparent",color:"var(--ide-text-secondary)",cursor:"pointer",
              borderRadius:"var(--ide-radius-xs)",fontSize:11,transition:"all 0.08s"
            }}
            onMouseOver={e=>e.currentTarget.style.background="var(--ide-bg-hover)"}
            onMouseOut={e=>e.currentTarget.style.background="transparent"}>⊟</button>
            <button style={{
              width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",
              border:"none",background:"transparent",color:"var(--ide-text-secondary)",cursor:"pointer",
              borderRadius:"var(--ide-radius-xs)",fontSize:11,transition:"all 0.08s"
            }}
            onMouseOver={e=>e.currentTarget.style.background="var(--ide-bg-hover)"}
            onMouseOut={e=>e.currentTarget.style.background="transparent"}>⚙</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1,overflow:"auto",padding:"4px 0" }}>
          {activeTool === "project" && MOCK_TREE.map((n,i) => <FileTreeNode key={i} node={n} />)}
          {activeTool === "search" && (
            <div style={{ display:"flex",flexDirection:"column",padding:"12px",gap:8 }}>
              <input placeholder="Search..." style={{
                width:"100%",height:30,padding:"0 10px",border:"1px solid var(--ide-border)",
                borderRadius:"var(--ide-radius-sm)",background:"var(--ide-bg-input)",
                color:"var(--ide-text-primary)",fontSize:"var(--ide-font-size-sm)",outline:"none",
                boxSizing:"border-box"
              }} />
              <div style={{ color:"var(--ide-text-disabled)",fontSize:"var(--ide-font-size-sm)",textAlign:"center",paddingTop:20 }}>Double Shift to search everywhere</div>
            </div>
          )}
          {activeTool === "git" && (
            <div style={{ display:"flex",flexDirection:"column",padding:"12px",gap:6 }}>
              <div style={{ display:"flex",justifyContent:"space-between",padding:"6px 8px",background:"var(--ide-bg-active)",borderRadius:"var(--ide-radius-sm)",fontSize:"var(--ide-font-size-xs)" }}>
                <span style={{ color:"var(--ide-text-secondary)" }}>Branch</span><span style={{ fontWeight:500 }}>AstralApplication</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",padding:"6px 8px",background:"var(--ide-bg-active)",borderRadius:"var(--ide-radius-sm)",fontSize:"var(--ide-font-size-xs)" }}>
                <span style={{ color:"var(--ide-text-secondary)" }}>Status</span><span style={{ color:"var(--ide-accent-green)" }}>Clean ✓</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",padding:"6px 8px",background:"var(--ide-bg-active)",borderRadius:"var(--ide-radius-sm)",fontSize:"var(--ide-font-size-xs)" }}>
                <span style={{ color:"var(--ide-text-secondary)" }}>Remote</span><span>origin/main</span>
              </div>
            </div>
          )}
          {activeTool === "run" && (
            <div style={{ display:"flex",flexDirection:"column",padding:"12px",gap:6 }}>
              <div style={{ padding:"8px 10px",background:"var(--ide-bg-card)",borderRadius:"var(--ide-radius-md)",border:"1px solid var(--ide-border)" }}>
                <div style={{ fontSize:"var(--ide-font-size-sm)",fontWeight:500,marginBottom:4 }}>Spring Boot App</div>
                <div style={{ fontSize:"var(--ide-font-size-xs)",color:"var(--ide-text-secondary)" }}>AstralMonitorApplication</div>
              </div>
              <div style={{ padding:"8px 10px",background:"var(--ide-bg-active)",borderRadius:"var(--ide-radius-sm)" }}>
                <div style={{ fontSize:"var(--ide-font-size-sm)",fontWeight:400 }}>Package jar</div>
              </div>
            </div>
          )}
          {activeTool === "structure" && (
            <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"var(--ide-text-disabled)",fontSize:"var(--ide-font-size-sm)" }}>
              No structure available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
