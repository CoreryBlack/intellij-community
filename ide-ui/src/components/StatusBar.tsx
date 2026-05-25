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

import { useState, useCallback, useEffect } from "react";
import { getStatusBarDescriptor, type StatusBarDescriptor as RustStatusBarDescriptor } from "../services/ideService";

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



interface Props {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenSettings: () => void;
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
  onToggleTheme: _onToggleTheme,
  onOpenSettings,
}: {
  widget: StatusBarWidget;
  theme?: "dark" | "light";
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

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
    background: pressed && widget.style.hover
      ? "var(--toolbar-bg-pressed)"
      : hovered && widget.style.hover
        ? "var(--toolbar-bg-hovered)"
        : widget.style.background || "transparent",
    transition: "background 0.08s ease",
    border: "none",
    outline: "none",
    whiteSpace: "nowrap" as const,
    userSelect: "none" as const,
  };

  const isSettingsEntryPoint = widget.id === "settingsEntryPointWidget";

  const handleClick = useCallback(() => {
    if (isSettingsEntryPoint) onOpenSettings();
  }, [isSettingsEntryPoint, onOpenSettings]);

  const iconColor = widget.style.icon_color || "var(--text-muted)";

  if (widget.widget_type === "Icon") {
    return (
      <span style={baseStyle} title={widget.tooltip || undefined}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setPressed(false); }}
        onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
        onClick={handleClick}>
        {widget.icon && <StatusWidgetIcon name={widget.icon} color={iconColor} />}
      </span>
    );
  }

  if (widget.widget_type === "Separator") {
    return <span style={{ width: 1, height: "21px", background: "var(--separator-color)", margin: "0 2px" }} />;
  }

  if (isSettingsEntryPoint) {
    return (
      <button style={baseStyle} title={widget.tooltip || "Settings"}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setPressed(false); }}
        onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
        onClick={handleClick}>
        {widget.icon && <StatusWidgetIcon name={widget.icon} color={iconColor} />}
        {widget.text}
      </button>
    );
  }

  return (
    <span style={baseStyle} title={widget.tooltip ? (widget.shortcut ? `${widget.tooltip} (${widget.shortcut})` : widget.tooltip) : undefined}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}>
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

export default function StatusBar({ theme, onToggleTheme, onOpenSettings }: Props) {
  const [descriptor, setDescriptor] = useState<StatusBarDescriptor>({
    info_message: "",
    progress: null,
    memory: { used_mb: 0, max_mb: 0, fraction: 0, is_high: false, enabled: true, show_text: false },
    left_widgets: [],
    center_widgets: [],
    right_widgets: [],
  });

  useEffect(() => {
    getStatusBarDescriptor()
      .then((data: RustStatusBarDescriptor) => {
        setDescriptor(data as unknown as StatusBarDescriptor);
      });
  }, []);

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
          {visibleLeft.map(w => <StatusWidget key={w.id} widget={w} theme={theme} onToggleTheme={onToggleTheme} onOpenSettings={onOpenSettings} />)}
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
          visibleCenter.map(w => <StatusWidget key={w.id} widget={w} theme={theme} onToggleTheme={onToggleTheme} onOpenSettings={onOpenSettings} />)
        ) : (
          <span style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-xs)" }}>{descriptor.info_message}</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 1, paddingLeft: 4, borderLeft: "1px solid var(--separator-color)" }}>
        {visibleRight.map(w => <StatusWidget key={w.id} widget={w} theme={theme} onToggleTheme={onToggleTheme} onOpenSettings={onOpenSettings} />)}
        <MemoryIndicator memory={descriptor.memory} />
      </div>
    </div>
  );
}
