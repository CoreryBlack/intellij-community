/**
 * @see com.intellij.openapi.ui.Splitter.Divider
 * 
 * Resizable panel divider — matches IntelliJ Splitter.Divider behavior:
 * - Draggable divider between panels
 * - Cursor changes on hover
 * - Min/max constraints respected
 * - Double-click to reset to default size
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface ResizerProps {
  direction: "horizontal" | "vertical";
  size: number;
  minSize: number;
  maxSize: number;
  defaultSize: number;
  onSizeChange: (size: number) => void;
  disabled?: boolean;
}

export default function Resizer({
  direction,
  size,
  minSize,
  maxSize,
  defaultSize,
  onSizeChange,
  disabled = false,
}: ResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);
  const resizerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = direction === "horizontal" ? e.clientX : e.clientY;
    startSizeRef.current = size;
  }, [direction, disabled, size]);

  const handleDoubleClick = useCallback(() => {
    if (disabled) return;
    onSizeChange(defaultSize);
  }, [disabled, defaultSize, onSizeChange]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === "horizontal" ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      const newSize = startSizeRef.current + (direction === "horizontal" ? delta : -delta);
      const clampedSize = Math.max(minSize, Math.min(maxSize, newSize));
      onSizeChange(clampedSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, direction, minSize, maxSize, onSizeChange]);

  const cursor = disabled
    ? "default"
    : direction === "horizontal"
      ? "ew-resize"
      : "ns-resize";

  return (
    <div
      ref={resizerRef}
      style={{
        flexShrink: 0,
        width: direction === "horizontal" ? "4px" : "100%",
        height: direction === "vertical" ? "4px" : "100%",
        cursor,
        backgroundColor: isDragging ? "var(--focus-border-color, #4A6E8C)" : "transparent",
        transition: isDragging ? "none" : "background-color 0.15s ease",
        zIndex: isDragging ? 1000 : 1,
        position: "relative",
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div
        style={{
          position: "absolute",
          top: direction === "horizontal" ? 0 : "-2px",
          left: direction === "horizontal" ? "-2px" : 0,
          right: direction === "horizontal" ? "-2px" : 0,
          bottom: direction === "horizontal" ? 0 : "-2px",
          backgroundColor: isDragging ? "var(--focus-border-color, #4A6E8C)" : "transparent",
        }}
      />
    </div>
  );
}
