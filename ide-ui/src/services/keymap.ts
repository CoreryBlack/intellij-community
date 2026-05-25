/**
 * @see com.intellij.openapi.keymap.KeymapManager
 * @see com.intellij.openapi.actionSystem.ActionManager
 *
 * Keyboard shortcut system — mirrors IntelliJ's keymap/action system
 * Actions are identified by ID, bound to key combinations
 */

export interface KeyBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: string;
}

export const DEFAULT_KEYMAP: KeyBinding[] = [
  { key: "p", ctrl: true, action: "search-everywhere" },
  { key: "n", ctrl: true, action: "new-file" },
  { key: "o", ctrl: true, action: "open-file" },
  { key: "e", ctrl: true, action: "recent-files" },
  { key: "f", ctrl: true, action: "find" },
  { key: "r", ctrl: true, shift: true, action: "replace" },
  { key: "h", ctrl: true, shift: true, action: "find-in-files" },
  { key: "s", ctrl: true, action: "save" },
  { key: "w", ctrl: true, action: "close-tab" },
  { key: "Tab", ctrl: true, action: "switch-tab-next" },
  { key: "Tab", ctrl: true, shift: true, action: "switch-tab-prev" },
  { key: "1", alt: true, action: "tool-window-project" },
  { key: "2", alt: true, action: "tool-window-search" },
  { key: "4", alt: true, action: "tool-window-run" },
  { key: "7", alt: true, action: "tool-window-structure" },
  { key: "9", alt: true, action: "tool-window-git" },
  { key: "F12", alt: true, action: "tool-window-terminal" },
  { key: "b", ctrl: true, action: "goto-declaration" },
  { key: "b", ctrl: true, alt: true, action: "goto-implementation" },
  { key: "F7", shift: true, action: "find-usages" },
  { key: "g", ctrl: true, action: "goto-line" },
  { key: "F10", shift: true, action: "run" },
  { key: "F9", shift: true, action: "debug" },
  { key: "k", ctrl: true, action: "git-commit" },
  { key: "k", ctrl: true, shift: true, action: "git-push" },
  { key: "`", ctrl: true, action: "quick-switch-scheme" },
  { key: ",", ctrl: true, alt: true, action: "settings" },
  { key: ";", ctrl: true, shift: true, action: "search-everywhere" },
  { key: "F11", action: "toggle-fullscreen" },
  { key: "Escape", action: "escape" },
  { key: "Enter", action: "enter" },
];

export function formatShortcut(binding: KeyBinding): string {
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.alt) parts.push("Alt");
  if (binding.shift) parts.push("Shift");
  if (binding.meta) parts.push("⌘");
  parts.push(binding.key.length === 1 ? binding.key.toUpperCase() : binding.key);
  return parts.join("+");
}

export function matchKeyEvent(e: KeyboardEvent, binding: KeyBinding): boolean {
  return e.key.toLowerCase() === binding.key.toLowerCase()
    && !!e.ctrlKey === !!binding.ctrl
    && !!e.altKey === !!binding.alt
    && !!e.shiftKey === !!binding.shift
    && !!e.metaKey === !!binding.meta;
}

export function findAction(e: KeyboardEvent): string | null {
  for (const binding of DEFAULT_KEYMAP) {
    if (matchKeyEvent(e, binding)) return binding.action;
  }
  return null;
}
