/**
 * @see com.intellij.openapi.wm.impl.headertoolbar.MainMenuWithButton
 * @see com.intellij.openapi.wm.impl.headertoolbar.MainMenuButton.ShowMenuAction
 * @see com.intellij.ide.IdeActions.GROUP_MAIN_MENU
 * @see com.intellij.platform.ide.menu.IdeMenuBarHelper.createIdeMainMenuActionGroup
 *
 * Mirrors IntelliJ's complete MainMenu ActionGroup hierarchy.
 * The hamburger button (MainMenuButton) pops up this menu via JBPopupFactory.createActionGroupPopup.
 *
 * Menu assembly order (from PlatformActions.xml + LangActions.xml + ExecutionActions.xml + VcsActions.xml):
 *   File → Edit → View → Navigate → Code → Refactor → Build → Run → Tools → Git → Window → Help
 */

use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub enum MenuItemType {
    Action,
    Separator,
    Submenu,
    SectionHeader,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct MenuItem {
    pub id: String,
    pub label: String,
    pub item_type: MenuItemType,
    pub icon: Option<String>,
    pub shortcut: Option<String>,
    pub enabled: bool,
    pub visible: bool,
    pub checked: Option<bool>,
    pub toggle: bool,
    pub children: Vec<MenuItem>,
    pub click_action: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct MainMenuDescriptor {
    pub menus: Vec<MenuItem>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ToolbarDropdownMenu {
    pub trigger_id: String,
    pub x: i32,
    pub y: i32,
    pub items: Vec<MenuItem>,
}

pub struct MenuManager {
    main_menu: Mutex<MainMenuDescriptor>,
}

impl MenuManager {
    pub fn new() -> Self {
        Self {
            main_menu: Mutex::new(Self::build_main_menu()),
        }
    }

    pub fn get_main_menu(&self) -> MainMenuDescriptor {
        self.main_menu.lock().unwrap().clone()
    }

    pub fn get_dropdown_menu(&self, trigger_id: &str, x: i32, y: i32) -> Option<ToolbarDropdownMenu> {
        let desc = self.main_menu.lock().unwrap();
        for menu in &desc.menus {
            if menu.id == trigger_id {
                return Some(ToolbarDropdownMenu {
                    trigger_id: trigger_id.into(),
                    x,
                    y,
                    items: menu.children.clone(),
                });
            }
            if let Some(items) = Self::find_submenu(&menu.children, trigger_id) {
                return Some(ToolbarDropdownMenu {
                    trigger_id: trigger_id.into(),
                    x,
                    y,
                    items,
                });
            }
        }
        let children_items = desc.menus.iter().map(|m| MenuItem {
            id: m.id.clone(),
            label: m.label.clone(),
            item_type: MenuItemType::Action,
            icon: m.icon.clone(),
            shortcut: None,
            enabled: m.enabled,
            visible: m.visible,
            checked: None,
            toggle: false,
            children: vec![],
            click_action: Some(format!("open_submenu:{}", m.id)),
        }).collect();
        Some(ToolbarDropdownMenu {
            trigger_id: trigger_id.into(),
            x,
            y,
            items: children_items,
        })
    }

    fn find_submenu(children: &[MenuItem], id: &str) -> Option<Vec<MenuItem>> {
        for item in children {
            if item.id == id {
                return Some(item.children.clone());
            }
            if !item.children.is_empty() {
                if let Some(found) = Self::find_submenu(&item.children, id) {
                    return Some(found);
                }
            }
        }
        None
    }

    fn build_main_menu() -> MainMenuDescriptor {
        MainMenuDescriptor {
            menus: vec![
                Self::build_file_menu(),
                Self::build_edit_menu(),
                Self::build_view_menu(),
                Self::build_navigate_menu(),
                Self::build_code_menu(),
                Self::build_refactor_menu(),
                Self::build_build_menu(),
                Self::build_run_menu(),
                Self::build_tools_menu(),
                Self::build_vcs_menu(),
                Self::build_window_menu(),
                Self::build_help_menu(),
            ],
        }
    }

    fn build_file_menu() -> MenuItem {
        MenuItem {
            id: "FileMenu".into(),
            label: "File".into(),
            item_type: MenuItemType::Submenu,
            icon: None,
            shortcut: None,
            enabled: true,
            visible: true,
            checked: None,
            toggle: false,
            click_action: None,
            children: vec![
                MenuItem { id: "OpenFile".into(), label: "Open...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: Some("open_file".into()) },
                MenuItem { id: "AttachProject".into(), label: "Attach Project...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "CloseProject".into(), label: "Close Project".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: Some("back_to_welcome".into()) },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem {
                    id: "FilePropertiesGroup".into(), label: "File Properties".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
                    children: vec![
                        MenuItem { id: "FileEncoding".into(), label: "File Encoding...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "AssociateFileType".into(), label: "Associate with File Type...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "ToggleReadOnly".into(), label: "Toggle Read-Only".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: true, children: vec![], click_action: None },
                        MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem {
                            id: "LineSeparatorsGroup".into(), label: "Line Separators".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
                            children: vec![
                                MenuItem { id: "line_sep.crlf".into(), label: "CRLF - Windows (\\r\\n)".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: Some(false), toggle: true, children: vec![], click_action: None },
                                MenuItem { id: "line_sep.lf".into(), label: "LF - Unix / macOS (\\n)".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: Some(false), toggle: true, children: vec![], click_action: None },
                                MenuItem { id: "line_sep.cr".into(), label: "CR - Classic Mac (\\r)".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: Some(false), toggle: true, children: vec![], click_action: None },
                            ],
                        },
                    ],
                },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "SaveAll".into(), label: "Save All".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+S".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Synchronize".into(), label: "Reload from Disk".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "InvalidateCaches".into(), label: "Invalidate Caches...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem {
                    id: "ExportImportGroup".into(), label: "Manage IDE Settings".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
                    children: vec![
                        MenuItem { id: "ImportSettings".into(), label: "Import Settings...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "ExportSettings".into(), label: "Export Settings...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "RestoreDefaultSettings".into(), label: "Restore Default Settings...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                    ],
                },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "TogglePowerSave".into(), label: "Power Save Mode".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: true, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Exit".into(), label: "Exit".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
            ],
        }
    }

    fn build_edit_menu() -> MenuItem {
        MenuItem {
            id: "EditMenu".into(), label: "Edit".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
            children: vec![
                MenuItem { id: "Undo".into(), label: "Undo".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Z".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Redo".into(), label: "Redo".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+Z".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Cut".into(), label: "Cut".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+X".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Copy".into(), label: "Copy".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+C".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "CopyPath".into(), label: "Copy Path".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+C".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem {
                    id: "PasteGroup".into(), label: "Paste".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: Some("Ctrl+V".into()), enabled: true, visible: true, checked: None, toggle: false, click_action: None,
                    children: vec![
                        MenuItem { id: "PasteSimple".into(), label: "Paste as Plain Text".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+V".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                    ],
                },
                MenuItem { id: "Delete".into(), label: "Delete".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Delete".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem {
                    id: "FindMenuGroup".into(), label: "Find".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
                    children: vec![
                        MenuItem { id: "Find".into(), label: "Find...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+F".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "Replace".into(), label: "Replace...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+R".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "FindNext".into(), label: "Find Next".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("F3".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "FindPrevious".into(), label: "Find Previous".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Shift+F3".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "FindInFiles".into(), label: "Find in Files...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+F".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "ReplaceInFiles".into(), label: "Replace in Files...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+R".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                    ],
                },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "ColumnSelectionMode".into(), label: "Column Selection Mode".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Shift+Alt+Insert".into()), enabled: true, visible: true, checked: None, toggle: true, children: vec![], click_action: None },
                MenuItem { id: "SelectAll".into(), label: "Select All".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+A".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "ToggleCase".into(), label: "Toggle Case".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+U".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "JoinLines".into(), label: "Join Lines".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+J".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "DuplicateLines".into(), label: "Duplicate Line".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+D".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "ConvertIndents".into(), label: "Convert Indents".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Macros".into(), label: "Macros".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
            ],
        }
    }

    fn build_view_menu() -> MenuItem {
        MenuItem {
            id: "ViewMenu".into(), label: "View".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
            children: vec![
                MenuItem {
                    id: "ToolWindowsGroup".into(), label: "Tool Windows".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
                    children: vec![
                        MenuItem { id: "ActivateProjectToolWindow".into(), label: "Project".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Alt+1".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "ActivateCommitToolWindow".into(), label: "Commit".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Alt+0".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "ActivateTerminalToolWindow".into(), label: "Terminal".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Alt+F12".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "ActivateRunToolWindow".into(), label: "Run".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Alt+4".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "ActivateProblemsViewToolWindow".into(), label: "Problems".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "ActivateStructureToolWindow".into(), label: "Structure".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Alt+7".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                    ],
                },
                MenuItem {
                    id: "ViewAppearanceGroup".into(), label: "Appearance".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
                    children: vec![
                        MenuItem { id: "ToggleFullScreen".into(), label: "Full Screen".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: true, children: vec![], click_action: None },
                        MenuItem { id: "TogglePresentationMode".into(), label: "Presentation Mode".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: true, children: vec![], click_action: None },
                        MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "ViewMainMenu".into(), label: "Main Menu".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: Some(true), toggle: true, children: vec![], click_action: None },
                        MenuItem { id: "ViewToolbar".into(), label: "Toolbar".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: Some(true), toggle: true, children: vec![], click_action: None },
                        MenuItem { id: "ViewStatusBar".into(), label: "Status Bar".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: Some(true), toggle: true, children: vec![], click_action: None },
                    ],
                },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "RecentFiles".into(), label: "Recent Files".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+E".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "RecentLocations".into(), label: "Recent Locations".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+E".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "QuickSwitchScheme".into(), label: "Quick Switch Scheme...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem {
                    id: "EditorToggleActions".into(), label: "Active Editor".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
                    children: vec![
                        MenuItem { id: "ToggleLineNumbers".into(), label: "Show Line Numbers".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: Some(true), toggle: true, children: vec![], click_action: None },
                        MenuItem { id: "ToggleBreadcrumb".into(), label: "Show Breadcrumbs".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: true, children: vec![], click_action: None },
                        MenuItem { id: "ToggleGutterIcons".into(), label: "Show Gutter Icons".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: Some(true), toggle: true, children: vec![], click_action: None },
                        MenuItem { id: "ToggleIndentGuides".into(), label: "Show Indent Guides".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: true, children: vec![], click_action: None },
                    ],
                },
            ],
        }
    }

    fn build_navigate_menu() -> MenuItem {
        MenuItem {
            id: "GoToMenu".into(), label: "Navigate".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
            children: vec![
                MenuItem { id: "Back".into(), label: "Back".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Alt+Left".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Forward".into(), label: "Forward".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Alt+Right".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "SearchEverywhere".into(), label: "Search Everywhere".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Double Shift".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: Some("search_everywhere".into()) },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "GotoFile".into(), label: "File...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+N".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "GotoClass".into(), label: "Class...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+N".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "GotoLine".into(), label: "Line/Column...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+G".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "GotoDeclaration".into(), label: "Declaration / Usages".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+B".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "GotoImplementation".into(), label: "Implementation(s)".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Alt+B".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "GotoNextError".into(), label: "Next Highlighted Error".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("F2".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "GotoPreviousError".into(), label: "Previous Highlighted Error".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Shift+F2".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "LastEditLocation".into(), label: "Last Edit Location".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+Backspace".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
            ],
        }
    }

    fn build_code_menu() -> MenuItem {
        MenuItem {
            id: "CodeMenu".into(), label: "Code".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
            children: vec![
                MenuItem { id: "OverrideMethods".into(), label: "Override Methods...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+O".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "ImplementMethods".into(), label: "Implement Methods...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+I".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Generate".into(), label: "Generate...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Alt+Insert".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem {
                    id: "CodeCompletionGroup".into(), label: "Code Completion".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
                    children: vec![
                        MenuItem { id: "CodeCompletion".into(), label: "Basic".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Space".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "SmartTypeCompletion".into(), label: "SmartType".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+Space".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                    ],
                },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "InsertLiveTemplate".into(), label: "Insert Live Template...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+J".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "SurroundWith".into(), label: "Surround With...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Alt+T".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem {
                    id: "CodeFoldingGroup".into(), label: "Folding".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
                    children: vec![
                        MenuItem { id: "CollapseRegion".into(), label: "Collapse".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+-".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "ExpandRegion".into(), label: "Expand".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl++".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "CollapseAll".into(), label: "Collapse All".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+-".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "ExpandAll".into(), label: "Expand All".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift++".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                    ],
                },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "CommentByLineComment".into(), label: "Comment with Line Comment".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+/".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "CommentByBlockComment".into(), label: "Comment with Block Comment".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+/".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "ReformatCode".into(), label: "Reformat Code".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Alt+L".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "OptimizeImports".into(), label: "Optimize Imports".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Alt+O".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "MoveLineUp".into(), label: "Move Line Up".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Shift+Alt+Up".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "MoveLineDown".into(), label: "Move Line Down".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Shift+Alt+Down".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
            ],
        }
    }

    fn build_refactor_menu() -> MenuItem {
        MenuItem {
            id: "RefactoringMenu".into(), label: "Refactor".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
            children: vec![
                MenuItem { id: "Refactorings.QuickListPopupAction".into(), label: "Refactor This...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Alt+Shift+T".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "RenameElement".into(), label: "Rename...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Shift+F6".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "ChangeSignature".into(), label: "Change Signature...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+F6".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem {
                    id: "IntroduceActionsGroup".into(), label: "Extract / Introduce".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
                    children: vec![
                        MenuItem { id: "IntroduceVariable".into(), label: "Variable...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Alt+V".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "IntroduceConstant".into(), label: "Constant...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Alt+C".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "IntroduceField".into(), label: "Field...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Alt+F".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "IntroduceParameter".into(), label: "Parameter...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Alt+P".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "ExtractMethod".into(), label: "Method...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Alt+M".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                    ],
                },
                MenuItem { id: "Inline".into(), label: "Inline...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Alt+N".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Move".into(), label: "Move...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("F6".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "CopyClass".into(), label: "Copy...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("F5".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "SafeDelete".into(), label: "Safe Delete...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Alt+Delete".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
            ],
        }
    }

    fn build_build_menu() -> MenuItem {
        MenuItem {
            id: "BuildMenu".into(), label: "Build".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
            children: vec![
                MenuItem { id: "CompileDirty".into(), label: "Build Project".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+F9".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Compile".into(), label: "Compile File".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+F9".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "RecompileWithAllWarnings".into(), label: "Recompile Files".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
            ],
        }
    }

    fn build_run_menu() -> MenuItem {
        MenuItem {
            id: "RunMenu".into(), label: "Run".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
            children: vec![
                MenuItem { id: "Run".into(), label: "Run".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Shift+F10".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Debug".into(), label: "Debug".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Shift+F9".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "RunClass".into(), label: "Run...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+F10".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "DebugClass".into(), label: "Debug...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Stop".into(), label: "Stop".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+F2".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Rerun".into(), label: "Rerun".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "EditRunConfigurations".into(), label: "Edit Configurations...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
            ],
        }
    }

    fn build_tools_menu() -> MenuItem {
        MenuItem {
            id: "ToolsMenu".into(), label: "Tools".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
            children: vec![
                MenuItem { id: "CreateCommandLineLauncher".into(), label: "Create Command-line Launcher...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "CreateDesktopEntry".into(), label: "Create Desktop Entry...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Terminal".into(), label: "Terminal".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
            ],
        }
    }

    fn build_vcs_menu() -> MenuItem {
        MenuItem {
            id: "VcsGroups".into(), label: "Git".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
            children: vec![
                MenuItem { id: "Vcs.QuickListPopupAction".into(), label: "VCS Operations Popup...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Alt+`".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "CheckinProject".into(), label: "Commit...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+K".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Vcs.UpdateProject".into(), label: "Update Project".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+T".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Vcs.Push".into(), label: "Push...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+K".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "Vcs.Branches".into(), label: "Branches...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "ShelveChanges".into(), label: "Shelve Changes...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "CreatePatch".into(), label: "Create Patch...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "ApplyPatch".into(), label: "Apply Patch...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
            ],
        }
    }

    fn build_window_menu() -> MenuItem {
        MenuItem {
            id: "WindowMenu".into(), label: "Window".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
            children: vec![
                MenuItem {
                    id: "ActiveToolWindowGroup".into(), label: "Active Tool Window".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
                    children: vec![
                        MenuItem { id: "HideActiveWindow".into(), label: "Hide".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+F12".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "MaximizeToolWindow".into(), label: "Maximize".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                    ],
                },
                MenuItem {
                    id: "EditorTabsGroup".into(), label: "Editor Tabs".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
                    children: vec![
                        MenuItem { id: "CloseEditor".into(), label: "Close".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+F4".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "CloseAllEditors".into(), label: "Close All".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "SplitVertically".into(), label: "Split Right".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                        MenuItem { id: "SplitHorizontally".into(), label: "Split Down".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                    ],
                },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "StoreDefaultLayout".into(), label: "Store Current Layout as Default".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "RestoreDefaultLayout".into(), label: "Restore Default Layout".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
            ],
        }
    }

    fn build_help_menu() -> MenuItem {
        MenuItem {
            id: "HelpMenu".into(), label: "Help".into(), item_type: MenuItemType::Submenu, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, click_action: None,
            children: vec![
                MenuItem { id: "GotoAction".into(), label: "Find Action...".into(), item_type: MenuItemType::Action, icon: None, shortcut: Some("Ctrl+Shift+A".into()), enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: Some("search_everywhere".into()) },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "HelpTopics".into(), label: "Help Topics...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "CheckForUpdate".into(), label: "Check for Updates...".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "", label: "".into(), item_type: MenuItemType::Separator, icon: None, shortcut: None, enabled: false, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
                MenuItem { id: "About".into(), label: "About".into(), item_type: MenuItemType::Action, icon: None, shortcut: None, enabled: true, visible: true, checked: None, toggle: false, children: vec![], click_action: None },
            ],
        }
    }
}

#[tauri::command]
pub fn get_main_menu(state: tauri::State<crate::AppState>) -> MainMenuDescriptor {
    state.menu_manager.get_main_menu()
}

#[tauri::command]
pub fn get_dropdown_menu(
    state: tauri::State<crate::AppState>,
    trigger_id: String,
    x: i32,
    y: i32,
) -> Option<ToolbarDropdownMenu> {
    state.menu_manager.get_dropdown_menu(&trigger_id, x, y)
}
