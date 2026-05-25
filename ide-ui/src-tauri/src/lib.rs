use std::sync::Mutex;

mod button_look;
mod commands;
mod frontend;
mod fs;
mod layout;
mod main_toolbar;
mod menu;
mod statusbar;
mod terminal;
mod welcome;

pub use commands::*;
pub use fs::*;
pub use layout::*;

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct IslandsState {
    pub many_islands_enabled: bool,
    pub arc_radius: u32,
    pub compact_arc_radius: u32,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct ToolWindowInfo {
    pub id: String,
    pub anchor: ToolWindowAnchor,
    pub title: String,
    pub icon: String,
    pub visible: bool,
    pub content_type: String,
    pub active: bool,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub enum ToolWindowAnchor {
    #[serde(rename = "left")]
    Left,
    #[serde(rename = "right")]
    Right,
    #[serde(rename = "bottom")]
    Bottom,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct EditorFileInfo {
    pub path: String,
    pub name: String,
    pub language: String,
    pub modified: bool,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct CursorPosition {
    pub line: usize,
    pub column: usize,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct StatusBarState {
    pub git_branch: String,
    pub problem_count: usize,
    pub file_encoding: String,
    pub line_ending: String,
    pub indent_style: String,
    pub language: String,
    pub read_only: bool,
}

pub struct ToolWindowLayout {
    pub left_toolbar: Vec<ToolWindowInfo>,
    pub right_toolbar: Vec<ToolWindowInfo>,
}

pub struct EditorState {
    pub open_files: Vec<EditorFileInfo>,
    pub active_file: Option<String>,
    pub cursor_position: CursorPosition,
}

pub struct AppState {
    pub project_paths: Mutex<Vec<String>>,
    pub current_project: Mutex<Option<String>>,
    pub is_jvm_running: Mutex<bool>,
    pub islands: Mutex<IslandsState>,
    pub tool_window_layout: Mutex<ToolWindowLayout>,
    pub editor: Mutex<EditorState>,
    pub status_bar: Mutex<StatusBarState>,
    pub theme: Mutex<String>,
    pub sidebar_visible: Mutex<bool>,
    pub bottom_panel_visible: Mutex<bool>,
    pub active_tool_window: Mutex<String>,
    pub layout_descriptor: layout::LayoutDescriptor,
    pub terminal_manager: terminal::TerminalManager,
    pub main_toolbar_manager: main_toolbar::ToolbarManager,
    pub toolbar_frontend: frontend::ToolbarFrontend,
    pub statusbar_manager: statusbar::StatusBarManager,
    pub menu_manager: menu::MenuManager,
    pub welcome_manager: welcome::WelcomeScreenManager,
}

impl Default for AppState {
    fn default() -> Self {
        let lt = layout::LayoutDescriptor::default();
        Self {
            project_paths: Mutex::new(vec![]),
            current_project: Mutex::new(None),
            is_jvm_running: Mutex::new(false),
            islands: Mutex::new(IslandsState {
                many_islands_enabled: true,
                arc_radius: 20,
                compact_arc_radius: 16,
            }),
            tool_window_layout: Mutex::new(ToolWindowLayout {
                left_toolbar: lt.left_toolbar_items(),
                right_toolbar: vec![],
            }),
            editor: Mutex::new(EditorState {
                open_files: lt.default_open_files(),
                active_file: Some("src/main/java/com/corvertrack/monitor/AstralMonitorApplication.java".into()),
                cursor_position: CursorPosition { line: 12, column: 20 },
            }),
            status_bar: Mutex::new(lt.default_status_bar_state()),
            theme: Mutex::new("dark".into()),
            sidebar_visible: Mutex::new(true),
            bottom_panel_visible: Mutex::new(true),
            active_tool_window: Mutex::new("project".into()),
            layout_descriptor: lt,
            terminal_manager: terminal::TerminalManager::new(),
            main_toolbar_manager: main_toolbar::ToolbarManager::new(),
            toolbar_frontend: frontend::ToolbarFrontend::new(),
            statusbar_manager: statusbar::StatusBarManager::new(),
            menu_manager: menu::MenuManager::new(),
            welcome_manager: welcome::WelcomeScreenManager::new(),
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::get_recent_projects,
            commands::open_project,
            commands::create_project,
            commands::get_ide_version,
            commands::is_jvm_running,
            commands::get_app_state,
            commands::toggle_theme,
            commands::toggle_sidebar,
            commands::toggle_bottom_panel,
            commands::set_active_tool_window,
            commands::set_active_file,
            commands::get_islands_config,
            commands::get_status_bar_state,
            commands::get_tool_window_layout,
            commands::get_editor_state,
            commands::get_layout_descriptor,
            fs::read_directory,
            fs::read_file_content,
            fs::file_exists,
            fs::is_directory,
            terminal::terminal_create,
            terminal::terminal_write,
            terminal::terminal_resize,
            terminal::terminal_kill,
            terminal::terminal_list,
            terminal::get_problems,
            terminal::get_services,
            terminal::run_command,
            main_toolbar::get_toolbar_descriptor,
            main_toolbar::update_project_info,
            main_toolbar::update_git_state,
            main_toolbar::update_active_file,
            frontend::toolbar_event,
            frontend::get_frontend_toolbar,
            frontend::toolbar_click,
            statusbar::get_status_bar_descriptor,
            statusbar::update_status_cursor,
            statusbar::update_status_encoding,
            statusbar::update_status_line_separator,
            statusbar::update_status_language,
            statusbar::update_status_read_only,
            statusbar::update_status_info_message,
            statusbar::update_status_indent_style,
            menu::get_main_menu,
            menu::get_dropdown_menu,
            welcome::get_welcome_screen,
            welcome::welcome_set_active_tab,
            statusbar::update_status_memory,
            statusbar::toggle_memory_indicator,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
