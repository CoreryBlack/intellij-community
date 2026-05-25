/**
 * @see com.intellij.openapi.wm.impl.InternalDecoratorImpl
 * @see com.intellij.openapi.application.impl.islands.IslandsUICustomization
 *
 * Official InternalDecorator (tool window content panel) wrapped in Island:
 *
 *   XNextIslandHolder (Island container)
 *   └─ InternalDecoratorImpl
 *       ├─ TitleBar (tool window header)
 *       │    ├─ [LEFT]   tool window title text + dropdown
 *       │    ├─ [CENTER] (spacer)
 *       │    └─ [RIGHT]  action buttons (minimize, settings, close)
 *       └─ ContentPanel (tool window content)
 *
 * Island visual treatment:
 *   - borderRadius: var(--island-arc) = 20px
 *   - borderWidth: var(--island-border-width) = 6px (drawn as padding with borderColor bg)
 *   - borderColor: var(--island-border-color) = #191A1C (layer0-bg, same as content bg)
 *   - background: var(--ide-bg-tool-window) = #191A1C (layer0-bg)
 *   - Island.ToolWindow.border padding: 3px
 *   - The Island "floats" on layer1-bg (#26282C) background
 */

import { useState } from "react";

type ToolWindow = "project" | "search" | "git" | "run" | "structure";

interface Props {
  activeTool: ToolWindow;
}

interface TreeNode {
  name: string;
  type: "file" | "dir" | "module" | "root";
  ext?: string;
  children?: TreeNode[];
  expanded?: boolean;
}

const TOOL_TITLES: Record<ToolWindow, string> = {
  project: "Project",
  search: "Search",
  git: "Git",
  run: "Run",
  structure: "Structure",
};

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
          display: "flex",
          alignItems: "center",
          gap: 4,
          height: "var(--ide-tree-row-height)",
          paddingLeft: 6 + depth * 16,
          paddingRight: 6,
          margin: "0 2px",
          borderRadius: "var(--ide-radius-sm)",
          cursor: "pointer",
          fontSize: "var(--ide-font-size-sm)",
          color: "var(--ide-text-default)",
          background: hovered ? "var(--ide-bg-hover)" : "transparent",
          transition: "background var(--ide-transition-fast)",
          fontWeight: isRoot ? 600 : 400,
        }}
      >
        {isDir && (
          <span style={{
            width: 14,
            fontSize: 9,
            color: "var(--ide-text-disabled)",
            flexShrink: 0,
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}>▸</span>
        )}
        {!isDir && <span style={{ width: 14, flexShrink: 0 }} />}

        {isRoot ? (
          <span style={{
            width: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #3871E1, #8060DB)",
            color: "#fff",
            borderRadius: 3,
            fontSize: 8,
            fontWeight: 700,
            flexShrink: 0,
          }}>A</span>
        ) : isDir ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill={expanded ? "#DCB439" : "var(--ide-text-secondary)"} style={{ flexShrink: 0 }}>
            <path d="M1.75 2.5a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h12.5a.75.75 0 0 0 .75-.75V5.5a.75.75 0 0 0-.75-.75H8.75a.75.75 0 0 1-.53-.22L7.03 3.28a.75.75 0 0 0-.53-.22H1.75z" />
          </svg>
        ) : (
          <span style={{
            width: 14,
            height: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 9,
          }}>
            {node.ext === "java" && <span style={{ color: "#F89820" }}>☕</span>}
            {node.ext === "xml" && <span style={{ color: "#C94A47" }}>📋</span>}
            {node.ext === "md" && <span style={{ color: "#499C54" }}>📝</span>}
            {!["java", "xml", "md"].includes(String(node.ext)) && <span style={{ color: "#8C8F94" }}>📄</span>}
          </span>
        )}

        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.name}</span>
      </div>
      {isDir && expanded && node.children?.map((c, i) => <FileTreeNode key={i} node={c} depth={depth + 1} />)}
    </div>
  );
}

export default function Sidebar({ activeTool }: Props) {
  const titleBtn: React.CSSProperties = {
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    color: "var(--ide-text-secondary)",
    cursor: "pointer",
    borderRadius: "var(--ide-radius-xs)",
    fontSize: 11,
    transition: "background var(--ide-transition-fast)",
    padding: 0,
  };

  return (
    <div style={{
      width: "var(--ide-tool-window-width)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      flexShrink: 0,
      borderRadius: "var(--island-arc)",
      background: "var(--island-border-color)",
      padding: "var(--island-tool-window-padding)",
    }}>
      {/* Island inner content — actual tool window surface */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "calc(var(--island-arc) - var(--island-tool-window-padding))",
        background: "var(--ide-bg-tool-window)",
      }}>
        {/* ═══════ TitleBar ═══════
         * @see InternalDecorator TitleBar
         * LEFT: tool window title (uppercase, small, bold)
         * RIGHT: minimize + settings + close buttons
         */}
        <div style={{
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          flexShrink: 0,
          gap: 4,
        }}>
          <span style={{
            fontSize: "var(--ide-font-size-xs)",
            fontWeight: 600,
            color: "var(--ide-text-muted)",
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}>
            {TOOL_TITLES[activeTool]}
          </span>
          <div style={{ display: "flex", gap: 1 }}>
            <button style={titleBtn}
              onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
              title="Minimize">⊟</button>
            <button style={titleBtn}
              onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
              title="Settings">⚙</button>
          </div>
        </div>

        {/* ═══════ ContentPanel ═══════ */}
        <div style={{ flex: 1, overflow: "auto", padding: "2px 0" }}>
          {activeTool === "project" && MOCK_TREE.map((n, i) => <FileTreeNode key={i} node={n} />)}
          {activeTool === "search" && (
            <div style={{ display: "flex", flexDirection: "column", padding: "10px", gap: 8 }}>
              <input placeholder="Search..." style={{
                width: "100%",
                height: 28,
                padding: "0 8px",
                border: "1px solid var(--ide-border)",
                borderRadius: "var(--ide-radius-sm)",
                background: "var(--ide-bg-input)",
                color: "var(--ide-text-default)",
                fontSize: "var(--ide-font-size-sm)",
                outline: "none",
                boxSizing: "border-box",
              }} />
              <div style={{ color: "var(--ide-text-disabled)", fontSize: "var(--ide-font-size-sm)", textAlign: "center", paddingTop: 20 }}>
                Double Shift to search everywhere
              </div>
            </div>
          )}
          {activeTool === "git" && (
            <div style={{ display: "flex", flexDirection: "column", padding: "10px", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", background: "var(--ide-bg-active)", borderRadius: "var(--ide-radius-sm)", fontSize: "var(--ide-font-size-xs)" }}>
                <span style={{ color: "var(--ide-text-secondary)" }}>Branch</span>
                <span style={{ fontWeight: 500 }}>AstralApplication</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", background: "var(--ide-bg-active)", borderRadius: "var(--ide-radius-sm)", fontSize: "var(--ide-font-size-xs)" }}>
                <span style={{ color: "var(--ide-text-secondary)" }}>Status</span>
                <span style={{ color: "var(--ide-accent-green)" }}>Clean ✓</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", background: "var(--ide-bg-active)", borderRadius: "var(--ide-radius-sm)", fontSize: "var(--ide-font-size-xs)" }}>
                <span style={{ color: "var(--ide-text-secondary)" }}>Remote</span>
                <span>origin/main</span>
              </div>
            </div>
          )}
          {activeTool === "run" && (
            <div style={{ display: "flex", flexDirection: "column", padding: "10px", gap: 4 }}>
              <div style={{ padding: "6px 8px", background: "var(--ide-bg-card)", borderRadius: "var(--ide-radius-md)", border: "1px solid var(--ide-border)" }}>
                <div style={{ fontSize: "var(--ide-font-size-sm)", fontWeight: 500, marginBottom: 2 }}>Spring Boot App</div>
                <div style={{ fontSize: "var(--ide-font-size-xs)", color: "var(--ide-text-secondary)" }}>AstralMonitorApplication</div>
              </div>
              <div style={{ padding: "6px 8px", background: "var(--ide-bg-active)", borderRadius: "var(--ide-radius-sm)" }}>
                <div style={{ fontSize: "var(--ide-font-size-sm)" }}>Package jar</div>
              </div>
            </div>
          )}
          {activeTool === "structure" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--ide-text-disabled)", fontSize: "var(--ide-font-size-sm)" }}>
              No structure available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
