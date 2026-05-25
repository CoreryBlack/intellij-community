/**
 * @see com.intellij.openapi.application.ApplicationManager
 * @see com.intellij.openapi.project.Project
 *
 * Unified IDE service layer — all Tauri invoke calls go through here.
 * Each function maps to a Rust #[tauri::command].
 * Components import from this module instead of calling invoke() directly.
 */

import { invoke } from "@tauri-apps/api/core";

/* ── Toolbar ── @see main_toolbar.rs ── */

export interface ActionPresentation {
  id: string;
  text: string;
  description: string | null;
  icon: string;
  action_kind: "Button" | "Toggle" | "Dropdown" | "Separator" | "Widget";
  shortcut: string | null;
  tooltip: string | null;
  enabled: boolean;
  visible: boolean;
  popup_group: boolean;
  hide_dropdown_icon: boolean;
  toggle_state: boolean | null;
  badge: string | null;
}

export interface ButtonLookParams {
  kind: string;
  button_arc: number;
  icon_size: number;
  minimum_button_size: { width: number; height: number };
  preferred_button_size: { width: number; height: number };
  icon_insets: { top: number; left: number; bottom: number; right: number };
  suppress_border: boolean;
  focus_ring_arc: number;
  focus_ring_width: number;
}

export interface ButtonRenderOutput {
  background_color: string | null;
  paint_border: boolean;
  border_color: string | null;
  icon_x: number;
  icon_y: number;
  show_down_arrow: boolean;
  arrow_x: number;
  arrow_y: number;
  preferred_size: { width: number; height: number };
  minimum_size: { width: number; height: number };
}

export interface ToolbarButtonDesc {
  presentation: ActionPresentation;
  look_params: ButtonLookParams;
  render_output: ButtonRenderOutput;
  state: string;
  focused: boolean;
  current_width: number;
  current_height: number;
}

export interface ToolbarGroup {
  id: string;
  position: "Left" | "Center" | "Right";
  buttons: ToolbarButtonDesc[];
}

export interface ProjectInfo {
  name: string;
  path: string;
  description: string | null;
  icon: string;
  color: string | null;
}

export interface RunConfiguration {
  id: string;
  name: string;
  type_name: string;
  icon: string;
  pinned: boolean;
}

export interface GitState {
  branch: string;
  remote: string;
  clean: boolean;
  ahead: number;
  behind: number;
  has_changes: boolean;
}

export interface ToolbarDescriptor {
  layout_gap: number;
  groups: ToolbarGroup[];
  project: ProjectInfo;
  run_configurations: RunConfiguration[];
  active_run_config: string | null;
  run_widget_state: "Idle" | "Running" | "Debugging";
  git: GitState | null;
  active_file_name: string | null;
  theme: string;
}

export interface ToolbarEventResult {
  button: ToolbarButtonDesc;
  action: string | null;
}

export async function getToolbarDescriptor(): Promise<ToolbarDescriptor> {
  return invoke<ToolbarDescriptor>("get_toolbar_descriptor");
}

export async function toolbarEvent(id: string, eventType: string): Promise<ToolbarEventResult | null> {
  return invoke<ToolbarEventResult | null>("toolbar_event", { id, eventType });
}

export async function toolbarClick(id: string): Promise<string> {
  return invoke<string>("toolbar_click", { id });
}

export async function updateProjectInfo(name: string, path: string): Promise<void> {
  return invoke("update_project_info", { name, path });
}

export async function updateGitState(git: GitState): Promise<void> {
  return invoke("update_git_state", { git });
}

export async function updateActiveFile(name: string | null): Promise<void> {
  return invoke("update_active_file", { name });
}

/* ── StatusBar ── @see statusbar.rs ── */

export interface StatusBarWidgetStyle {
  hover: boolean;
  font_weight: string | null;
  text_color: string | null;
  background: string | null;
  border_radius: string | null;
  icon_color: string | null;
}

export interface StatusBarWidget {
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

export interface MemoryInfo {
  used_mb: number;
  max_mb: number;
  fraction: number;
  is_high: boolean;
  enabled: boolean;
  show_text: boolean;
}

export interface StatusBarDescriptor {
  left_widgets: StatusBarWidget[];
  center_widgets: StatusBarWidget[];
  right_widgets: StatusBarWidget[];
  info_message: string;
  memory: MemoryInfo;
}

export async function getStatusBarDescriptor(): Promise<StatusBarDescriptor> {
  return invoke<StatusBarDescriptor>("get_status_bar_descriptor");
}

export async function updateStatusCursor(line: number, column: number): Promise<void> {
  return invoke("update_status_cursor", { line, column });
}

export async function updateStatusEncoding(encoding: string): Promise<void> {
  return invoke("update_status_encoding", { encoding });
}

export async function updateStatusLanguage(language: string): Promise<void> {
  return invoke("update_status_language", { language });
}

export async function updateStatusInfoMessage(message: string): Promise<void> {
  return invoke("update_status_info_message", { message });
}

/* ── Settings ── @see settings.rs ── */

export interface ConfigurableItem {
  id: string;
  label: string;
  description: string | null;
  icon: string | null;
  configurable_type: "Standard" | "Composite" | "Searchable";
  children: ConfigurableItem[];
  modified: boolean;
  has_error: boolean;
  enabled: boolean;
  search_terms: string[];
  project_level: boolean;
  beta: boolean;
  promo: boolean;
}

export interface ConfigurableGroup {
  id: string;
  label: string;
  description: string | null;
  configurables: ConfigurableItem[];
}

export interface SettingsEditorState {
  current_configurable_id: string | null;
  modified_ids: string[];
  error_ids: string[];
  search_query: string;
  breadcrumbs: { id: string; label: string }[];
  can_navigate_back: boolean;
  can_navigate_forward: boolean;
}

export interface SettingsDescriptor {
  title: string;
  groups: ConfigurableGroup[];
  editor_state: SettingsEditorState;
  dialog_width: number;
  dialog_height: number;
  splitter_ratio: number;
  show_apply_button: boolean;
  show_reset_button: boolean;
  is_modified: boolean;
  has_errors: boolean;
}

export async function getSettingsDescriptor(): Promise<SettingsDescriptor> {
  return invoke<SettingsDescriptor>("get_settings_descriptor");
}

export async function settingsSelectConfigurable(id: string): Promise<void> {
  return invoke("settings_select_configurable", { id });
}

export async function settingsSearch(query: string): Promise<void> {
  return invoke("settings_search", { query });
}

export async function settingsMarkModified(id: string, modified: boolean): Promise<void> {
  return invoke("settings_mark_modified", { id, modified });
}

export async function settingsApply(): Promise<void> {
  return invoke("settings_apply");
}

export async function settingsReset(): Promise<void> {
  return invoke("settings_reset");
}

/* ── Welcome ── @see welcome.rs ── */

export interface WelcomeTab {
  id: string;
  label: string;
  icon: string;
  selected: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description: string | null;
  enabled: boolean;
}

export interface RecentProject {
  name: string;
  path: string;
  icon: string;
  timestamp: string;
  valid: boolean;
}

export interface WelcomeScreenDescriptor {
  product_name: string;
  version: string;
  product_icon: string;
  build_number: string;
  tabs: WelcomeTab[];
  active_tab_id: string;
  quick_actions: QuickAction[];
  recent_projects: RecentProject[];
  configure_actions: QuickAction[];
  footer_actions: QuickAction[];
}

export async function getWelcomeScreen(): Promise<WelcomeScreenDescriptor> {
  return invoke<WelcomeScreenDescriptor>("get_welcome_screen");
}

export async function welcomeSetActiveTab(tabId: string): Promise<void> {
  return invoke("welcome_set_active_tab", { tabId });
}

/* ── Global State ── @see commands.rs ── */

export async function getIdeVersion(): Promise<string> {
  return invoke<string>("get_ide_version");
}

export async function getRecentProjects(): Promise<string[]> {
  return invoke<string[]>("get_recent_projects");
}

export async function openProject(path: string): Promise<string> {
  return invoke<string>("open_project", { path });
}

export async function createProject(name: string, path: string): Promise<string> {
  return invoke<string>("create_project", { name, path });
}

export async function toggleTheme(): Promise<string> {
  return invoke<string>("toggle_theme");
}

export async function toggleSidebar(): Promise<boolean> {
  return invoke<boolean>("toggle_sidebar");
}

export async function toggleBottomPanel(): Promise<boolean> {
  return invoke<boolean>("toggle_bottom_panel");
}

export async function setActiveToolWindow(toolId: string): Promise<void> {
  return invoke("set_active_tool_window", { toolId });
}

export async function setActiveFile(path: string): Promise<void> {
  return invoke("set_active_file", { path });
}

/* ── Menu ── @see menu.rs ── */

export interface ActionNode {
  group: { id: string; text: string; icon: string; children: ActionNode[] } | null;
  action: ActionPresentation | null;
  separator: boolean;
}

export interface MainMenuDescriptor {
  menus: { id: string; label: string; children: ActionNode[] }[];
}

export async function getMainMenu(): Promise<MainMenuDescriptor> {
  return invoke<MainMenuDescriptor>("get_main_menu");
}

export async function getDropdownMenu(triggerId: string, x: number, y: number): Promise<{ items: ActionNode[] } | null> {
  return invoke("get_dropdown_menu", { triggerId, x, y });
}
