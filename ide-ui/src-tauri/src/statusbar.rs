/**
 * statusbar.rs — StatusBar descriptor
 *
 * @see com.intellij.openapi.wm.impl.status.IdeStatusBarImpl
 * @see com.intellij.openapi.wm.impl.status.WidgetRegistry
 * @see com.intellij.openapi.wm.impl.status.StatusBarWidgetsManager
 * @see com.intellij.openapi.wm.StatusBarWidgetFactory
 * @see com.intellij.openapi.wm.StatusBar.StandardWidgets
 *
 * Mirrors IntelliJ's IdeStatusBarImpl widget system.
 * Every widget, position, text, icon, and style is defined here in Rust.
 * Frontend is a pure renderer with ZERO hardcoded design decisions.
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
 *
 * RIGHT panel widget order (from PlatformExtensions.xml + LangExtensions.xml):
 *   VfsRefresh(first,disabled) → Position → LanguageService → LineSeparator →
 *   Encoding → PowerSaveMode(disabled) → InsertOverwrite → ReadOnlyAttribute →
 *   Notifications → FatalError → WriteThread(last,internal) →
 *   Memory(last,disabled) → settingsEntryPointWidget(last)
 *
 * Key parameters:
 *   - height: 28px
 *   - topBorderWidth: 0px (Islands mode)
 *   - item height: 24px
 *   - item padding horizontal: 7px
 *   - leftPanel border: empty(0,4,0,1)
 *   - rightPanel border: emptyLeft(1)
 *   - leftPanel widgets: no hover effect
 *   - rightPanel widgets: hover effect with arc=4px
 */

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub enum StatusBarWidgetType {
    Text,
    Icon,
    IconAndText,
    Separator,
    Progress,
    Custom,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub enum StatusBarWidgetPosition {
    #[serde(rename = "left")]
    Left,
    #[serde(rename = "center")]
    Center,
    #[serde(rename = "right")]
    Right,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct StatusBarWidgetStyle {
    pub hover: bool,
    pub font_weight: Option<String>,
    pub text_color: Option<String>,
    pub background: Option<String>,
    pub border_radius: Option<String>,
    pub icon_color: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct StatusBarWidget {
    pub id: String,
    pub position: StatusBarWidgetPosition,
    pub widget_type: StatusBarWidgetType,
    pub text: String,
    pub icon: Option<String>,
    pub tooltip: Option<String>,
    pub shortcut: Option<String>,
    pub enabled: bool,
    pub visible: bool,
    pub order: i32,
    pub style: StatusBarWidgetStyle,
    pub click_action: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ProgressInfo {
    pub text: String,
    pub fraction: Option<f32>,
    pub indeterminate: bool,
    pub cancellable: bool,
}

/* ──────────────────────────────────────────────
 * MemoryIndicator — port of MemoryUsagePanel
 * @see com.intellij.openapi.wm.impl.status.MemoryUsagePanel
 *
 * Shows current memory usage with a progress bar style widget.
 * Located at the right edge of the status bar (last position).
 * In Islands mode it uses the configured status bar colors.
 * ────────────────────────────────────────────── */

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct MemoryInfo {
    /// Current heap usage in MB
    pub used_mb: u64,
    /// Maximum heap size in MB
    pub max_mb: u64,
    /// Percentage used (0.0 - 1.0)
    pub fraction: f32,
    /// Whether memory usage is high (>80%)
    pub is_high: bool,
    /// Whether the memory indicator is enabled
    pub enabled: bool,
    /// Whether to show the memory indicator text
    pub show_text: bool,
}

impl Default for MemoryInfo {
    fn default() -> Self {
        Self {
            used_mb: 256,
            max_mb: 1024,
            fraction: 0.25,
            is_high: false,
            enabled: true,
            show_text: false,
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct StatusBarDescriptor {
    pub left_widgets: Vec<StatusBarWidget>,
    pub center_widgets: Vec<StatusBarWidget>,
    pub right_widgets: Vec<StatusBarWidget>,
    pub info_message: String,
    pub progress: Option<ProgressInfo>,
    /// @see MemoryUsagePanel — memory indicator
    pub memory: MemoryInfo,
}

pub struct StatusBarManager {
    descriptor: Mutex<StatusBarDescriptor>,
}

impl StatusBarManager {
    pub fn new() -> Self {
        Self {
            descriptor: Mutex::new(StatusBarDescriptor::default()),
        }
    }

    pub fn get_descriptor(&self) -> StatusBarDescriptor {
        self.descriptor.lock().unwrap().clone()
    }

    pub fn update_cursor_position(&self, line: usize, column: usize) {
        let mut desc = self.descriptor.lock().unwrap();
        for w in &mut desc.right_widgets {
            if w.id == "Position" {
                w.text = format!("Ln {}, Col {}", line, column);
                return;
            }
        }
    }

    pub fn update_encoding(&self, encoding: String) {
        let mut desc = self.descriptor.lock().unwrap();
        for w in &mut desc.right_widgets {
            if w.id == "Encoding" {
                w.text = encoding;
                return;
            }
        }
    }

    pub fn update_line_separator(&self, separator: String) {
        let mut desc = self.descriptor.lock().unwrap();
        for w in &mut desc.right_widgets {
            if w.id == "LineSeparator" {
                w.text = separator;
                return;
            }
        }
    }

    pub fn update_language(&self, language: String) {
        let mut desc = self.descriptor.lock().unwrap();
        for w in &mut desc.right_widgets {
            if w.id == "LanguageService" {
                w.text = language.clone();
                w.style.text_color = Some("var(--ide-text-default)".into());
                w.style.font_weight = Some("500".into());
                return;
            }
        }
    }

    pub fn update_read_only(&self, read_only: bool) {
        let mut desc = self.descriptor.lock().unwrap();
        for w in &mut desc.right_widgets {
            if w.id == "ReadOnlyAttribute" {
                w.visible = read_only;
                return;
            }
        }
    }

    pub fn update_insert_mode(&self, column_mode: bool) {
        let mut desc = self.descriptor.lock().unwrap();
        for w in &mut desc.right_widgets {
            if w.id == "InsertOverwrite" {
                w.text = if column_mode { "COL".to_string() } else { "INS".to_string() };
                w.visible = true;
                return;
            }
        }
    }

    pub fn update_info_message(&self, message: String) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.info_message = message;
    }

    pub fn update_progress(&self, progress: Option<ProgressInfo>) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.progress = progress;
    }

    pub fn update_indent_style(&self, style: String) {
        let mut desc = self.descriptor.lock().unwrap();
        for w in &mut desc.right_widgets {
            if w.id == "IndentStyle" {
                w.text = style;
                return;
            }
        }
    }

    pub fn update_memory(&self, memory: MemoryInfo) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.memory = memory;
    }

    pub fn toggle_memory_text(&self, show_text: bool) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.memory.show_text = show_text;
    }
}

impl Default for StatusBarDescriptor {
    fn default() -> Self {
        let left_widgets = vec![
            StatusBarWidget {
                id: "ToolWindowsWidget".into(),
                position: StatusBarWidgetPosition::Left,
                widget_type: StatusBarWidgetType::Icon,
                text: String::new(),
                icon: Some("tool-windows".into()),
                tooltip: Some("Tool Windows".into()),
                shortcut: None,
                enabled: true,
                visible: true,
                order: 0,
                style: StatusBarWidgetStyle {
                    hover: false,
                    font_weight: None,
                    text_color: Some("var(--ide-text-muted)".into()),
                    background: None,
                    border_radius: None,
                    icon_color: None,
                },
                click_action: Some("showToolWindowList".into()),
            },
        ];

        let center_widgets = vec![
            StatusBarWidget {
                id: "InfoAndProgressPanel".into(),
                position: StatusBarWidgetPosition::Center,
                widget_type: StatusBarWidgetType::Text,
                text: "Ready".into(),
                icon: None,
                tooltip: None,
                shortcut: None,
                enabled: true,
                visible: true,
                order: 0,
                style: StatusBarWidgetStyle {
                    hover: false,
                    font_weight: None,
                    text_color: Some("var(--ide-text-secondary)".into()),
                    background: None,
                    border_radius: None,
                    icon_color: None,
                },
                click_action: None,
            },
        ];

        let right_widgets = vec![
            StatusBarWidget {
                id: "Position".into(),
                position: StatusBarWidgetPosition::Right,
                widget_type: StatusBarWidgetType::Text,
                text: "Ln 12, Col 20".into(),
                icon: None,
                tooltip: Some("Cursor Position".into()),
                shortcut: Some("Ctrl+G".into()),
                enabled: true,
                visible: true,
                order: 10,
                style: StatusBarWidgetStyle {
                    hover: false,
                    font_weight: None,
                    text_color: Some("var(--ide-text-muted)".into()),
                    background: None,
                    border_radius: None,
                    icon_color: None,
                },
                click_action: Some("gotoLine".into()),
            },
            StatusBarWidget {
                id: "LanguageService".into(),
                position: StatusBarWidgetPosition::Right,
                widget_type: StatusBarWidgetType::Text,
                text: "Java".into(),
                icon: None,
                tooltip: Some("Language Service".into()),
                shortcut: None,
                enabled: true,
                visible: true,
                order: 20,
                style: StatusBarWidgetStyle {
                    hover: true,
                    font_weight: Some("500".into()),
                    text_color: Some("var(--ide-text-default)".into()),
                    background: None,
                    border_radius: Some("var(--ide-status-bar-widget-hover-arc)".into()),
                    icon_color: None,
                },
                click_action: Some("showLanguageServices".into()),
            },
            StatusBarWidget {
                id: "LineSeparator".into(),
                position: StatusBarWidgetPosition::Right,
                widget_type: StatusBarWidgetType::Text,
                text: "CRLF".into(),
                icon: None,
                tooltip: Some("Line Separator".into()),
                shortcut: None,
                enabled: true,
                visible: true,
                order: 30,
                style: StatusBarWidgetStyle {
                    hover: true,
                    font_weight: None,
                    text_color: Some("var(--ide-text-muted)".into()),
                    background: None,
                    border_radius: Some("var(--ide-status-bar-widget-hover-arc)".into()),
                    icon_color: None,
                },
                click_action: Some("changeLineSeparator".into()),
            },
            StatusBarWidget {
                id: "Encoding".into(),
                position: StatusBarWidgetPosition::Right,
                widget_type: StatusBarWidgetType::Text,
                text: "UTF-8".into(),
                icon: None,
                tooltip: Some("File Encoding".into()),
                shortcut: None,
                enabled: true,
                visible: true,
                order: 40,
                style: StatusBarWidgetStyle {
                    hover: true,
                    font_weight: None,
                    text_color: Some("var(--ide-text-muted)".into()),
                    background: None,
                    border_radius: Some("var(--ide-status-bar-widget-hover-arc)".into()),
                    icon_color: None,
                },
                click_action: Some("changeEncoding".into()),
            },
            StatusBarWidget {
                id: "IndentStyle".into(),
                position: StatusBarWidgetPosition::Right,
                widget_type: StatusBarWidgetType::Text,
                text: "Spaces: 4".into(),
                icon: None,
                tooltip: Some("Indentation".into()),
                shortcut: None,
                enabled: true,
                visible: true,
                order: 45,
                style: StatusBarWidgetStyle {
                    hover: true,
                    font_weight: None,
                    text_color: Some("var(--ide-text-muted)".into()),
                    background: None,
                    border_radius: Some("var(--ide-status-bar-widget-hover-arc)".into()),
                    icon_color: None,
                },
                click_action: Some("changeIndentStyle".into()),
            },
            StatusBarWidget {
                id: "InsertOverwrite".into(),
                position: StatusBarWidgetPosition::Right,
                widget_type: StatusBarWidgetType::Text,
                text: "INS".into(),
                icon: None,
                tooltip: Some("Insert/Overwrite Mode".into()),
                shortcut: Some("Insert".into()),
                enabled: true,
                visible: false,
                order: 50,
                style: StatusBarWidgetStyle {
                    hover: true,
                    font_weight: None,
                    text_color: Some("var(--ide-text-muted)".into()),
                    background: None,
                    border_radius: Some("var(--ide-status-bar-widget-hover-arc)".into()),
                    icon_color: None,
                },
                click_action: Some("toggleInsertMode".into()),
            },
            StatusBarWidget {
                id: "ReadOnlyAttribute".into(),
                position: StatusBarWidgetPosition::Right,
                widget_type: StatusBarWidgetType::Icon,
                text: String::new(),
                icon: Some("lock".into()),
                tooltip: Some("Read-only".into()),
                shortcut: None,
                enabled: true,
                visible: false,
                order: 60,
                style: StatusBarWidgetStyle {
                    hover: false,
                    font_weight: None,
                    text_color: Some("var(--ide-text-muted)".into()),
                    background: None,
                    border_radius: None,
                    icon_color: Some("var(--ide-text-muted)".into()),
                },
                click_action: Some("toggleReadOnly".into()),
            },
            StatusBarWidget {
                id: "Notifications".into(),
                position: StatusBarWidgetPosition::Right,
                widget_type: StatusBarWidgetType::Icon,
                text: String::new(),
                icon: Some("notifications".into()),
                tooltip: Some("Notifications".into()),
                shortcut: None,
                enabled: true,
                visible: true,
                order: 70,
                style: StatusBarWidgetStyle {
                    hover: true,
                    font_weight: None,
                    text_color: Some("var(--ide-text-muted)".into()),
                    background: None,
                    border_radius: Some("var(--ide-status-bar-widget-hover-arc)".into()),
                    icon_color: Some("var(--ide-text-muted)".into()),
                },
                click_action: Some("showNotifications".into()),
            },
            StatusBarWidget {
                id: "settingsEntryPointWidget".into(),
                position: StatusBarWidgetPosition::Right,
                widget_type: StatusBarWidgetType::Icon,
                text: String::new(),
                icon: Some("settings".into()),
                tooltip: Some("Settings".into()),
                shortcut: Some("Ctrl+Alt+,".into()),
                enabled: true,
                visible: true,
                order: 999,
                style: StatusBarWidgetStyle {
                    hover: true,
                    font_weight: None,
                    text_color: Some("var(--ide-text-muted)".into()),
                    background: None,
                    border_radius: Some("var(--ide-status-bar-widget-hover-arc)".into()),
                    icon_color: Some("var(--ide-text-muted)".into()),
                },
                click_action: Some("openSettings".into()),
            },
        ];

        Self {
            left_widgets,
            center_widgets,
            right_widgets,
            info_message: "Ready".into(),
            progress: None,
            memory: MemoryInfo::default(),
        }
    }
}

/// Tauri command to update memory info
#[tauri::command]
pub fn update_status_memory(
    state: tauri::State<crate::AppState>,
    memory: MemoryInfo,
) {
    state.statusbar_manager.update_memory(memory);
}

/// Tauri command to toggle memory indicator visibility
#[tauri::command]
pub fn toggle_memory_indicator(
    state: tauri::State<crate::AppState>,
    show_text: bool,
) {
    state.statusbar_manager.toggle_memory_text(show_text);
}

#[tauri::command]
pub fn get_status_bar_descriptor(state: tauri::State<crate::AppState>) -> StatusBarDescriptor {
    state.statusbar_manager.get_descriptor()
}

#[tauri::command]
pub fn update_status_cursor(
    state: tauri::State<crate::AppState>,
    line: usize,
    column: usize,
) {
    state.statusbar_manager.update_cursor_position(line, column);
}

#[tauri::command]
pub fn update_status_encoding(
    state: tauri::State<crate::AppState>,
    encoding: String,
) {
    state.statusbar_manager.update_encoding(encoding);
}

#[tauri::command]
pub fn update_status_line_separator(
    state: tauri::State<crate::AppState>,
    separator: String,
) {
    state.statusbar_manager.update_line_separator(separator);
}

#[tauri::command]
pub fn update_status_language(
    state: tauri::State<crate::AppState>,
    language: String,
) {
    state.statusbar_manager.update_language(language);
}

#[tauri::command]
pub fn update_status_read_only(
    state: tauri::State<crate::AppState>,
    read_only: bool,
) {
    state.statusbar_manager.update_read_only(read_only);
}

#[tauri::command]
pub fn update_status_info_message(
    state: tauri::State<crate::AppState>,
    message: String,
) {
    state.statusbar_manager.update_info_message(message);
}

#[tauri::command]
pub fn update_status_indent_style(
    state: tauri::State<crate::AppState>,
    style: String,
) {
    state.statusbar_manager.update_indent_style(style);
}
