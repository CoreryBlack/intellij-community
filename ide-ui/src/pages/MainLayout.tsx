/**
 * @see com.intellij.openapi.wm.impl.IdeRootPane
 * @see com.intellij.openapi.application.impl.islands.IslandsUICustomization
 * @see com.intellij.openapi.wm.impl.headertoolbar.MainToolbar
 *
 * Main IDE layout — IntelliJ IDEA 2025+ New UI (Islands) layout.
 * EXACTLY matches the official IslandsNewUI layout structure:
 *
 *   MainWindow.background (= layer-1-bg = #26282C Dark)
 *   ┌────────────────────────────────────────────────────┐
 *   │  MainToolbar (transparent border, same bg)         │
 *   │  ┌──────────────────────────────────────────────┐  │
 *   │  │ gap = emptyGap = 4px (shows main-window-bg)  │  │
 *   │  │ ┌─────────┐ ┌──────────────────────────────┐ │  │
 *   │  │ │Stripe   │ │ Editor Island (arc=20)       │ │  │
 *   │  │ │(left)   │ │ ┌─ EditorTabs ──────────┐   │ │  │
 *   │  │ │         │ │ │  ...content...         │   │ │  │
 *   │  │ │         │ │ └────────────────────────┘   │ │  │
 *   │  │ └─────────┘ │                              │ │  │
 *   │  │ ┌─────────┐ │  Bottom Panel Island         │ │  │
 *   │  │ │Stripe   │ │  (when visible)              │ │  │
 *   │  │ │(right)  │ │                              │ │  │
 *   │  │ └─────────┘ └──────────────────────────────┘ │  │
 *   │  │ gap = emptyGap = 4px                         │  │
 *   │  └──────────────────────────────────────────────┘  │
 *   │  StatusBar (no top border, same bg)                │
 *   └────────────────────────────────────────────────────┘
 *
 * Official Islands parameters (IslandsUICustomization.kt):
 *   Island.arc = 20 (large), Island.arc.compact = 16
 *   Island.borderWidth = 6 (→ 3px rendered offset each side)
 *   Island.borderColor = ToolWindow.background = layer-0-bg
 *   Islands.emptyGap = 4
 *   Divider width = 0 (gaps handle separation)
 */

import { useEffect } from "react";
import TopToolbar from "../components/TopToolbar";
import ToolButtonStrip from "../components/ToolButtonStrip";
import Sidebar from "../components/Sidebar";
import StatusBar from "../components/StatusBar";
import EditorArea from "../components/EditorArea";
import BottomPanel from "../components/BottomPanel";
import { useIdeStore, type ToolWindowId } from "../store/ideStore";
import { readDirectory, readFileContent, getFileLang } from "../services/fileSystem";
import { notify } from "../components/NotificationStack";

/* ── Official Islands layout constants (IslandsUICustomization.kt) ──
 *   Island.arc = 20, Island.emptyGap = 4
 *   Island.borderColor = ToolWindow.background (= layer-0-bg)
 *   MainWindow.background = layer-1-bg
 *   Each component (Sidebar, EditorArea, BottomPanel) provides its OWN
 *   island container with the official insets (3px for tool windows, 2px for editor).
 *   MainLayout only provides the background and 4px gaps between islands.
 * ──────────────────────────────────────────────────────────────── */

const ISLAND_GAP = "var(--island-empty-gap)";      // 4px
const MAIN_BG = "var(--main-window-background)";

interface Props {
  projectPath: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onBackToWelcome: () => void;
}

export default function MainLayout({ projectPath, theme, onToggleTheme, onBackToWelcome }: Props) {
  const { state, dispatch } = useIdeStore();

  useEffect(() => {
    if (!projectPath) return;
    dispatch({ type: "SET_FILE_TREE_LOADING", loading: true });
    readDirectory(projectPath).then(entries => {
      dispatch({ type: "SET_FILE_TREE", entries });
    });
  }, [projectPath]);

  const handleSelectTool = (id: ToolWindowId) => {
    const tw = state.toolWindows[id];
    if (tw.anchor === "left") {
      if (state.activeToolWindow === id && state.sidebarVisible) {
        dispatch({ type: "TOGGLE_SIDEBAR" });
      } else {
        if (!state.sidebarVisible) dispatch({ type: "TOGGLE_SIDEBAR" });
        dispatch({ type: "SET_ACTIVE_TOOL_WINDOW", id });
      }
    } else if (tw.anchor === "bottom") {
      dispatch({ type: "SET_BOTTOM_TAB", tab: id === "terminal" ? "terminal" : id === "problems" ? "problems" : "services" });
      if (!state.bottomPanelVisible) dispatch({ type: "TOGGLE_BOTTOM_PANEL" });
    }
  };

  const handleOpenFile = async (filePath: string, fileName: string) => {
    const existing = state.openFiles.find(f => f.path === filePath);
    if (existing) {
      dispatch({ type: "SET_ACTIVE_FILE", path: filePath });
      return;
    }
    const content = await readFileContent(filePath);
    dispatch({
      type: "OPEN_FILE",
      file: {
        name: fileName,
        path: filePath,
        content,
        lang: getFileLang(fileName),
        modified: false,
        scrollTop: 0,
        cursorLine: 1,
        cursorCol: 1,
      },
    });
  };

  const currentProject = projectPath.split("/").pop()?.split("\\").pop() || "Project";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: MAIN_BG,
      overflow: "hidden",
    }}>
      <TopToolbar
        projectName={currentProject}
        onBackToWelcome={onBackToWelcome}
        onToggleTheme={onToggleTheme}
        onSearchEverywhere={() => dispatch({ type: "SHOW_MODAL", modal: { type: "search-everywhere" } })}
      />

      {/* ═══ Main content area with 4px gap around islands ═══
       * @see IslandsUICustomization.configureToolWindowPane():
       *   emptyGap=4 surrounds the toolWindowPaneParent
       * Each component (Sidebar, EditorArea, BottomPanel) provides its own
       * island container (arc=20, 3px/2px insets) matching XNextIslandHolder.
       */}
      <div style={{
        flex: 1,
        display: "flex",
        overflow: "hidden",
        gap: ISLAND_GAP,
        padding: `${ISLAND_GAP} 0 0 ${ISLAND_GAP}`,
        minHeight: 0,
        minWidth: 0,
      }}>
        {/* Left tool window stripe — @see ToolWindow.Stripe */}
        <ToolButtonStrip
          activeTool={state.activeToolWindow || "project"}
          onSelectTool={handleSelectTool}
          showSidebar={state.sidebarVisible}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          showBottomPanel={state.bottomPanelVisible}
          onToggleBottomPanel={() => dispatch({ type: "TOGGLE_BOTTOM_PANEL" })}
        />

        {/* ═══ Editor layout with islands ═══
         * Sidebar + EditorArea + BottomPanel each provide their own
         * island container matching XNextIslandHolder / Editor island specs.
         * 4px gap between them reveals main-window-bg (the "border").
         */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          gap: ISLAND_GAP,
          minWidth: 0,
          minHeight: 0,
          paddingRight: ISLAND_GAP,
          paddingBottom: ISLAND_GAP,
        }}>
          <div style={{ flex: 1, display: "flex", overflow: "hidden", gap: ISLAND_GAP, minHeight: 0 }}>
            {/* Sidebar — self-islanded via Sidebar.tsx XNextIslandHolder-style inset */}
            {state.sidebarVisible && (
              <Sidebar
                activeTool={state.activeToolWindow || "project"}
                projectPath={state.projectPath}
                fileTree={state.fileTree}
                onOpenFile={handleOpenFile}
                onContextMenu={(e, path, name) => {
                  e.preventDefault();
                  dispatch({
                    type: "SHOW_CONTEXT_MENU",
                    menu: {
                      x: e.clientX, y: e.clientY,
                      items: [
                        { label: "Open", shortcut: "Enter", action: () => handleOpenFile(path, name) },
                        { label: "Copy Path", shortcut: "Ctrl+Shift+C", action: () => { navigator.clipboard.writeText(path); notify(dispatch, "info", "Copied", path); } },
                        { label: "Copy Relative Path", action: () => { navigator.clipboard.writeText(path.replace(state.projectPath, "")); notify(dispatch, "info", "Copied", path); } },
                        { label: "", separator: true, action: () => {} },
                        { label: "Reveal in Explorer", action: () => {} },
                      ],
                    },
                  });
                }}
              />
            )}

            {/* EditorArea — self-islanded via EditorArea.tsx Editor island-style inset */}
            <EditorArea
              openFiles={state.openFiles}
              activeFilePath={state.activeFilePath}
              onSelectFile={(path) => dispatch({ type: "SET_ACTIVE_FILE", path })}
              onCloseFile={(path) => dispatch({ type: "CLOSE_FILE", path })}
              onTabContextMenu={(e, path) => {
                e.preventDefault(); e.stopPropagation();
                dispatch({
                  type: "SHOW_CONTEXT_MENU",
                  menu: {
                    x: e.clientX, y: e.clientY,
                    items: [
                      { label: "Close", shortcut: "Ctrl+W", action: () => dispatch({ type: "CLOSE_FILE", path }) },
                      { label: "Close Others", action: () => { state.openFiles.forEach(f => { if (f.path !== path) dispatch({ type: "CLOSE_FILE", path: f.path }); }); } },
                      { label: "Close All", action: () => { state.openFiles.forEach(f => dispatch({ type: "CLOSE_FILE", path: f.path })); } },
                      { label: "", separator: true, action: () => {} },
                      { label: "Copy Path", shortcut: "Ctrl+Shift+C", action: () => { navigator.clipboard.writeText(path); } },
                      { label: "Copy Reference", action: () => {} },
                    ],
                  },
                });
              }}
            />
          </div>

          {/* BottomPanel — self-islanded via BottomPanel.tsx XNextIslandHolder-style inset */}
          {state.bottomPanelVisible && (
            <BottomPanel
              bottomPanelTab={state.bottomPanelTab}
              onBottomPanelTab={(tab) => dispatch({ type: "SET_BOTTOM_TAB", tab })}
              onHide={() => dispatch({ type: "TOGGLE_BOTTOM_PANEL" })}
              projectPath={state.projectPath}
            />
          )}
        </div>

        {/* Right tool window stripe (hidden by default, similar to left) */}
      </div>

      {/* ═══ Status Bar ═══
       * @see IslandsUICustomization:
       *   StatusBar.borderColor = transparent
       *   topBorderWidth = 0
       *   background = main-window-bg
       */}
      <StatusBar theme={theme} onToggleTheme={onToggleTheme} />
    </div>
  );
}
