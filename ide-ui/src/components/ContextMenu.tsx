/**
 * @see com.intellij.openapi.ui.popup.JBPopupFactory
 * @see com.intellij.ui.popup.PopupFactoryImpl.ActionPopupStep
 *
 * Context menu — mirrors IntelliJ's right-click context menus
 * Positioned at mouse coordinates, with keyboard navigation
 */

import React, { useEffect, useRef, useState } from "react";
import type { ContextMenuState, ContextMenuItem } from "../store/ideStore";

interface Props {
  menu: ContextMenuState;
  onClose: () => void;
}

export default function ContextMenu({ menu, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const filteredItems = menu.items.filter(i => !i.separator || true);

  return (
    <div ref={ref} style={{
      position: "fixed",
      left: menu.x,
      top: menu.y,
      zIndex: 10000,
      minWidth: 200,
      background: "var(--ide-bg-popup)",
      border: "1px solid var(--ide-border)",
      borderRadius: "var(--ide-radius-md)",
      boxShadow: "var(--ide-shadow-popup)",
      padding: "4px 0",
      fontSize: "var(--ide-font-size-sm)",
      color: "var(--ide-text-default)",
      maxHeight: 400,
      overflowY: "auto",
    }}>
      {filteredItems.map((item, i) => {
        if (item.separator) {
          return <div key={`sep-${i}`} style={{ height: 1, background: "var(--ide-border)", margin: "4px 8px" }} />;
        }
        return (
          <div key={i}
            onClick={() => { item.action(); onClose(); }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(-1)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "4px 12px",
              cursor: item.disabled ? "default" : "pointer",
              color: item.disabled ? "var(--ide-text-disabled)" : "var(--ide-text-default)",
              background: hoveredIdx === i ? "var(--ide-bg-hover)" : "transparent",
              transition: "background var(--ide-transition-fast)",
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span style={{ color: "var(--ide-text-disabled)", fontSize: "var(--ide-font-size-xs)", marginLeft: 24 }}>
                {item.shortcut}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
