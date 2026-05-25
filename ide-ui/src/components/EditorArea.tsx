/**
 * @see com.intellij.openapi.fileEditor.impl.EditorComposite
 * @see com.intellij.openapi.fileEditor.impl.EditorHeaderComponent
 * @see com.intellij.openapi.fileEditor.impl.EditorTabs
 *
 * Editor area — real file content display with multi-tab support
 * Reads from IdeStore openFiles/activeFilePath
 */

import { useState, useMemo } from "react";
import type { OpenFile } from "../store/ideStore";
import { getFileIcon } from "../services/fileSystem";

interface Props {
  openFiles: OpenFile[];
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
  onTabContextMenu: (e: React.MouseEvent, path: string) => void;
}

function SyntaxHighlight({ content, lang }: { content: string; lang: string }) {
  const lines = content.split("\n");
  return (
    <pre style={{
      fontFamily: "var(--ide-font-editor)",
      fontSize: "var(--ide-font-size-sm)",
      lineHeight: "20px",
      color: "var(--ide-text-editor)",
      whiteSpace: "pre",
      padding: "0 16px 100px",
      margin: 0,
    }}>
      <code>{content}</code>
    </pre>
  );
}

export default function EditorArea({ openFiles, activeFilePath, onSelectFile, onCloseFile, onTabContextMenu }: Props) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const activeFile = useMemo(() =>
    openFiles.find(f => f.path === activeFilePath) || null,
    [openFiles, activeFilePath]
  );

  if (openFiles.length === 0 || !activeFile) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: 0,
        minHeight: 0,
        borderRadius: "var(--island-arc)",
        background: "var(--island-border-color)",
        padding: "var(--island-editor-padding)",
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "calc(var(--island-arc) - var(--island-editor-padding))",
          background: "var(--ide-bg-editor)",
          color: "var(--ide-text-disabled)",
          fontSize: "var(--ide-font-size-lg)",
        }}>
          <div style={{ textAlign: "center", padding: "0 24px" }}>
            <div style={{ fontSize: "var(--font-size-xl)", color: "var(--text-disabled)", marginBottom: 8 }}>
              No file opened
            </div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}>
              Double Shift to search everywhere
            </div>
          </div>
        </div>
      </div>
    );
  }

  const parts = activeFile.path.split("/");
  const lineCount = activeFile.content.split("\n").length;

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      minWidth: 0,
      minHeight: 0,
      borderRadius: "var(--island-arc)",
      background: "var(--island-border-color)",
      padding: "var(--island-editor-padding)",
    }}>
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "calc(var(--island-arc) - var(--island-editor-padding))",
        background: "var(--ide-bg-editor)",
      }}>
        {/* Tab bar */}
        <div style={{
          height: 36,
          display: "flex",
          alignItems: "flex-end",
          gap: 0,
          padding: "0 4px",
          flexShrink: 0,
          background: "var(--editor-tab-bg)",
        }}>
          {openFiles.map(f => {
            const isActive = f.path === activeFilePath;
            const isHovered = hoveredTab === f.path;
            return (
              <div
                key={f.path}
                onClick={() => onSelectFile(f.path)}
                onContextMenu={e => onTabContextMenu(e, f.path)}
                onMouseEnter={() => setHoveredTab(f.path)}
                onMouseLeave={() => setHoveredTab(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  height: "var(--editor-tab-height)",
                  padding: "0 8px",
                  borderRadius: "var(--editor-tab-arc) var(--editor-tab-arc) 0 0",
                  background: isActive
                    ? "var(--editor-tab-selected-bg-active)"
                    : isHovered
                      ? "var(--editor-tab-hover-bg)"
                      : "transparent",
                  border: isActive
                    ? "1px solid var(--editor-tab-selected-border-active)"
                    : "1px solid transparent",
                  borderBottom: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                  minWidth: 0,
                  maxWidth: 200,
                  transition: "background var(--ide-transition-fast), border-color var(--ide-transition-fast)",
                  color: isActive ? "var(--ide-text-default)" : "var(--ide-text-muted)",
                  fontSize: "var(--ide-font-size-sm)",
                  position: "relative" as const,
                  marginRight: 1,
                }}
              >
                <span style={{ fontSize: 11, flexShrink: 0 }}>{getFileIcon(f.name)}</span>
                <span style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: isActive ? 500 : 400,
                }}>{f.name}</span>
                {f.modified && (
                  <span style={{ color: "var(--ide-accent-blue)", fontSize: 14, lineHeight: 1, marginLeft: 2 }}>●</span>
                )}
                {(isHovered || isActive) && (
                  <button style={{
                    width: 18,
                    height: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    background: "transparent",
                    color: "var(--ide-text-disabled)",
                    cursor: "pointer",
                    borderRadius: "var(--ide-radius-xs)",
                    fontSize: 14,
                    flexShrink: 0,
                    padding: 0,
                    transition: "background var(--ide-transition-fast)",
                  }}
                    onClick={e => { e.stopPropagation(); onCloseFile(f.path); }}
                    onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                  >✕</button>
                )}
              </div>
            );
          })}
        </div>

        {/* Breadcrumb */}
        <div style={{
          display: "flex",
          alignItems: "center",
          height: 26,
          padding: "0 12px",
          background: "var(--ide-bg-editor)",
          borderBottom: "1px solid var(--ide-border-subtle)",
          fontSize: "var(--ide-font-size-xs)",
          flexShrink: 0,
          gap: 3,
        }}>
          {parts.map((p, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {i > 0 && <span style={{ color: "var(--ide-text-disabled)", fontSize: 9 }}>›</span>}
              <span style={{
                color: i === parts.length - 1 ? "var(--ide-text-default)" : "var(--ide-text-link)",
                cursor: i === parts.length - 1 ? "default" : "pointer",
                fontWeight: i === parts.length - 1 ? 500 : 400,
              }}>{p}</span>
            </span>
          ))}
        </div>

        {/* Editor content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "var(--ide-bg-editor)" }}>
          <div style={{
            width: 52,
            flexShrink: 0,
            background: "var(--ide-bg-editor)",
            textAlign: "right",
            padding: "8px 10px 0 0",
            userSelect: "none",
            display: "flex",
            flexDirection: "column",
          }}>
            {Array.from({ length: Math.min(lineCount, 200) }, (_, i) => (
              <div key={i} style={{
                height: 20,
                fontSize: "var(--ide-font-size-xs)",
                color: i === 0 ? "var(--ide-accent-blue)" : "var(--ide-text-disabled)",
                lineHeight: "20px",
                fontFamily: "var(--ide-font-editor)",
              }}>{i + 1}</div>
            ))}
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "8px 0 0 0" }}>
            <SyntaxHighlight content={activeFile.content} lang={activeFile.lang} />
          </div>
        </div>
      </div>
    </div>
  );
}
