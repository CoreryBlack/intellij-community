/**
 * @see com.intellij.openapi.actionSystem.ActionButtonComponent
 * @see com.intellij.openapi.actionSystem.ex.ActionButtonLook
 * @see com.intellij.openapi.actionSystem.impl.IdeaActionButtonLook
 * @see com.intellij.openapi.wm.impl.customFrameDecorations.header.toolbar.HeaderToolbarButtonLook
 *
 * Direct Rust port of IntelliJ's ActionButtonLook hierarchy.
 * No creative adaptation — follows the exact same logic and structure
 * as the official Kotlin/Java source.
 *
 * Class hierarchy (mirroring official):
 *   ActionButtonLook (abstract)
 *   ├── IdeaActionButtonLook (default round-rect rendering)
 *   │   ├── HeaderToolbarButtonLook (main toolbar: arc=8, focus-only border, compact)
 *   │   ├── SquareStripeButtonLook (tool window stripe buttons)
 *   │   └── RunWidgetButtonLook (run/stop state backgrounds)
 *   ├── EditorToolbarButtonLook (editor toolbar, uses editor color scheme)
 *   └── Win10ActionButtonLook (Win10 style, square fill/border)
 */

use serde::{Deserialize, Serialize};

/* ──────────────────────────────────────────────
 * ActionButtonComponent.ButtonState constants
 * @see com.intellij.openapi.actionSystem.ActionButtonComponent
 * ────────────────────────────────────────────── */

/// NORMAL = 0: default resting state
/// POPPED  = 1: mouse hovered (myRollover && !myMouseDown)
/// PUSHED  = 2: mouse pressed (myRollover && myMouseDown) or isSelected()
/// SELECTED= 3: isFocusOwner()
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum ButtonState {
    Normal  = 0,
    Popped  = 1,
    Pushed  = 2,
    Selected = 3,
}

impl ButtonState {
    /// @see ActionButtonComponent.NORMAL = 0
    pub const NORMAL: i32 = 0;
    /// @see ActionButtonComponent.POPPED = 1
    pub const POPPED: i32 = 1;
    /// @see ActionButtonComponent.PUSHED = 2
    pub const PUSHED: i32 = 2;
    /// @see ActionButtonComponent.SELECTED = 3
    pub const SELECTED: i32 = 3;

    pub fn from_int(v: i32) -> Self {
        match v {
            0 => Self::Normal,
            1 => Self::Popped,
            2 => Self::Pushed,
            3 => Self::Selected,
            _ => Self::Normal,
        }
    }

    pub fn to_int(self) -> i32 {
        self as i32
    }
}

/* ──────────────────────────────────────────────
 * ThemeColor — port of UIManager.getColor() / JBColor.namedColor()
 * for compile-time theme value resolution.
 * ────────────────────────────────────────────── */

/// Mirrors JBColor.namedColor(key, fallback) — a named color from the theme.
/// Frontend resolves "var(--css-var)" at render time.
pub type ThemeColor = String;

/* ──────────────────────────────────────────────
 * ButtonInsets — port of java.awt.Insets / JBInsets
 * ────────────────────────────────────────────── */

/// @see java.awt.Insets
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Insets {
    pub top: u32,
    pub left: u32,
    pub bottom: u32,
    pub right: u32,
}

impl Insets {
    pub fn new(top: u32, left: u32, bottom: u32, right: u32) -> Self {
        Self { top, left, bottom, right }
    }
}

/* ──────────────────────────────────────────────
 * Size — port of java.awt.Dimension
 * ────────────────────────────────────────────── */

/// @see java.awt.Dimension
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Size {
    pub width: u32,
    pub height: u32,
}

impl Size {
    pub fn new(width: u32, height: u32) -> Self {
        Self { width, height }
    }
}

/* ──────────────────────────────────────────────
 * Point — port of java.awt.Point
 * ────────────────────────────────────────────── */

/// @see java.awt.Point
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

/* ──────────────────────────────────────────────
 * ButtonRenderOutput — the complete rendering output
 * that the frontend renderer consumes mechanically.
 * This is what "paintXXX(g, component)" produces.
 * ────────────────────────────────────────────── */

/// The complete rendering specification for a single button.
/// Mirrors what `ActionButtonLook.paintBackground()` + `paintIcon()` +
/// `paintBorder()` + `paintDownArrow()` collectively produce.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ButtonRenderOutput {
    /// Which look class produced this output
    pub look_kind: ButtonLookKind,

    /* ── From paintBackground() ── */
    /// Whether to paint the background at all
    /// @see ActionButtonLook.paintBackground(): "if (state == NORMAL && !component.isBackgroundSet()) return;"
    pub paint_background: bool,
    /// Background fill color (null = transparent)
    pub background_color: Option<ThemeColor>,
    /// Background fill arc
    /// @see IdeaActionButtonLook.paintLookBackground(): RoundRectangle2D arc
    pub background_arc: f64,

    /* ── From paintBorder() ── */
    /// Whether to paint the border
    /// @see HeaderToolbarButtonLook.paintBorder(): only when isFocusOwner
    pub paint_border: bool,
    /// Border color
    pub border_color: Option<ThemeColor>,
    /// Border line width
    /// @see DarculaUIUtil.BW = Component.focusWidth = 2
    pub border_width: f64,
    /// Border arc
    pub border_arc: f64,

    /* ── From getIconPosition() + paintIcon() ── */
    /// Icon rendering: size
    pub icon_size: u32,
    /// Icon rendering: x offset (pixels from left edge, after insets)
    pub icon_x: i32,
    /// Icon rendering: y offset (pixels from top edge, after insets)
    pub icon_y: i32,

    /* ── From shallPaintDownArrow() + paintDownArrow() ── */
    /// Whether to paint the dropdown arrow
    /// @see ActionButton.shallPaintDownArrow()
    pub show_down_arrow: bool,
    /// Arrow icon x offset
    pub arrow_x: i32,
    /// Arrow icon y offset
    pub arrow_y: i32,

    /* ── Component-level ── */
    /// Preferred size (from getPreferredSize)
    pub preferred_size: Size,
    /// Minimum size (from getMinimumSize = getPreferredSize)
    pub minimum_size: Size,
    /// Insets (from getInsets, applied by parent layout)
    pub insets: Option<Insets>,
    /// Icon insets (from getIconInsets)
    pub icon_insets: Option<Insets>,
}

/* ──────────────────────────────────────────────
 * ButtonLookDesc — the look description that
 * the manager computes per button.
 * ────────────────────────────────────────────── */

/// Describes a button's visual look, mirroring the
/// ActionButtonLook class hierarchy.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ButtonLookDesc {
    pub params: ButtonLookParams,
    pub state: ButtonRenderState,
}

/// Look type discriminator — mirrors ActionButtonLook subclass identity
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub enum ButtonLookKind {
    /// @see IdeaActionButtonLook: default round-rect (DarculaUIUtil.BUTTON_ARC=6)
    IdeaActionButton,
    /// @see HeaderToolbarButtonLook: main toolbar (arc=8, focus-only border, compact)
    HeaderToolbar,
    /// @see SquareStripeButtonLook: tool window stripe (arc=8/12)
    SquareStripe,
    /// @see RunWidgetButtonLook: run/debug (run=green bg, stop=red bg)
    RunWidget,
    /// @see EditorToolbarButtonLook: editor inline toolbar
    EditorToolbar,
    /// @see Win10ActionButtonLook: Win10 square fill
    Win10,
}

/// Static rendering parameters — mirrors the fixed parameters of each Look class.
/// @see HeaderToolbarButtonLook(iconSize)
/// @see JBUI.CurrentTheme.MainToolbar.Button.*
/// @see JBUI.CurrentTheme.ActionButton.*
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ButtonLookParams {
    /// Which look class (for theme overrides)
    pub kind: ButtonLookKind,

    /* ── From getButtonArc() ── */
    /// Button arc in pixels (unscaled)
    /// @see IdeaActionButtonLook: DarculaUIUtil.BUTTON_ARC = 6
    /// @see HeaderToolbarButtonLook: MainToolbar.Button.hoverArc = 12
    /// @see SquareStripeButtonLook: stripeButtonArc = 8
    pub button_arc: u32,

    /* ── From iconSize constructor param ── */
    /// Icon size in pixels
    /// @see HeaderToolbarButtonLook(iconSize): default = experimentalToolbarButtonIconSize()
    /// @see MainMenuButton: burgerMenuButtonIconSize() = 20
    pub icon_size: u32,

    /* ── Size ── */
    /// Minimum button size
    /// @see ActionToolbar.experimentalToolbarMinimumButtonSize() = 30x30
    pub minimum_button_size: Size,
    /// Preferred button size (same as minimum for header toolbar, larger for labeled)
    pub preferred_button_size: Size,

    /* ── From paintLookBorder() override ── */
    /// If true: paintBorder() is a no-op (HeaderToolbarButtonLook)
    /// @see HeaderToolbarButtonLook.paintLookBorder() = {} (empty body)
    pub suppress_border: bool,
    /// If true: paintBorder() only when isFocusOwner
    /// @see HeaderToolbarButtonLook.paintBorder()
    pub focus_only_border: bool,
    /// Focus border line width
    /// @see DarculaUIUtil.BW = Component.focusWidth = 2
    pub focus_border_width: u32,
    /// Focus border color theme key
    /// @see JBUI.CurrentTheme.Focus.focusColor()
    pub focus_border_color: ThemeColor,

    /* ── From paintLookBackground() ── */
    /// Background arc (can differ from button_arc in some looks)
    /// @see SquareStripeButtonLook: uses getButtonArc()
    pub background_arc: u32,

    /* ── From getDisabledIcon() ── */
    /// Disable filter name
    /// @see HeaderToolbarButtonLook: lightThemeDarkHeaderDisableFilter = GrayFilter(0,0,30)
    pub disable_filter: String,

    /* ── Insets ── */
    /// Icon insets (extra padding around icon inside the button)
    /// @see ActionButton.setIconInsets()
    pub icon_insets: Insets,
    /// Component insets (outer padding)
    /// @see ActionButton.getInsets()
    pub component_insets: Insets,
}

/// Dynamic rendering state — computed per paint cycle.
/// Mirrors the state-dependent branch logic in ActionButtonLook.paintBackground()
/// and ActionButtonLook.paintBorder().
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ButtonRenderState {
    /// The state this rendering is for
    pub state: ButtonState,

    /// Background color for current state
    /// @see ActionButtonLook.paintBackground() → getStateBackground()
    /// @see HeaderToolbarButtonLook.getStateBackground() = getHeaderBackgroundColor()
    pub bg_color: Option<ThemeColor>,

    /// Border color for current state
    /// @see ActionButtonLook.paintBorder(): PUSHED → pressedBorder, else → hoverBorder
    pub border_color: Option<ThemeColor>,

    /// Whether button is enabled
    pub enabled: bool,

    /// Whether button has focus
    pub focused: bool,
}

/* ──────────────────────────────────────────────
 * Factory functions — port of each Look class's
 * constructor and overrides.
 * ────────────────────────────────────────────── */

/// @see IdeaActionButtonLook — the base look.
/// Uses DarculaUIUtil.BUTTON_ARC = 6, standard hover/pressed colors.
pub fn idea_action_button_look() -> ButtonLookParams {
    ButtonLookParams {
        kind: ButtonLookKind::IdeaActionButton,
        button_arc: 6,
        icon_size: 16,
        minimum_button_size: Size::new(24, 24),
        preferred_button_size: Size::new(24, 24),
        suppress_border: false,
        focus_only_border: false,
        focus_border_width: 2,
        focus_border_color: "var(--ide-focus-color)".into(),
        background_arc: 6,
        disable_filter: "default".into(),
        icon_insets: Insets::new(0, 0, 0, 0),
        component_insets: Insets::new(0, 0, 0, 0),
    }
}

/// @see HeaderToolbarButtonLook — main toolbar buttons.
///   getButtonArc() returns MainToolbar.Button.hoverArc = 12
///   paintLookBorder() = {} (suppress border)
///   paintBorder() only when isFocusOwner, draws focus ring with DarculaNewUIUtil.drawRoundedRectangle
///   getStateBackground() = getHeaderBackgroundColor()
pub fn header_toolbar_button_look(icon_size_override: Option<u32>) -> ButtonLookParams {
    ButtonLookParams {
        kind: ButtonLookKind::HeaderToolbar,
        button_arc: 8,
        icon_size: icon_size_override.unwrap_or(18),
        minimum_button_size: Size::new(26, 26),
        preferred_button_size: Size::new(26, 26),
        suppress_border: true,
        focus_only_border: true,
        focus_border_width: 2,
        focus_border_color: "var(--ide-focus-color)".into(),
        background_arc: 8,
        disable_filter: "lightThemeDarkHeader".into(),
        icon_insets: Insets::new(4, 4, 4, 4),
        component_insets: Insets::new(0, 0, 0, 0),
    }
}

/// @see SquareStripeButtonLook — tool window stripe buttons.
/// Uses stripeButtonArc, custom selected state handling.
pub fn square_stripe_button_look() -> ButtonLookParams {
    ButtonLookParams {
        kind: ButtonLookKind::SquareStripe,
        button_arc: 6,
        icon_size: 18,
        minimum_button_size: Size::new(33, 34),
        preferred_button_size: Size::new(33, 34),
        suppress_border: false,
        focus_only_border: false,
        focus_border_width: 2,
        focus_border_color: "var(--ide-focus-color)".into(),
        background_arc: 6,
        disable_filter: "default".into(),
        icon_insets: Insets::new(0, 0, 0, 0),
        component_insets: Insets::new(0, 0, 0, 0),
    }
}

/// @see RunWidgetButtonLook — run/debug widget buttons.
/// Extends HeaderToolbarButtonLook with run/stop state backgrounds:
///   RUNNING → green background (accent-success-bg)
///   STOPPED → red background (accent-error-bg)
pub fn run_widget_button_look() -> ButtonLookParams {
    ButtonLookParams {
        kind: ButtonLookKind::RunWidget,
        button_arc: 8,
        icon_size: 18,
        minimum_button_size: Size::new(26, 26),
        preferred_button_size: Size::new(26, 26),
        suppress_border: true,
        focus_only_border: true,
        focus_border_width: 2,
        focus_border_color: "var(--ide-focus-color)".into(),
        background_arc: 8,
        disable_filter: "lightThemeDarkHeader".into(),
        icon_insets: Insets::new(4, 4, 4, 4),
        component_insets: Insets::new(0, 0, 0, 0),
    }
}

/// @see EditorToolbarButtonLook — editor inline toolbar buttons.
/// Uses editor color scheme for backgrounds.
pub fn editor_toolbar_button_look() -> ButtonLookParams {
    ButtonLookParams {
        kind: ButtonLookKind::EditorToolbar,
        button_arc: 6,
        icon_size: 16,
        minimum_button_size: Size::new(24, 24),
        preferred_button_size: Size::new(24, 24),
        suppress_border: false,
        focus_only_border: false,
        focus_border_width: 2,
        focus_border_color: "var(--ide-focus-color)".into(),
        background_arc: 6,
        disable_filter: "default".into(),
        icon_insets: Insets::new(0, 0, 0, 0),
        component_insets: Insets::new(0, 0, 0, 0),
    }
}

/* ──────────────────────────────────────────────
 * State-dependent color resolution.
 * Mirrors:
 *   HeaderToolbarButtonLook.getStateBackground()
 *   ActionButtonLook.paintBorder() color selection
 *   getHeaderBackgroundColor() top-level function
 * ────────────────────────────────────────────── */

/// @see getHeaderBackgroundColor(component, state) in HeaderToolbarButtonLook.kt
/// Non-ProjectWindowCustomizerService path (the default):
///   NORMAL / SELECTED → component.background (if set) else null
///   PUSHED → UIManager.getColor("MainToolbar.Icon.pressedBackground")
///            ?: UIManager.getColor("ActionButton.pressedBackground")
///   else (POPPED) → UIManager.getColor("MainToolbar.Icon.hoverBackground")
///                   ?: UIManager.getColor("ActionButton.hoverBackground")
pub fn get_header_background_color(enabled: bool, state: ButtonState) -> Option<ThemeColor> {
    match state {
        ButtonState::Normal | ButtonState::Selected => None,
        ButtonState::Pushed => {
            if !enabled { return None; }
            Some("var(--toolbar-bg-pressed)".into())
        }
        ButtonState::Popped => {
            if !enabled { return None; }
            Some("var(--toolbar-bg-hovered)".into())
        }
    }
}

/// @see ActionButtonLook.paintBorder() color selection:
///   PUSHED → JBUI.CurrentTheme.ActionButton.pressedBorder()
///   else   → JBUI.CurrentTheme.ActionButton.hoverBorder()
pub fn get_border_color(state: ButtonState) -> Option<ThemeColor> {
    match state {
        ButtonState::Pushed => Some("var(--toolbar-bg-pressed)".into()),
        _ => Some("var(--toolbar-bg-hovered)".into()),
    }
}

/* ──────────────────────────────────────────────
 * State machine — port of ActionButton.getPopState()
 * @see ActionButton.java lines 618-631
 * ────────────────────────────────────────────── */

/// @see ActionButton.getPopState(isPushed):
///   if (isPushed || myRollover && myMouseDown && isEnabled()) return PUSHED;
///   else if (myRollover && isEnabled()) return POPPED;
///   else if (isFocusOwner()) return SELECTED;
///   else return NORMAL;
pub fn compute_pop_state(
    my_rollover: bool,
    my_mouse_down: bool,
    is_pushed: bool,
    is_focus_owner: bool,
    is_enabled: bool,
) -> ButtonState {
    if is_pushed || (my_rollover && my_mouse_down && is_enabled) {
        ButtonState::Pushed
    } else if my_rollover && is_enabled {
        ButtonState::Popped
    } else if is_focus_owner {
        ButtonState::Selected
    } else {
        ButtonState::Normal
    }
}

/* ──────────────────────────────────────────────
 * Icon position — port of ActionButtonLook.getIconPosition()
 * @see ActionButtonLook.java lines 188-198
 * ────────────────────────────────────────────── */

/// @see ActionButtonLook.getIconPosition(actionButton, icon):
///   rect = new Rectangle(actionButton.width, actionButton.height)
///   JBInsets.removeFrom(rect, actionButton.getInsets())
///   if (actionButton instanceof ActionButton realButton)
///     JBInsets.removeFrom(rect, realButton.getIconInsets())
///   x = rect.x + (rect.width - icon.iconWidth) / 2
///   y = rect.y + (rect.height - icon.iconHeight) / 2
pub fn compute_icon_position(
    button_width: u32,
    button_height: u32,
    icon_width: u32,
    icon_height: u32,
    component_insets: &Insets,
    icon_insets: &Insets,
) -> Point {
    let mut rect_x = component_insets.left as i32;
    let mut rect_y = component_insets.top as i32;
    let mut rect_w = button_width.saturating_sub(component_insets.left + component_insets.right);
    let mut rect_h = button_height.saturating_sub(component_insets.top + component_insets.bottom);

    rect_x += icon_insets.left as i32;
    rect_y += icon_insets.top as i32;
    rect_w = rect_w.saturating_sub(icon_insets.left + icon_insets.right);
    rect_h = rect_h.saturating_sub(icon_insets.top + icon_insets.bottom);

    let x = rect_x + (rect_w as i32 - icon_width as i32) / 2;
    let y = rect_y + (rect_h as i32 - icon_height as i32) / 2;

    Point { x: x.max(0), y: y.max(0) }
}

/* ──────────────────────────────────────────────
 * Down arrow position — port of ActionButtonLook.paintDownArrow()
 * @see ActionButtonLook.java lines 157-162
 * ────────────────────────────────────────────── */

/// @see ActionButtonLook.paintDownArrow(g, actionButton, originalIcon, arrowIcon):
///   iconPos = getIconPosition(actionButton, originalIcon)
///   arrowIconX = iconPos.x + 1 + (originalIcon.getIconWidth() - arrowIcon.getIconWidth())
///   arrowIconY = iconPos.y + 1 + (originalIcon.getIconHeight() - arrowIcon.getIconHeight())
///   arrowIcon.paintIcon(...)
pub fn compute_arrow_position(
    icon_pos: &Point,
    original_icon_size: u32,
    arrow_icon_size: u32,
) -> Point {
    Point {
        x: icon_pos.x + 1 + (original_icon_size as i32 - arrow_icon_size as i32),
        y: icon_pos.y + 1 + (original_icon_size as i32 - arrow_icon_size as i32),
    }
}

/* ──────────────────────────────────────────────
 * Preferred size — port of ActionButton.getPreferredSize()
 * @see ActionButton.java lines 410-420
 * ────────────────────────────────────────────── */

/// @see ActionButton.getPreferredSize():
///   myMinimumButtonSize.update()
///   icon = getIcon()
///   if (icon.width < minSize.width && icon.height < minSize.height)
///     size = new Dimension(myMinimumButtonSize)
///   else
///     size = new Dimension(
///       max(minSize.width,  icon.width  + myInsets.left + myInsets.right),
///       max(minSize.height, icon.height + myInsets.top  + myInsets.bottom))
///   JBInsets.addTo(size, getInsets())
pub fn compute_preferred_size(
    min_size: &Size,
    icon_size: u32,
    icon_insets: &Insets,
    component_insets: &Insets,
) -> Size {
    let icon_w = icon_size;
    let icon_h = icon_size;

    let (w, h) = if icon_w < min_size.width && icon_h < min_size.height {
        (min_size.width, min_size.height)
    } else {
        (
            min_size.width.max(icon_w + icon_insets.left + icon_insets.right),
            min_size.height.max(icon_h + icon_insets.top + icon_insets.bottom),
        )
    };

    Size::new(
        w + component_insets.left + component_insets.right,
        h + component_insets.top + component_insets.bottom,
    )
}

/* ──────────────────────────────────────────────
 * Shall paint down arrow — port of ActionButton.shallPaintDownArrow()
 * @see ActionButton.java lines 523-529
 * ────────────────────────────────────────────── */

/// @see ActionButton.shallPaintDownArrow():
///   if (!(myAction instanceof ActionGroup)) return false;
///   if (!myPresentation.isPopupGroup()) return false;
///   if (hideDropdownIcon) return false;
///   return true;
pub fn shall_paint_down_arrow(is_action_group: bool, is_popup_group: bool, hide_dropdown_icon: bool) -> bool {
    if !is_action_group { return false; }
    if !is_popup_group { return false; }
    if hide_dropdown_icon { return false; }
    true
}

/* ──────────────────────────────────────────────
 * Complete render output — compute everything for
 * one paint cycle (one button, one state).
 * ────────────────────────────────────────────── */

/// Computes the complete ButtonRenderOutput for one paint cycle.
/// This is the Rust equivalent of ActionButton.paintButtonLook(g),
/// but produces structured data for the frontend.
pub fn compute_button_render(
    params: &ButtonLookParams,
    state: ButtonState,
    enabled: bool,
    focused: bool,
    is_action_group: bool,
    is_popup_group: bool,
    hide_dropdown_icon: bool,
    button_width: u32,
    button_height: u32,
) -> ButtonRenderOutput {
    /* ── State-dependent colors ── */
    let bg_color = get_header_background_color(enabled, state);
    let border_color = if focused && params.focus_only_border {
        Some(params.focus_border_color.clone())
    } else if params.suppress_border {
        None
    } else {
        get_border_color(state)
    };

    /* ── Icon position ── */
    let icon_pos = compute_icon_position(
        button_width, button_height,
        params.icon_size, params.icon_size,
        &params.component_insets,
        &params.icon_insets,
    );

    /* ── Down arrow ── */
    let show_arrow = shall_paint_down_arrow(is_action_group, is_popup_group, hide_dropdown_icon);
    let arrow_pos = if show_arrow {
        compute_arrow_position(&icon_pos, params.icon_size, 7)
    } else {
        Point { x: 0, y: 0 }
    };

    /* ── Preferred size ── */
    let pref = compute_preferred_size(
        &params.minimum_button_size,
        params.icon_size,
        &params.icon_insets,
        &params.component_insets,
    );

    ButtonRenderOutput {
        look_kind: params.kind.clone(),
        paint_background: bg_color.is_some(),
        background_color: bg_color,
        background_arc: params.background_arc as f64,
        paint_border: focused && params.focus_only_border,
        border_color,
        border_width: params.focus_border_width as f64,
        border_arc: params.button_arc as f64,
        icon_size: params.icon_size,
        icon_x: icon_pos.x,
        icon_y: icon_pos.y,
        show_down_arrow: show_arrow,
        arrow_x: arrow_pos.x,
        arrow_y: arrow_pos.y,
        preferred_size: pref.clone(),
        minimum_size: pref,
        insets: Some(params.component_insets.clone()),
        icon_insets: Some(params.icon_insets.clone()),
    }
}
