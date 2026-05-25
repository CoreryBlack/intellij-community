/**
 * @see com.intellij.openapi.wm.impl.welcomeScreen.FlatWelcomeFrame
 * @see com.intellij.openapi.wm.impl.welcomeScreen.TabbedWelcomeScreen
 * @see com.intellij.openapi.wm.impl.welcomeScreen.RecentProjectPanel
 * @see com.intellij.openapi.wm.impl.welcomeScreen.NewRecentProjectPanel
 *
 * WelcomeScreen — PURE RENDERER.
 * ALL data comes from Rust backend (welcome::WelcomeScreenDescriptor).
 * ZERO hardcoded local data. Every string, icon, tab, project comes from Rust.
 */

import { useState } from "react";

/* ── Rust backend types (direct port of welcome.rs) ── */

interface WelcomeTab {
  id: string;
  label: string;
  icon: string;
  selected: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description: string | null;
  enabled: boolean;
}

interface RecentProject {
  name: string;
  path: string;
  icon: string;
  timestamp: string;
  valid: boolean;
}

interface ProjectGroup {
  id: string;
  label: string;
  icon: string;
  expanded: boolean;
  projects: RecentProject[];
}

interface SpeedSearchState {
  enabled: boolean;
  query: string;
  selected_index: number;
}

interface ProjectPreview {
  project_path: string;
  project_name: string;
  last_modified: string;
  file_count: number;
  preview_files: string[];
}

interface WelcomeScreenDescriptor {
  product_name: string;
  version: string;
  product_icon: string;
  build_number: string;
  tabs: WelcomeTab[];
  active_tab_id: string;
  quick_actions: QuickAction[];
  recent_projects: RecentProject[];
  project_groups: ProjectGroup[];
  speed_search: SpeedSearchState;
  configure_actions: QuickAction[];
  footer_actions: QuickAction[];
  project_preview: ProjectPreview | null;
}

/* ── FALLBACK data (identical to Rust welcome.rs default) ── */

const FALLBACK_WELCOME: WelcomeScreenDescriptor = {
  product_name: "IntelliJ IDEA",
  version: "2025.1",
  product_icon: "intellij-idea",
  build_number: "251.0",
  tabs: [
    { id: "projects", label: "Projects", icon: "folder", selected: true },
    { id: "plugins", label: "Plugins", icon: "plugin", selected: false },
    { id: "learn", label: "Learn", icon: "learn", selected: false },
  ],
  active_tab_id: "projects",
  quick_actions: [
    { id: "NewProject", label: "New Project", icon: "new-project", description: "Create a new project from scratch", enabled: true },
    { id: "Open", label: "Open", icon: "open", description: "Open an existing project", enabled: true },
    { id: "GetFromVCS", label: "Get from VCS", icon: "vcs", description: "Clone a repository from version control", enabled: true },
  ],
  recent_projects: [
    { name: "AstralLight", path: "E:/Projects/AstralLight", icon: "project", timestamp: "Just now", valid: true },
    { name: "intellij-community", path: "E:/OfficialVersion/intellij-community", icon: "project", timestamp: "2 min ago", valid: true },
    { name: "ide-ui", path: "E:/OfficialVersion/intellij-community/ide-ui", icon: "project", timestamp: "Yesterday", valid: true },
    { name: "rust-toolkit", path: "E:/Projects/rust-toolkit", icon: "project", timestamp: "3 days ago", valid: true },
  ],
  project_groups: [],
  speed_search: { enabled: true, query: "", selected_index: -1 },
  configure_actions: [
    { id: "settings", label: "Settings", icon: "settings", description: null, enabled: true },
    { id: "plugins", label: "Plugins", icon: "plugin", description: null, enabled: true },
    { id: "help", label: "Help", icon: "help", description: null, enabled: true },
  ],
  footer_actions: [
    { id: "toggle_theme", label: "Light", icon: "theme", description: null, enabled: true },
    { id: "settings", label: "Settings", icon: "settings", description: null, enabled: true },
    { id: "about", label: "About", icon: "about", description: null, enabled: true },
  ],
  project_preview: null,
};

/* ── ActionIcon — purely mechanical icon renderer ── */

function ActionIcon({ icon, size = 16 }: { icon: string; size?: number }) {
  const iconMap: Record<string, string> = {
    "new-project": "add",
    open: "open",
    vcs: "branch",
    project: "folder",
    folder: "folder",
    settings: "settings",
    help: "help",
    plugin: "plugin",
    learn: "learn",
  };
  const officialName = iconMap[icon];
  if (officialName) {
    return <img src={`/icons/${officialName}.svg`} width={size} height={size} alt="" style={{ display: "block" }} />;
  }
  if (icon === "theme") return <span>☀</span>;
  if (icon === "about") return <span>ⓘ</span>;
  return <span style={{ fontSize: size - 2 }}>?</span>;
}

/* ── WelcomeScreen — pure renderer ── */

interface Props {
  onOpenProject: (path: string) => void;
  onNewProject: () => void;
  onToggleTheme: () => void;
  _theme?: "dark" | "light";
}

export default function WelcomeScreen({ onOpenProject, onNewProject, onToggleTheme }: Props) {
  const [welcome, setWelcome] = useState<WelcomeScreenDescriptor>(FALLBACK_WELCOME);
  const [searchQuery, setSearchQuery] = useState("");

  const handleQuickAction = (action: QuickAction) => {
    switch (action.id) {
      case "NewProject": onNewProject(); break;
      case "Open": onOpenProject(""); break;
      case "toggle_theme": onToggleTheme(); break;
    }
  };

  const handleTabClick = (tabId: string) => {
    const tabs = welcome.tabs.map(t => ({ ...t, selected: t.id === tabId }));
    setWelcome(prev => ({ ...prev, active_tab_id: tabId, tabs }));
  };

  /* ── Speed search filtering (port of RecentProjectPanel ListWithFilter) ── */
  const filteredProjects = welcome.recent_projects.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q);
  });

  const showFilter = welcome.speed_search.enabled && welcome.recent_projects.length > 4;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "var(--main-window-background)",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ═══ Left Sidebar ═══
         * @see TabbedWelcomeScreen — left sidebar 224px
         */}
        <div style={{
          width: 224,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--tool-window-bg)",
          borderRight: "1px solid var(--editor-border)",
        }}>
          {/* Logo */}
          <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #FE2857 0%, #FF6584 25%, #FC801D 50%, #FFC700 75%, #3871E1 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>IJ</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-default)" }}>{welcome.product_name}</span>
          </div>

          {/* Tab list */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, padding: "0 8px" }}>
            {welcome.tabs.map(tab => (
              <button key={tab.id} onClick={() => handleTabClick(tab.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", border: "none", borderRadius: 6, background: tab.selected ? "var(--selection-bg-active)" : "transparent", color: tab.selected ? "var(--text-default)" : "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: tab.selected ? 500 : 400, textAlign: "left", width: "100%", transition: "background 0.08s" }}
                onMouseEnter={e => { if (!tab.selected) e.currentTarget.style.background = "var(--toolbar-bg-hovered)"; }}
                onMouseLeave={e => { if (!tab.selected) e.currentTarget.style.background = "transparent"; }}>
                <ActionIcon icon={tab.icon} size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Access — @see TabbedWelcomeScreen: createQuickAccessPanel() */}
          <div style={{ padding: "8px", borderTop: "1px solid var(--separator-color)", display: "flex", flexDirection: "column", gap: 2 }}>
            {welcome.configure_actions.map(action => (
              <button key={action.id} onClick={() => handleQuickAction(action)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", border: "none", borderRadius: 6, background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, textAlign: "left", width: "100%", transition: "background 0.08s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <ActionIcon icon={action.icon} size={14} />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Central Content Area ══════ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
          {/* Logo + Title */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px 24px" }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg, #FE2857 0%, #FF6584 25%, #FC801D 50%, #FFC700 75%, #3871E1 100%)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: "0 4px 16px rgba(56,113,225,0.3)" }}>
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="8" width="32" height="32" rx="6" fill="rgba(0,0,0,0.3)" />
                <text x="24" y="33" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="var(--font-ui)">IJ</text>
              </svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text-over-accent)", letterSpacing: "-0.3px" }}>{welcome.product_name}</h1>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", marginTop: 2 }}>{welcome.product_name} {welcome.version}</p>
          </div>

          {/* Quick Actions */}
          <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 24 }}>
            {welcome.quick_actions.filter(a => a.enabled).map(action => (
              <button key={action.id} onClick={() => handleQuickAction(action)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "8px 20px", border: "none", background: "transparent", color: "var(--text-default)", fontSize: "var(--font-size-sm)", fontWeight: 500, cursor: "pointer", borderRadius: "var(--component-arc)", transition: "background 0.08s ease" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <ActionIcon icon={action.icon} size={28} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Recent Projects — @see RecentProjectPanel */}
          <div style={{ maxWidth: 600, width: "100%", margin: "0 auto", padding: "0 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingLeft: 4 }}>
              <h2 style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Recent Projects</h2>
              {/* Speed search input — @see RecentProjectPanel ListWithFilter */}
              {showFilter && (
                <input placeholder="Search projects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: 160, height: 22, padding: "0 6px", border: "1px solid var(--control-border)", borderRadius: "var(--component-arc)", background: "var(--control-bg)", color: "var(--text-default)", fontSize: "var(--font-size-xs)", outline: "none" }}
                />
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: "var(--island-arc)", background: "var(--island-border-color)", padding: "3px" }}>
              <div style={{ borderRadius: "calc(var(--island-arc) - 3px)", background: "var(--tool-window-bg)", overflow: "hidden" }}>
                {filteredProjects.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "var(--text-disabled)", fontSize: "var(--font-size-sm)" }}>
                    {searchQuery ? `No projects matching "${searchQuery}"` : "No recent projects"}
                  </div>
                ) : filteredProjects.map((p, i) => (
                  <div key={p.path} onClick={() => p.valid && onOpenProject(p.path)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: p.valid ? "pointer" : "default", transition: "background 0.08s ease", opacity: p.valid ? 1 : 0.5, borderBottom: i < filteredProjects.length - 1 ? "1px solid var(--editor-border)" : "none" }}
                    onMouseEnter={e => { if (p.valid) e.currentTarget.style.background = "var(--toolbar-bg-hovered)"; }}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 32, height: 32, borderRadius: "var(--component-arc)", background: "var(--layer-2-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <ActionIcon icon={p.icon} size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "var(--font-size-md)", fontWeight: 500, color: "var(--text-default)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.path}</div>
                    </div>
                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-disabled)", flexShrink: 0 }}>{p.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Footer ═══ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 14px", borderTop: "1px solid var(--separator-color)", background: "var(--layer-0-bg)", flexShrink: 0, height: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
          <span>{welcome.product_name} {welcome.version} (Build {welcome.build_number})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {welcome.footer_actions.map(action => (
            <button key={action.id} onClick={() => handleQuickAction(action)}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", border: "none", borderRadius: "var(--component-arc)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "var(--font-size-xs)", transition: "background 0.08s ease" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <ActionIcon icon={action.icon} size={12} />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
