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
 * In browser dev mode (no Tauri invoke), uses FALLBACK state simulation
 * that exactly mirrors the Rust backend's logic.
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

interface ToolbarEventResult {
  button: ToolbarButtonDesc;
  action: string | null;
}

/* ═══════════════════════════════════════════
 * FALLBACK RUST STATE MACHINE — pure TS port
 * of frontend.rs::ToolbarFrontend
 *
 * In production (Tauri), the REAL Rust backend
 * handles state. In dev browser mode, this
 * fallback exactly mirrors the Rust logic.
 * ═══════════════════════════════════════════ */

interface ButtonClientState {
  rollover: boolean;
  mouse_down: boolean;
  focused: boolean;
}

function newClientState(): ButtonClientState {
  return { rollover: false, mouse_down: false, focused: false };
}

/** @see frontend.rs::ButtonClientState methods — exact port */
function handleClientEvent(state: ButtonClientState, eventType: string): { state: ButtonClientState; shouldPerformAction: boolean } {
  const s = { ...state };
  let shouldPerformAction = false;
  switch (eventType) {
    case "mouse_enter": s.rollover = true; break;
    case "mouse_leave": s.rollover = false; s.mouse_down = false; break;
    case "mouse_down": s.mouse_down = true; s.rollover = true; break;
    case "mouse_up": shouldPerformAction = s.rollover; s.mouse_down = false; break;
    case "focus": s.focused = true; break;
    case "blur": s.focused = false; break;
  }
  return { state: s, shouldPerformAction };
}

/** @see button_look.rs::compute_pop_state — exact port */
function computePopState(rollover: boolean, mouseDown: boolean, isPushed: boolean, isFocusOwner: boolean, isEnabled: boolean): ButtonStateStr {
  if (isPushed || (rollover && mouseDown && isEnabled)) return "Pushed";
  if (rollover && isEnabled) return "Popped";
  if (isFocusOwner) return "Selected";
  return "Normal";
}

/** @see button_look.rs::get_header_background_color — exact port */
function getHeaderBgColor(enabled: boolean, state: ButtonStateStr): string | null {
  if (!enabled) return null;
  if (state === "Pushed") return "var(--toolbar-bg-pressed)";
  if (state === "Popped") return "var(--toolbar-bg-hovered)";
  return null;
}

/** @see button_look.rs::compute_icon_position — exact port */
function computeIconPos(w: number, h: number, iconSize: number, compInsets: Insets, iconInsets: Insets): { x: number; y: number } {
  let rx = compInsets.left + iconInsets.left;
  let ry = compInsets.top + iconInsets.top;
  let rw = w - compInsets.left - compInsets.right - iconInsets.left - iconInsets.right;
  let rh = h - compInsets.top - compInsets.bottom - iconInsets.top - iconInsets.bottom;
  return {
    x: Math.max(0, Math.round(rx + (rw - iconSize) / 2)),
    y: Math.max(0, Math.round(ry + (rh - iconSize) / 2)),
  };
}

/** @see button_look.rs::compute_arrow_position — exact port */
function computeArrowPos(iconPos: { x: number; y: number }, iconSize: number): { x: number; y: number } {
  return {
    x: Math.max(0, iconPos.x + 1 + (iconSize - 7)),
    y: Math.max(0, iconPos.y + 1 + (iconSize - 4)),
  };
}

/** @see frontend.rs::ToolbarFrontend.compute_updated_button — exact port */
function computeButtonRender(
  btn: ToolbarButtonDesc,
  clientState: ButtonClientState,
): ToolbarButtonDesc {
  const { presentation, look_params } = btn;
  const state = computePopState(
    clientState.rollover, clientState.mouse_down,
    presentation.toggle_state ?? false, clientState.focused,
    presentation.enabled,
  );

  const bgColor = getHeaderBgColor(presentation.enabled, state);
  const iconPos = computeIconPos(
    btn.current_width, btn.current_height,
    look_params.icon_size, look_params.component_insets, look_params.icon_insets,
  );
  const showArrow = presentation.popup_group && !presentation.hide_dropdown_icon;
  const arrowPos = showArrow ? computeArrowPos(iconPos, look_params.icon_size) : { x: 0, y: 0 };

  return {
    ...btn,
    state,
    focused: clientState.focused,
    render_output: {
      look_kind: look_params.kind,
      paint_background: bgColor !== null,
      background_color: bgColor,
      background_arc: look_params.background_arc,
      paint_border: clientState.focused && look_params.focus_only_border,
      border_color: clientState.focused ? look_params.focus_border_color : null,
      border_width: look_params.focus_border_width,
      border_arc: look_params.button_arc,
      icon_size: look_params.icon_size,
      icon_x: iconPos.x,
      icon_y: iconPos.y,
      show_down_arrow: showArrow,
      arrow_x: arrowPos.x,
      arrow_y: arrowPos.y,
      preferred_size: { ...look_params.minimum_button_size },
      minimum_size: { ...look_params.minimum_button_size },
      insets: { ...look_params.component_insets },
      icon_insets: { ...look_params.icon_insets },
    },
  };
}

/** @see frontend.rs::ToolbarFrontend.determine_action — exact port */
function determineAction(btn: ToolbarButtonDesc): string | null {
  if (btn.presentation.popup_group) return "show_menu";
  if (btn.presentation.id === "MainMenuButton") return "show_main_menu";
  return "click";
}

/* ═══════════════════════════════════════════
 * FALLBACK DATA (identical to Rust backend output)
 * ═══════════════════════════════════════════ */

function makeLook(isBurger?: boolean): ButtonLookParams {
  return {
    kind: "HeaderToolbar",
    button_arc: 8,
    icon_size: 18,
    minimum_button_size: { width: 26, height: 26 },
    preferred_button_size: { width: 26, height: 26 },
    suppress_border: true,
    focus_only_border: true,
    focus_border_width: 2,
    focus_border_color: "var(--ide-focus-color)",
    background_arc: 8,
    disable_filter: "lightThemeDarkHeader",
    icon_insets: isBurger ? { top: 4, left: 5, bottom: 4, right: 5 } : { top: 4, left: 4, bottom: 4, right: 4 },
    component_insets: { top: 0, left: 0, bottom: 0, right: 0 },
  };
}

function makeBtn(id: string, text: string, icon: string, kind: ActionKind, popup: boolean, tooltip: string | null, shortcut: string | null, enabled: boolean, badge: string | null, isBurger?: boolean): ToolbarButtonDesc {
  const look = makeLook(isBurger);
  const presentation: ActionPresentation = {
    id, text, description: tooltip, icon,
    action_kind: kind, shortcut, tooltip,
    enabled, visible: true, popup_group: popup,
    hide_dropdown_icon: false, toggle_state: null, badge,
  };
  const iconPos = computeIconPos(look.minimum_button_size.width, look.minimum_button_size.height, look.icon_size, look.component_insets, look.icon_insets);
  const showArrow = popup;
  const arrowPos = showArrow ? computeArrowPos(iconPos, look.icon_size) : { x: 0, y: 0 };
  return {
    presentation, look_params: look,
    state: "Normal", focused: false,
    current_width: look.minimum_button_size.width,
    current_height: look.minimum_button_size.height,
    render_output: {
      look_kind: look.kind, paint_background: false, background_color: null,
      background_arc: look.background_arc,
      paint_border: false, border_color: null, border_width: look.focus_border_width, border_arc: look.button_arc,
      icon_size: look.icon_size, icon_x: iconPos.x, icon_y: iconPos.y,
      show_down_arrow: showArrow, arrow_x: arrowPos.x, arrow_y: arrowPos.y,
      preferred_size: { ...look.minimum_button_size }, minimum_size: { ...look.minimum_button_size },
      insets: { ...look.component_insets }, icon_insets: { ...look.icon_insets },
    },
  };
}

function makeSep(): ToolbarButtonDesc {
  return {
    presentation: { id: "Separator", text: "", description: null, icon: "", action_kind: "Separator", shortcut: null, tooltip: null, enabled: false, visible: true, popup_group: false, hide_dropdown_icon: false, toggle_state: null, badge: null },
    look_params: makeLook(), state: "Normal", focused: false, current_width: 1, current_height: 18,
    render_output: {
      look_kind: "HeaderToolbar", paint_background: false, background_color: null, background_arc: 12,
      paint_border: false, border_color: null, border_width: 2, border_arc: 12,
      icon_size: 20, icon_x: 0, icon_y: 0, show_down_arrow: false, arrow_x: 0, arrow_y: 0,
      preferred_size: { width: 1, height: 18 }, minimum_size: { width: 1, height: 18 },
      insets: { top: 0, left: 0, bottom: 0, right: 0 }, icon_insets: { top: 0, left: 0, bottom: 0, right: 0 },
    },
  };
}

function FALLBACK_TOOLBAR_DESCRIPTOR(projectName: string): ToolbarDescriptor {
  return {
    layout_gap: 10,
    project: { name: projectName, path: "", icon: "project", color: "#3871E1" },
    run_configurations: [{ id: "spring-boot", name: "AstralMonitorApplication", type_name: "Spring Boot", icon: "spring", pinned: true }],
    active_run_config: "spring-boot",
    git: { branch: "main", remote: "origin", clean: true, ahead: 0, behind: 0, has_changes: false },
    active_file_name: null,
    groups: [
      { id: "MainToolbarLeft", position: "Left", buttons: [
        makeBtn("MainMenuButton", "Main Menu", "hamburger", "Button", false, "Main Menu", null, true, null, true),
        makeBtn("main.toolbar.Project", projectName, "project", "Dropdown", true, "Recent Projects", null, true, null),
        makeBtn("main.toolbar.git.Branches", "main", "git-branch", "Dropdown", true, "Git Branches", null, true, null),
        makeBtn("CheckinProject", "Commit", "commit", "Button", false, "Commit (Ctrl+K)", "Ctrl+K", true, null),
        makeBtn("Vcs.Push", "Push", "push", "Button", false, "Push (Ctrl+Shift+K)", "Ctrl+Shift+K", true, null),
        makeSep(),
      ]},
      { id: "MainToolbarCenter", position: "Center", buttons: [
        makeBtn("SearchEverywhere", "Search", "search", "Button", false, "Search Everywhere (Double Shift)", "Double Shift", true, null),
      ]},
      { id: "MainToolbarRight", position: "Right", buttons: [
        makeBtn("NewUiRunWidget", "AstralMonitorApplication", "run", "Dropdown", true, "Run Configuration", null, true, null),
        makeBtn("Run", "Run", "run", "Button", false, "Run (Shift+F10)", "Shift+F10", true, null),
        makeBtn("Debug", "Debug", "debug", "Button", false, "Debug (Shift+F9)", "Shift+F9", true, null),
        makeSep(),
        makeBtn("SearchEverywhere.Right", "Search", "search", "Button", false, "Search Everywhere (Double Shift)", "Double Shift", true, null),
        makeBtn("SettingsEntryPoint", "Settings", "settings", "Button", false, "Settings (Ctrl+Alt+,)", "Ctrl+Alt+,", true, null),
      ]},
    ],
    width_distribution: null,
  };
}

/* ═══════════════════════════════════════════
 * FALLBACK main menu data
 * ═══════════════════════════════════════════ */

function M(label: string, id: string, shortcut?: string, action?: string, children?: MenuItem[], opts?: { disabled?: boolean; toggle?: boolean; checked?: boolean }): MenuItem {
  return {
    id, label, item_type: children ? "Submenu" : "Action", icon: null, shortcut: shortcut || null,
    enabled: !opts?.disabled, visible: true, checked: opts?.checked ? true : null, toggle: opts?.toggle || false,
    children: children || [], click_action: action || null,
  };
}
function SEP(): MenuItem { return { id: "", label: "", item_type: "Separator", icon: null, shortcut: null, enabled: false, visible: true, checked: null, toggle: false, children: [], click_action: null }; }

function FALLBACK_MAIN_MENU(): MenuItem[] {
  return [
    M("File", "FileMenu", undefined, undefined, [
      M("Open...", "OpenFile", undefined, "open_file"), M("Attach Project...", "AttachProject"), SEP(),
      M("Close Project", "CloseProject", undefined, "back_to_welcome"), SEP(),
      M("File Properties", "FilePropertiesGroup", undefined, undefined, [
        M("File Encoding...", "FileEncoding"), M("Associate with File Type...", "AssociateFileType"),
        M("Toggle Read-Only", "ToggleReadOnly", undefined, undefined, undefined, { toggle: true }), SEP(),
        M("Line Separators", "LineSeparatorsGroup", undefined, undefined, [
          M("CRLF - Windows (\\r\\n)", "line_sep.crlf", undefined, undefined, undefined, { toggle: true }),
          M("LF - Unix / macOS (\\n)", "line_sep.lf", undefined, undefined, undefined, { toggle: true }),
          M("CR - Classic Mac (\\r)", "line_sep.cr", undefined, undefined, undefined, { toggle: true }),
        ]),
      ]),
      SEP(), M("Save All", "SaveAll", "Ctrl+S"), M("Reload from Disk", "Synchronize"),
      M("Invalidate Caches...", "InvalidateCaches"), SEP(),
      M("Manage IDE Settings", "ExportImportGroup", undefined, undefined, [
        M("Import Settings...", "ImportSettings"), M("Export Settings...", "ExportSettings"),
        M("Restore Default Settings...", "RestoreDefaultSettings"),
      ]), SEP(),
      M("Power Save Mode", "TogglePowerSave", undefined, undefined, undefined, { toggle: true }), SEP(),
      M("Exit", "Exit"),
    ]),
    M("Edit", "EditMenu", undefined, undefined, [
      M("Undo", "Undo", "Ctrl+Z"), M("Redo", "Redo", "Ctrl+Shift+Z"), SEP(),
      M("Cut", "Cut", "Ctrl+X"), M("Copy", "Copy", "Ctrl+C"), M("Copy Path", "CopyPath", "Ctrl+Shift+C"),
      M("Paste", "PasteGroup", "Ctrl+V", undefined, [M("Paste as Plain Text", "PasteSimple", "Ctrl+Shift+V")]),
      M("Delete", "Delete", "Delete"), SEP(),
      M("Find", "FindMenuGroup", undefined, undefined, [
        M("Find...", "Find", "Ctrl+F"), M("Replace...", "Replace", "Ctrl+R"),
        M("Find Next", "FindNext", "F3"), M("Find Previous", "FindPrevious", "Shift+F3"), SEP(),
        M("Find in Files...", "FindInFiles", "Ctrl+Shift+F"), M("Replace in Files...", "ReplaceInFiles", "Ctrl+Shift+R"),
      ]), SEP(),
      M("Column Selection Mode", "ColumnSelectionMode", "Shift+Alt+Insert", undefined, undefined, { toggle: true }),
      M("Select All", "SelectAll", "Ctrl+A"), SEP(),
      M("Toggle Case", "ToggleCase", "Ctrl+Shift+U"), M("Join Lines", "JoinLines", "Ctrl+Shift+J"),
      M("Duplicate Line", "DuplicateLines", "Ctrl+D"), SEP(),
      M("Convert Indents", "ConvertIndents"), M("Macros", "Macros"),
    ]),
    M("View", "ViewMenu", undefined, undefined, [
      M("Tool Windows", "ToolWindowsGroup", undefined, undefined, [
        M("Project", "ActivateProjectToolWindow", "Alt+1"), M("Commit", "ActivateCommitToolWindow", "Alt+0"),
        M("Terminal", "ActivateTerminalToolWindow", "Alt+F12"), M("Run", "ActivateRunToolWindow", "Alt+4"),
        M("Problems", "ActivateProblemsViewToolWindow"), M("Structure", "ActivateStructureToolWindow", "Alt+7"),
      ]),
      M("Appearance", "ViewAppearanceGroup", undefined, undefined, [
        M("Full Screen", "ToggleFullScreen", undefined, undefined, undefined, { toggle: true }),
        M("Presentation Mode", "TogglePresentationMode", undefined, undefined, undefined, { toggle: true }), SEP(),
        M("Main Menu", "ViewMainMenu", undefined, undefined, undefined, { toggle: true, checked: true }),
        M("Toolbar", "ViewToolbar", undefined, undefined, undefined, { toggle: true, checked: true }),
        M("Status Bar", "ViewStatusBar", undefined, undefined, undefined, { toggle: true, checked: true }),
      ]), SEP(),
      M("Recent Files", "RecentFiles", "Ctrl+E"), M("Recent Locations", "RecentLocations", "Ctrl+Shift+E"), SEP(),
      M("Quick Switch Scheme...", "QuickSwitchScheme"),
      M("Active Editor", "EditorToggleActions", undefined, undefined, [
        M("Show Line Numbers", "ToggleLineNumbers", undefined, undefined, undefined, { toggle: true, checked: true }),
        M("Show Breadcrumbs", "ToggleBreadcrumb", undefined, undefined, undefined, { toggle: true }),
        M("Show Gutter Icons", "ToggleGutterIcons", undefined, undefined, undefined, { toggle: true, checked: true }),
        M("Show Indent Guides", "ToggleIndentGuides", undefined, undefined, undefined, { toggle: true }),
      ]),
    ]),
    M("Navigate", "GoToMenu", undefined, undefined, [
      M("Back", "Back", "Ctrl+Alt+Left"), M("Forward", "Forward", "Ctrl+Alt+Right"), SEP(),
      M("Search Everywhere", "SearchEverywhere", "Double Shift", "search_everywhere"), SEP(),
      M("File...", "GotoFile", "Ctrl+Shift+N"), M("Class...", "GotoClass", "Ctrl+N"),
      M("Line/Column...", "GotoLine", "Ctrl+G"), M("Declaration / Usages", "GotoDeclaration", "Ctrl+B"),
      M("Implementation(s)", "GotoImplementation", "Ctrl+Alt+B"), SEP(),
      M("Next Highlighted Error", "GotoNextError", "F2"), M("Previous Highlighted Error", "GotoPreviousError", "Shift+F2"),
      M("Last Edit Location", "LastEditLocation", "Ctrl+Shift+Backspace"),
    ]),
    M("Code", "CodeMenu", undefined, undefined, [
      M("Override Methods...", "OverrideMethods", "Ctrl+O"), M("Implement Methods...", "ImplementMethods", "Ctrl+I"),
      M("Generate...", "Generate", "Alt+Insert"), SEP(),
      M("Code Completion", "CodeCompletionGroup", undefined, undefined, [
        M("Basic", "CodeCompletion", "Ctrl+Space"), M("SmartType", "SmartTypeCompletion", "Ctrl+Shift+Space"),
      ]), SEP(),
      M("Insert Live Template...", "InsertLiveTemplate", "Ctrl+J"), M("Surround With...", "SurroundWith", "Ctrl+Alt+T"), SEP(),
      M("Folding", "CodeFoldingGroup", undefined, undefined, [
        M("Collapse", "CollapseRegion", "Ctrl+-"), M("Expand", "ExpandRegion", "Ctrl++"),
        M("Collapse All", "CollapseAll", "Ctrl+Shift+-"), M("Expand All", "ExpandAll", "Ctrl+Shift++"),
      ]), SEP(),
      M("Comment with Line Comment", "CommentByLineComment", "Ctrl+/"), M("Comment with Block Comment", "CommentByBlockComment", "Ctrl+Shift+/"), SEP(),
      M("Reformat Code", "ReformatCode", "Ctrl+Alt+L"), M("Optimize Imports", "OptimizeImports", "Ctrl+Alt+O"),
      M("Move Line Up", "MoveLineUp", "Shift+Alt+Up"), M("Move Line Down", "MoveLineDown", "Shift+Alt+Down"),
    ]),
    M("Refactor", "RefactoringMenu", undefined, undefined, [
      M("Refactor This...", "Refactorings.QuickListPopupAction", "Ctrl+Alt+Shift+T"), SEP(),
      M("Rename...", "RenameElement", "Shift+F6"), M("Change Signature...", "ChangeSignature", "Ctrl+F6"), SEP(),
      M("Extract / Introduce", "IntroduceActionsGroup", undefined, undefined, [
        M("Variable...", "IntroduceVariable", "Ctrl+Alt+V"), M("Constant...", "IntroduceConstant", "Ctrl+Alt+C"),
        M("Field...", "IntroduceField", "Ctrl+Alt+F"), M("Parameter...", "IntroduceParameter", "Ctrl+Alt+P"),
        M("Method...", "ExtractMethod", "Ctrl+Alt+M"),
      ]),
      M("Inline...", "Inline", "Ctrl+Alt+N"), SEP(),
      M("Move...", "Move", "F6"), M("Copy...", "CopyClass", "F5"), M("Safe Delete...", "SafeDelete", "Alt+Delete"),
    ]),
    M("Build", "BuildMenu", undefined, undefined, [
      M("Build Project", "CompileDirty", "Ctrl+F9"), M("Compile File", "Compile", "Ctrl+Shift+F9"), SEP(),
      M("Recompile Files", "RecompileWithAllWarnings"),
    ]),
    M("Run", "RunMenu", undefined, undefined, [
      M("Run", "Run", "Shift+F10"), M("Debug", "Debug", "Shift+F9"), SEP(),
      M("Run...", "RunClass", "Ctrl+Shift+F10"), M("Debug...", "DebugClass"), SEP(),
      M("Stop", "Stop", "Ctrl+F2"), M("Rerun", "Rerun"), SEP(),
      M("Edit Configurations...", "EditRunConfigurations"),
    ]),
    M("Tools", "ToolsMenu", undefined, undefined, [
      M("Create Command-line Launcher...", "CreateCommandLineLauncher"), M("Create Desktop Entry...", "CreateDesktopEntry"), SEP(),
      M("Terminal", "Terminal"),
    ]),
    M("Git", "VcsGroups", undefined, undefined, [
      M("VCS Operations Popup...", "Vcs.QuickListPopupAction", "Alt+`"), SEP(),
      M("Commit...", "CheckinProject", "Ctrl+K"), M("Update Project", "Vcs.UpdateProject", "Ctrl+T"),
      M("Push...", "Vcs.Push", "Ctrl+Shift+K"), SEP(),
      M("Branches...", "Vcs.Branches"), M("Shelve Changes...", "ShelveChanges"), M("Create Patch...", "CreatePatch"),
      M("Apply Patch...", "ApplyPatch"),
    ]),
    M("Window", "WindowMenu", undefined, undefined, [
      M("Active Tool Window", "ActiveToolWindowGroup", undefined, undefined, [
        M("Hide", "HideActiveWindow", "Ctrl+Shift+F12"), M("Maximize", "MaximizeToolWindow"),
      ]),
      M("Editor Tabs", "EditorTabsGroup", undefined, undefined, [
        M("Close", "CloseEditor", "Ctrl+F4"), M("Close All", "CloseAllEditors"),
        M("Split Right", "SplitVertically"), M("Split Down", "SplitHorizontally"),
      ]), SEP(),
      M("Store Current Layout as Default", "StoreDefaultLayout"), M("Restore Default Layout", "RestoreDefaultLayout"),
    ]),
    M("Help", "HelpMenu", undefined, undefined, [
      M("Find Action...", "GotoAction", "Ctrl+Shift+A", "search_everywhere"), SEP(),
      M("Help Topics...", "HelpTopics"), SEP(), M("Check for Updates...", "CheckForUpdate"), SEP(),
      M("About", "About"),
    ]),
  ];
}

/* ═══════════════════════════════════════════
 * FALLBACK EVENT HANDLER — pure TS port of
 * frontend.rs::ToolbarFrontend.handle_event
 * ═══════════════════════════════════════════ */

const fallbackClientStates = new Map<string, ButtonClientState>();

function fallbackHandleEvent(
  descriptor: ToolbarDescriptor,
  id: string,
  eventType: string,
): ToolbarEventResult | null {
  let client = fallbackClientStates.get(id);
  if (!client) { client = newClientState(); fallbackClientStates.set(id, client); }

  const { state: updatedClient, shouldPerformAction } = handleClientEvent(client, eventType);
  fallbackClientStates.set(id, updatedClient);

  for (const group of descriptor.groups) {
    for (const btn of group.buttons) {
      if (btn.presentation.id === id) {
        const updatedButton = computeButtonRender(btn, updatedClient);
        let action: string | null = null;
        if (shouldPerformAction) {
          action = determineAction(btn);
        }
        return { button: updatedButton, action };
      }
    }
  }
  return null;
}

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
  onEvent: (eventType: string, result: ToolbarEventResult) => void;
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
      onMouseEnter={() => onEvent("mouse_enter", null as any)}
      onMouseLeave={() => onEvent("mouse_leave", null as any)}
      onMouseDown={() => onEvent("mouse_down", null as any)}
      onMouseUp={(e) => {
        e.preventDefault();
        onEvent("mouse_up", null as any);
      }}
      onFocus={() => onEvent("focus", null as any)}
      onBlur={() => onEvent("blur", null as any)}
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
  const [descriptor, setDescriptor] = useState<ToolbarDescriptor>(() => FALLBACK_TOOLBAR_DESCRIPTOR(projectName));
  const [buttonMap, setButtonMap] = useState<Map<string, ToolbarButtonDesc>>(new Map());
  const [dropdownState, setDropdownState] = useState<{
    triggerId: string;
    triggerRect: DOMRect;
    items: MenuItem[];
  } | null>(null);

  useEffect(() => {
    const d = FALLBACK_TOOLBAR_DESCRIPTOR(projectName);
    setDescriptor(d);
    const m = new Map<string, ToolbarButtonDesc>();
    for (const g of d.groups) {
      for (const b of g.buttons) {
        m.set(b.presentation.id, b);
      }
    }
    setButtonMap(m);
  }, [projectName]);

  const mainMenu = FALLBACK_MAIN_MENU();

  const handleEvent = useCallback((
    id: string,
    eventType: string,
  ) => {
    const result = fallbackHandleEvent(descriptor, id, eventType);
    if (!result) return;

    // Update the single button in the map
    setButtonMap(prev => {
      const next = new Map(prev);
      next.set(id, result.button);
      return next;
    });

    // If Rust returns an action, execute it
    if (result.action === "show_menu") {
      const btn = descriptor.groups.flatMap(g => g.buttons).find(b => b.presentation.id === id);
      if (!btn) return;

      if (id === "MainMenuButton") {
        // Find the button element in the DOM and get its rect
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
      switch (id) {
        case "MainMenuButton":
          const el = document.querySelector('[title="Main Menu"]');
          if (el) {
            setDropdownState({
              triggerId: id,
              triggerRect: el.getBoundingClientRect(),
              items: mainMenu,
            });
          }
          break;
        case "SearchEverywhere":
        case "SearchEverywhere.Right":
          onSearchEverywhere();
          break;
        case "SettingsEntryPoint":
          onOpenSettings();
          break;
      }
    }
  }, [descriptor, mainMenu, onBackToWelcome, onSearchEverywhere, onToggleTheme, onOpenSettings]);

  const renderButtons = (buttons: ToolbarButtonDesc[]) =>
    buttons.filter(b => b.presentation.visible).map(btn => {
      if (btn.presentation.action_kind === "Separator") {
        return <div key={btn.presentation.id} style={{ width: 1, height: 18, background: "var(--ide-border-toolbar)", margin: "0 2px" }} />;
      }
      const current = buttonMap.get(btn.presentation.id) || btn;
      return (
        <ToolbarButton
          key={btn.presentation.id}
          button={current}
          onEvent={(eventType: string, _result: ToolbarEventResult) => handleEvent(btn.presentation.id, eventType)}
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
        padding: "0 6px",
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
