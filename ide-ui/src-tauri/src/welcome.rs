/**
 * @see com.intellij.openapi.wm.impl.welcomeScreen.FlatWelcomeFrame
 * @see com.intellij.openapi.wm.impl.welcomeScreen.NewWelcomeScreen
 * @see com.intellij.openapi.wm.impl.welcomeScreen.TabbedWelcomeScreen
 * @see com.intellij.openapi.wm.impl.welcomeScreen.RecentProjectPanel
 * @see com.intellij.openapi.wm.impl.welcomeScreen.WelcomeScreenColors
 * @see com.intellij.ide.RecentProjectListActionProvider
 * @see com.intellij.openapi.actionSystem.IdeActions.GROUP_WELCOME_SCREEN_QUICKSTART
 * @see com.intellij.openapi.application.ApplicationNamesInfo
 * @see com.intellij.openapi.application.ApplicationInfo
 *
 * Direct Rust port of IntelliJ's WelcomeScreen data model.
 *
 * Official structure (TabbedWelcomeScreen / New UI):
 *   ┌──────────────────────────────────────────────────────┐
 *   │  Left Sidebar (224px)  │  Central Content Area       │
 *   │  ┌────────────────────┐│  ┌────────────────────────┐ │
 *   │  │  Logo (small)      ││  │  Logo + Title (center) │ │
 *   │  │                    ││  │                         │ │
 *   │  │  Tab: Projects     ││  │  Quick Actions Row      │ │
 *   │  │  Tab: Plugins      ││  │  [New][Open][VCS]       │ │
 *   │  │  Tab: ...          ││  │                         │ │
 *   │  │                    ││  │  Recent Projects         │ │
 *   │  │  Quick Access      ││  │  [project list]         │ │
 *   │  │  (bottom)          ││  │                         │ │
 *   │  └────────────────────┘│  │  Footer: Theme|Settings  │ │
 *   │                        │  └────────────────────────┘ │
 *   └──────────────────────────────────────────────────────┘
 *
 * Colors (from WelcomeScreenColors.java):
 *   WELCOME_HEADER_BACKGROUND: #191A1C (dialog-bg)
 *   FOOTER_BACKGROUND: #26282C (main-window-bg)
 *   FOOTER_FOREGROUND: #9FA2A8 (text-muted)
 *   BORDER_COLOR: #26282C (layer-0-border)
 */

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

/* ──────────────────────────────────────────────
 * WelcomeScreenTab — port of WelcomeScreenTab from TabbedWelcomeScreen
 * @see TabbedWelcomeScreen.DefaultWelcomeScreenTab
 * ────────────────────────────────────────────── */

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WelcomeTab {
    pub id: String,
    pub label: String,
    pub icon: String,
    pub selected: bool,
}

/* ──────────────────────────────────────────────
 * QuickAction — port of an action from GROUP_WELCOME_SCREEN_QUICKSTART
 * @see NewWelcomeScreen.createInnerPanel()
 * @see PlatformActions.xml WelcomeScreen.QuickStart
 * ────────────────────────────────────────────── */

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct QuickAction {
    pub id: String,
    pub label: String,
    pub icon: String,
    pub description: Option<String>,
    pub enabled: bool,
}

/* ──────────────────────────────────────────────
 * RecentProject — port of ReopenProjectAction / RecentProjectPanel item
 * @see RecentProjectPanel
 * @see RecentProjectListActionProvider
 * ────────────────────────────────────────────── */

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RecentProject {
    pub name: String,
    pub path: String,
    pub icon: String,
    pub timestamp: String,
    /// @see RecentProjectItemRenderer — valid/invalid state
    pub valid: bool,
}

/* ──────────────────────────────────────────────
 * ProjectGroup — port of RecentProjectPanel project groups
 * @see NewRecentProjectPanel — supports grouped projects
 * Groups are folders that contain multiple related projects.
 * Each group has a name, and projects can optionally belong to a group.
 * ────────────────────────────────────────────── */

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProjectGroup {
    pub id: String,
    pub label: String,
    pub icon: String,
    pub expanded: bool,
    pub projects: Vec<RecentProject>,
}

/* ──────────────────────────────────────────────
 * SpeedSearchState — port of ListWithFilter / SpeedSearch
 * @see RecentProjectPanel — speed search for filtering projects
 * Stores the current search state so it persists across tab switches.
 * ────────────────────────────────────────────── */

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SpeedSearchState {
    pub enabled: bool,
    pub query: String,
    pub selected_index: i32,
}

impl Default for SpeedSearchState {
    fn default() -> Self {
        Self { enabled: true, query: String::new(), selected_index: -1 }
    }
}

/* ──────────────────────────────────────────────
 * ProjectPreview — port of FilePreview / RecentProjectPanel preview
 * @see NewRecentProjectPanel — project preview on hover/selection
 * Shows a brief preview of the project contents.
 * ────────────────────────────────────────────── */

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProjectPreview {
    pub project_path: String,
    pub project_name: String,
    pub last_modified: String,
    pub file_count: u32,
    pub preview_files: Vec<String>,
}

/* ──────────────────────────────────────────────
 * WelcomeScreenDescriptor — full welcome screen data
 * ────────────────────────────────────────────── */

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WelcomeScreenDescriptor {
    /// @see ApplicationNamesInfo.getFullProductName()
    pub product_name: String,
    /// @see ApplicationInfo.getFullVersion()
    pub version: String,
    /// @see ApplicationInfoEx.getApplicationSvgIconUrl()
    pub product_icon: String,

    /// @see NewWelcomeScreen.createFooterPanel() — version info
    pub build_number: String,

    /// @see TabbedWelcomeScreen — left sidebar tabs
    pub tabs: Vec<WelcomeTab>,
    pub active_tab_id: String,

    /// @see GROUP_WELCOME_SCREEN_QUICKSTART actions
    pub quick_actions: Vec<QuickAction>,

    /// @see RecentProjectPanel — recent projects list
    pub recent_projects: Vec<RecentProject>,

    /// @see NewRecentProjectPanel — project groups (optional)
    pub project_groups: Vec<ProjectGroup>,

    /// @see RecentProjectPanel — speed search state
    pub speed_search: SpeedSearchState,

    /// @see NewWelcomeScreen — configure actions group
    pub configure_actions: Vec<QuickAction>,

    /// @see FlatWelcomeFrame — footer actions
    pub footer_actions: Vec<QuickAction>,

    /// Project preview on selection
    pub project_preview: Option<ProjectPreview>,
}

/* ──────────────────────────────────────────────
 * WelcomeScreenManager — port of:
 *   - FlatWelcomeFrame
 *   - RecentProjectListActionProvider
 *   - ApplicationNamesInfo/ApplicationInfo
 * ────────────────────────────────────────────── */

pub struct WelcomeScreenManager {
    descriptor: Mutex<WelcomeScreenDescriptor>,
}

impl WelcomeScreenManager {
    pub fn new() -> Self {
        Self {
            descriptor: Mutex::new(WelcomeScreenDescriptor::default()),
        }
    }

    pub fn get_descriptor(&self) -> WelcomeScreenDescriptor {
        self.descriptor.lock().unwrap().clone()
    }

    /// @see FlatWelcomeFrame — switch to a different tab
    pub fn set_active_tab(&self, tab_id: &str) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.active_tab_id = tab_id.into();
        for tab in &mut desc.tabs {
            tab.selected = tab.id == tab_id;
        }
    }

    /// @see RecentProjectListActionProvider — add a project to recent list
    /// @see RecentProjectPanel — project opened
    pub fn add_recent_project(&self, name: String, path: String) {
        let mut desc = self.descriptor.lock().unwrap();
        // Remove duplicate
        desc.recent_projects.retain(|p| p.path != path);
        // Add to front
        desc.recent_projects.insert(0, RecentProject {
            name,
            path,
            icon: "project".into(),
            timestamp: "Just now".into(),
            valid: true,
        });
        // Keep max 20 items
        desc.recent_projects.truncate(20);
    }
}

/* ──────────────────────────────────────────────
 * Default implementation — mirrors the Java/Kotlin defaults
 * ────────────────────────────────────────────── */

impl Default for WelcomeScreenDescriptor {
    fn default() -> Self {
        Self {
            product_name: "IntelliJ IDEA".into(),
            version: "2025.1".into(),
            product_icon: "intellij-idea".into(),
            build_number: "251.0".into(),

            tabs: vec![
                WelcomeTab { id: "projects".into(), label: "Projects".into(), icon: "folder".into(), selected: true },
                WelcomeTab { id: "plugins".into(), label: "Plugins".into(), icon: "plugin".into(), selected: false },
                WelcomeTab { id: "learn".into(), label: "Learn".into(), icon: "learn".into(), selected: false },
            ],

            active_tab_id: "projects".into(),

            // @see GROUP_WELCOME_SCREEN_QUICKSTART
            // New Project | Open | Get from VCS
            quick_actions: vec![
                QuickAction {
                    id: "NewProject".into(),
                    label: "New Project".into(),
                    icon: "new-project".into(),
                    description: Some("Create a new project from scratch".into()),
                    enabled: true,
                },
                QuickAction {
                    id: "Open".into(),
                    label: "Open".into(),
                    icon: "open".into(),
                    description: Some("Open an existing project".into()),
                    enabled: true,
                },
                QuickAction {
                    id: "GetFromVCS".into(),
                    label: "Get from VCS".into(),
                    icon: "vcs".into(),
                    description: Some("Clone a repository from version control".into()),
                    enabled: true,
                },
            ],

            // @see RecentProjectPanel — recent projects list
            recent_projects: vec![
                RecentProject { name: "AstralLight".into(), path: "E:/Projects/AstralLight".into(), icon: "project".into(), timestamp: "Just now".into(), valid: true },
                RecentProject { name: "intellij-community".into(), path: "E:/OfficialVersion/intellij-community".into(), icon: "project".into(), timestamp: "2 min ago".into(), valid: true },
                RecentProject { name: "ide-ui".into(), path: "E:/OfficialVersion/intellij-community/ide-ui".into(), icon: "project".into(), timestamp: "Yesterday".into(), valid: true },
                RecentProject { name: "rust-toolkit".into(), path: "E:/Projects/rust-toolkit".into(), icon: "project".into(), timestamp: "3 days ago".into(), valid: true },
            ],

            // @see NewRecentProjectPanel — project groups (empty by default)
            project_groups: vec![],

            // @see RecentProjectPanel — speed search enabled by default
            speed_search: SpeedSearchState::default(),

            // @see NewWelcomeScreen — configure actions group
            configure_actions: vec![
                QuickAction { id: "settings".into(), label: "Settings".into(), icon: "settings".into(), description: None, enabled: true },
                QuickAction { id: "plugins".into(), label: "Plugins".into(), icon: "plugin".into(), description: None, enabled: true },
                QuickAction { id: "help".into(), label: "Help".into(), icon: "help".into(), description: None, enabled: true },
            ],

            // @see FlatWelcomeFrame.createFooterPanel()
            footer_actions: vec![
                QuickAction { id: "toggle_theme".into(), label: "Light".into(), icon: "theme".into(), description: None, enabled: true },
                QuickAction { id: "settings".into(), label: "Settings".into(), icon: "settings".into(), description: None, enabled: true },
                QuickAction { id: "about".into(), label: "About".into(), icon: "about".into(), description: None, enabled: true },
            ],

            // @see NewRecentProjectPanel — no preview by default
            project_preview: None,
        }
    }
}

/* ──────────────────────────────────────────────
 * Tauri commands
 * ────────────────────────────────────────────── */

#[tauri::command]
pub fn get_welcome_screen(state: tauri::State<crate::AppState>) -> WelcomeScreenDescriptor {
    state.welcome_manager.get_descriptor()
}

#[tauri::command]
pub fn welcome_set_active_tab(state: tauri::State<crate::AppState>, tab_id: String) {
    state.welcome_manager.set_active_tab(&tab_id);
}
