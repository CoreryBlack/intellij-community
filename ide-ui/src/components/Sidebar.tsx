/**
 * @see com.intellij.openapi.wm.impl.InternalDecoratorImpl
 * @see com.intellij.openapi.vfs.VirtualFile
 *
 * Sidebar — real file tree with Tauri backend integration
 * Supports: directory expansion, file opening, context menus
 */

import { useState, useEffect, useCallback } from "react";
import type { DirEntry, ToolWindowId } from "../store/ideStore";
import { readDirectory, getFileIcon } from "../services/fileSystem";

interface Props {
  activeTool: ToolWindowId;
  projectPath: string;
  fileTree: DirEntry[];
  onOpenFile: (path: string, name: string) => void;
  onContextMenu: (e: React.MouseEvent, path: string, name: string) => void;
}

const TOOL_TITLES: Record<ToolWindowId, string> = {
  project: "Project",
  search: "Search",
  git: "Git",
  run: "Run",
  structure: "Structure",
  terminal: "Terminal",
  problems: "Problems",
  services: "Services",
};

interface TreeNodeProps {
  entry: DirEntry;
  depth: number;
  projectPath: string;
  onOpenFile: (path: string, name: string) => void;
  onContextMenu: (e: React.MouseEvent, path: string, name: string) => void;
}

function TreeNode({ entry, depth, projectPath, onOpenFile, onContextMenu }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<DirEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const loadChildren = useCallback(async () => {
    if (!entry.is_dir || loading) return;
    setLoading(true);
    const entries = await readDirectory(entry.path);
    setChildren(entries);
    setExpanded(true);
    setLoading(false);
  }, [entry.path, entry.is_dir, loading]);

  const handleClick = () => {
    if (entry.is_dir) {
      if (expanded) {
        setExpanded(false);
      } else if (children.length > 0) {
        setExpanded(true);
      } else {
        loadChildren();
      }
    } else {
      onOpenFile(entry.path, entry.name);
    }
  };

  useEffect(() => {
    if (entry.is_dir && depth === 0) {
      loadChildren();
    }
  }, []);

  const isRoot = depth === 0;

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={e => onContextMenu(e, entry.path, entry.name)}
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
          userSelect: "none",
        }}
      >
        {entry.is_dir && (
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
        {!entry.is_dir && <span style={{ width: 14, flexShrink: 0 }} />}

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
        ) : entry.is_dir ? (
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
          }}>{getFileIcon(entry.name)}</span>
        )}

        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</span>
        {loading && <span style={{ color: "var(--ide-text-disabled)", fontSize: 9 }}>...</span>}
      </div>
      {entry.is_dir && expanded && children.map((c) => (
        <TreeNode
          key={c.path}
          entry={c}
          depth={depth + 1}
          projectPath={projectPath}
          onOpenFile={onOpenFile}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
}

export default function Sidebar({ activeTool, projectPath, fileTree, onOpenFile, onContextMenu }: Props) {
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
      background: "var(--layer-0-bg)",
      padding: "var(--island-tool-window-padding)",
    }}>
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "calc(var(--island-arc) - var(--island-tool-window-padding))",
        background: "var(--tool-window-bg)",
      }}>
        <div style={{
          height: "var(--ide-tool-window-header-height)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 6px",
          flexShrink: 0,
          gap: 2,
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
              title="Minimize"><img src="/icons/hide.svg" width={12} height={12} alt="" style={{ display: "block" }} /></button>
            <button style={titleBtn}
              onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
              title="Settings"><img src="/icons/settings.svg" width={12} height={12} alt="" style={{ display: "block" }} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "2px 0" }}>
          {activeTool === "project" && fileTree.map((entry) => (
            <TreeNode
              key={entry.path}
              entry={entry}
              depth={0}
              projectPath={projectPath}
              onOpenFile={onOpenFile}
              onContextMenu={onContextMenu}
            />
          ))}
          {activeTool === "search" && (
            <div style={{ display: "flex", flexDirection: "column", padding: "6px 8px", gap: 6 }}>
              <input placeholder="Search..." style={{
                width: "100%",
                height: 24,
                padding: "0 8px",
                border: "1px solid var(--ide-border)",
                borderRadius: "var(--ide-radius-sm)",
                background: "var(--ide-bg-input)",
                color: "var(--ide-text-default)",
                fontSize: "var(--ide-font-size-sm)",
                outline: "none",
                boxSizing: "border-box",
              }} />
              <div style={{ color: "var(--ide-text-disabled)", fontSize: "var(--ide-font-size-sm)", textAlign: "center", paddingTop: 12 }}>
                Double Shift to search everywhere
              </div>
            </div>
          )}
          {activeTool === "git" && (
            <div style={{ display: "flex", flexDirection: "column", padding: "6px 8px", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px", background: "var(--ide-bg-active)", borderRadius: "var(--ide-radius-sm)", fontSize: "var(--ide-font-size-xs)" }}>
                <span style={{ color: "var(--ide-text-secondary)" }}>Branch</span>
                <span style={{ fontWeight: 500 }}>main</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px", background: "var(--ide-bg-active)", borderRadius: "var(--ide-radius-sm)", fontSize: "var(--ide-font-size-xs)" }}>
                <span style={{ color: "var(--ide-text-secondary)" }}>Status</span>
                <span style={{ color: "var(--ide-accent-green)" }}>Clean ✓</span>
              </div>
            </div>
          )}
          {activeTool === "run" && (
            <div style={{ display: "flex", flexDirection: "column", padding: "6px 8px", gap: 3 }}>
              <div style={{ padding: "4px 6px", background: "var(--ide-bg-card)", borderRadius: "var(--ide-radius-md)", border: "1px solid var(--ide-border)" }}>
                <div style={{ fontSize: "var(--ide-font-size-sm)", fontWeight: 500, marginBottom: 2 }}>Spring Boot App</div>
                <div style={{ fontSize: "var(--ide-font-size-xs)", color: "var(--ide-text-secondary)" }}>AstralMonitorApplication</div>
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
