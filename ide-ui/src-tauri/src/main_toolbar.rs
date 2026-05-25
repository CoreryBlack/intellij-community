/**
 * @see com.intellij.openapi.wm.impl.headertoolbar.MainToolbar
 * @see com.intellij.openapi.actionSystem.ActionToolbar
 * @see com.intellij.openapi.actionSystem.impl.ActionToolbarImpl
 * @see com.intellij.openapi.wm.impl.headertoolbar.HorizontalLayout
 *
 * Direct Rust port of MainToolbar.kt — the main toolbar layout
 * with LEFT/CENTER/RIGHT grouping and COMPRESSING_STRATEGY.
 *
 * Official structure (MainToolbar.kt):
 *   class MainToolbar : JPanel(HorizontalLayout(layoutGap = 10))
 *     LEFT:   MainMenuWithButton + main.toolbar.Project + VCSGroup
 *     CENTER: main.toolbar.Filename
 *     RIGHT:  NewUiRunWidget + SearchEverywhere + SettingsEntryPoint
 *
 *   CompressingLayoutStrategy.distributeSize() populates width
 *   based on available space.
 */

use crate::button_look::{self, ButtonLookKind, ButtonLookParams, ButtonState, Insets, Size};
use serde::{Deserialize, Serialize};

/// @see com.intellij.openapi.wm.impl.headertoolbar.CompressingLayoutStrategy
/// @see MainToolbar.kt lines 167-192
///
/// Port of CompressingLayoutStrategy.distributeSize().
/// Distributes available width among toolbars based on their preferred widths.
/// Each toolbar gets its preferred width if it fits, otherwise widths are
/// compressed proportionally to their minimum widths.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ToolbarWidthInfo {
    pub group_id: String,
    pub preferred_width: u32,
    pub minimum_width: u32,
    pub actual_width: u32,
}

/// @see CompressingLayoutStrategy.distributeSize(availableSize, toolbars)
///   Returns a map of component → Dimension with distributed widths.
pub fn distribute_toolbar_widths(
    total_available_width: u32,
    groups: &[ToolbarGroup],
    layout_gap: u32,
) -> Vec<ToolbarWidthInfo> {
    let num_groups = groups.len() as u32;
    let total_gap_width = if num_groups > 0 { (num_groups - 1) * layout_gap } else { 0 };

    if total_available_width <= total_gap_width || groups.is_empty() {
        return groups.iter().map(|g| ToolbarWidthInfo {
            group_id: g.id.clone(),
            preferred_width: 0,
            minimum_width: 0,
            actual_width: 0,
        }).collect();
    }

    let available = total_available_width - total_gap_width;

    let infos: Vec<(String, u32, u32)> = groups.iter().map(|g| {
        let pref: u32 = g.buttons.iter().map(|b| {
            let w = b.render_output.preferred_size.width;
            w + 2 // gap between buttons
        }).sum::<u32>().max(30);
        let min: u32 = g.buttons.iter().map(|b| {
            b.render_output.minimum_size.width + 2
        }).sum::<u32>().max(30);
        (g.id.clone(), pref, min)
    }).collect();

    let total_pref: u32 = infos.iter().map(|(_, p, _)| p).sum();
    let total_min: u32 = infos.iter().map(|(_, _, m)| m).sum();

    if total_pref <= available {
        // All fit at preferred size
        return infos.iter().map(|(id, pref, _)| ToolbarWidthInfo {
            group_id: id.clone(),
            preferred_width: *pref,
            minimum_width: 0,
            actual_width: *pref,
        }).collect();
    }

    if total_min >= available {
        // All compressed to minimum
        return infos.iter().map(|(id, _, min)| ToolbarWidthInfo {
            group_id: id.clone(),
            preferred_width: 0,
            minimum_width: *min,
            actual_width: *min,
        }).collect();
    }

    // Proportional compression
    let deficit = total_pref - available;
    let compressible = total_pref - total_min;
    let ratio = deficit as f64 / compressible as f64;

    infos.iter().map(|(id, pref, min)| {
        let compress_amount = ((*pref - *min) as f64 * ratio) as u32;
        let actual = pref.saturating_sub(compress_amount).max(*min);
        ToolbarWidthInfo {
            group_id: id.clone(),
            preferred_width: *pref,
            minimum_width: *min,
            actual_width: actual,
        }
    }).collect()
}

/* ──────────────────────────────────────────────
 * HeaderIconUpdater — port of MainToolbar.kt inner class
 * @see MainToolbar.kt lines 439-554 (MyActionToolbarImpl)
 *
 * Updates icon colors based on toolbar background brightness.
 * In New UI Islands mode, icons use dark header variant when
 * the toolbar background is light.
 * ────────────────────────────────────────────── */

/// @see isDarkHeader() in HeaderToolbarButtonLook.kt
/// Determines whether the toolbar background is dark enough
/// to use the light variant of icons.
pub fn is_dark_header(toolbar_theme: &str) -> bool {
    matches!(toolbar_theme, "dark" | "darcula")
}

/// @see HeaderToolbarButtonLook.scaleAndAdjustIcon()
/// The icon suffix selector: returns "dark" if the header background
/// is light (for contrast), empty string otherwise.
pub fn icon_theme_suffix(is_dark_header: bool) -> &'static str {
    if is_dark_header { "" } else { "_dark" }
}

/* ──────────────────────────────────────────────
 * ToolbarCustomization — port of CustomActionsSchema
 * @see MainToolbar.kt lines 218-254
 * @see CustomizationUtil.createToolbarCustomizationHandler()
 *
 * Supports toolbar customization via right-click context menu,
 * allowing users to add/remove/reorder toolbar actions.
 * ────────────────────────────────────────────── */

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ToolbarCustomization {
    /// @see schema.getCorrectedActionAsync(MAIN_TOOLBAR_ID)
    pub enabled: bool,
    /// IDs of actions the user has added to the toolbar
    pub added_action_ids: Vec<String>,
    /// IDs of actions the user has removed from the toolbar
    pub removed_action_ids: Vec<String>,
    /// Custom order of action IDs (empty = use default)
    pub custom_order: Vec<String>,
    /// Whether the toolbar shows text labels for buttons
    pub show_labels: bool,
}

impl Default for ToolbarCustomization {
    fn default() -> Self {
        Self {
            enabled: false,
            added_action_ids: vec![],
            removed_action_ids: vec![],
            custom_order: vec![],
            show_labels: false,
        }
    }
}

/* ──────────────────────────────────────────────
 * GroupPosition — port of HorizontalLayout.Group
 * @see HorizontalLayout.Group: LEFT, CENTER, RIGHT
 * ────────────────────────────────────────────── */

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub enum GroupPosition {
    Left,
    Center,
    Right,
}

/* ──────────────────────────────────────────────
 * ActionKind — port of action_type derived
 * from AnAction subclass identity.
 * ────────────────────────────────────────────── */

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub enum ActionKind {
    Button,
    Toggle,
    Dropdown,
    Separator,
    Widget,
}

/* ──────────────────────────────────────────────
 * ActionPresentation — port of Presentation class
 * @see com.intellij.openapi.actionSystem.Presentation
 * ────────────────────────────────────────────── */

/// Mirrors Presentation.java fields:
///   text, description, icon, disabledIcon, enabled, visible,
///   popupGroup (isPopupGroup), hoveredIcon, selected (isSelected)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ActionPresentation {
    pub id: String,
    pub text: String,
    pub description: Option<String>,
    pub icon: String,
    pub action_kind: ActionKind,
    pub shortcut: Option<String>,
    pub tooltip: Option<String>,
    pub enabled: bool,
    pub visible: bool,
    pub popup_group: bool,
    pub hide_dropdown_icon: bool,
    pub toggle_state: Option<bool>,
    pub badge: Option<String>,
}

/* ──────────────────────────────────────────────
 * ActionGroupPresentation — port of ActionGroup
 * @see com.intellij.openapi.actionSystem.ActionGroup
 * ────────────────────────────────────────────── */

/// Mirrors DefaultActionGroup / ActionGroup structure.
/// Groups contain children which may be other groups (submenus).
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ActionGroupPresentation {
    pub id: String,
    pub text: String,
    pub icon: String,
    pub children: Vec<ActionNode>,
}

/// A node in the action tree — either a leaf action or a group.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ActionNode {
    pub group: Option<ActionGroupPresentation>,
    pub action: Option<ActionPresentation>,
    pub separator: bool,
}

/* ──────────────────────────────────────────────
 * ToolbarButtonDesc — the complete description of
 * one button in the toolbar, combining:
 *   - Presentation (what)
 *   - ButtonLookParams (how to render)
 *   - ButtonState (current state)
 *   - computed ButtonRenderOutput (rendering coordinates)
 * ────────────────────────────────────────────── */

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ToolbarButtonDesc {
    pub presentation: ActionPresentation,
    pub look_params: button_look::ButtonLookParams,
    pub render_output: button_look::ButtonRenderOutput,
    pub state: ButtonState,
    pub focused: bool,
    pub current_width: u32,
    pub current_height: u32,
}

/* ──────────────────────────────────────────────
 * ToolbarGroup — port of GroupInfo from
 * MainToolbar.getMainToolbarGroups()
 * @see MainToolbar.kt lines 624-630
 * ────────────────────────────────────────────── */

/// @see MainToolbar.GroupInfo:
///   data class GroupInfo(
///     val id: String,
///     val actionGroup: ActionGroup,
///     val position: HorizontalLayout.Group
///   )
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ToolbarGroup {
    pub id: String,
    pub position: GroupPosition,
    pub buttons: Vec<ToolbarButtonDesc>,
}

/* ──────────────────────────────────────────────
 * ToolbarDescriptor — output of ToolbarManager
 * sent to frontend renderer.
 * ────────────────────────────────────────────── */

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ToolbarDescriptor {
    pub layout_gap: u32,
    pub groups: Vec<ToolbarGroup>,
    pub project: ProjectInfo,
    pub run_configurations: Vec<RunConfiguration>,
    pub active_run_config: Option<String>,
    pub run_widget_state: RunWidgetState,
    pub git: Option<GitState>,
    pub active_file_name: Option<String>,
    /// @see HeaderIconUpdater — "dark" or "light"
    pub theme: String,
    /// @see ToolbarCustomization
    pub customization: ToolbarCustomization,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProjectInfo {
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub icon: String,
    pub color: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RunConfiguration {
    pub id: String,
    pub name: String,
    pub type_name: String,
    pub icon: String,
    pub pinned: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum RunWidgetState {
    Idle,
    Running,
    Debugging,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GitState {
    pub branch: String,
    pub remote: String,
    pub clean: bool,
    pub ahead: u32,
    pub behind: u32,
    pub has_changes: bool,
}

/* ──────────────────────────────────────────────
 * ToolbarManager — port of MainToolbar class.
 * @see MainToolbar.kt
 *
 * init() flow:
 *   1. computeMainActionGroups() → 3x (ActionGroup, Group)
 *   2. For each group: createActionBar(group) → ActionToolbar
 *   3. Add widgets (MainMenuButton) + ActionToolbars to JPanel
 *   4. Register focus support, update actions
 * ────────────────────────────────────────────── */

use std::sync::Mutex;

pub struct ToolbarManager {
    descriptor: Mutex<ToolbarDescriptor>,
}

impl ToolbarManager {
    /// @see MainToolbar constructor
    /// layoutGap = JBUI.scale(10) → 10
    pub fn new() -> Self {
        Self {
            descriptor: Mutex::new(ToolbarDescriptor::default()),
        }
    }

    /// @see ToolbarManager.update_project()
    pub fn update_project(&self, name: String, path: String) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.project = ProjectInfo {
            name,
            path,
            description: None,
            icon: "project".into(),
            color: Some("#3871E1".into()),
        };
        self.rebuild_groups(&mut desc);
    }

    /// @see ToolbarManager.update_git()
    pub fn update_git(&self, git: GitState) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.git = Some(git);
        self.rebuild_groups(&mut desc);
    }

    /// @see ToolbarManager.update_run_configs()
    pub fn update_run_configs(&self, configs: Vec<RunConfiguration>, active: Option<String>) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.run_configurations = configs;
        desc.active_run_config = active;
        self.rebuild_groups(&mut desc);
    }

    /// @see ToolbarManager.update_active_file()
    pub fn update_active_file(&self, name: Option<String>) {
        let mut desc = self.descriptor.lock().unwrap();
        desc.active_file_name = name;
        self.rebuild_groups(&mut desc);
    }

    /// @see ToolbarManager.get_descriptor()
    pub fn get_descriptor(&self) -> ToolbarDescriptor {
        self.descriptor.lock().unwrap().clone()
    }

    /* ──────────────────────────────────────────
     * rebuild_groups — port of init() / computeMainActionGroups()
     * @see MainToolbar.kt init() block
     *   1. Get three GroupInfo objects
     *   2. For each: createActionBar(group)
     *   3. Add widgets (MainMenuWithButton)
     * ────────────────────────────────────────── */

    fn rebuild_groups(&self, desc: &mut ToolbarDescriptor) {
        let project_name = desc.project.name.clone();
        let git = desc.git.clone();
        let run_configs = desc.run_configurations.clone();
        let active_config = desc.active_run_config.clone();
        let active_file = desc.active_file_name.clone();

        /* ── MainToolbarButtonInsets ──
         * @see createActionBar(): toolbar.setActionButtonBorder(JBUI.Borders.empty(mainToolbarButtonInsets()))
         * mainToolbarButtonInsets() returns insets for the toolbar button border
         */
        let main_toolbar_icon_insets = Insets::new(4, 4, 4, 4);
        let burger_icon_insets = Insets::new(3, 4, 3, 4);

        /* ── Build LEFT group (MainToolbarLeft) ──
         * @see MainToolbar.getMainToolbarGroups():
         *   GroupInfo("MainToolbarLeft", ActionsTreeUtil.getMainToolbarLeft(), LEFT)
         * Contains: MainMenuButton, main.toolbar.Project, VCSGroup
         */
        let mut left_buttons = vec![];

        // MainMenuButton — @see MainMenuButton.createMenuButton()
        //   look = HeaderToolbarButtonLook(iconSize = burgerMenuButtonIconSize)
        //   minimumSize = experimentalToolbarMinimumButtonSize()
        left_buttons.push(create_toolbar_button(
            "MainMenuButton", "Main Menu", "hamburger",
            ActionKind::Button, false,
            "Main Menu", None, true, None,
            &burger_icon_insets, 20,
        ));

        // main.toolbar.Project — @see main.toolbar.Project action in plugin XML
        left_buttons.push(create_toolbar_button(
            "main.toolbar.Project", &project_name, "project",
            ActionKind::Dropdown, true,
            "Recent Projects", None, true, None,
            &main_toolbar_icon_insets, 18,
        ));

        // VCS group — @see MainToolbarVCSGroup in plugin XML
        if let Some(ref g) = git {
            left_buttons.push(create_toolbar_button(
                "main.toolbar.git.Branches", &g.branch, "git-branch",
                ActionKind::Dropdown, true,
                "Git Branches", None, true, None,
                &main_toolbar_icon_insets, 18,
            ));

            left_buttons.push(create_toolbar_button(
                "CheckinProject", "Commit", "commit",
                ActionKind::Button, false,
                "Commit (Ctrl+K)", Some("Ctrl+K"),
                true,
                if g.has_changes { Some("●".into()) } else { None },
                &main_toolbar_icon_insets, 18,
            ));

            left_buttons.push(create_toolbar_button(
                "Vcs.Push", "Push", "push",
                ActionKind::Button, false,
                "Push (Ctrl+Shift+K)", Some("Ctrl+Shift+K"),
                true,
                if g.ahead > 0 { Some(g.ahead.to_string()) } else { None },
                &main_toolbar_icon_insets, 18,
            ));
        }

        // Separator
        left_buttons.push(create_separator_button());

        /* ── Build CENTER group (MainToolbarCenter) ──
         * @see MainToolbar.getMainToolbarGroups():
         *   GroupInfo("MainToolbarCenter", ActionsTreeUtil.getMainToolbarCenter(), CENTER)
         * Contains: SearchEverywhere, main.toolbar.Filename
         */
        let mut center_buttons = vec![];

        center_buttons.push(create_toolbar_button(
            "SearchEverywhere", "Search", "search",
            ActionKind::Button, false,
            "Search Everywhere (Double Shift)", Some("Double Shift"),
            true, None,
            &main_toolbar_icon_insets, 18,
        ));

        if let Some(ref name) = active_file {
            center_buttons.push(create_toolbar_button(
                "main.toolbar.Filename", name, "file",
                ActionKind::Widget, false,
                None, None, true, None,
                &main_toolbar_icon_insets, 16,
            ));
        }

        /* ── Build RIGHT group (MainToolbarRight) ──
         * @see MainToolbar.getMainToolbarGroups():
         *   GroupInfo("MainToolbarRight", ActionsTreeUtil.getMainToolbarRight(), RIGHT)
         * Contains: NewUiRunWidget + Run/Debug + SearchEverywhere + SettingsEntryPoint
         *
         * @see NewUiRunWidget — uses RunWidgetButtonLook (arc=12, suppress_border=true)
         *   Run button: green icon color (icon-green-stroke)
         *   Debug button: muted icon color
         *   Running state: runningBackground (toolbar-run-bg)
         */
        let mut right_buttons = vec![];

        let active_name = active_config
            .as_ref()
            .and_then(|id| run_configs.iter().find(|c| &c.id == id).map(|c| c.name.clone()))
            .unwrap_or_else(|| "No configuration".into());

        // NewUiRunWidget — @see NewUiRunWidget.kt
        //   Uses RunWidgetButtonLook: arc=12, iconSize=20, suppress_border=true
        right_buttons.push(create_run_widget_button(
            "NewUiRunWidget", &active_name, "run",
            ActionKind::Dropdown, true,
            "Run Configuration", None, true, None,
        ));

        // Run button — @see NewUiRunWidget run button
        //   Uses RunWidgetButtonLook with green icon (icon-green-stroke)
        right_buttons.push(create_run_widget_button(
            "Run", "Run", "run",
            ActionKind::Button, false,
            "Run (Shift+F10)", Some("Shift+F10"),
            true, None,
        ));

        // Debug button — @see NewUiRunWidget debug button
        right_buttons.push(create_run_widget_button(
            "Debug", "Debug", "debug",
            ActionKind::Button, false,
            "Debug (Shift+F9)", Some("Shift+F9"),
            true, None,
        ));

        // Separator
        right_buttons.push(create_separator_button());

        right_buttons.push(create_toolbar_button(
            "SearchEverywhere.Right", "Search", "search",
            ActionKind::Button, false,
            "Search Everywhere (Double Shift)", Some("Double Shift"),
            true, None,
            &main_toolbar_icon_insets, 18,
        ));

        right_buttons.push(create_toolbar_button(
            "SettingsEntryPoint", "Settings", "settings",
            ActionKind::Button, false,
            "Settings (Ctrl+Alt+,)", Some("Ctrl+Alt+,"),
            true, None,
            &main_toolbar_icon_insets, 18,
        ));

        /* ── Assemble groups ──
         * @see MainToolbar.getMainToolbarGroups() → sequenceOf(...)
         */
        desc.groups = vec![
            ToolbarGroup {
                id: "MainToolbarLeft".into(),
                position: GroupPosition::Left,
                buttons: left_buttons,
            },
            ToolbarGroup {
                id: "MainToolbarCenter".into(),
                position: GroupPosition::Center,
                buttons: center_buttons,
            },
            ToolbarGroup {
                id: "MainToolbarRight".into(),
                position: GroupPosition::Right,
                buttons: right_buttons,
            },
        ];
    }
}

/* ──────────────────────────────────────────────
 * create_toolbar_button — port of:
 *   MainToolbar.createActionBar() +
 *   ActionButton constructor +
 *   HeaderToolbarButtonLook constructor
 * @see MainToolbar.kt lines 410-422
 * @see MainMenuButton.kt lines 313-330
 * @see ActionButton.java constructor
 * ────────────────────────────────────────────── */

/// Creates a toolbar button with HeaderToolbarButtonLook.
/// Mirrors createActionBar() + createMenuButton() flow.
fn create_toolbar_button(
    id: &str,
    label: &str,
    icon: &str,
    action_kind: ActionKind,
    popup_group: bool,
    tooltip: Option<&str>,
    shortcut: Option<&str>,
    enabled: bool,
    badge: Option<String>,
    icon_insets: &Insets,
    icon_size: u32,
) -> ToolbarButtonDesc {
    let look_params = button_look::header_toolbar_button_look(Some(icon_size));
    let mut adjusted_look = look_params.clone();
    adjusted_look.icon_insets = icon_insets.clone();

    let presentation = ActionPresentation {
        id: id.into(),
        text: label.into(),
        description: tooltip.map(|s| s.into()),
        icon: icon.into(),
        action_kind: action_kind.clone(),
        shortcut: shortcut.map(|s| s.into()),
        tooltip: tooltip.map(|s| s.into()),
        enabled,
        visible: true,
        popup_group,
        hide_dropdown_icon: false,
        toggle_state: None,
        badge,
    };

    let state = ButtonState::Normal;
    let focused = false;
    let is_action_group = popup_group;
    let render_output = button_look::compute_button_render(
        &adjusted_look,
        state,
        enabled,
        focused,
        is_action_group,
        popup_group,
        false,
        adjusted_look.minimum_button_size.width,
        adjusted_look.minimum_button_size.height,
    );

    ToolbarButtonDesc {
        presentation,
        look_params: adjusted_look,
        render_output,
        state,
        focused,
        current_width: 30,
        current_height: 30,
    }
}

/// Creates a RunWidget button with RunWidgetButtonLook.
/// @see NewUiRunWidget.kt — uses RunWidgetButtonLook (arc=12, suppress_border=true)
/// @see RunWidget.theme.json — runIconColor=icon-green-stroke, runningBackground=toolbar-run-bg
fn create_run_widget_button(
    id: &str,
    label: &str,
    icon: &str,
    action_kind: ActionKind,
    popup_group: bool,
    tooltip: Option<&str>,
    shortcut: Option<&str>,
    enabled: bool,
    badge: Option<String>,
) -> ToolbarButtonDesc {
    let look_params = button_look::run_widget_button_look();

    let presentation = ActionPresentation {
        id: id.into(),
        text: label.into(),
        description: tooltip.map(|s| s.into()),
        icon: icon.into(),
        action_kind: action_kind.clone(),
        shortcut: shortcut.map(|s| s.into()),
        tooltip: tooltip.map(|s| s.into()),
        enabled,
        visible: true,
        popup_group,
        hide_dropdown_icon: false,
        toggle_state: None,
        badge,
    };

    let state = ButtonState::Normal;
    let focused = false;
    let is_action_group = popup_group;
    let render_output = button_look::compute_button_render(
        &look_params,
        state,
        enabled,
        focused,
        is_action_group,
        popup_group,
        false,
        look_params.minimum_button_size.width,
        look_params.minimum_button_size.height,
    );

    ToolbarButtonDesc {
        presentation,
        look_params,
        render_output,
        state,
        focused,
        current_width: 30,
        current_height: 30,
    }
}

/// Creates a separator button (@see ActionKind::Separator)
fn create_separator_button() -> ToolbarButtonDesc {
    let look_params = button_look::header_toolbar_button_look(None);
    let render_output = button_look::compute_button_render(
        &look_params,
        ButtonState::Normal,
        false, false, false, false, false,
        1, 18,
    );

    ToolbarButtonDesc {
        presentation: ActionPresentation {
            id: "Separator".into(),
            text: String::new(),
            description: None,
            icon: String::new(),
            action_kind: ActionKind::Separator,
            shortcut: None,
            tooltip: None,
            enabled: false,
            visible: true,
            popup_group: false,
            hide_dropdown_icon: false,
            toggle_state: None,
            badge: None,
        },
        look_params,
        render_output,
        state: ButtonState::Normal,
        focused: false,
        current_width: 1,
        current_height: 18,
    }
}

/* ──────────────────────────────────────────────
 * Default implementations
 * ────────────────────────────────────────────── */

impl Default for ToolbarDescriptor {
    fn default() -> Self {
        let mgr = ToolbarManager::new();
        let mut desc = ToolbarDescriptor {
            layout_gap: 10,
            groups: vec![],
            project: ProjectInfo {
                name: "Project".into(),
                path: String::new(),
                description: None,
                icon: "project".into(),
                color: Some("#3871E1".into()),
            },
            run_configurations: vec![
                RunConfiguration {
                    id: "spring-boot".into(),
                    name: "AstralMonitorApplication".into(),
                    type_name: "Spring Boot".into(),
                    icon: "spring".into(),
                    pinned: true,
                },
            ],
            active_run_config: Some("spring-boot".into()),
            run_widget_state: RunWidgetState::Idle,
            git: Some(GitState {
                branch: "main".into(),
                remote: "origin".into(),
                clean: true,
                ahead: 0,
                behind: 0,
                has_changes: false,
            }),
            active_file_name: Some("AstralMonitorApplication.java".into()),
            theme: "dark".into(),
            customization: ToolbarCustomization::default(),
        };
        mgr.rebuild_groups(&mut desc);
        desc
    }
}

/* ──────────────────────────────────────────────
 * Tauri commands
 * ────────────────────────────────────────────── */

#[tauri::command]
pub fn get_toolbar_descriptor(state: tauri::State<crate::AppState>) -> ToolbarDescriptor {
    state.main_toolbar_manager.get_descriptor()
}

#[tauri::command]
pub fn update_project_info(
    state: tauri::State<crate::AppState>,
    name: String,
    path: String,
) {
    state.main_toolbar_manager.update_project(name, path);
}

#[tauri::command]
pub fn update_git_state(
    state: tauri::State<crate::AppState>,
    git: GitState,
) {
    state.main_toolbar_manager.update_git(git);
}

#[tauri::command]
pub fn update_active_file(
    state: tauri::State<crate::AppState>,
    name: Option<String>,
) {
    state.main_toolbar_manager.update_active_file(name);
}
