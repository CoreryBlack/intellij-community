/**
 * @see com.intellij.openapi.wm.impl.IdeRootPane.CustomHeaderRootLayout
 * @see com.intellij.toolWindow.ToolWindowPaneNewButtonManager.wrapWithControls
 *
 * Main IDE layout — strict BorderLayout matching official IntelliJ
 * All state comes from IdeStoreContext, no local state for IDE data
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
      background: "var(--ide-bg-main)",
      overflow: "hidden",
    }}>
      <TopToolbar
        projectName={currentProject}
        onBackToWelcome={onBackToWelcome}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onSearchEverywhere={() => dispatch({ type: "SHOW_MODAL", modal: { type: "search-everywhere" } })}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0, minHeight: 0 }}>
        <ToolButtonStrip
          activeTool={state.activeToolWindow || "project"}
          onSelectTool={handleSelectTool}
          showSidebar={state.sidebarVisible}
          onToggleSidebar={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          showBottomPanel={state.bottomPanelVisible}
          onToggleBottomPanel={() => dispatch({ type: "TOGGLE_BOTTOM_PANEL" })}
        />

        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
          minHeight: 0,
          padding: "var(--island-empty-gap)",
          gap: "var(--island-empty-gap)",
        }}>
          <div style={{ flex: 1, display: "flex", overflow: "hidden", gap: "var(--island-empty-gap)", minHeight: 0 }}>
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
                      x: e.clientX,
                      y: e.clientY,
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
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", gap: "var(--island-empty-gap)", minWidth: 0, minHeight: 0 }}>
              <EditorArea
                openFiles={state.openFiles}
                activeFilePath={state.activeFilePath}
                onSelectFile={(path) => dispatch({ type: "SET_ACTIVE_FILE", path })}
                onCloseFile={(path) => dispatch({ type: "CLOSE_FILE", path })}
                onTabContextMenu={(e, path) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dispatch({
                    type: "SHOW_CONTEXT_MENU",
                    menu: {
                      x: e.clientX,
                      y: e.clientY,
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
              {state.bottomPanelVisible && (
                <BottomPanel
                  bottomPanelTab={state.bottomPanelTab}
                  onBottomPanelTab={(tab) => dispatch({ type: "SET_BOTTOM_TAB", tab })}
                  onHide={() => dispatch({ type: "TOGGLE_BOTTOM_PANEL" })}
                  projectPath={state.projectPath}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <StatusBar theme={theme} onToggleTheme={onToggleTheme} />
    </div>
  );
}
