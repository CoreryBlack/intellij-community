use std::sync::Mutex;
use tauri::State;

struct AppState {
    project_paths: Mutex<Vec<String>>,
    is_jvm_running: Mutex<bool>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! IntelliJ IDEA is loading...", name)
}

#[tauri::command]
fn get_recent_projects(state: State<AppState>) -> Vec<String> {
    state.project_paths.lock().unwrap().clone()
}

#[tauri::command]
fn open_project(path: String) -> Result<String, String> {
    if path.is_empty() {
        Err("Project path cannot be empty".to_string())
    } else {
        Ok(format!("Opening project: {}", path))
    }
}

#[tauri::command]
fn create_project(name: String, path: String) -> Result<String, String> {
    if name.is_empty() || path.is_empty() {
        Err("Name and path are required".to_string())
    } else {
        Ok(format!("Creating project {} at {}", name, path))
    }
}

#[tauri::command]
fn get_ide_version() -> String {
    "IntelliJ IDEA 2025.1 (Rust Edition)".to_string()
}

#[tauri::command]
fn is_jvm_running(state: State<AppState>) -> bool {
    *state.is_jvm_running.lock().unwrap()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            project_paths: Mutex::new(vec![]),
            is_jvm_running: Mutex::new(false),
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_recent_projects,
            open_project,
            create_project,
            get_ide_version,
            is_jvm_running,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
