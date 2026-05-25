/**
 * settings.rs — Settings/Preferences dialog descriptor
 *
 * @see com.intellij.openapi.options.newEditor.SettingsEditor
 * @see com.intellij.openapi.options.newEditor.SettingsTreeView
 * @see com.intellij.openapi.options.newEditor.SettingsSearch
 * @see com.intellij.openapi.options.newEditor.SettingsFilter
 * @see com.intellij.openapi.options.newEditor.ConfigurableEditor
 * @see com.intellij.openapi.options.newEditor.ConfigurableEditorBanner
 * @see com.intellij.openapi.options.ConfigurableGroup
 * @see com.intellij.openapi.options.Configurable
 * @see com.intellij.openapi.options.SearchableConfigurable
 *
 * Direct Rust port of IntelliJ's Settings dialog system.
 *
 * Official layout (SettingsEditor):
 *   OnePixelSplitter(ratio=0.2):
 *     LEFT  = searchField + treeView (ConfigurableGroup tree)
 *     RIGHT = banner (breadcrumb + history) + configurableEditor (card panel)
 *
 * Official ConfigurableGroup hierarchy:
 *   Appearance & Behavior
 *     → Appearance, New UI, Accessibility, Menus and Toolbars,
 *       System Settings, File Colors, Scopes, Notifications,
 *       Quick Lists, Path Variables
 *   Keymap
 *   Editor
 *     → General, Font, Color Scheme, Code Style, File Encodings,
 *       General (Advanced), Emmet, Live Templates, File and Code Templates,
 *       Inspections, File Types, Copyright
 *   Plugins
 *   Version Control
 *     → Git, GitHub, Confirmation, Changelists, Issue Navigation,
 *       Commit, Background
 *   Build, Execution, Deployment
 *     → Build Tools, Compiler, Debugger, Application Servers,
 *       Coverage, Gradle, Maven, Runner
 *   Languages & Frameworks
 *     → Java, Kotlin, Spring, SQL, JavaScript, TypeScript, etc.
 *   Tools
 *     → Actions on Save, External Tools, Terminal, Database,
 *       HTTP Client, Diagrams, Web Browsers, SSH Terminal, Diff, Tasks
 *
 * Key parameters:
 *   - dialog min size: 900x700
 *   - splitter ratio: 0.2 (20% left, 80% right)
 *   - tree row height: 24px
 *   - search field height: 28px
 *   - modified item foreground: blue
 *   - error item foreground: red
 */

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum ConfigurableType {
    Standard,
    Composite,
    Searchable,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ConfigurableItem {
    pub id: String,
    pub label: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub configurable_type: ConfigurableType,
    pub children: Vec<ConfigurableItem>,
    pub modified: bool,
    pub has_error: bool,
    pub enabled: bool,
    pub search_terms: Vec<String>,
    pub project_level: bool,
    pub beta: bool,
    pub promo: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ConfigurableGroup {
    pub id: String,
    pub label: String,
    pub description: Option<String>,
    pub configurables: Vec<ConfigurableItem>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SettingsSearchResult {
    pub configurable_id: String,
    pub match_type: String,
    pub match_text: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BreadcrumbItem {
    pub id: String,
    pub label: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SettingsEditorState {
    pub current_configurable_id: Option<String>,
    pub modified_ids: Vec<String>,
    pub error_ids: Vec<String>,
    pub search_query: String,
    pub search_results: Vec<SettingsSearchResult>,
    pub breadcrumbs: Vec<BreadcrumbItem>,
    pub can_navigate_back: bool,
    pub can_navigate_forward: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SettingsDescriptor {
    pub title: String,
    pub groups: Vec<ConfigurableGroup>,
    pub editor_state: SettingsEditorState,
    pub dialog_width: u32,
    pub dialog_height: u32,
    pub splitter_ratio: f32,
    pub show_apply_button: bool,
    pub show_reset_button: bool,
    pub is_modified: bool,
    pub has_errors: bool,
}

pub struct SettingsManager {
    descriptor: Mutex<SettingsDescriptor>,
}

impl SettingsManager {
    pub fn new() -> Self {
        Self {
            descriptor: Mutex::new(SettingsDescriptor::default()),
        }
    }

    pub fn get_descriptor(&self) -> SettingsDescriptor {
        self.descriptor.lock().unwrap().clone()
    }

    pub fn select_configurable(&self, id: String) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.editor_state.current_configurable_id = Some(id.clone());
        desc.editor_state.breadcrumbs = build_breadcrumbs(&desc.groups, &id);
        desc.editor_state.can_navigate_back = true;
        desc.editor_state.can_navigate_forward = false;
    }

    pub fn search(&self, query: String) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.editor_state.search_query = query.clone();
        if query.is_empty() {
            desc.editor_state.search_results = vec![];
            return;
        }
        let q = query.to_lowercase();
        let mut results = vec![];
        for group in &desc.groups {
            search_configurables(&group.configurables, &q, &mut results);
        }
        desc.editor_state.search_results = results;
    }

    pub fn mark_modified(&self, id: String, modified: bool) {
        let mut desc = self.descriptor.lock().unwrap();
        mark_configurable_modified(&mut desc.groups, &id, modified);
        if modified {
            if !desc.editor_state.modified_ids.contains(&id) {
                desc.editor_state.modified_ids.push(id);
            }
        } else {
            desc.editor_state.modified_ids.retain(|i| i != &id);
        }
        desc.is_modified = !desc.editor_state.modified_ids.is_empty();
    }

    pub fn apply(&self) -> Result<(), String> {
        let desc = self.descriptor.lock().unwrap();
        if desc.editor_state.error_ids.is_empty() {
            Ok(())
        } else {
            Err("Cannot apply: there are errors".into())
        }
    }

    pub fn reset(&self) {
        let mut desc = self.descriptor.lock().unwrap();
        for id in &desc.editor_state.modified_ids {
            mark_configurable_modified(&mut desc.groups, id, false);
        }
        desc.editor_state.modified_ids = vec![];
        desc.editor_state.error_ids = vec![];
        desc.is_modified = false;
        desc.has_errors = false;
    }
}

fn search_configurables(items: &[ConfigurableItem], query: &str, results: &mut Vec<SettingsSearchResult>) {
    for item in items {
        let label_lower = item.label.to_lowercase();
        if label_lower.contains(query) {
            results.push(SettingsSearchResult {
                configurable_id: item.id.clone(),
                match_type: if label_lower == query { "nameFull" } else if label_lower.starts_with(query) { "namePrefix" } else { "nameContains" }.into(),
                match_text: item.label.clone(),
            });
        }
        for term in &item.search_terms {
            if term.to_lowercase().contains(query) {
                results.push(SettingsSearchResult {
                    configurable_id: item.id.clone(),
                    match_type: "content".into(),
                    match_text: term.clone(),
                });
                break;
            }
        }
        search_configurables(&item.children, query, results);
    }
}

fn mark_configurable_modified(groups: &mut [ConfigurableGroup], id: &str, modified: bool) {
    for group in groups.iter_mut() {
        mark_item_modified(&mut group.configurables, id, modified);
    }
}

fn mark_item_modified(items: &mut [ConfigurableItem], id: &str, modified: bool) {
    for item in items.iter_mut() {
        if item.id == id {
            item.modified = modified;
            return;
        }
        mark_item_modified(&mut item.children, id, modified);
    }
}

fn build_breadcrumbs(groups: &[ConfigurableGroup], target_id: &str) -> Vec<BreadcrumbItem> {
    for group in groups {
        let mut path = vec![BreadcrumbItem { id: group.id.clone(), label: group.label.clone() }];
        if let Some(rest) = find_breadcrumb_path(&group.configurables, target_id, &mut path) {
            return rest;
        }
    }
    vec![]
}

fn find_breadcrumb_path(items: &[ConfigurableItem], target_id: &str, path: &mut Vec<BreadcrumbItem>) -> Option<Vec<BreadcrumbItem>> {
    for item in items {
        path.push(BreadcrumbItem { id: item.id.clone(), label: item.label.clone() });
        if item.id == target_id {
            return Some(path.clone());
        }
        if let Some(result) = find_breadcrumb_path(&item.children, target_id, path) {
            return Some(result);
        }
        path.pop();
    }
    None
}

fn configurable(id: &str, label: &str, children: Vec<ConfigurableItem>) -> ConfigurableItem {
    ConfigurableItem {
        id: id.into(),
        label: label.into(),
        description: None,
        icon: None,
        configurable_type: if children.is_empty() { ConfigurableType::Searchable } else { ConfigurableType::Composite },
        children,
        modified: false,
        has_error: false,
        enabled: true,
        search_terms: vec![],
        project_level: false,
        beta: false,
        promo: false,
    }
}

fn searchable(id: &str, label: &str, terms: Vec<&str>) -> ConfigurableItem {
    ConfigurableItem {
        id: id.into(),
        label: label.into(),
        description: None,
        icon: None,
        configurable_type: ConfigurableType::Searchable,
        children: vec![],
        modified: false,
        has_error: false,
        enabled: true,
        search_terms: terms.iter().map(|s| s.to_string()).collect(),
        project_level: false,
        beta: false,
        promo: false,
    }
}

fn beta_item(id: &str, label: &str, terms: Vec<&str>) -> ConfigurableItem {
    let mut item = searchable(id, label, terms);
    item.beta = true;
    item
}

impl Default for SettingsDescriptor {
    fn default() -> Self {
        let groups = vec![
            ConfigurableGroup {
                id: "appearance".into(),
                label: "Appearance & Behavior".into(),
                description: Some("Customize the IDE appearance and behavior".into()),
                configurables: vec![
                    configurable("appearance", "Appearance", vec![
                        searchable("appearance.ui", "UI Options", vec!["theme", "font", "size", "antialiasing"]),
                        searchable("appearance.toolbar", "Toolbar", vec!["main toolbar", "navigation", "buttons"]),
                        searchable("appearance.statusbar", "Status Bar", vec!["status bar", "widgets", "memory"]),
                    ]),
                    configurable("new.ui", "New UI", vec![
                        searchable("new.ui.settings", "New UI Settings", vec!["compact mode", "toolbar", "tool window", "islands"]),
                        beta_item("new.ui.experimental", "Experimental Features", vec!["experimental", "new ui", "preview"]),
                    ]),
                    configurable("accessibility", "Accessibility", vec![
                        searchable("accessibility.settings", "Accessibility Settings", vec!["contrast", "color blindness", "screen reader"]),
                    ]),
                    configurable("menus.and.toolbars", "Menus and Toolbars", vec![]),
                    configurable("system.settings", "System Settings", vec![
                        searchable("system.settings.general", "General", vec!["startup", "reopen", "frame", "window"]),
                        searchable("system.settings.passwords", "Passwords", vec!["password", "keychain", "vault"]),
                        searchable("system.settings.http.proxy", "HTTP Proxy", vec!["proxy", "http", "socks"]),
                        searchable("system.settings.updates", "Updates", vec!["update", "channel", "check"]),
                        searchable("system.settings.data.sharing", "Data Sharing", vec!["statistics", "analytics", "sharing"]),
                    ]),
                    searchable("file.colors", "File Colors", vec!["file colors", "scopes", "labels"]),
                    searchable("scopes", "Scopes", vec!["scopes", "local", "shared"]),
                    searchable("notifications", "Notifications", vec!["notifications", "popup", "balloon", "sound"]),
                    searchable("quick.lists", "Quick Lists", vec!["quick lists", "shortcuts"]),
                    searchable("path.variables", "Path Variables", vec!["path variables", "macros"]),
                ],
            },
            ConfigurableGroup {
                id: "keymap".into(),
                label: "Keymap".into(),
                description: Some("Configure keyboard shortcuts".into()),
                configurables: vec![
                    searchable("keymap.main", "Keymap", vec!["keymap", "shortcut", "keyboard", "binding", "action"]),
                ],
            },
            ConfigurableGroup {
                id: "editor".into(),
                label: "Editor".into(),
                description: Some("Configure the editor".into()),
                configurables: vec![
                    configurable("editor.general", "General", vec![
                        searchable("editor.general.basic", "Basic", vec!["editor", "basic", "virtual space", "caret", "brackets"]),
                        searchable("editor.general.smart.keys", "Smart Keys", vec!["smart keys", "completion", "insert", "autopair"]),
                        searchable("editor.general.appearance", "Appearance", vec!["line numbers", "gutter", "breadcrumbs", "indent guide"]),
                        searchable("editor.general.soft.wrap", "Soft Wraps", vec!["soft wrap", "wrap", "line"]),
                        searchable("editor.general.code.folding", "Code Folding", vec!["folding", "collapse", "expand"]),
                        searchable("editor.general.editor.tabs", "Editor Tabs", vec!["tab", "editor tab", "close", "placement"]),
                        searchable("editor.general.gutter.icons", "Gutter Icons", vec!["gutter", "icon", "line marker"]),
                    ]),
                    configurable("editor.font", "Font", vec![
                        searchable("editor.font.primary", "Primary Font", vec!["font", "size", "line spacing", "fallback"]),
                    ]),
                    configurable("editor.color.scheme", "Color Scheme", vec![
                        searchable("editor.color.scheme.general", "Color Scheme", vec!["color", "scheme", "theme", "syntax highlight"]),
                    ]),
                    configurable("editor.code.style", "Code Style", vec![
                        searchable("editor.code.style.general", "General", vec!["code style", "indent", "formatting"]),
                        searchable("editor.code.style.java", "Java", vec!["java", "code style", "indent"]),
                        searchable("editor.code.style.kotlin", "Kotlin", vec!["kotlin", "code style"]),
                    ]),
                    searchable("editor.file.encodings", "File Encodings", vec!["encoding", "utf", "charset"]),
                    configurable("editor.advanced", "General (Advanced)", vec![]),
                    configurable("editor.emmet", "Emmet", vec![
                        searchable("editor.emmet.html", "HTML", vec!["emmet", "html", "abbreviation"]),
                        searchable("editor.emmet.css", "CSS", vec!["emmet", "css"]),
                    ]),
                    configurable("editor.live.templates", "Live Templates", vec![
                        searchable("editor.live.templates.general", "General", vec!["live template", "snippet", "abbreviation"]),
                    ]),
                    searchable("editor.file.templates", "File and Code Templates", vec!["template", "file template", "code template"]),
                    configurable("editor.inspections", "Inspections", vec![
                        searchable("editor.inspections.general", "General", vec!["inspection", "lint", "warning", "error"]),
                        searchable("editor.inspections.java", "Java", vec!["java", "inspection"]),
                        searchable("editor.inspections.kotlin", "Kotlin", vec!["kotlin", "inspection"]),
                    ]),
                    searchable("editor.file.types", "File Types", vec!["file type", "association", "pattern"]),
                    searchable("editor.copyright", "Copyright", vec!["copyright", "license", "header"]),
                ],
            },
            ConfigurableGroup {
                id: "plugins".into(),
                label: "Plugins".into(),
                description: Some("Manage plugins".into()),
                configurables: vec![
                    searchable("plugins.marketplace", "Marketplace", vec!["plugin", "install", "browse", "search"]),
                    searchable("plugins.installed", "Installed", vec!["plugin", "installed", "manage"]),
                ],
            },
            ConfigurableGroup {
                id: "version.control".into(),
                label: "Version Control".into(),
                description: Some("Configure version control settings".into()),
                configurables: vec![
                    configurable("vcs.general", "General", vec![
                        searchable("vcs.git", "Git", vec!["git", "ssh", "commit", "branch", "merge"]),
                        searchable("vcs.github", "GitHub", vec!["github", "pull request", "account"]),
                    ]),
                    searchable("vcs.confirmation", "Confirmation", vec!["confirmation", "dialog", "when creating"]),
                    searchable("vcs.changelists", "Changelists", vec!["changelist", "active", "default"]),
                    searchable("vcs.issue.navigation", "Issue Navigation", vec!["issue", "jira", "navigation", "link"]),
                    searchable("vcs.commit", "Commit", vec!["commit", "message", "template"]),
                ],
            },
            ConfigurableGroup {
                id: "build.execution.deployment".into(),
                label: "Build, Execution, Deployment".into(),
                description: Some("Configure build and deployment settings".into()),
                configurables: vec![
                    configurable("build.tools", "Build Tools", vec![
                        searchable("build.gradle", "Gradle", vec!["gradle", "build", "sync", "wrapper"]),
                        searchable("build.maven", "Maven", vec!["maven", "pom", "repository"]),
                    ]),
                    searchable("build.compiler", "Compiler", vec!["compiler", "javac", "annotation processor"]),
                    searchable("build.debugger", "Debugger", vec!["debugger", "breakpoint", "stepping"]),
                    configurable("build.application.servers", "Application Servers", vec![]),
                    searchable("build.coverage", "Coverage", vec!["coverage", "test", "report"]),
                ],
            },
            ConfigurableGroup {
                id: "languages.frameworks".into(),
                label: "Languages & Frameworks".into(),
                description: Some("Configure language and framework settings".into()),
                configurables: vec![
                    configurable("lang.java", "Java", vec![
                        searchable("lang.java.compiler", "Compiler", vec!["java", "compiler", "bytecode", "target"]),
                        searchable("lang.java.code.coverage", "Code Coverage", vec!["java", "coverage"]),
                    ]),
                    searchable("lang.kotlin", "Kotlin", vec!["kotlin", "compiler", "jvm"]),
                    configurable("lang.spring", "Spring", vec![
                        searchable("lang.spring.boot", "Spring Boot", vec!["spring boot", "auto configuration"]),
                    ]),
                    configurable("lang.sql", "SQL", vec![
                        searchable("lang.sql.general", "General", vec!["sql", "database", "dialect"]),
                    ]),
                    configurable("lang.javascript", "JavaScript", vec![
                        searchable("lang.javascript.general", "General", vec!["javascript", "js", "ecmascript"]),
                        searchable("lang.typescript", "TypeScript", vec!["typescript", "ts"]),
                    ]),
                ],
            },
            ConfigurableGroup {
                id: "tools".into(),
                label: "Tools".into(),
                description: Some("Configure external tools and integrations".into()),
                configurables: vec![
                    searchable("tools.actions.on.save", "Actions on Save", vec!["save", "reformat", "optimize imports", "on save"]),
                    searchable("tools.external.tools", "External Tools", vec!["external", "tool", "command"]),
                    searchable("tools.terminal", "Terminal", vec!["terminal", "shell", "bash", "powershell"]),
                    configurable("tools.database", "Database", vec![]),
                    configurable("tools.http.client", "HTTP Client", vec![]),
                    searchable("tools.diagrams", "Diagrams", vec!["diagram", "uml", "graph"]),
                    searchable("tools.web.browsers", "Web Browsers", vec!["browser", "chrome", "firefox"]),
                    configurable("tools.ssh.terminal", "SSH Terminal", vec![]),
                    searchable("tools.diff", "Diff", vec!["diff", "compare", "merge"]),
                    configurable("tools.tasks", "Tasks", vec![
                        searchable("tools.tasks.general", "General", vec!["task", "issue tracker", "jira"]),
                    ]),
                ],
            },
        ];

        Self {
            title: "Settings".into(),
            groups,
            editor_state: SettingsEditorState {
                current_configurable_id: None,
                modified_ids: vec![],
                error_ids: vec![],
                search_query: String::new(),
                search_results: vec![],
                breadcrumbs: vec![],
                can_navigate_back: false,
                can_navigate_forward: false,
            },
            dialog_width: 900,
            dialog_height: 700,
            splitter_ratio: 0.2,
            show_apply_button: false,
            show_reset_button: false,
            is_modified: false,
            has_errors: false,
        }
    }
}

#[tauri::command]
pub fn get_settings_descriptor(state: tauri::State<crate::AppState>) -> SettingsDescriptor {
    state.settings_manager.get_descriptor()
}

#[tauri::command]
pub fn settings_select_configurable(
    state: tauri::State<crate::AppState>,
    id: String,
) {
    state.settings_manager.select_configurable(id);
}

#[tauri::command]
pub fn settings_search(
    state: tauri::State<crate::AppState>,
    query: String,
) {
    state.settings_manager.search(query);
}

#[tauri::command]
pub fn settings_mark_modified(
    state: tauri::State<crate::AppState>,
    id: String,
    modified: bool,
) {
    state.settings_manager.mark_modified(id, modified);
}

#[tauri::command]
pub fn settings_apply(state: tauri::State<crate::AppState>) -> Result<(), String> {
    state.settings_manager.apply()
}

#[tauri::command]
pub fn settings_reset(state: tauri::State<crate::AppState>) {
    state.settings_manager.reset();
}
