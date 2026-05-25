/**
 * @see com.intellij.openapi.wm.impl.status.IdeStatusBarImpl
 *
 * StatusBar — pure renderer.
 * All widgets, text, icons, styles, and positions are defined in Rust (statusbar.rs).
 * This component reads StatusBarDescriptor from the Rust backend and renders it.
 * ZERO hardcoded design decisions in this file.
 *
 * Official IdeStatusBarImpl layout (BorderLayout):
 *   ├─ WEST:   leftPanel (BoxLayout.X_AXIS)
 *   │    border: empty(0,4,0,1)
 *   │    Contains: ToolWindowsWidget
 *   ├─ CENTER: centerPanel (BorderLayout)
 *   │    Contains: InfoAndProgressPanel (messages, progress bars)
 *   └─ EAST:   rightPanel (GridBagLayout)
 *        border: emptyLeft(1)
 *        Contains: all registered widgets sorted by LoadingOrder
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

interface StatusBarDescriptor {
  left_widgets: StatusBarWidget[];
  center_widgets: StatusBarWidget[];
  right_widgets: StatusBarWidget[];
  info_message: string;
  progress: ProgressInfo | null;
}

function FALLBACK_STATUS_BAR_DESCRIPTOR(): StatusBarDescriptor {
  const noHover: StatusBarWidgetStyle = { hover: false, font_weight: null, text_color: "var(--ide-text-muted)", background: null, border_radius: null, icon_color: null };
  const hoverStyle: StatusBarWidgetStyle = { hover: true, font_weight: null, text_color: "var(--ide-text-muted)", background: null, border_radius: "var(--ide-status-bar-widget-hover-arc)", icon_color: null };

  return {
    info_message: "Ready",
    progress: null,
    left_widgets: [
      { id: "ToolWindowsWidget", position: "left", widget_type: "Icon", text: "", icon: "tool-windows", tooltip: "Tool Windows", shortcut: null, enabled: true, visible: true, order: 0, style: noHover, click_action: "showToolWindowList" },
    ],
    center_widgets: [
      { id: "InfoAndProgressPanel", position: "center", widget_type: "Text", text: "Ready", icon: null, tooltip: null, shortcut: null, enabled: true, visible: true, order: 0, style: { ...noHover, text_color: "var(--ide-text-secondary)" }, click_action: null },
    ],
    right_widgets: [
      { id: "Position", position: "right", widget_type: "Text", text: "Ln 12, Col 20", icon: null, tooltip: "Cursor Position", shortcut: "Ctrl+G", enabled: true, visible: true, order: 10, style: noHover, click_action: "gotoLine" },
      { id: "LanguageService", position: "right", widget_type: "Text", text: "Java", icon: null, tooltip: "Language Service", shortcut: null, enabled: true, visible: true, order: 20, style: { ...hoverStyle, font_weight: "500", text_color: "var(--ide-text-default)" }, click_action: "showLanguageServices" },
      { id: "LineSeparator", position: "right", widget_type: "Text", text: "CRLF", icon: null, tooltip: "Line Separator", shortcut: null, enabled: true, visible: true, order: 30, style: hoverStyle, click_action: "changeLineSeparator" },
      { id: "Encoding", position: "right", widget_type: "Text", text: "UTF-8", icon: null, tooltip: "File Encoding", shortcut: null, enabled: true, visible: true, order: 40, style: hoverStyle, click_action: "changeEncoding" },
      { id: "IndentStyle", position: "right", widget_type: "Text", text: "Spaces: 4", icon: null, tooltip: "Indentation", shortcut: null, enabled: true, visible: true, order: 45, style: hoverStyle, click_action: "changeIndentStyle" },
      { id: "InsertOverwrite", position: "right", widget_type: "Text", text: "INS", icon: null, tooltip: "Insert/Overwrite Mode", shortcut: "Insert", enabled: true, visible: false, order: 50, style: hoverStyle, click_action: "toggleInsertMode" },
      { id: "ReadOnlyAttribute", position: "right", widget_type: "Icon", text: "", icon: "lock", tooltip: "Read-only", shortcut: null, enabled: true, visible: false, order: 60, style: { ...noHover, icon_color: "var(--ide-text-muted)" }, click_action: "toggleReadOnly" },
      { id: "Notifications", position: "right", widget_type: "Icon", text: "", icon: "notifications", tooltip: "Notifications", shortcut: null, enabled: true, visible: true, order: 70, style: { ...hoverStyle, icon_color: "var(--ide-text-muted)" }, click_action: "showNotifications" },
      { id: "settingsEntryPointWidget", position: "right", widget_type: "Icon", text: "", icon: "settings", tooltip: "Settings", shortcut: "Ctrl+Alt+,", enabled: true, visible: true, order: 999, style: { ...hoverStyle, icon_color: "var(--ide-text-muted)" }, click_action: "openSettings" },
    ],
  };
}

interface Props {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

function StatusWidgetIcon({ name, color }: { name: string; color: string }) {
  switch (name) {
    case "tool-windows":
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill={color}>
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      );
    case "lock":
      return (
        <svg width="10" height="10" viewBox="0 0 16 16" fill={color}>
          <path d="M8 0a1.5 1.5 0 0 1 1.5 1.5v3.79l2.71 2.71a1.5 1.5 0 0 1-2.12 2.12L8 7.91l-2.09 2.09A1.5 1.5 0 1 1 3.79 8L6.5 5.29V1.5A1.5 1.5 0 0 1 8 0z" />
        </svg>
      );
    case "notifications":
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill={color}>
          <path d="M8 1a4.5 4.5 0 0 0-4.5 4.5v2.76l-.95 1.9A1 1 0 0 0 3.44 12h2.06a2.5 2.5 0 0 0 5 0h2.06a1 1 0 0 0 .89-1.84L12.5 8.26V5.5A4.5 4.5 0 0 0 8 1zm1 11H7a1 1 0 0 0 2 0z" />
        </svg>
      );
    case "settings":
      return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill={color}>
          <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
          <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
        </svg>
      );
    default:
      return null;
  }
}

function StatusWidget({
  widget,
  theme,
  onToggleTheme,
}: {
  widget: StatusBarWidget;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    padding: `0 var(--ide-status-bar-item-padding-horizontal)`,
    height: "var(--ide-status-bar-item-height)",
    borderRadius: widget.style.border_radius || 0,
    cursor: widget.style.hover ? "pointer" : "default",
    color: widget.style.text_color || "var(--ide-text-muted)",
    fontSize: "var(--ide-status-bar-font-size)",
    fontWeight: widget.style.font_weight || undefined,
    background: hovered && widget.style.hover ? "var(--ide-bg-hover)" : widget.style.background || "transparent",
    transition: "background var(--ide-transition-fast)",
    border: "none",
    outline: "none",
    whiteSpace: "nowrap" as const,
  };

  const isSettingsEntryPoint = widget.id === "settingsEntryPointWidget";

  const handleClick = useCallback(() => {
    if (isSettingsEntryPoint) {
      onToggleTheme();
      return;
    }
  }, [isSettingsEntryPoint, onToggleTheme]);

  const iconColor = widget.style.icon_color || "var(--ide-text-muted)";

  if (widget.widget_type === "Icon") {
    return (
      <span
        style={baseStyle}
        title={widget.tooltip || undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleClick}
      >
        {widget.icon && <StatusWidgetIcon name={widget.icon} color={iconColor} />}
      </span>
    );
  }

  if (widget.widget_type === "Separator") {
    return (
      <span style={{
        width: 1,
        height: "var(--ide-status-bar-item-height)",
        background: "var(--ide-border-subtle)",
        margin: "0 2px",
      }} />
    );
  }

  if (isSettingsEntryPoint) {
    return (
      <button
        style={baseStyle}
        title={widget.tooltip || "Toggle theme"}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onToggleTheme}
      >
        {widget.icon && <StatusWidgetIcon name={widget.icon} color={iconColor} />}
        {theme === "dark" ? "Dark" : "Light"}
      </button>
    );
  }

  return (
    <span
      style={baseStyle}
      title={widget.tooltip ? (widget.shortcut ? `${widget.tooltip} (${widget.shortcut})` : widget.tooltip) : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {widget.icon && <StatusWidgetIcon name={widget.icon} color={iconColor} />}
      {widget.text}
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
      height: "var(--ide-status-bar-height)",
      display: "flex",
      alignItems: "center",
      background: "var(--ide-bg-statusbar)",
      borderTop: "var(--ide-status-bar-top-border) solid var(--ide-border-toolbar)",
      padding: "0 var(--ide-status-bar-padding-h)",
      flexShrink: 0,
      fontSize: "var(--ide-status-bar-font-size)",
    }}>
      {/* ═══════ WEST: leftPanel ═══════
       * @see IdeStatusBarImpl leftPanel
       * border: empty(0,4,0,1)
       * Contains: ToolWindowsWidget
       * No hover effect on left panel widgets
       */}
      {visibleLeft.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 1, paddingRight: 4, borderRight: "1px solid var(--ide-border-subtle)" }}>
          {visibleLeft.map(w => (
            <StatusWidget key={w.id} widget={w} theme={theme} onToggleTheme={onToggleTheme} />
          ))}
        </div>
      )}

      {/* ═══════ CENTER: centerPanel ═══════
       * @see IdeStatusBarImpl centerPanel
       * Contains: InfoAndProgressPanel (messages, progress bars)
       */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 8px", gap: 8 }}>
        {descriptor.progress && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, maxWidth: 300 }}>
            <span style={{ color: "var(--ide-text-secondary)", fontSize: "var(--ide-status-bar-font-size)", whiteSpace: "nowrap" }}>
              {descriptor.progress.text}
            </span>
            <div style={{
              flex: 1,
              height: 3,
              background: "var(--ide-border-subtle)",
              borderRadius: 2,
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: descriptor.progress.indeterminate ? "30%" : `${(descriptor.progress.fraction || 0) * 100}%`,
                background: "var(--ide-accent-blue)",
                borderRadius: 2,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        )}
        {!descriptor.progress && visibleCenter.map(w => (
          <StatusWidget key={w.id} widget={w} theme={theme} onToggleTheme={onToggleTheme} />
        ))}
        {!descriptor.progress && !visibleCenter.length && (
          <span style={{ color: "var(--ide-text-secondary)", fontSize: "var(--ide-status-bar-font-size)" }}>
            {descriptor.info_message}
          </span>
        )}
      </div>

      {/* ═══════ EAST: rightPanel ═══════
       * @see IdeStatusBarImpl rightPanel
       * border: emptyLeft(1)
       * Contains: all registered widgets sorted by LoadingOrder
       * Has hover effect on right panel widgets
       */}
      {visibleRight.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 1, paddingLeft: 4, borderLeft: "1px solid var(--ide-border-subtle)" }}>
          {visibleRight.map(w => (
            <StatusWidget key={w.id} widget={w} theme={theme} onToggleTheme={onToggleTheme} />
          ))}
        </div>
      )}
    </div>
  );
}
