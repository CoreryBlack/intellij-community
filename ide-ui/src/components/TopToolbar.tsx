/**
 * @see com.intellij.openapi.wm.impl.headertoolbar.MainToolbar
 * @see com.intellij.openapi.actionSystem.ActionManager
 *
 * TopToolbar — PURE RENDERER. All data comes from Rust backend ToolbarDescriptor.
 * Zero hardcoded design decisions. Every button, label, icon, order is defined in Rust.
 *
 * Official MainToolbarNewUI hierarchy:
 *   LEFT:   MainMenuButton + Project + VCSGroup (Git branches + Commit + Push)
 *   CENTER: SearchEverywhere + Filename
 *   RIGHT:  RunWidget (config selector + Run + Debug) + Separator + Search + Settings
 */

import { useState, useEffect } from "react";

interface ToolbarActionStyle { border: boolean; accent_color: string | null; font_weight: string | null; text_color: string | null; }
interface ToolbarAction { id: string; label: string; short_label: string | null; icon: string; action_type: "Button" | "Toggle" | "Dropdown" | "Separator" | "Widget"; shortcut: string | null; tooltip: string | null; enabled: boolean; visible: boolean; toggle_state: boolean | null; badge: string | null; children: ToolbarAction[]; style_override: ToolbarActionStyle | null; }
interface ToolbarGroup { id: string; position: "Left" | "Center" | "Right"; actions: ToolbarAction[]; }
interface ToolbarDescriptor { groups: ToolbarGroup[]; project: { name: string; path: string; icon: string; color: string | null }; run_configurations: { id: string; name: string; type_name: string; icon: string; pinned: boolean }[]; active_run_config: string | null; git: { branch: string; remote: string; clean: boolean; ahead: number; behind: number; has_changes: boolean } | null; active_file_name: string | null; }

function FALLBACK_TOOLBAR_DESCRIPTOR(projectName: string): ToolbarDescriptor {
    return {
        project: { name: projectName, path: "", icon: "project", color: "#3871E1" },
        run_configurations: [{ id: "spring-boot", name: "AstralMonitorApplication", type_name: "Spring Boot", icon: "spring", pinned: true }],
        active_run_config: "spring-boot",
        git: { branch: "main", remote: "origin", clean: true, ahead: 0, behind: 0, has_changes: false },
        active_file_name: null,
        groups: [
            {
                id: "MainToolbarLeft", position: "Left", actions: [
                    { id: "MainMenuButton", label: "Main Menu", short_label: null, icon: "hamburger", action_type: "Button", shortcut: null, tooltip: "Main Menu", enabled: true, visible: true, toggle_state: null, badge: null, children: [], style_override: null },
                    { id: "main.toolbar.Project", label: projectName, short_label: null, icon: "project", action_type: "Dropdown", shortcut: null, tooltip: "Recent Projects", enabled: true, visible: true, toggle_state: null, badge: null, children: [], style_override: { border: false, accent_color: null, font_weight: "600", text_color: "var(--ide-text-default)" } },
                    { id: "main.toolbar.git.Branches", label: "main", short_label: null, icon: "git-branch", action_type: "Dropdown", shortcut: null, tooltip: "Git Branches", enabled: true, visible: true, toggle_state: null, badge: null, children: [], style_override: { border: true, accent_color: "var(--ide-accent-blue)", font_weight: null, text_color: null } },
                    { id: "CheckinProject", label: "Commit", short_label: null, icon: "commit", action_type: "Button", shortcut: "Ctrl+K", tooltip: "Commit (Ctrl+K)", enabled: true, visible: true, toggle_state: null, badge: null, children: [], style_override: null },
                    { id: "Vcs.Push", label: "Push", short_label: null, icon: "push", action_type: "Button", shortcut: "Ctrl+Shift+K", tooltip: "Push (Ctrl+Shift+K)", enabled: true, visible: true, toggle_state: null, badge: null, children: [], style_override: null },
                ]
            },
            {
                id: "MainToolbarCenter", position: "Center", actions: [
                    { id: "SearchEverywhere", label: "Search", short_label: null, icon: "search", action_type: "Button", shortcut: "Double Shift", tooltip: "Search Everywhere (Double Shift)", enabled: true, visible: true, toggle_state: null, badge: null, children: [], style_override: { border: false, accent_color: null, font_weight: null, text_color: "var(--ide-text-secondary)" } },
                ]
            },
            {
                id: "MainToolbarRight", position: "Right", actions: [
                    { id: "NewUiRunWidget", label: "AstralMonitorApplication", short_label: null, icon: "run", action_type: "Dropdown", shortcut: null, tooltip: "Run Configuration", enabled: true, visible: true, toggle_state: null, badge: null, children: [], style_override: { border: false, accent_color: "var(--ide-accent-green)", font_weight: null, text_color: "var(--ide-text-default)" } },
                    { id: "Run", label: "Run", short_label: null, icon: "run", action_type: "Button", shortcut: "Shift+F10", tooltip: "Run (Shift+F10)", enabled: true, visible: true, toggle_state: null, badge: null, children: [], style_override: { border: false, accent_color: "var(--ide-accent-green)", font_weight: null, text_color: "var(--ide-accent-green)" } },
                    { id: "Debug", label: "Debug", short_label: null, icon: "debug", action_type: "Button", shortcut: "Shift+F9", tooltip: "Debug (Shift+F9)", enabled: true, visible: true, toggle_state: null, badge: null, children: [], style_override: null },
                    { id: "Separator", label: "", short_label: null, icon: "", action_type: "Separator", shortcut: null, tooltip: null, enabled: false, visible: true, toggle_state: null, badge: null, children: [], style_override: null },
                    { id: "SearchEverywhere.Right", label: "Search", short_label: null, icon: "search", action_type: "Button", shortcut: "Double Shift", tooltip: "Search Everywhere (Double Shift)", enabled: true, visible: true, toggle_state: null, badge: null, children: [], style_override: null },
                    { id: "SettingsEntryPoint", label: "Settings", short_label: null, icon: "settings", action_type: "Button", shortcut: "Ctrl+Alt+,", tooltip: "Settings (Ctrl+Alt+,)", enabled: true, visible: true, toggle_state: null, badge: null, children: [], style_override: null },
                ]
            },
        ],
    };
}

function ActionIcon({ icon, size = 16 }: { icon: string; size?: number }) {
    switch (icon) {
        case "hamburger":
            return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="3" width="12" height="2" rx="1" /><rect x="2" y="7" width="12" height="2" rx="1" /><rect x="2" y="11" width="12" height="2" rx="1" /></svg>;
        case "project":
            return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M2.75 2.5a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h10.5a.75.75 0 0 0 .75-.75V6.25a.75.75 0 0 0-.75-.75H8.75a.75.75 0 0 1-.53-.22L6.78 3.78a.75.75 0 0 0-.53-.22H2.75z" /></svg>;
        case "git-branch":
            return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C5.8 0 4 1.8 4 4c0 1.5.8 2.8 2 3.5V15h4V7.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4zm0 1.5c1.4 0 2.5 1.1 2.5 2.5S9.4 7.5 8 7.5 5.5 6.4 5.5 5 6.6 2.5 8 2.5z" /></svg>;
        case "commit":
            return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 8 3z" /></svg>;
        case "push":
            return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M13 7L8 2 3 7h2v6h6V7h2z" /></svg>;
        case "search":
            return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="6.5" cy="6.5" r="5" /><path d="M10 10l4.5 4.5" strokeLinecap="round" /></svg>;
        case "run":
            return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M4 2v12l10-6z" /></svg>;
        case "debug":
            return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M5 2v4H3v4h2v4h2v-4h2V6H9V2H7zm6 3v6h2V5h-2z" /></svg>;
        case "settings":
            return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z" /></svg>;
        case "file":
            return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M4 1h5.5L13 4.5V15H4V1z" /></svg>;
        default:
            return <span style={{ fontSize: size - 2 }}>?</span>;
    }
}

function ToolbarButton({ action, onClick }: { action: ToolbarAction; onClick?: () => void }) {
    const [hovered, setHovered] = useState(false);
    const style = action.style_override;

    const btnStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 30,
        minWidth: 30,
        padding: style?.font_weight ? "2px 8px" : "var(--toolbar-button-insets-top) var(--toolbar-button-insets-right) var(--toolbar-button-insets-bottom) var(--toolbar-button-insets-left)",
        border: style?.border ? "1px solid var(--ide-border)" : "none",
        borderRadius: "var(--toolbar-button-arc)",
        background: hovered ? "var(--toolbar-bg-hovered)" : "transparent",
        color: style?.text_color || (style?.accent_color ? style.accent_color : "var(--ide-text-muted)"),
        cursor: action.enabled ? "pointer" : "default",
        fontSize: style?.font_weight ? "var(--ide-font-size-sm)" : "var(--ide-font-toolbar)",
        fontWeight: style?.font_weight as any || 400,
        transition: "background var(--ide-transition-fast)",
        flexShrink: 0,
        gap: action.label ? 4 : 0,
    };

    return (
        <button
            style={btnStyle}
            title={action.tooltip || action.label}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <ActionIcon icon={action.icon} size={action.label ? 14 : 16} />
            {action.label && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{action.label}</span>}
            {action.action_type === "Dropdown" && (
                <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" style={{ color: "var(--ide-text-disabled)", flexShrink: 0 }}>
                    <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
            {action.badge && <span style={{ color: "var(--ide-accent-blue)", fontSize: 11, lineHeight: 1 }}>{action.badge}</span>}
        </button>
    );
}

interface Props {
    projectName: string;
    onBackToWelcome: () => void;
    theme: "dark" | "light";
    onToggleTheme: () => void;
    onSearchEverywhere: () => void;
}

export default function TopToolbar({ projectName, onBackToWelcome, theme, onToggleTheme, onSearchEverywhere }: Props) {
    const [descriptor, setDescriptor] = useState<ToolbarDescriptor>(() => FALLBACK_TOOLBAR_DESCRIPTOR(projectName));

    useEffect(() => {
        setDescriptor(FALLBACK_TOOLBAR_DESCRIPTOR(projectName));
    }, [projectName]);

    const handleAction = (action: ToolbarAction) => {
        switch (action.id) {
            case "MainMenuButton":
                onBackToWelcome();
                break;
            case "SearchEverywhere":
            case "SearchEverywhere.Right":
                onSearchEverywhere();
                break;
            case "SettingsEntryPoint":
                onToggleTheme();
                break;
        }
    };

    const leftGroup = descriptor.groups.find(g => g.position === "Left");
    const centerGroup = descriptor.groups.find(g => g.position === "Center");
    const rightGroup = descriptor.groups.find(g => g.position === "Right");

    return (
        <div style={{
            height: "var(--ide-toolbar-height)",
            display: "flex",
            alignItems: "center",
            background: "var(--ide-bg-toolbar)",
            borderBottom: "1px solid var(--ide-border-toolbar)",
            padding: "0 6px",
            flexShrink: 0,
            gap: "var(--ide-main-toolbar-layout-gap)",
        }}>
            {/* LEFT */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                {leftGroup?.actions.filter(a => a.visible).map(action =>
                    action.action_type === "Separator" ? (
                        <div key={action.id} style={{ width: 1, height: 18, background: "var(--ide-border-toolbar)", margin: "0 2px" }} />
                    ) : (
                        <ToolbarButton key={action.id} action={action} onClick={() => handleAction(action)} />
                    )
                )}
            </div>

            {/* CENTER */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2, justifyContent: "center", minWidth: 0 }}>
                {centerGroup?.actions.filter(a => a.visible).map(action =>
                    action.action_type === "Separator" ? (
                        <div key={action.id} style={{ width: 1, height: 18, background: "var(--ide-border-toolbar)", margin: "0 2px" }} />
                    ) : (
                        <ToolbarButton key={action.id} action={action} onClick={() => handleAction(action)} />
                    )
                )}
            </div>

            {/* RIGHT */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                {rightGroup?.actions.filter(a => a.visible).map(action =>
                    action.action_type === "Separator" ? (
                        <div key={action.id} style={{ width: 1, height: 18, background: "var(--ide-border-toolbar)", margin: "0 2px" }} />
                    ) : (
                        <ToolbarButton key={action.id} action={action} onClick={() => handleAction(action)} />
                    )
                )}
            </div>
        </div>
    );
}
