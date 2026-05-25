use tauri::State;
use serde::{Serialize, Deserialize};
use crate::{AppState, layout::LayoutDescriptor};

#[derive(Serialize, Deserialize, Clone)]
pub struct FullAppState {
    pub theme: String,
    pub sidebar_visible: bool,
    pub bottom_panel_visible: bool,
    pub active_tool_window: String,
    pub islands_config: IslandsConfig,
    pub editor: EditorStateResponse,
    pub status_bar: StatusBarResponse,
    pub tool_windows: ToolWindowLayoutResponse,
    pub current_project: Option<String>,
    pub layout: LayoutDescriptor,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct IslandsConfig {
    pub many_islands_enabled: bool,
    pub arc_radius: u32,
    pub compact_arc_radius: u32,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct EditorStateResponse {
    pub open_files: Vec<EditorFileResponse>,
    pub active_file: Option<String>,
    pub cursor_line: usize,
    pub cursor_column: usize,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct EditorFileResponse {
    pub path: String,
    pub name: String,
    pub language: String,
    pub modified: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct StatusBarResponse {
    pub git_branch: String,
    pub problem_count: usize,
    pub file_encoding: String,
    pub line_ending: String,
    pub indent_style: String,
    pub language: String,
    pub read_only: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ToolWindowLayoutResponse {
    pub left_toolbar: Vec<ToolWindowResponse>,
    pub right_toolbar: Vec<ToolWindowResponse>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ToolWindowResponse {
    pub id: String,
    pub anchor: String,
    pub title: String,
    pub icon: String,
    pub visible: bool,
    pub content_type: String,
    pub active: bool,
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! IntelliJ IDEA is loading...", name)
}

#[tauri::command]
pub fn get_recent_projects(state: State<AppState>) -> Vec<String> {
    state.project_paths.lock().unwrap().clone()
}

#[tauri::command]
pub fn open_project(path: String) -> Result<String, String> {
    if path.is_empty() {
        Err("Project path cannot be empty".to_string())
    } else {
        Ok(format!("Opening project: {}", path))
    }
}

#[tauri::command]
pub fn create_project(name: String, path: String) -> Result<String, String> {
    if name.is_empty() || path.is_empty() {
        Err("Name and path are required".to_string())
    } else {
        Ok(format!("Creating project {} at {}", name, path))
    }
}

#[tauri::command]
pub fn get_ide_version() -> String {
    "IntelliJ IDEA 2025.1 (Rust Edition)".to_string()
}

#[tauri::command]
pub fn is_jvm_running(state: State<AppState>) -> bool {
    *state.is_jvm_running.lock().unwrap()
}

#[tauri::command]
pub fn toggle_theme(state: State<AppState>) -> String {
    let mut theme = state.theme.lock().unwrap();
    *theme = if *theme == "dark" { "light".to_string() } else { "dark".to_string() };
    theme.clone()
}

#[tauri::command]
pub fn toggle_sidebar(state: State<AppState>) -> bool {
    let mut visible = state.sidebar_visible.lock().unwrap();
    *visible = !*visible;
    *visible
}

#[tauri::command]
pub fn toggle_bottom_panel(state: State<AppState>) -> bool {
    let mut visible = state.bottom_panel_visible.lock().unwrap();
    *visible = !*visible;
    *visible
}

#[tauri::command]
pub fn set_active_tool_window(state: State<AppState>, tool_id: String) -> Result<(), String> {
    let mut active = state.active_tool_window.lock().unwrap();
    *active = tool_id;
    Ok(())
}

#[tauri::command]
pub fn set_active_file(state: State<AppState>, path: String) -> Result<(), String> {
    let mut editor = state.editor.lock().unwrap();
    if editor.open_files.iter().any(|f| f.path == path) {
        editor.active_file = Some(path);
        Ok(())
    } else {
        Err(format!("File '{}' is not open", path))
    }
}

#[tauri::command]
pub fn get_app_state(state: State<AppState>) -> FullAppState {
    let theme = state.theme.lock().unwrap().clone();
    let sidebar = *state.sidebar_visible.lock().unwrap();
    let bottom = *state.bottom_panel_visible.lock().unwrap();
    let active_tool = state.active_tool_window.lock().unwrap().clone();
    let islands = state.islands.lock().unwrap();
    let editor = state.editor.lock().unwrap();
    let sb = state.status_bar.lock().unwrap();
    let tw_layout = state.tool_window_layout.lock().unwrap();

    FullAppState {
        theme,
        sidebar_visible: sidebar,
        bottom_panel_visible: bottom,
        active_tool_window: active_tool.clone(),
        islands_config: IslandsConfig {
            many_islands_enabled: islands.many_islands_enabled,
            arc_radius: islands.arc_radius,
            compact_arc_radius: islands.compact_arc_radius,
        },
        editor: EditorStateResponse {
            open_files: editor.open_files.iter().map(|f| EditorFileResponse {
                path: f.path.clone(),
                name: f.name.clone(),
                language: f.language.clone(),
                modified: f.modified,
            }).collect(),
            active_file: editor.active_file.clone(),
            cursor_line: editor.cursor_position.line,
            cursor_column: editor.cursor_position.column,
        },
        status_bar: StatusBarResponse {
            git_branch: sb.git_branch.clone(),
            problem_count: sb.problem_count,
            file_encoding: sb.file_encoding.clone(),
            line_ending: sb.line_ending.clone(),
            indent_style: sb.indent_style.clone(),
            language: sb.language.clone(),
            read_only: sb.read_only,
        },
        tool_windows: ToolWindowLayoutResponse {
            left_toolbar: tw_layout.left_toolbar.iter().map(|t| ToolWindowResponse {
                id: t.id.clone(),
                anchor: "left".into(),
                title: t.title.clone(),
                icon: t.icon.clone(),
                visible: t.visible,
                content_type: t.content_type.clone(),
                active: t.id == active_tool,
            }).collect(),
            right_toolbar: tw_layout.right_toolbar.iter().map(|t| ToolWindowResponse {
                id: t.id.clone(),
                anchor: "right".into(),
                title: t.title.clone(),
                icon: t.icon.clone(),
                visible: t.visible,
                content_type: t.content_type.clone(),
                active: false,
            }).collect(),
        },
        current_project: state.current_project.lock().unwrap().clone(),
        layout: state.layout_descriptor.clone(),
    }
}

#[tauri::command]
pub fn get_islands_config(state: State<AppState>) -> IslandsConfig {
    let islands = state.islands.lock().unwrap();
    IslandsConfig {
        many_islands_enabled: islands.many_islands_enabled,
        arc_radius: islands.arc_radius,
        compact_arc_radius: islands.compact_arc_radius,
    }
}

#[tauri::command]
pub fn get_status_bar_state(state: State<AppState>) -> StatusBarResponse {
    let sb = state.status_bar.lock().unwrap();
    StatusBarResponse {
        git_branch: sb.git_branch.clone(),
        problem_count: sb.problem_count,
        file_encoding: sb.file_encoding.clone(),
        line_ending: sb.line_ending.clone(),
        indent_style: sb.indent_style.clone(),
        language: sb.language.clone(),
        read_only: sb.read_only,
    }
}

#[tauri::command]
pub fn get_tool_window_layout(state: State<AppState>) -> ToolWindowLayoutResponse {
    let active_tool = state.active_tool_window.lock().unwrap().clone();
    let tw_layout = state.tool_window_layout.lock().unwrap();
    ToolWindowLayoutResponse {
        left_toolbar: tw_layout.left_toolbar.iter().map(|t| ToolWindowResponse {
            id: t.id.clone(),
            anchor: "left".into(),
            title: t.title.clone(),
            icon: t.icon.clone(),
            visible: t.visible,
            content_type: t.content_type.clone(),
            active: t.id == active_tool,
        }).collect(),
        right_toolbar: tw_layout.right_toolbar.iter().map(|t| ToolWindowResponse {
            id: t.id.clone(),
            anchor: "right".into(),
            title: t.title.clone(),
            icon: t.icon.clone(),
            visible: t.visible,
            content_type: t.content_type.clone(),
            active: false,
        }).collect(),
    }
}

#[tauri::command]
pub fn get_editor_state(state: State<AppState>) -> EditorStateResponse {
    let editor = state.editor.lock().unwrap();
    EditorStateResponse {
        open_files: editor.open_files.iter().map(|f| EditorFileResponse {
            path: f.path.clone(),
            name: f.name.clone(),
            language: f.language.clone(),
            modified: f.modified,
        }).collect(),
        active_file: editor.active_file.clone(),
        cursor_line: editor.cursor_position.line,
        cursor_column: editor.cursor_position.column,
    }
}

#[tauri::command]
pub fn get_layout_descriptor(state: State<AppState>) -> LayoutDescriptor {
    state.layout_descriptor.clone()
}
