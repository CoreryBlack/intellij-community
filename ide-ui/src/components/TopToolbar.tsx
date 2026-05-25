/**
 * @see com.intellij.openapi.actionSystem.impl.ActionButton
 * @see com.intellij.openapi.wm.impl.customFrameDecorations.header.toolbar.HeaderToolbarButtonLook
 * @see com.intellij.openapi.actionSystem.ex.ActionButtonLook
 *
 * TopToolbar — PURE EVENT FORWARDING LAYER.
 *
 * ALL button state management lives in Rust (frontend::ToolbarFrontend).
 * This component is a thin shell that:
 *   1. Receives initial button descriptions from Rust
 *   2. Forwards user interactions to Rust via invoke()
 *   3. Mechanically applies the Rust-computed render output
 *
 * Official pipeline (fully ported to Rust):
 *   ActionButton.paintComponent(g)
 *   → paintButtonLook(g)
 *     → look.paintBackground(g, this)  [frontend.rs::get_header_background_color]
 *     → look.paintIcon(g, this, icon)  [button_look.rs::compute_icon_position]
 *     → look.paintBorder(g, this)      [button_look.rs → focus ring]
 *     → shallPaintDownArrow()? paintDownArrow() [button_look.rs::compute_arrow_position]
 *
 *   ActionButton.processMouseEvent(e)
 *   → frontend.rs::ToolbarFrontend.handle_event()
 *     → ButtonClientState.handle_mouse_enter/leave/down/up/focus/blur
 *     → button_look::compute_pop_state()
 *     → button_look::compute_button_render()
 */

import { useState, useEffect, useCallback } from "react";
import ToolbarDropdown, { type MenuItem } from "./ToolbarDropdown";
import { getToolbarDescriptor, toolbarEvent, toolbarClick, getMainMenu, type ToolbarDescriptor as RustToolbarDescriptor } from "../services/ideService";

/* ═══════════════════════════════════════════
 * RUST BACKEND TYPES — exact mirror of
 * button_look.rs + main_toolbar.rs + frontend.rs
 * ═══════════════════════════════════════════ */

interface Insets { top: number; left: number; bottom: number; right: number; }
interface Size { width: number; height: number; }

/** @see main_toolbar.rs::ToolbarWidthInfo — CompressingLayoutStrategy output */
interface ToolbarWidthInfo {
  group_id: string;
  preferred_width: number;
  minimum_width: number;
  actual_width: number;
}

type ButtonLookKind = "IdeaActionButton" | "HeaderToolbar" | "SquareStripe" | "RunWidget" | "EditorToolbar" | "Win10";
type ButtonStateStr = "Normal" | "Popped" | "Pushed" | "Selected";
type ActionKind = "Button" | "Toggle" | "Dropdown" | "Separator" | "Widget";

interface ButtonLookParams {
  kind: ButtonLookKind;
  button_arc: number;
  icon_size: number;
  minimum_button_size: Size;
  preferred_button_size: Size;
  suppress_border: boolean;
  focus_only_border: boolean;
  focus_border_width: number;
  focus_border_color: string;
  background_arc: number;
  disable_filter: string;
  icon_insets: Insets;
  component_insets: Insets;
}

interface ButtonRenderOutput {
  look_kind: ButtonLookKind;
  paint_background: boolean;
  background_color: string | null;
  background_arc: number;
  paint_border: boolean;
  border_color: string | null;
  border_width: number;
  border_arc: number;
  icon_size: number;
  icon_x: number;
  icon_y: number;
  show_down_arrow: boolean;
  arrow_x: number;
  arrow_y: number;
  preferred_size: Size;
  minimum_size: Size;
  insets: Insets | null;
  icon_insets: Insets | null;
}

interface ActionPresentation {
  id: string;
  text: string;
  description: string | null;
  icon: string;
  action_kind: ActionKind;
  shortcut: string | null;
  tooltip: string | null;
  enabled: boolean;
  visible: boolean;
  popup_group: boolean;
  hide_dropdown_icon: boolean;
  toggle_state: boolean | null;
  badge: string | null;
}

interface ToolbarButtonDesc {
  presentation: ActionPresentation;
  look_params: ButtonLookParams;
  render_output: ButtonRenderOutput;
  state: ButtonStateStr;
  focused: boolean;
  current_width: number;
  current_height: number;
}

interface ToolbarGroup {
  id: string;
  position: "Left" | "Center" | "Right";
  buttons: ToolbarButtonDesc[];
}

interface ToolbarDescriptor {
  layout_gap: number;
  groups: ToolbarGroup[];
  project: { name: string; path: string; icon: string; color: string | null };
  run_configurations: { id: string; name: string; type_name: string; icon: string; pinned: boolean }[];
  active_run_config: string | null;
  git: { branch: string; remote: string; clean: boolean; ahead: number; behind: number; has_changes: boolean } | null;
  active_file_name: string | null;
  width_distribution: ToolbarWidthInfo[] | null;
}



const EMPTY_DESCRIPTOR: ToolbarDescriptor = {
  layout_gap: 0,
  groups: [],
  project: { name: "", path: "", icon: "", color: null },
  run_configurations: [],
  active_run_config: null,
  git: null,
  active_file_name: null,
  width_distribution: null,
};

/* ═══════════════════════════════════════════
 * ActionIcon — purely mechanical SVG renderer
 * ═══════════════════════════════════════════ */

function ActionIcon({ icon, size = 16, isRunWidget = false }: { icon: string; size?: number; isRunWidget?: boolean }) {
  const iconMap: Record<string, string> = {
    hamburger: "menu",
    project: "folder",
    "git-branch": "branch",
    commit: "commit",
    push: "push",
    search: "search",
    run: "run",
    debug: "debug",
    settings: "settings",
    file: "folder",
  };
  const officialName = iconMap[icon];
  if (officialName) {
    return <img src={`/icons/${officialName}.svg`} width={size} height={size} alt="" style={{ display: "block", filter: isRunWidget && icon === "run" ? "none" : undefined }} />;
  }
  return <span style={{ fontSize: size - 2 }}>?</span>;
}

/* ═══════════════════════════════════════════
 * ToolbarButton — PURE MECHANICAL RENDERER
 *
 * ZERO state management. Every visual property
 * comes from the Rust-computed ToolbarButtonDesc.
 * User events are forwarded to Rust via invoke().
 *
 * This is the frontend equivalent of:
 *   ActionButton.paintComponent(g) + MouseListener
 * ═══════════════════════════════════════════ */

function ToolbarButton({
  button,
  onEvent,
}: {
  button: ToolbarButtonDesc;
  onEvent: (eventType: string) => void;
}) {
  const { presentation, look_params, render_output } = button;
  const isDropdown = presentation.action_kind === "Dropdown" || render_output.show_down_arrow;
  const isHeaderToolbar = look_params.kind === "HeaderToolbar";
  const isRunWidget = look_params.kind === "RunWidget";
  const hasLabel = !!presentation.text;
  const iconSize = render_output.icon_size;

  const w = Math.max(render_output.preferred_size.width, render_output.icon_size + (render_output.icon_insets?.left ?? 0) + (render_output.icon_insets?.right ?? 0));
  const h = Math.max(render_output.preferred_size.height, render_output.icon_size + (render_output.icon_insets?.top ?? 0) + (render_output.icon_insets?.bottom ?? 0));

  const bg = render_output.paint_background ? (render_output.background_color || "transparent") : "transparent";
  const focusRing = render_output.paint_border
    ? `inset 0 0 0 ${render_output.border_width}px ${render_output.border_color || look_params.focus_border_color}`
    : "none";

  return (
    <button
      title={presentation.tooltip || presentation.text}
      onMouseEnter={() => onEvent("mouse_enter")}
      onMouseLeave={() => onEvent("mouse_leave")}
      onMouseDown={() => onEvent("mouse_down")}
      onMouseUp={(e) => {
        e.preventDefault();
        onEvent("mouse_up");
      }}
      onFocus={() => onEvent("focus")}
      onBlur={() => onEvent("blur")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: h,
        minWidth: w,
        padding: render_output.insets
          ? `${render_output.insets.top}px ${render_output.insets.right}px ${render_output.insets.bottom}px ${render_output.insets.left}px`
          : hasLabel ? "2px 8px" : 0,
        border: isHeaderToolbar ? "none" : (button.state !== "Normal" ? "1px solid var(--toolbar-border)" : "none"),
        borderRadius: look_params.button_arc,
        background: bg,
        color: "var(--ide-text-muted)",
        cursor: presentation.enabled ? "pointer" : "default",
        fontSize: hasLabel ? "var(--ide-font-size-sm)" : undefined,
        transition: "background var(--ide-transition-fast)",
        flexShrink: 0,
        gap: hasLabel ? 4 : 0,
        outline: "none",
        position: "relative" as const,
        userSelect: "none" as const,
        boxShadow: focusRing,
      }}
    >
      <ActionIcon icon={presentation.icon} size={iconSize} isRunWidget={isRunWidget} />
      {hasLabel && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{presentation.text}</span>}
      {isDropdown && (
        <svg width="7" height="4" viewBox="0 0 7 4" fill="none" style={{ color: "var(--text-disabled)", flexShrink: 0, marginLeft: 2 }}>
          <path d="M1 0.5L3.5 3.5L6 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {presentation.badge && <span style={{ color: "var(--ide-accent-blue)", fontSize: 11, lineHeight: 1, fontWeight: 600 }}>{presentation.badge}</span>}
    </button>
  );
}

/* ═══════════════════════════════════════════
 * TopToolbar — main component
 * ═══════════════════════════════════════════ */

interface Props {
  projectName: string;
  onBackToWelcome: () => void;
  onToggleTheme: () => void;
  onSearchEverywhere: () => void;
  onOpenSettings: () => void;
}

export default function TopToolbar({ projectName, onBackToWelcome, onToggleTheme, onSearchEverywhere, onOpenSettings }: Props) {
  const [descriptor, setDescriptor] = useState<ToolbarDescriptor>(EMPTY_DESCRIPTOR);
  const [buttonMap, setButtonMap] = useState<Map<string, ToolbarButtonDesc>>(new Map());
  const [mainMenu, setMainMenu] = useState<MenuItem[]>([]);
  const [dropdownState, setDropdownState] = useState<{
    triggerId: string;
    triggerRect: DOMRect;
    items: MenuItem[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      const rustDescriptor: RustToolbarDescriptor = await getToolbarDescriptor();
      setDescriptor(rustDescriptor as unknown as ToolbarDescriptor);
      const m = new Map<string, ToolbarButtonDesc>();
      for (const g of rustDescriptor.groups) {
        for (const b of g.buttons) {
          m.set(b.presentation.id, b as unknown as ToolbarButtonDesc);
        }
      }
      setButtonMap(m);
    })();
    (async () => {
      const menu = await getMainMenu();
      setMainMenu(menu.menus.flatMap(m => m.children) as unknown as MenuItem[]);
    })();
  }, [projectName]);

  const handleEvent = useCallback(async (
    id: string,
    eventType: string,
  ) => {
    const result = await toolbarEvent(id, eventType);
    if (!result) return;

    setButtonMap(prev => {
      const next = new Map(prev);
      next.set(id, result.button as unknown as ToolbarButtonDesc);
      return next;
    });

    if (result.action === "show_menu") {
      const btn = descriptor.groups.flatMap(g => g.buttons).find(b => b.presentation.id === id);
      if (!btn) return;

      if (id === "MainMenuButton") {
        const el = document.querySelector(`[title="${btn.presentation.tooltip || btn.presentation.text}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          setDropdownState({
            triggerId: id,
            triggerRect: rect,
            items: mainMenu,
          });
        }
      }
    } else if (result.action === "click" || result.action === "show_main_menu") {
      const clickAction = await toolbarClick(id);
      switch (clickAction) {
        case "show_main_menu": {
          const el = document.querySelector('[title="Main Menu"]');
          if (el) {
            setDropdownState({
              triggerId: id,
              triggerRect: el.getBoundingClientRect(),
              items: mainMenu,
            });
          }
          break;
        }
        case "search_everywhere":
          onSearchEverywhere();
          break;
        case "open_settings":
          onOpenSettings();
          break;
      }
    }
  }, [descriptor, mainMenu, onBackToWelcome, onSearchEverywhere, onToggleTheme, onOpenSettings]);

  const renderButtons = (buttons: ToolbarButtonDesc[]) =>
    buttons.filter(b => b.presentation.visible).map(btn => {
      if (btn.presentation.action_kind === "Separator") {
        return <div key={btn.presentation.id} style={{ width: 1, height: 14, background: "var(--ide-border-toolbar)", margin: "0 1px" }} />;
      }
      const current = buttonMap.get(btn.presentation.id) || btn;
      return (
        <ToolbarButton
          key={btn.presentation.id}
          button={current}
          onEvent={(eventType: string) => handleEvent(btn.presentation.id, eventType)}
        />
      );
    });

  const leftGroup = descriptor.groups.find(g => g.position === "Left");
  const centerGroup = descriptor.groups.find(g => g.position === "Center");
  const rightGroup = descriptor.groups.find(g => g.position === "Right");

  return (
    <>
      <div style={{
        height: "var(--ide-toolbar-height)",
        display: "flex",
        alignItems: "center",
        background: "var(--ide-bg-toolbar)",
        borderBottom: "1px solid var(--ide-border-toolbar)",
        padding: "0 var(--main-toolbar-padding-h)",
        flexShrink: 0,
        gap: "var(--ide-main-toolbar-layout-gap)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          {leftGroup && renderButtons(leftGroup.buttons)}
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2, justifyContent: "center", minWidth: 0 }}>
          {centerGroup && renderButtons(centerGroup.buttons)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
          {rightGroup && renderButtons(rightGroup.buttons)}
        </div>
      </div>

      {dropdownState && (
        <ToolbarDropdown
          triggerRect={dropdownState.triggerRect}
          items={dropdownState.items}
          onClose={() => setDropdownState(null)}
          onAction={(menuItem) => {
            if (menuItem.click_action === "back_to_welcome") onBackToWelcome();
            else if (menuItem.click_action === "search_everywhere") onSearchEverywhere();
            else if (menuItem.click_action === "open_settings") onToggleTheme();
            setDropdownState(null);
          }}
          triggerId={dropdownState.triggerId}
        />
      )}
    </>
  );
}
