/**
 * @see com.intellij.openapi.wm.impl.headertoolbar.MainToolbar
 * @see com.intellij.openapi.actionSystem.ActionManager
 * @see com.intellij.execution.RunManager
 * @see com.intellij.openapi.actionSystem.IdeActions
 *
 * Toolbar descriptor — mirrors IntelliJ's ActionManager + MainToolbarNewUI
 * Every button, group, and data item is defined here in Rust.
 * Frontend is a pure renderer with ZERO hardcoded design decisions.
 *
 * Official MainToolbarNewUI hierarchy:
 *   MainToolbarLeft:
 *     MainMenuWithButton (hamburger menu)
 *     main.toolbar.Project (project name popup)
 *     MainToolbarVCSGroup (git branches + merge/rebase)
 *     MainToolbarGeneralActionsGroup (extensible)
 *   MainToolbarCenter:
 *     main.toolbar.Filename (current file name)
 *   MainToolbarRight:
 *     NewUiRunWidget (run config selector + run/debug + stop)
 *     SearchEverywhere
 *     SettingsEntryPoint
 */

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub enum ToolbarActionType {
    Button,
    Toggle,
    Dropdown,
    Separator,
    Widget,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub enum ToolbarGroupPosition {
    Left,
    Center,
    Right,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ToolbarAction {
    pub id: String,
    pub label: String,
    pub short_label: Option<String>,
    pub icon: String,
    pub action_type: ToolbarActionType,
    pub shortcut: Option<String>,
    pub tooltip: Option<String>,
    pub enabled: bool,
    pub visible: bool,
    pub toggle_state: Option<bool>,
    pub badge: Option<String>,
    pub children: Vec<ToolbarAction>,
    pub style_override: Option<ToolbarActionStyle>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ToolbarActionStyle {
    pub border: bool,
    pub accent_color: Option<String>,
    pub font_weight: Option<String>,
    pub text_color: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ToolbarGroup {
    pub id: String,
    pub position: ToolbarGroupPosition,
    pub actions: Vec<ToolbarAction>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct RunConfiguration {
    pub id: String,
    pub name: String,
    pub type_name: String,
    pub icon: String,
    pub pinned: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct GitState {
    pub branch: String,
    pub remote: String,
    pub clean: bool,
    pub ahead: u32,
    pub behind: u32,
    pub has_changes: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ProjectInfo {
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub icon: String,
    pub color: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ToolbarDescriptor {
    pub groups: Vec<ToolbarGroup>,
    pub project: ProjectInfo,
    pub run_configurations: Vec<RunConfiguration>,
    pub active_run_config: Option<String>,
    pub git: Option<GitState>,
    pub active_file_name: Option<String>,
}

pub struct ToolbarManager {
    descriptor: Mutex<ToolbarDescriptor>,
}

impl ToolbarManager {
    pub fn new() -> Self {
        Self {
            descriptor: Mutex::new(ToolbarDescriptor::default()),
        }
    }

    pub fn update_project(&self, name: String, path: String) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.project = ProjectInfo {
            name,
            path,
            description: None,
            icon: "project".into(),
            color: Some("#3871E1".into()),
        };
        self.rebuild_actions(&mut desc);
    }

    pub fn update_git(&self, git: GitState) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.git = Some(git);
        self.rebuild_actions(&mut desc);
    }

    pub fn update_run_configs(&self, configs: Vec<RunConfiguration>, active: Option<String>) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.run_configurations = configs;
        desc.active_run_config = active;
        self.rebuild_actions(&mut desc);
    }

    pub fn update_active_file(&self, name: Option<String>) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.active_file_name = name;
        self.rebuild_actions(&mut desc);
    }

    pub fn get_descriptor(&self) -> ToolbarDescriptor {
        self.descriptor.lock().unwrap().clone()
    }

    fn rebuild_actions(&self, desc: &mut ToolbarDescriptor) {
        let project_name = desc.project.name.clone();
        let git = desc.git.clone();
        let run_configs = desc.run_configurations.clone();
        let active_config = desc.active_run_config.clone();
        let active_file = desc.active_file_name.clone();

        desc.groups = vec![
            self.build_left_group(&project_name, &git),
            self.build_center_group(&active_file),
            self.build_right_group(&run_configs, &active_config, &git),
        ];
    }

    fn build_left_group(&self, project_name: &str, git: &Option<GitState>) -> ToolbarGroup {
        let mut actions = vec![
            ToolbarAction {
                id: "MainMenuButton".into(),
                label: "Main Menu".into(),
                short_label: None,
                icon: "hamburger".into(),
                action_type: ToolbarActionType::Button,
                shortcut: None,
                tooltip: Some("Main Menu".into()),
                enabled: true,
                visible: true,
                toggle_state: None,
                badge: None,
                children: vec![],
                style_override: None,
            },
            ToolbarAction {
                id: "main.toolbar.Project".into(),
                label: project_name.into(),
                short_label: None,
                icon: "project".into(),
                action_type: ToolbarActionType::Dropdown,
                shortcut: None,
                tooltip: Some("Recent Projects".into()),
                enabled: true,
                visible: true,
                toggle_state: None,
                badge: None,
                children: vec![],
                style_override: Some(ToolbarActionStyle {
                    border: false,
                    accent_color: None,
                    font_weight: Some("600".into()),
                    text_color: Some("var(--ide-text-default)".into()),
                }),
            },
        ];

        if let Some(g) = git {
            actions.push(ToolbarAction {
                id: "main.toolbar.git.Branches".into(),
                label: g.branch.clone(),
                short_label: None,
                icon: "git-branch".into(),
                action_type: ToolbarActionType::Dropdown,
                shortcut: None,
                tooltip: Some("Git Branches".into()),
                enabled: true,
                visible: true,
                toggle_state: None,
                badge: None,
                children: vec![],
                style_override: Some(ToolbarActionStyle {
                    border: true,
                    accent_color: Some("var(--ide-accent-blue)".into()),
                    font_weight: None,
                    text_color: None,
                }),
            });

            actions.push(ToolbarAction {
                id: "CheckinProject".into(),
                label: "Commit".into(),
                short_label: None,
                icon: "commit".into(),
                action_type: ToolbarActionType::Button,
                shortcut: Some("Ctrl+K".into()),
                tooltip: Some("Commit (Ctrl+K)".into()),
                enabled: true,
                visible: true,
                toggle_state: None,
                badge: if g.has_changes { Some("●".into()) } else { None },
                children: vec![],
                style_override: None,
            });

            actions.push(ToolbarAction {
                id: "Vcs.Push".into(),
                label: "Push".into(),
                short_label: None,
                icon: "push".into(),
                action_type: ToolbarActionType::Button,
                shortcut: Some("Ctrl+Shift+K".into()),
                tooltip: Some("Push (Ctrl+Shift+K)".into()),
                enabled: true,
                visible: true,
                toggle_state: None,
                badge: if g.ahead > 0 { Some(g.ahead.to_string()) } else { None },
                children: vec![],
                style_override: None,
            });
        }

        ToolbarGroup {
            id: "MainToolbarLeft".into(),
            position: ToolbarGroupPosition::Left,
            actions,
        }
    }

    fn build_center_group(&self, active_file: &Option<String>) -> ToolbarGroup {
        let mut actions = vec![
            ToolbarAction {
                id: "SearchEverywhere".into(),
                label: "Search".into(),
                short_label: None,
                icon: "search".into(),
                action_type: ToolbarActionType::Button,
                shortcut: Some("Double Shift".into()),
                tooltip: Some("Search Everywhere (Double Shift)".into()),
                enabled: true,
                visible: true,
                toggle_state: None,
                badge: None,
                children: vec![],
                style_override: Some(ToolbarActionStyle {
                    border: false,
                    accent_color: None,
                    font_weight: None,
                    text_color: Some("var(--ide-text-secondary)".into()),
                }),
            },
        ];

        if let Some(name) = active_file {
            actions.push(ToolbarAction {
                id: "main.toolbar.Filename".into(),
                label: name.clone(),
                short_label: None,
                icon: "file".into(),
                action_type: ToolbarActionType::Widget,
                shortcut: None,
                tooltip: None,
                enabled: true,
                visible: true,
                toggle_state: None,
                badge: None,
                children: vec![],
                style_override: None,
            });
        }

        ToolbarGroup {
            id: "MainToolbarCenter".into(),
            position: ToolbarGroupPosition::Center,
            actions,
        }
    }

    fn build_right_group(
        &self,
        run_configs: &[RunConfiguration],
        active_config: &Option<String>,
        git: &Option<GitState>,
    ) -> ToolbarGroup {
        let active_name = active_config
            .as_ref()
            .and_then(|id| run_configs.iter().find(|c| &c.id == id).map(|c| c.name.clone()))
            .unwrap_or_else(|| "No configuration".into());

        let mut actions = vec![
            ToolbarAction {
                id: "NewUiRunWidget".into(),
                label: active_name,
                short_label: None,
                icon: "run".into(),
                action_type: ToolbarActionType::Dropdown,
                shortcut: None,
                tooltip: Some("Run Configuration".into()),
                enabled: true,
                visible: true,
                toggle_state: None,
                badge: None,
                children: run_configs.iter().map(|c| ToolbarAction {
                    id: format!("run-config-{}", c.id),
                    label: c.name.clone(),
                    short_label: None,
                    icon: c.icon.clone(),
                    action_type: ToolbarActionType::Button,
                    shortcut: None,
                    tooltip: Some(c.type_name.clone()),
                    enabled: true,
                    visible: true,
                    toggle_state: None,
                    badge: None,
                    children: vec![],
                    style_override: None,
                }).collect(),
                style_override: Some(ToolbarActionStyle {
                    border: false,
                    accent_color: Some("var(--ide-accent-green)".into()),
                    font_weight: None,
                    text_color: Some("var(--ide-text-default)".into()),
                }),
            },
            ToolbarAction {
                id: "Run".into(),
                label: "Run".into(),
                short_label: None,
                icon: "run".into(),
                action_type: ToolbarActionType::Button,
                shortcut: Some("Shift+F10".into()),
                tooltip: Some("Run (Shift+F10)".into()),
                enabled: true,
                visible: true,
                toggle_state: None,
                badge: None,
                children: vec![],
                style_override: Some(ToolbarActionStyle {
                    border: false,
                    accent_color: Some("var(--ide-accent-green)".into()),
                    font_weight: None,
                    text_color: Some("var(--ide-accent-green)".into()),
                }),
            },
            ToolbarAction {
                id: "Debug".into(),
                label: "Debug".into(),
                short_label: None,
                icon: "debug".into(),
                action_type: ToolbarActionType::Button,
                shortcut: Some("Shift+F9".into()),
                tooltip: Some("Debug (Shift+F9)".into()),
                enabled: true,
                visible: true,
                toggle_state: None,
                badge: None,
                children: vec![],
                style_override: None,
            },
            ToolbarAction {
                id: "Separator".into(),
                label: String::new(),
                short_label: None,
                icon: String::new(),
                action_type: ToolbarActionType::Separator,
                shortcut: None,
                tooltip: None,
                enabled: false,
                visible: true,
                toggle_state: None,
                badge: None,
                children: vec![],
                style_override: None,
            },
            ToolbarAction {
                id: "SearchEverywhere.Right".into(),
                label: "Search".into(),
                short_label: None,
                icon: "search".into(),
                action_type: ToolbarActionType::Button,
                shortcut: Some("Double Shift".into()),
                tooltip: Some("Search Everywhere (Double Shift)".into()),
                enabled: true,
                visible: true,
                toggle_state: None,
                badge: None,
                children: vec![],
                style_override: None,
            },
            ToolbarAction {
                id: "SettingsEntryPoint".into(),
                label: "Settings".into(),
                short_label: None,
                icon: "settings".into(),
                action_type: ToolbarActionType::Button,
                shortcut: Some("Ctrl+Alt+,".into()),
                tooltip: Some("Settings (Ctrl+Alt+,)".into()),
                enabled: true,
                visible: true,
                toggle_state: None,
                badge: None,
                children: vec![],
                style_override: None,
            },
        ];

        ToolbarGroup {
            id: "MainToolbarRight".into(),
            position: ToolbarGroupPosition::Right,
            actions,
        }
    }
}

impl Default for ToolbarDescriptor {
    fn default() -> Self {
        let project = ProjectInfo {
            name: "Project".into(),
            path: String::new(),
            description: None,
            icon: "project".into(),
            color: Some("#3871E1".into()),
        };
        let run_configs = vec![
            RunConfiguration {
                id: "spring-boot".into(),
                name: "AstralMonitorApplication".into(),
                type_name: "Spring Boot".into(),
                icon: "spring".into(),
                pinned: true,
            },
        ];
        let git = Some(GitState {
            branch: "main".into(),
            remote: "origin".into(),
            clean: true,
            ahead: 0,
            behind: 0,
            has_changes: false,
        });

        let mgr = ToolbarManager::new();
        {
            let mut desc = mgr.descriptor.lock().unwrap();
            desc.project = project;
            desc.run_configurations = run_configs;
            desc.active_run_config = Some("spring-boot".into());
            desc.git = git;
            mgr.rebuild_actions(&mut desc);
        }
        mgr.get_descriptor()
    }
}

#[tauri::command]
pub fn get_toolbar_descriptor(state: tauri::State<crate::AppState>) -> ToolbarDescriptor {
    state.toolbar_manager.get_descriptor()
}

#[tauri::command]
pub fn update_project_info(
    state: tauri::State<crate::AppState>,
    name: String,
    path: String,
) {
    state.toolbar_manager.update_project(name, path);
}

#[tauri::command]
pub fn update_git_state(
    state: tauri::State<crate::AppState>,
    git: GitState,
) {
    state.toolbar_manager.update_git(git);
}

#[tauri::command]
pub fn update_active_file(
    state: tauri::State<crate::AppState>,
    name: Option<String>,
) {
    state.toolbar_manager.update_active_file(name);
}
