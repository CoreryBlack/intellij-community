/**
 * @see com.intellij.openapi.wm.impl.status.IdeStatusBarImpl
 * @see com.intellij.terminal.TerminalView
 * @see com.intellij.openapi.application.impl.islands.IslandsUICustomization
 *
 * Bottom panel — real terminal (xterm.js + Rust PTY) + Problems + Services
 * All tabs wrapped in Island container matching official styling
 */

import TerminalWidget from "./TerminalWidget";
import type { BottomTab } from "../store/ideStore";

interface Props {
  bottomPanelTab: BottomTab;
  onBottomPanelTab: (tab: BottomTab) => void;
  onHide: () => void;
  projectPath: string;
}

const BOTTOM_TABS: { id: BottomTab; label: string }[] = [
  { id: "terminal", label: "Terminal" },
  { id: "problems", label: "Problems" },
  { id: "services", label: "Services" },
];

export default function BottomPanel({ bottomPanelTab, onBottomPanelTab, onHide, projectPath }: Props) {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      borderRadius: "var(--island-arc)",
      background: "var(--layer-0-bg)",
      padding: "var(--island-tool-window-padding)",
    }}>
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
        borderRadius: "calc(var(--island-arc) - var(--island-tool-window-padding))",
        background: "var(--tool-window-bg)",
      }}>
        {/* TitleBar */}
        <div style={{
          height: "var(--ide-tool-window-header-height)",
          display: "flex",
          alignItems: "center",
          background: "var(--tool-window-bg)",
          padding: "0 4px",
          gap: 0,
          flexShrink: 0,
        }}>
          {BOTTOM_TABS.map(t => (
            <div key={t.id} style={{
              padding: "3px 10px",
              fontSize: "var(--ide-font-size-xs)",
              cursor: "pointer",
              borderRadius: "var(--editor-tab-arc) var(--editor-tab-arc) 0 0",
              transition: "background var(--ide-transition-fast), border-color var(--ide-transition-fast)",
              color: bottomPanelTab === t.id ? "var(--ide-text-default)" : "var(--ide-text-muted)",
              background: bottomPanelTab === t.id ? "var(--editor-tab-selected-bg-active)" : "transparent",
              border: bottomPanelTab === t.id ? "1px solid var(--editor-tab-selected-border-active)" : "1px solid transparent",
              borderBottom: "none",
              fontWeight: bottomPanelTab === t.id ? 500 : 400,
            }}
              onClick={() => onBottomPanelTab(t.id)}
              onMouseOver={e => { if (bottomPanelTab !== t.id) e.currentTarget.style.background = "var(--ide-bg-hover)"; }}
              onMouseOut={e => { if (bottomPanelTab !== t.id) e.currentTarget.style.background = "transparent"; }}
            >
              {t.label}
            </div>
          ))}

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
            <button style={{
              width: 20,
              height: 20,
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
            }}
              title="Split Right"
              onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            ><img src="/icons/splitVertically.svg" width={12} height={12} alt="" style={{ display: "block" }} /></button>
            <button onClick={onHide} style={{
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "transparent",
              color: "var(--ide-text-disabled)",
              cursor: "pointer",
              borderRadius: "var(--ide-radius-xs)",
              fontSize: 11,
              transition: "background var(--ide-transition-fast)",
              padding: 0,
            }}
              onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            ><img src="/icons/close.svg" width={12} height={12} alt="" style={{ display: "block" }} /></button>
          </div>
        </div>

        {/* ContentPanel */}
        <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
          {bottomPanelTab === "terminal" && (
            <TerminalWidget projectPath={projectPath} visible={true} />
          )}
          {bottomPanelTab === "problems" && (
            <div style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--editor-bg)",
              color: "var(--ide-text-disabled)",
              fontSize: "var(--ide-font-size-sm)",
            }}>
              No problems detected
            </div>
          )}
          {bottomPanelTab === "services" && (
            <div style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--editor-bg)",
              color: "var(--ide-text-disabled)",
              fontSize: "var(--ide-font-size-sm)",
            }}>
              No services running
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
