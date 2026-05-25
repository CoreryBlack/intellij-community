import { useReducer, useEffect, useCallback, useState } from "react";
import "./styles/global.css";
import WelcomeScreen from "./pages/WelcomeScreen";
import MainLayout from "./pages/MainLayout";
import ContextMenu from "./components/ContextMenu";
import SearchEverywhere from "./components/SearchEverywhere";
import NotificationStack from "./components/NotificationStack";
import { IdeStoreContext, ideReducer, createInitialIdeState } from "./store/ideStore";
import { findAction } from "./services/keymap";

type Page = "welcome" | "main";

export default function App() {
  const [state, dispatch] = useReducer(ideReducer, undefined, createInitialIdeState);
  const [page, setPage] = useState<Page>("welcome");

  const handleOpenProject = useCallback((path: string) => {
    dispatch({ type: "SET_PROJECT", path });
    setPage("main");
  }, []);

  const handleNewProject = useCallback(() => {
    setPage("main");
  }, []);

  const handleBackToWelcome = useCallback(() => {
    dispatch({ type: "SET_PROJECT", path: "" });
    setPage("welcome");
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const action = findAction(e);
      if (!action) return;

      switch (action) {
        case "search-everywhere":
          e.preventDefault();
          dispatch({ type: "SHOW_MODAL", modal: { type: "search-everywhere" } });
          break;
        case "tool-window-project":
          e.preventDefault();
          dispatch({ type: "TOGGLE_TOOL_WINDOW", id: "project" });
          break;
        case "tool-window-search":
          e.preventDefault();
          dispatch({ type: "TOGGLE_TOOL_WINDOW", id: "search" });
          break;
        case "tool-window-git":
          e.preventDefault();
          dispatch({ type: "TOGGLE_TOOL_WINDOW", id: "git" });
          break;
        case "tool-window-run":
          e.preventDefault();
          dispatch({ type: "TOGGLE_TOOL_WINDOW", id: "run" });
          break;
        case "tool-window-structure":
          e.preventDefault();
          dispatch({ type: "TOGGLE_TOOL_WINDOW", id: "structure" });
          break;
        case "tool-window-terminal":
          e.preventDefault();
          dispatch({ type: "TOGGLE_TOOL_WINDOW", id: "terminal" });
          break;
        case "close-tab":
          e.preventDefault();
          if (state.activeFilePath) dispatch({ type: "CLOSE_FILE", path: state.activeFilePath });
          break;
        case "save":
          e.preventDefault();
          break;
        case "escape":
          if (state.modal) dispatch({ type: "HIDE_MODAL" });
          if (state.contextMenu) dispatch({ type: "HIDE_CONTEXT_MENU" });
          break;
        case "settings":
          e.preventDefault();
          dispatch({ type: "SHOW_MODAL", modal: { type: "settings" } });
          break;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [state.activeFilePath, state.modal, state.contextMenu]);

  useEffect(() => {
    const handler = () => {
      if (state.contextMenu) dispatch({ type: "HIDE_CONTEXT_MENU" });
    };
    window.addEventListener("scroll", handler, true);
    return () => window.removeEventListener("scroll", handler, true);
  }, [state.contextMenu]);

  return (
    <IdeStoreContext.Provider value={{ state, dispatch }}>
      <div className={state.theme === "light" ? "light" : ""} style={{ height: "100%", width: "100%" }}>
        {page === "welcome" ? (
          <WelcomeScreen
            onOpenProject={handleOpenProject}
            onNewProject={handleNewProject}
            theme={state.theme}
            onToggleTheme={() => dispatch({ type: "TOGGLE_THEME" })}
          />
        ) : (
          <MainLayout
            projectPath={state.projectPath}
            theme={state.theme}
            onToggleTheme={() => dispatch({ type: "TOGGLE_THEME" })}
            onBackToWelcome={handleBackToWelcome}
          />
        )}

        {state.contextMenu && (
          <ContextMenu menu={state.contextMenu} onClose={() => dispatch({ type: "HIDE_CONTEXT_MENU" })} />
        )}

        {state.modal?.type === "search-everywhere" && (
          <SearchEverywhere onClose={() => dispatch({ type: "HIDE_MODAL" })} />
        )}

        <NotificationStack />
      </div>
    </IdeStoreContext.Provider>
  );
}
