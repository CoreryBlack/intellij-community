/**
 * @see com.intellij.openapi.project.Project
 * @see com.intellij.openapi.fileEditor.FileEditorManager
 * @see com.intellij.openapi.wm.ToolWindowManager
 *
 * Global IDE state store — mirrors IntelliJ's Project + ToolWindowManager + FileEditorManager
 * All state flows through this single store, components subscribe via React context
 */

import { createContext, useContext } from "react";

export type ToolWindowId = "project" | "search" | "git" | "run" | "structure" | "terminal" | "problems" | "services";
export type ToolWindowAnchor = "left" | "bottom" | "right" | "top";
export type BottomTab = "terminal" | "problems" | "services";

export interface DirEntry {
  name: string;
  path: string;
  is_dir: boolean;
  ext?: string;
}

export interface OpenFile {
  name: string;
  path: string;
  content: string;
  lang: string;
  modified: boolean;
  scrollTop: number;
  cursorLine: number;
  cursorCol: number;
}

export interface SearchMatch {
  file: string;
  line: number;
  col: number;
  text: string;
}

export interface IdeState {
  projectPath: string;
  projectName: string;
  theme: "dark" | "light";

  toolWindows: Record<ToolWindowId, {
    visible: boolean;
    anchor: ToolWindowAnchor;
    active: boolean;
  }>;
  activeToolWindow: ToolWindowId | null;
  sidebarVisible: boolean;
  bottomPanelVisible: boolean;
  bottomPanelTab: BottomTab;

  openFiles: OpenFile[];
  activeFilePath: string | null;

  fileTree: DirEntry[];
  fileTreeLoading: boolean;

  searchQuery: string;
  searchResults: SearchMatch[];
  searchLoading: boolean;

  notifications: Notification[];
  contextMenu: ContextMenuState | null;
  modal: ModalState | null;

  statusMessage: string;
  gitBranch: string;
  gitClean: boolean;
}

export interface Notification {
  id: string;
  type: "info" | "warning" | "error";
  title: string;
  message: string;
  timestamp: number;
}

export interface ContextMenuItem {
  label: string;
  shortcut?: string;
  action: () => void;
  separator?: boolean;
  disabled?: boolean;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export interface ModalState {
  type: "search-everywhere" | "settings" | "about" | "confirm" | "goto-file";
  data?: unknown;
}

export type IdeAction =
  | { type: "SET_PROJECT"; path: string }
  | { type: "TOGGLE_THEME" }
  | { type: "TOGGLE_TOOL_WINDOW"; id: ToolWindowId }
  | { type: "SET_ACTIVE_TOOL_WINDOW"; id: ToolWindowId | null }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "TOGGLE_BOTTOM_PANEL" }
  | { type: "SET_BOTTOM_TAB"; tab: BottomTab }
  | { type: "OPEN_FILE"; file: OpenFile }
  | { type: "CLOSE_FILE"; path: string }
  | { type: "SET_ACTIVE_FILE"; path: string }
  | { type: "UPDATE_FILE_CONTENT"; path: string; content: string }
  | { type: "SET_FILE_TREE"; entries: DirEntry[] }
  | { type: "SET_FILE_TREE_LOADING"; loading: boolean }
  | { type: "SET_SEARCH_QUERY"; query: string }
  | { type: "SET_SEARCH_RESULTS"; results: SearchMatch[] }
  | { type: "SET_SEARCH_LOADING"; loading: boolean }
  | { type: "ADD_NOTIFICATION"; notification: Notification }
  | { type: "DISMISS_NOTIFICATION"; id: string }
  | { type: "SHOW_CONTEXT_MENU"; menu: ContextMenuState }
  | { type: "HIDE_CONTEXT_MENU" }
  | { type: "SHOW_MODAL"; modal: ModalState }
  | { type: "HIDE_MODAL" }
  | { type: "SET_STATUS_MESSAGE"; message: string }
  | { type: "SET_GIT"; branch: string; clean: boolean }
  | { type: "SET_OPEN_FILES"; files: OpenFile[] };

export function createInitialIdeState(): IdeState {
  return {
    projectPath: "",
    projectName: "",
    theme: "dark",
    toolWindows: {
      project: { visible: true, anchor: "left", active: true },
      search: { visible: false, anchor: "left", active: false },
      git: { visible: false, anchor: "left", active: false },
      run: { visible: false, anchor: "left", active: false },
      structure: { visible: false, anchor: "left", active: false },
      terminal: { visible: true, anchor: "bottom", active: false },
      problems: { visible: false, anchor: "bottom", active: false },
      services: { visible: false, anchor: "bottom", active: false },
    },
    activeToolWindow: "project",
    sidebarVisible: true,
    bottomPanelVisible: true,
    bottomPanelTab: "terminal",
    openFiles: [],
    activeFilePath: null,
    fileTree: [],
    fileTreeLoading: false,
    searchQuery: "",
    searchResults: [],
    searchLoading: false,
    notifications: [],
    contextMenu: null,
    modal: null,
    statusMessage: "Ready",
    gitBranch: "main",
    gitClean: true,
  };
}

export function ideReducer(state: IdeState, action: IdeAction): IdeState {
  switch (action.type) {
    case "SET_PROJECT":
      return {
        ...state,
        projectPath: action.path,
        projectName: action.path.split("/").pop()?.split("\\").pop() || "Project",
        openFiles: [],
        activeFilePath: null,
        fileTree: [],
      };
    case "TOGGLE_THEME":
      return { ...state, theme: state.theme === "dark" ? "light" : "dark" };
    case "TOGGLE_TOOL_WINDOW": {
      const tw = state.toolWindows[action.id];
      const newVisible = !tw.visible;
      const isLeft = tw.anchor === "left";
      const isBottom = tw.anchor === "bottom";
      return {
        ...state,
        toolWindows: {
          ...state.toolWindows,
          [action.id]: { ...tw, visible: newVisible, active: newVisible },
        },
        sidebarVisible: isLeft ? (action.id === state.activeToolWindow ? !state.sidebarVisible : true) : state.sidebarVisible,
        bottomPanelVisible: isBottom ? (action.id === "terminal" ? !state.bottomPanelVisible : true) : state.bottomPanelVisible,
        activeToolWindow: isLeft ? action.id : state.activeToolWindow,
      };
    }
    case "SET_ACTIVE_TOOL_WINDOW":
      return { ...state, activeToolWindow: action.id };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarVisible: !state.sidebarVisible };
    case "TOGGLE_BOTTOM_PANEL":
      return { ...state, bottomPanelVisible: !state.bottomPanelVisible };
    case "SET_BOTTOM_TAB":
      return { ...state, bottomPanelTab: action.tab, bottomPanelVisible: true };
    case "OPEN_FILE": {
      const existing = state.openFiles.find(f => f.path === action.file.path);
      if (existing) return { ...state, activeFilePath: action.file.path };
      return {
        ...state,
        openFiles: [...state.openFiles, action.file],
        activeFilePath: action.file.path,
      };
    }
    case "CLOSE_FILE": {
      const files = state.openFiles.filter(f => f.path !== action.path);
      let newActive = state.activeFilePath;
      if (state.activeFilePath === action.path) {
        const idx = state.openFiles.findIndex(f => f.path === action.path);
        newActive = files.length > 0 ? files[Math.min(idx, files.length - 1)].path : null;
      }
      return { ...state, openFiles: files, activeFilePath: newActive };
    }
    case "SET_ACTIVE_FILE":
      return { ...state, activeFilePath: action.path };
    case "UPDATE_FILE_CONTENT":
      return {
        ...state,
        openFiles: state.openFiles.map(f =>
          f.path === action.path ? { ...f, content: action.content, modified: true } : f
        ),
      };
    case "SET_FILE_TREE":
      return { ...state, fileTree: action.entries, fileTreeLoading: false };
    case "SET_FILE_TREE_LOADING":
      return { ...state, fileTreeLoading: action.loading };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.query };
    case "SET_SEARCH_RESULTS":
      return { ...state, searchResults: action.results, searchLoading: false };
    case "SET_SEARCH_LOADING":
      return { ...state, searchLoading: action.loading };
    case "ADD_NOTIFICATION":
      return { ...state, notifications: [...state.notifications, action.notification] };
    case "DISMISS_NOTIFICATION":
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.id) };
    case "SHOW_CONTEXT_MENU":
      return { ...state, contextMenu: action.menu };
    case "HIDE_CONTEXT_MENU":
      return { ...state, contextMenu: null };
    case "SHOW_MODAL":
      return { ...state, modal: action.modal };
    case "HIDE_MODAL":
      return { ...state, modal: null };
    case "SET_STATUS_MESSAGE":
      return { ...state, statusMessage: action.message };
    case "SET_GIT":
      return { ...state, gitBranch: action.branch, gitClean: action.clean };
    case "SET_OPEN_FILES":
      return { ...state, openFiles: action.files };
    default:
      return state;
  }
}

export interface IdeStoreContextType {
  state: IdeState;
  dispatch: React.Dispatch<IdeAction>;
}

export const IdeStoreContext = createContext<IdeStoreContextType | null>(null);

export function useIdeStore(): IdeStoreContextType {
  const ctx = useContext(IdeStoreContext);
  if (!ctx) throw new Error("useIdeStore must be used within IdeStoreProvider");
  return ctx;
}

export function useIdeState(): IdeState {
  return useIdeStore().state;
}

export function useIdeDispatch(): React.Dispatch<IdeAction> {
  return useIdeStore().dispatch;
}
