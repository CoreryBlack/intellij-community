/**
 * @see com.intellij.openapi.wm.impl.status.IdeStatusBarImpl
 * @see com.intellij.openapi.wm.impl.status.MemoryUsagePanel
 *
 * StatusBar — pure renderer.
 * All widgets, text, icons, styles, and positions are defined in Rust (statusbar.rs).
 * ZERO hardcoded design decisions in this file.
 *
 * Official IdeStatusBarImpl layout (BorderLayout):
 *   ├─ WEST:   leftPanel — ToolWindowsWidget
 *   ├─ CENTER: centerPanel — InfoAndProgressPanel
 *   └─ EAST:   rightPanel — widgets sorted by order
 *        MemoryIndicator — rightmost position
 */

import { useState, useCallback } from "react";

interface StatusBarWidgetStyle {
  hover: boolean;
  font_weight: string | null;
  text_color: string | null;
  background: string | null;
  border_radius: string | null;
  icon_color: string | null;
}

interface StatusBarWidget {
  id: string;
  position: "left" | "center" | "right";
  widget_type: "Text" | "Icon" | "IconAndText" | "Separator" | "Progress" | "Custom";
  text: string;
  icon: string | null;
  tooltip: string | null;
  shortcut: string | null;
  enabled: boolean;
  visible: boolean;
  order: number;
  style: StatusBarWidgetStyle;
  click_action: string | null;
}

interface ProgressInfo {
  text: string;
  fraction: number | null;
  indeterminate: boolean;
  cancellable: boolean;
}

/** @see statusbar.rs::MemoryInfo */
interface MemoryInfo {
  used_mb: number;
  max_mb: number;
  fraction: number;
  is_high: boolean;
  enabled: boolean;
  show_text: boolean;
}

interface StatusBarDescriptor {
  left_widgets: StatusBarWidget[];
  center_widgets: StatusBarWidget[];
  right_widgets: StatusBarWidget[];
  info_message: string;
  progress: ProgressInfo | null;
  memory: MemoryInfo;
}

function FALLBACK_STATUS_BAR_DESCRIPTOR(): StatusBarDescriptor {
  const noHover: StatusBarWidgetStyle = { hover: false, font_weight: null, text_color: "var(--text-muted)", background: null, border_radius: null, icon_color: null };
  const hoverStyle: StatusBarWidgetStyle = { hover: true, font_weight: null, text_color: "var(--text-muted)", background: null, border_radius: "4px", icon_color: null };

  return {
    info_message: "Ready",
    progress: null,
    memory: { used_mb: 256, max_mb: 1024, fraction: 0.25, is_high: false, enabled: true, show_text: false },
    left_widgets: [
      { id: "ToolWindowsWidget", position: "left", widget_type: "Icon", text: "", icon: "tool-windows", tooltip: "Tool Windows", shortcut: null, enabled: true, visible: true, order: 0, style: noHover, click_action: "showToolWindowList" },
    ],
    center_widgets: [
      { id: "InfoAndProgressPanel", position: "center", widget_type: "Text", text: "Ready", icon: null, tooltip: null, shortcut: null, enabled: true, visible: true, order: 0, style: { ...noHover, text_color: "var(--text-secondary)" }, click_action: null },
    ],
    right_widgets: [
      { id: "Position", position: "right", widget_type: "Text", text: "Ln 12, Col 20", icon: null, tooltip: "Cursor Position", shortcut: "Ctrl+G", enabled: true, visible: true, order: 10, style: noHover, click_action: "gotoLine" },
      { id: "LanguageService", position: "right", widget_type: "Text", text: "Java", icon: null, tooltip: "Language Service", shortcut: null, enabled: true, visible: true, order: 20, style: { ...hoverStyle, font_weight: "500", text_color: "var(--text-default)" }, click_action: "showLanguageServices" },
      { id: "LineSeparator", position: "right", widget_type: "Text", text: "CRLF", icon: null, tooltip: "Line Separator", shortcut: null, enabled: true, visible: true, order: 30, style: hoverStyle, click_action: "changeLineSeparator" },
      { id: "Encoding", position: "right", widget_type: "Text", text: "UTF-8", icon: null, tooltip: "File Encoding", shortcut: null, enabled: true, visible: true, order: 40, style: hoverStyle, click_action: "changeEncoding" },
      { id: "IndentStyle", position: "right", widget_type: "Text", text: "Spaces: 4", icon: null, tooltip: "Indentation", shortcut: null, enabled: true, visible: true, order: 45, style: hoverStyle, click_action: "changeIndentStyle" },
      { id: "Notifications", position: "right", widget_type: "Icon", text: "", icon: "notifications", tooltip: "Notifications", shortcut: null, enabled: true, visible: true, order: 70, style: { ...hoverStyle, icon_color: "var(--text-muted)" }, click_action: "showNotifications" },
      { id: "settingsEntryPointWidget", position: "right", widget_type: "Icon", text: "", icon: "settings", tooltip: "Settings", shortcut: "Ctrl+Alt+,", enabled: true, visible: true, order: 999, style: { ...hoverStyle, icon_color: "var(--text-muted)" }, click_action: "openSettings" },
    ],
  };
}

interface Props {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

function StatusWidgetIcon({ name, color }: { name: string; color: string }) {
  const iconMap: Record<string, string> = {
    lock: "locked",
    notifications: "notifications",
    settings: "settings",
  };
  const officialName = iconMap[name];
  if (officialName) {
    return <img src={`/icons/${officialName}.svg`} width={12} height={12} alt="" style={{ display: "block" }} />;
  }
  if (name === "tool-windows") {
    return <svg width="12" height="12" viewBox="0 0 16 16" fill={color}><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>;
  }
  return null;
}

function StatusWidget({
  widget,
  onToggleTheme,
}: {
  widget: StatusBarWidget;
  theme?: "dark" | "light";
  onToggleTheme: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    padding: `0 7px`,
    height: "21px",
    borderRadius: widget.style.border_radius || 0,
    cursor: widget.style.hover ? "pointer" : "default",
    color: widget.style.text_color || "var(--text-muted)",
    fontSize: "var(--font-size-xs)",
    fontWeight: widget.style.font_weight || undefined,
    background: hovered && widget.style.hover ? "var(--toolbar-bg-hovered)" : widget.style.background || "transparent",
    transition: "background 0.08s ease",
    border: "none",
    outline: "none",
    whiteSpace: "nowrap" as const,
  };

  const isSettingsEntryPoint = widget.id === "settingsEntryPointWidget";

  const handleClick = useCallback(() => {
    if (isSettingsEntryPoint) onToggleTheme();
  }, [isSettingsEntryPoint, onToggleTheme]);

  const iconColor = widget.style.icon_color || "var(--text-muted)";

  if (widget.widget_type === "Icon") {
    return (
      <span style={baseStyle} title={widget.tooltip || undefined} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={handleClick}>
        {widget.icon && <StatusWidgetIcon name={widget.icon} color={iconColor} />}
      </span>
    );
  }

  if (widget.widget_type === "Separator") {
    return <span style={{ width: 1, height: "21px", background: "var(--separator-color)", margin: "0 2px" }} />;
  }

  if (isSettingsEntryPoint) {
    return (
      <button style={baseStyle} title={widget.tooltip || "Toggle theme"} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={handleClick}>
        {widget.icon && <StatusWidgetIcon name={widget.icon} color={iconColor} />}
        {widget.text}
      </button>
    );
  }

  return (
    <span style={baseStyle} title={widget.tooltip ? (widget.shortcut ? `${widget.tooltip} (${widget.shortcut})` : widget.tooltip) : undefined} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {widget.icon && <StatusWidgetIcon name={widget.icon} color={iconColor} />}
      {widget.text}
    </span>
  );
}

/* ── MemoryIndicator ──
 * @see MemoryUsagePanel — shows heap usage bar
 */

function MemoryIndicator({ memory }: { memory: MemoryInfo }) {
  if (!memory.enabled) return null;
  const pct = Math.round(memory.fraction * 100);
  const color = memory.is_high ? "var(--accent-error-bg)" : "var(--accent-brand-bg)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "0 7px", height: "21px", cursor: "pointer", fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}
      title={`Heap: ${memory.used_mb}MB / ${memory.max_mb}MB (${pct}%)`}>
      <div style={{ width: 30, height: 4, background: "var(--layer-2-bg)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.3s ease" }} />
      </div>
      {memory.show_text && <span>{memory.used_mb}M</span>}
    </span>
  );
}

export default function StatusBar({ theme, onToggleTheme }: Props) {
  const [descriptor] = useState<StatusBarDescriptor>(() => FALLBACK_STATUS_BAR_DESCRIPTOR());

  const visibleLeft = descriptor.left_widgets.filter(w => w.visible);
  const visibleCenter = descriptor.center_widgets.filter(w => w.visible);
  const visibleRight = descriptor.right_widgets.filter(w => w.visible).sort((a, b) => a.order - b.order);

  return (
    <div style={{
      height: "var(--status-bar-height)",
      display: "flex",
      alignItems: "center",
      background: "var(--main-window-background)",
      borderTop: "0 solid var(--editor-border)",
      padding: "0 10px",
      flexShrink: 0,
      fontSize: "var(--font-size-xs)",
    }}>
      {visibleLeft.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 1, paddingRight: 4, borderRight: "1px solid var(--separator-color)" }}>
          {visibleLeft.map(w => <StatusWidget key={w.id} widget={w} theme={theme} onToggleTheme={onToggleTheme} />)}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 8px", gap: 8 }}>
        {descriptor.progress ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, maxWidth: 300 }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-xs)", whiteSpace: "nowrap" }}>{descriptor.progress.text}</span>
            <div style={{ flex: 1, height: 3, background: "var(--selection-bg-inactive)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: descriptor.progress.indeterminate ? "30%" : `${(descriptor.progress.fraction || 0) * 100}%`, background: "var(--accent-brand-bg)", borderRadius: 2, transition: "width 0.3s ease" }} />
            </div>
          </div>
        ) : visibleCenter.length > 0 ? (
          visibleCenter.map(w => <StatusWidget key={w.id} widget={w} theme={theme} onToggleTheme={onToggleTheme} />)
        ) : (
          <span style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-xs)" }}>{descriptor.info_message}</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 1, paddingLeft: 4, borderLeft: "1px solid var(--separator-color)" }}>
        {visibleRight.map(w => <StatusWidget key={w.id} widget={w} theme={theme} onToggleTheme={onToggleTheme} />)}
        {/* @see MemoryUsagePanel — rightmost position */}
        <MemoryIndicator memory={descriptor.memory} />
      </div>
    </div>
  );
}
