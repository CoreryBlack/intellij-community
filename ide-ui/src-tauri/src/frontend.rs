/**
 * @see com.intellij.openapi.actionSystem.impl.ActionButton
 * @see com.intellij.openapi.wm.impl.customFrameDecorations.header.toolbar.MainMenuButton
 *
 * Direct Rust port of ActionButton's frontend event handling.
 *
 * Official pipeline (ActionButton.java):
 *   ActionButton extends JComponent
 *     processMouseEvent(e) { MOUSE_PRESSED/MOUSE_RELEASED/MOUSE_ENTERED/MOUSE_EXITED }
 *     getPopState() → NORMAL/POPPED/PUSHED/SELECTED
 *     paintButtonLook(g) → paintBackground + paintIcon + paintBorder + paintDownArrow
 *     performAction(e) → execute the action
 *
 * This module is the AUTHORITATIVE source of all button state.
 * The TypeScript frontend is a PURE DISPLAY LAYER that:
 *   1. Receives initial button descriptions from Rust
 *   2. Forwards user interactions to Rust via Tauri commands
 *   3. Applies the Rust-computed render output mechanically
 */

use std::collections::HashMap;
use std::sync::Mutex;

use crate::button_look;
use crate::main_toolbar;

/* ──────────────────────────────────────────────
 * ButtonClientState — port of ActionButton fields
 * @see ActionButton.java lines 110-111:
 *   private boolean myMouseDown;
 *   protected boolean myRollover;
 * Also tracks focus state (from FocusListener).
 * ────────────────────────────────────────────── */

/// Mirrors the transient mouse/focus state of an ActionButton.
/// @see ActionButton:
///   myRollover  — set in MOUSE_ENTERED/MOUSE_EXITED
///   myMouseDown — set in MOUSE_PRESSED, cleared in processMouseRelease
///   focusOwner  — tracked via FocusListener
#[derive(Clone, Debug)]
pub struct ButtonClientState {
    pub rollover: bool,
    pub mouse_down: bool,
    pub focused: bool,
}

impl ButtonClientState {
    pub fn new() -> Self {
        Self { rollover: false, mouse_down: false, focused: false }
    }

    /// @see ActionButton.processMouseEvent() MOUSE_ENTERED:
    ///   if (!myMouseDown && ourGlobalMouseDown) break;
    ///   myRollover = true;
    pub fn handle_mouse_enter(&mut self) {
        self.rollover = true;
    }

    /// @see ActionButton.processMouseEvent() MOUSE_EXITED:
    ///   myRollover = false;
    ///   if (!myMouseDown && ourGlobalMouseDown) break;
    pub fn handle_mouse_leave(&mut self) {
        self.rollover = false;
        self.mouse_down = false;
    }

    /// @see ActionButton.processMouseEvent() MOUSE_PRESSED:
    ///   myMouseDown = true;
    ///   myRollover = true;
    pub fn handle_mouse_down(&mut self) {
        self.mouse_down = true;
        self.rollover = true;
    }

    /// @see ActionButton.processMouseEvent() MOUSE_RELEASED:
    ///   onMouseReleased(e) { resetMouseState() }
    /// @see ActionButton.resetMouseState():
    ///   myMouseDown = false;
    ///   ourGlobalMouseDown = false;
    pub fn handle_mouse_up(&mut self) {
        let was_rollover = self.rollover;
        self.mouse_down = false;
        was_rollover // return whether we should perform action
    }

    /// @see ActionButton.addFocusListener:
    ///   focusGained → repaint()
    pub fn handle_focus(&mut self) {
        self.focused = true;
    }

    /// @see ActionButton.addFocusListener:
    ///   focusLost → repaint()
    pub fn handle_blur(&mut self) {
        self.focused = false;
    }
}

/* ──────────────────────────────────────────────
 * ToolbarEventResult — what Rust returns after
 * processing a frontend event.
 * ────────────────────────────────────────────── */

/// The result of processing a toolbar button event.
/// Contains the updated button description for rendering,
/// and optionally an action string to execute (e.g. "show_menu").
#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
pub struct ToolbarEventResult {
    pub button: main_toolbar::ToolbarButtonDesc,
    pub action: Option<String>,
}

/* ──────────────────────────────────────────────
 * ToolbarFrontend — manages all button client states
 * and processes user interactions.
 * Mirrors the frontend behavior of ActionButton.
 * ────────────────────────────────────────────── */

pub struct ToolbarFrontend {
    pub button_states: Mutex<HashMap<String, ButtonClientState>>,
}

impl ToolbarFrontend {
    pub fn new() -> Self {
        Self {
            button_states: Mutex::new(HashMap::new()),
        }
    }

    /// Process a mouse/focus event and return the updated button description.
    ///
    /// @see ActionButton.processMouseEvent() — the equivalent logic:
    ///   if MOUSE_PRESSED → myMouseDown=true, myRollover=true, repaint()
    ///   if MOUSE_RELEASED → resetMouseState(), if myRollover→performAction(), repaint()
    ///   if MOUSE_ENTERED → myRollover=true, repaint()
    ///   if MOUSE_EXITED → myRollover=false, repaint()
    ///
    /// @see ActionButton.paintButtonLook() — computes the render output:
    ///   look.paintBackground(g, this)
    ///   look.paintIcon(g, this, getIcon())
    ///   look.paintBorder(g, this)
    ///   shallPaintDownArrow() → paintDownArrow()
    pub fn handle_event(
        &self,
        id: &str,
        event_type: &str,
        descriptor: &main_toolbar::ToolbarDescriptor,
    ) -> Option<ToolbarEventResult> {
        let mut states = self.button_states.lock().unwrap();
        let client = states.entry(id.to_string()).or_insert_with(ButtonClientState::new);

        let mut should_perform_action = false;

        match event_type {
            "mouse_enter" => client.handle_mouse_enter(),
            "mouse_leave" => client.handle_mouse_leave(),
            "mouse_down" => client.handle_mouse_down(),
            "mouse_up" => {
                should_perform_action = client.handle_mouse_up();
            }
            "focus" => client.handle_focus(),
            "blur" => client.handle_blur(),
            _ => return None,
        }

        // Find the button in the descriptor and compute updated render
        let result = self.compute_updated_button(id, client, descriptor)?;

        // Determine action to execute
        let action = if should_perform_action {
            self.determine_action(id, descriptor)
        } else {
            None
        };

        Some(ToolbarEventResult {
            button: result,
            action,
        })
    }

    /// Compute the full updated button description using the current client state.
    ///
    /// This is the Rust equivalent of ActionButton.paintButtonLook(g):
    ///   popState = getPopState(isSelected) → compute_pop_state
    ///   paintBackground → compute_button_render
    ///   paintIcon → computed in render_output.icon_x/icon_y
    ///   paintBorder → computed in render_output.paint_border
    ///   paintDownArrow → computed in render_output.show_down_arrow/arrow_x/arrow_y
    fn compute_updated_button(
        &self,
        id: &str,
        client: &ButtonClientState,
        descriptor: &main_toolbar::ToolbarDescriptor,
    ) -> Option<main_toolbar::ToolbarButtonDesc> {
        for group in &descriptor.groups {
            for btn in &group.buttons {
                if btn.presentation.id == id {
                    let enabled = btn.presentation.enabled;
                    let is_pushed = btn.presentation.toggle_state.unwrap_or(false);

                    // @see ActionButton.getPopState() lines 618-631
                    let pop_state = button_look::compute_pop_state(
                        client.rollover,
                        client.mouse_down,
                        is_pushed,
                        client.focused,
                        enabled,
                    );

                    let is_action_group = btn.presentation.popup_group;

                    // @see ActionButtonLook.paintIcon() — icon position
                    // @see ActionButtonLook.paintDownArrow() — arrow position
                    // @see ActionButtonLook.paintBackground() — background color
                    // @see HeaderToolbarButtonLook.paintBorder() — focus ring
                    let render = button_look::compute_button_render(
                        &btn.look_params,
                        pop_state,
                        enabled,
                        client.focused,
                        is_action_group,
                        is_action_group,
                        btn.presentation.hide_dropdown_icon,
                        btn.current_width,
                        btn.current_height,
                    );

                    return Some(main_toolbar::ToolbarButtonDesc {
                        presentation: btn.presentation.clone(),
                        look_params: btn.look_params.clone(),
                        render_output: render,
                        state: pop_state,
                        focused: client.focused,
                        current_width: btn.current_width,
                        current_height: btn.current_height,
                    });
                }
            }
        }

        // Button not found — check if it's a new button being added dynamically
        // and create a fresh state for it
        None
    }

    /// Determine what action to execute for a click.
    /// @see ActionButton.actionPerformed():
    ///   if isPopupMenuAction → showActionGroupPopup()
    ///   else → myAction.actionPerformed(e)
    fn determine_action(
        &self,
        id: &str,
        descriptor: &main_toolbar::ToolbarDescriptor,
    ) -> Option<String> {
        for group in &descriptor.groups {
            for btn in &group.buttons {
                if btn.presentation.id == id {
                    // @see ActionButton.isPopupMenuAction():
                    //   if (!(myAction instanceof ActionGroup)) return false;
                    //   if (!myPresentation.isPopupGroup()) return false;
                    if btn.presentation.popup_group {
                        return Some("show_menu".into());
                    }
                    return Some("click".into());
                }
            }
        }
        None
    }

    /// Get the current state of all buttons (for initial load / reset).
    pub fn get_all_initial_states(&self, descriptor: &main_toolbar::ToolbarDescriptor) -> Vec<main_toolbar::ToolbarButtonDesc> {
        let mut result = Vec::new();
        for group in &descriptor.groups {
            for btn in &group.buttons {
                result.push(btn.clone());
            }
        }
        result
    }
}

/* ──────────────────────────────────────────────
 * Tauri commands
 * ────────────────────────────────────────────── */

/// Process a toolbar button event from the frontend.
/// The frontend calls this on every user interaction (mouse enter/leave/down/up/focus/blur).
///
/// Returns the updated button description with the Rust-computed render output,
/// and optionally an action string for the frontend to execute.
#[tauri::command]
pub fn toolbar_event(
    state: tauri::State<crate::AppState>,
    id: String,
    event_type: String,
) -> Option<ToolbarEventResult> {
    let descriptor = state.main_toolbar_manager.get_descriptor();
    state.toolbar_frontend.handle_event(&id, &event_type, &descriptor)
}

/// Get the full initial toolbar state (all button descriptions with computed render output).
/// Called by the frontend on mount.
#[tauri::command]
pub fn get_frontend_toolbar(state: tauri::State<crate::AppState>) -> main_toolbar::ToolbarDescriptor {
    state.main_toolbar_manager.get_descriptor()
}

/// Execute a toolbar action (called when user clicks a non-dropdown button).
/// @see ActionButton.actionPerformed()
#[tauri::command]
pub fn toolbar_click(
    state: tauri::State<crate::AppState>,
    id: String,
) -> String {
    match id.as_str() {
        "MainMenuButton" => "show_main_menu".into(),
        "SearchEverywhere" | "SearchEverywhere.Right" => "search_everywhere".into(),
        "SettingsEntryPoint" => "toggle_theme".into(),
        "main.toolbar.Project" => "show_project_menu".into(),
        "main.toolbar.git.Branches" => "show_git_menu".into(),
        "NewUiRunWidget" => "show_run_menu".into(),
        _ => id,
    }
}
