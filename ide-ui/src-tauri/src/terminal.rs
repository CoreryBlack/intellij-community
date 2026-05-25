/**
 * @see com.intellij.terminal.TerminalView
 * @see com.intellij.terminal.TerminalWidget
 * @see org.jetbrains.plugins.terminal.LocalTerminalDirectRunner
 *
 * Terminal backend — PTY process management via Rust
 * Spawns a real shell (cmd.exe on Windows, bash/zsh on Unix)
 * Streams output to frontend via Tauri events
 */

use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader, Write};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};
use crate::AppState;

#[derive(Clone, Serialize, Deserialize)]
pub struct TerminalSession {
    pub id: String,
    pub shell: String,
    pub cwd: String,
    pub running: bool,
}

pub struct TerminalManager {
    sessions: Mutex<Vec<TerminalSession>>,
    writers: Mutex<Vec<(String, Box<dyn Write + Send>)>>,
}

impl TerminalManager {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(Vec::new()),
            writers: Mutex::new(Vec::new()),
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub struct TerminalOutput {
    pub session_id: String,
    pub data: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ProblemItem {
    pub severity: String,
    pub file: String,
    pub line: usize,
    pub message: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ServiceItem {
    pub name: String,
    pub status: String,
    pub port: Option<u16>,
}

#[tauri::command]
pub fn terminal_create(
    app: AppHandle,
    state: State<AppState>,
    cwd: Option<String>,
) -> Result<TerminalSession, String> {
    let pty_system = native_pty_system();

    let working_dir = cwd
        .or_else(|| state.current_project.lock().unwrap().clone())
        .or_else(|| dirs::home_dir().map(|p| p.to_string_lossy().to_string()))
        .unwrap_or_else(|| ".".to_string());

    let shell = if cfg!(windows) {
        "cmd.exe".to_string()
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
    };

    let session_id = format!("term-{}", chrono_free_id());

    let cmd = if cfg!(windows) {
        CommandBuilder::new("cmd.exe")
    } else {
        CommandBuilder::new(&shell)
    };
    let mut cmd = cmd;
    cmd.cwd(&working_dir);

    let pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("Failed to create PTY: {}", e))?;

    let reader = pair.master.try_clone_reader().map_err(|e| format!("Clone reader: {}", e))?;
    let writer = pair.master.take_writer().map_err(|e| format!("Take writer: {}", e))?;

    let _child = pair.slave.spawn_command(cmd).map_err(|e| format!("Spawn: {}", e))?;

    let sid = session_id.clone();
    let app_h = app.clone();
    std::thread::spawn(move || {
        let br = BufReader::new(reader);
        for line in br.lines() {
            match line {
                Ok(text) => {
                    let output = TerminalOutput {
                        session_id: sid.clone(),
                        data: text + "\n",
                    };
                    let _ = app_h.emit("terminal-output", &output);
                }
                Err(_) => break,
            }
        }
        let _ = app_h.emit(
            "terminal-exit",
            &TerminalOutput {
                session_id: sid.clone(),
                data: "Process exited.\r\n".to_string(),
            },
        );
    });

    state
        .terminal_manager
        .writers
        .lock()
        .unwrap()
        .push((session_id.clone(), Box::new(writer)));

    let session = TerminalSession {
        id: session_id,
        shell,
        cwd: working_dir,
        running: true,
    };
    state
        .terminal_manager
        .sessions
        .lock()
        .unwrap()
        .push(session.clone());

    Ok(session)
}

#[tauri::command]
pub fn terminal_write(
    state: State<AppState>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    let mut writers = state.terminal_manager.writers.lock().unwrap();
    if let Some((_, writer)) = writers.iter_mut().find(|(id, _)| id == &session_id) {
        writer
            .write_all(data.as_bytes())
            .map_err(|e| format!("Write error: {}", e))?;
        writer.flush().map_err(|e| format!("Flush error: {}", e))?;
        Ok(())
    } else {
        Err(format!("Session '{}' not found", session_id))
    }
}

#[tauri::command]
pub fn terminal_resize(
    _state: State<AppState>,
    _session_id: String,
    _cols: u16,
    _rows: u16,
) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn terminal_kill(
    state: State<AppState>,
    session_id: String,
) -> Result<(), String> {
    let mut writers = state.terminal_manager.writers.lock().unwrap();
    writers.retain(|(id, _)| id != &session_id);
    let mut sessions = state.terminal_manager.sessions.lock().unwrap();
    sessions.retain(|s| s.id != session_id);
    Ok(())
}

#[tauri::command]
pub fn terminal_list(state: State<AppState>) -> Vec<TerminalSession> {
    state.terminal_manager.sessions.lock().unwrap().clone()
}

#[tauri::command]
pub fn get_problems(state: State<AppState>) -> Vec<ProblemItem> {
    vec![]
}

#[tauri::command]
pub fn get_services(state: State<AppState>) -> Vec<ServiceItem> {
    vec![]
}

#[tauri::command]
pub fn run_command(
    app: AppHandle,
    state: State<AppState>,
    command: String,
    cwd: Option<String>,
) -> Result<String, String> {
    let working_dir = cwd
        .or_else(|| state.current_project.lock().unwrap().clone())
        .unwrap_or_else(|| ".".to_string());

    let output = std::process::Command::new(if cfg!(windows) { "cmd" } else { "sh" })
        .args(if cfg!(windows) {
            vec!["/C", &command]
        } else {
            vec!["-c", &command]
        })
        .current_dir(&working_dir)
        .output()
        .map_err(|e| format!("Command failed: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!("{}\n{}", stdout, stderr))
    }
}

fn chrono_free_id() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64
}
