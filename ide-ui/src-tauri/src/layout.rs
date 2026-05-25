/*
 * layout.rs — 完整布局描述符
 *
 * @see com.intellij.openapi.wm.impl.IdeRootPane.CustomHeaderRootLayout
 * @see com.intellij.toolWindow.ToolWindowPaneNewButtonManager.wrapWithControls
 * @see com.intellij.openapi.application.impl.islands.IslandsUICustomization
 *
 * 此文件定义 IDE 窗口每一层的布局参数。
 * 前端组件应该从此结构读取所有布局值，不做自主设计决策。
 *
 * 窗口结构 (BorderLayout)：
 *   ├─ NORTH: MainToolbar
 *   ├─ WEST:  ToolWindowLeftToolbar
 *   ├─ CENTER: ToolWindowPane → Sidebar + Editor + BottomPanel
 *   ├─ EAST:  ToolWindowRightToolbar
 *   └─ SOUTH: IdeStatusBarImpl
 */

use crate::{ToolWindowInfo, ToolWindowAnchor, EditorFileInfo, StatusBarState};

/// LayoutDescriptor — frontend reads every pixel from this struct.
/// No hardcoded values in React/CSS beyond what this describes.
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct LayoutDescriptor {
    /// Window-level settings (from tauri.conf.json)
    pub window: WindowLayout,

    /// MainToolbar (NORTH) — from IdeRootPane toolbar slot
    pub toolbar: ToolbarLayout,

    /// ToolWindowLeftToolbar (WEST, 40px) — from ToolWindowPaneNewButtonManager
    pub left_button_strip: ButtonStripLayout,

    /// ToolWindowRightToolbar (EAST) — from ToolWindowPaneNewButtonManager
    pub right_button_strip: ButtonStripLayout,

    /// CENTER: ToolWindowPane contents
    pub center_area: CenterAreaLayout,

    /// Tool window sidebar (slides out from button strip)
    pub sidebar: SidebarLayout,

    /// Editor area (tabs + breadcrumb + code)
    pub editor: EditorLayout,

    /// Bottom panel (terminal / problems / services)
    pub bottom_panel: BottomPanelLayout,

    /// StatusBar (SOUTH) — from IdeStatusBarImpl
    pub status_bar: StatusBarLayout,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct WindowLayout {
    pub default_width: u32,
    pub default_height: u32,
    pub min_width: u32,
    pub min_height: u32,
    pub title: String,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct ToolbarLayout {
    pub height: u32,
    pub horizontal_padding: u32,
    pub item_gap: u32,
    pub icon_button_size: u32,
    pub font_size: u32,
    pub border_bottom_width: u32,
    pub show_hamburger_menu: bool,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct ButtonStripLayout {
    pub width: u32,
    pub button_size: u32,
    pub button_radius: u32,
    pub vertical_padding: u32,
    pub item_gap: u32,
    pub show_collapse_button: bool,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct CenterAreaLayout {
    /// flex direction: always "row" — from BorderLayout CENTER
    pub direction: String,
    /// When bottom panel is visible, split proportion:
    ///   editor_flex: 5, bottom_flex: 3  =>  editor ~62%, bottom ~38%
    pub editor_flex: u32,
    pub bottom_flex: u32,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct SidebarLayout {
    pub width: u32,
    pub header_height: u32,
    pub header_padding: u32,
    pub tree_row_height: u32,
    pub tree_indent_per_level: u32,
    pub font_size: u32,
    pub show_gear_icon: bool,
    pub show_toolbox_icon: bool,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct EditorLayout {
    pub tab_bar_height: u32,
    pub tab_height: u32,
    pub tab_horizontal_padding: u32,
    pub breadcrumb_height: u32,
    pub line_number_gutter_width: u32,
    pub line_height: u32,
    pub font_size: u32,
    pub active_tab_border_width: u32,
    pub active_tab_border_radius: u32,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct BottomPanelLayout {
    pub tab_bar_height: u32,
    pub tab_horizontal_padding: u32,
    pub tab_radius: u32,
    pub mini_tree_width: u32,
    pub mini_tree_header_height: u32,
    pub mini_tree_row_height: u32,
    pub terminal_font_size: u32,
    pub terminal_line_height: u32,
}

#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct StatusBarLayout {
    pub height: u32,
    pub item_height: u32,
    pub item_padding_horizontal: u32,
    pub item_gap: u32,
    pub font_size: u32,
}

impl Default for LayoutDescriptor {
    fn default() -> Self {
        Self {
            window: WindowLayout {
                default_width: 1400,
                default_height: 900,
                min_width: 800,
                min_height: 600,
                title: "IntelliJ IDEA".into(),
            },
            toolbar: ToolbarLayout {
                height: 44,
                horizontal_padding: 6,
                item_gap: 2,
                icon_button_size: 30,
                font_size: 13,
                border_bottom_width: 1,
                show_hamburger_menu: true,
            },
            left_button_strip: ButtonStripLayout {
                width: 40,
                button_size: 32,
                button_radius: 8,
                vertical_padding: 4,
                item_gap: 1,
                show_collapse_button: true,
            },
            right_button_strip: ButtonStripLayout {
                width: 0, // no right toolbar in current config
                button_size: 32,
                button_radius: 8,
                vertical_padding: 4,
                item_gap: 1,
                show_collapse_button: false,
            },
            center_area: CenterAreaLayout {
                direction: "row".into(),
                editor_flex: 5,
                bottom_flex: 3,
            },
            sidebar: SidebarLayout {
                width: 240,
                header_height: 34,
                header_padding: 10,
                tree_row_height: 24,
                tree_indent_per_level: 16,
                font_size: 12,
                show_gear_icon: true,
                show_toolbox_icon: true,
            },
            editor: EditorLayout {
                tab_bar_height: 36,
                tab_height: 32,
                tab_horizontal_padding: 12,
                breadcrumb_height: 26,
                line_number_gutter_width: 52,
                line_height: 20,
                font_size: 12,
                active_tab_border_width: 2,
                active_tab_border_radius: 6,
            },
            bottom_panel: BottomPanelLayout {
                tab_bar_height: 30,
                tab_horizontal_padding: 14,
                tab_radius: 6,
                mini_tree_width: 200,
                mini_tree_header_height: 28,
                mini_tree_row_height: 26,
                terminal_font_size: 11,
                terminal_line_height: 17,
            },
            status_bar: StatusBarLayout {
                height: 28,
                item_height: 24,
                item_padding_horizontal: 7,
                item_gap: 1,
                font_size: 11,
            },
        }
    }
}

impl LayoutDescriptor {
    pub fn left_toolbar_items(&self) -> Vec<ToolWindowInfo> {
        vec![
            ToolWindowInfo {
                id: "project".into(),
                anchor: ToolWindowAnchor::Left,
                title: "Project".into(),
                icon: "project".into(),
                visible: true,
                content_type: "tree".into(),
            },
            ToolWindowInfo {
                id: "search".into(),
                anchor: ToolWindowAnchor::Left,
                title: "Search".into(),
                icon: "search".into(),
                visible: true,
                content_type: "search".into(),
            },
            ToolWindowInfo {
                id: "git".into(),
                anchor: ToolWindowAnchor::Left,
                title: "Git".into(),
                icon: "git".into(),
                visible: true,
                content_type: "vcs".into(),
            },
            ToolWindowInfo {
                id: "run".into(),
                anchor: ToolWindowAnchor::Left,
                title: "Run".into(),
                icon: "run".into(),
                visible: true,
                content_type: "run".into(),
            },
            ToolWindowInfo {
                id: "structure".into(),
                anchor: ToolWindowAnchor::Left,
                title: "Structure".into(),
                icon: "structure".into(),
                visible: true,
                content_type: "structure".into(),
            },
        ]
    }

    pub fn default_status_bar_state(&self) -> StatusBarState {
        StatusBarState {
            git_branch: "main".into(),
            problem_count: 0,
            file_encoding: "UTF-8".into(),
            line_ending: "CRLF".into(),
            indent_style: "Spaces: 4".into(),
            language: "Java".into(),
            read_only: false,
        }
    }

    pub fn default_open_files(&self) -> Vec<EditorFileInfo> {
        vec![
            EditorFileInfo {
                path: "src/main/java/com/corvertrack/monitor/AstralMonitorApplication.java".into(),
                name: "AstralMonitorApplication.java".into(),
                language: "java".into(),
                modified: true,
            },
            EditorFileInfo {
                path: "src/main/java/com/corvertrack/monitor/controller/UserControllerImpl.java".into(),
                name: "UserControllerImpl.java".into(),
                language: "java".into(),
                modified: false,
            },
            EditorFileInfo {
                path: "src/main/java/com/corvertrack/monitor/controller/PortalsControllerImpl.java".into(),
                name: "PortalsControllerImpl.java".into(),
                language: "java".into(),
                modified: false,
            },
        ]
    }
}
