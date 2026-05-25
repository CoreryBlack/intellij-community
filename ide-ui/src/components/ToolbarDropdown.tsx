/**
 * @see com.intellij.openapi.wm.impl.headertoolbar.MainMenuButton.ShowMenuAction
 * @see com.intellij.openapi.ui.JBPopupMenu
 * @see com.intellij.openapi.actionSystem.impl.ActionMenu
 *
 * ToolbarDropdown — renders a popup dropdown menu positioned below a trigger button.
 * Mirrors JBPopupFactory.createActionGroupPopup behavior:
 *   - showUnderneathOf the trigger button
 *   - Submenus expand to the right on hover (ActionMenu -> JBPopupMenu)
 *   - Keyboard: up/down navigate, Enter select, Escape close, Left back to parent
 *   - SpeedSearch: type to filter menu items
 *   - Auto-close on click outside
 */

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";

export interface MenuItem {
  id: string;
  label: string;
  item_type: "Action" | "Separator" | "Submenu" | "SectionHeader";
  icon: string | null;
  shortcut: string | null;
  enabled: boolean;
  visible: boolean;
  checked: boolean | null;
  toggle: boolean;
  children: MenuItem[];
  click_action: string | null;
}

interface Props {
  triggerRect: DOMRect;
  items: MenuItem[];
  onClose: () => void;
  onAction: (action: MenuItem) => void;
  triggerId?: string;
}

function formatShortcut(shortcut: string): string {
  return shortcut
    .replace(/Ctrl\+/g, "⌃")
    .replace(/Alt\+/g, "⌥")
    .replace(/Shift\+/g, "⇧")
    .replace(/Backspace/g, "⌫")
    .replace(/Delete/g, "⌦")
    .replace(/Insert/g, "Ins")
    .replace(/Enter/g, "↵")
    .replace(/Escape/g, "Esc");
}

export default function ToolbarDropdown({ triggerRect, items, onClose, onAction }: Props) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [submenuIndex, setSubmenuIndex] = useState<number | null>(null);
  const [submenuRect, setSubmenuRect] = useState<DOMRect | null>(null);
  const [search, setSearch] = useState("");
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const searchTimeout = useRef<number | undefined>();

  const visibleItems = items.filter(i => i.visible);
  const actionItems = visibleItems.filter(i => i.item_type !== "Separator");
  const filteredItems = search
    ? visibleItems.filter(i =>
        i.item_type !== "Separator" &&
        i.label.toLowerCase().includes(search.toLowerCase()))
    : visibleItems;

  useEffect(() => {
    const top = Math.min(triggerRect.bottom + 2, window.innerHeight - 420);
    const left = Math.min(triggerRect.left, window.innerWidth - 260);
    setMenuPos({ top, left: Math.max(left, 0) });
  }, [triggerRect]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        if (submenuIndex !== null) {
          setSubmenuIndex(null);
          setSubmenuRect(null);
        } else {
          onClose();
        }
        return;
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose, submenuIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const actives = actionItems;
    const currentActiveId = activeIndex >= 0 ? filteredItems[activeIndex]?.id : null;
    const currentIndexInActions = currentActiveId
      ? actives.findIndex(a => a.id === currentActiveId)
      : -1;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        let next = currentIndexInActions + 1;
        if (next >= actives.length) next = 0;
        const nextItem = actives[next];
        const nextFilteredIndex = filteredItems.findIndex(f => f.id === nextItem.id);
        setActiveIndex(nextFilteredIndex);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        let prev = currentIndexInActions - 1;
        if (prev < 0) prev = actives.length - 1;
        const prevItem = actives[prev];
        const prevFilteredIndex = filteredItems.findIndex(f => f.id === prevItem.id);
        setActiveIndex(prevFilteredIndex);
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredItems.length) {
          const item = filteredItems[activeIndex];
          handleItemClick(item);
        }
        break;
      }
      case "ArrowRight": {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredItems.length) {
          const item = filteredItems[activeIndex];
          if (item.item_type === "Submenu" && item.children.length > 0) {
            openSubmenu(item, activeIndex);
          }
        }
        break;
      }
      case "ArrowLeft": {
        e.preventDefault();
        if (submenuIndex !== null) {
          setSubmenuIndex(null);
          setSubmenuRect(null);
        }
        break;
      }
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          setSearch(prev => {
            const s = prev + e.key;
            clearTimeout(searchTimeout.current);
            searchTimeout.current = window.setTimeout(() => setSearch(""), 800);
            return s;
          });
        }
        break;
    }
  }, [activeIndex, filteredItems, submenuIndex]);

  const handleItemClick = (item: MenuItem) => {
    if (item.item_type === "Submenu" && item.children.length > 0) {
      const idx = filteredItems.findIndex(f => f.id === item.id);
      openSubmenu(item, idx);
      return;
    }
    if (item.click_action) {
      onAction(item);
    }
    if (item.item_type !== "Submenu") {
      onClose();
    }
  };

  const openSubmenu = (_item: MenuItem, index: number) => {
    setSubmenuIndex(index);
    const el = itemRefs.current[index];
    if (el) {
      const rect = el.getBoundingClientRect();
      setSubmenuRect(rect);
    }
  };

  const highlightMatch = (text: string) => {
    if (!search) return text;
    const idx = text.toLowerCase().indexOf(search.toLowerCase());
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ background: "#3871E1", color: "#FFF", borderRadius: 2 }}>{text.slice(idx, idx + search.length)}</span>
        {text.slice(idx + search.length)}
      </>
    );
  };

  return (
    <>
      <div
        ref={menuRef}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{
          position: "fixed",
          top: menuPos.top,
          left: menuPos.left,
          minWidth: 240,
          maxWidth: 340,
          maxHeight: 420,
          overflowY: "auto",
          background: "var(--ide-bg-popup)",
          border: "1px solid var(--ide-border-popup)",
          borderRadius: 8,
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          padding: "6px 0",
          zIndex: 10000,
          outline: "none",
          fontSize: "var(--ide-font-size-sm)",
          color: "var(--ide-text-default)",
        }}
        autoFocus
      >
        {filteredItems.length === 0 && (
          <div style={{ padding: "8px 16px", color: "var(--ide-text-disabled)" }}>No results</div>
        )}
        {filteredItems.map((item, i) => {
          if (item.item_type === "Separator") {
            return <div key={`sep-${i}`} style={{ height: 1, background: "var(--ide-border-subtle)", margin: "4px 8px" }} />;
          }

          const isActive = i === activeIndex;
          const isDisabled = !item.enabled;

          return (
            <div
              key={item.id || `item-${i}`}
              ref={el => { itemRefs.current[i] = el; }}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "5px 16px 5px 8px",
                cursor: isDisabled ? "default" : "pointer",
                background: isActive ? "var(--toolbar-bg-hovered)" : "transparent",
                opacity: isDisabled ? 0.4 : 1,
                gap: 6,
                minHeight: 26,
              }}
              onMouseEnter={() => {
                setActiveIndex(i);
                if (submenuIndex !== null) {
                  setSubmenuIndex(null);
                  setSubmenuRect(null);
                }
                if (item.item_type === "Submenu" && item.children.length > 0) {
                  setTimeout(() => {
                    const idx = itemRefs.current.findIndex((_el, j) =>
                      filteredItems[j]?.id === item.id
                    );
                    if (idx >= 0) openSubmenu(item, idx);
                  }, 250);
                }
              }}
              onClick={() => handleItemClick(item)}
            >
              <span style={{ width: 20, display: "inline-flex", justifyContent: "center", flexShrink: 0 }}>
                {item.checked === true && <span style={{ color: "var(--ide-accent-blue)", fontWeight: 600 }}>✓</span>}
              </span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {highlightMatch(item.label)}
              </span>
              {item.shortcut && (
                <span style={{
                  color: "var(--ide-text-disabled)",
                  fontSize: "var(--ide-font-size-xs)",
                  marginLeft: 32,
                  flexShrink: 0,
                }}>
                  {formatShortcut(item.shortcut)}
                </span>
              )}
              {item.item_type === "Submenu" && (
                <svg width="6" height="10" viewBox="0 0 6 10" fill="currentColor" style={{ color: "var(--ide-text-disabled)", flexShrink: 0, marginLeft: 4 }}>
                  <path d="M0 0l6 5-6 5" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {submenuIndex !== null && submenuRect && (() => {
        const subId = filteredItems[submenuIndex]?.id;
        const subItems = items.find(it => it.id === subId)?.children || [];
        return (
          <ToolbarDropdown
            triggerRect={{
              ...submenuRect,
              bottom: submenuRect.top,
              left: submenuRect.right,
              width: submenuRect.width,
              height: submenuRect.height,
              top: submenuRect.top,
              right: submenuRect.right,
            } as DOMRect}
            items={subItems}
            onClose={() => { setSubmenuIndex(null); setSubmenuRect(null); }}
            onAction={onAction}
            triggerId={`sub-${subId}`}
          />
        );
      })()}
    </>
  );
}
