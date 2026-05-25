/**
 * @see com.intellij.notification.Notifications
 * @see com.intellij.notification.NotificationDisplayType
 * @see com.intellij.notification.EventLog
 *
 * Notification system — mirrors IntelliJ's balloon notifications
 * Shows in bottom-right corner, auto-dismiss after timeout
 */

import { useEffect } from "react";
import { useIdeStore } from "../store/ideStore";
import type { Notification } from "../store/ideStore";

interface Props {}

export default function NotificationStack({}: Props) {
  const { state, dispatch } = useIdeStore();

  return (
    <div style={{
      position: "fixed",
      bottom: 36,
      right: 12,
      zIndex: 9000,
      display: "flex",
      flexDirection: "column-reverse",
      gap: 6,
      maxWidth: 360,
    }}>
      {state.notifications.map(n => (
        <NotificationItem key={n.id} notification={n} onDismiss={() => dispatch({ type: "DISMISS_NOTIFICATION", id: n.id })} />
      ))}
    </div>
  );
}

function NotificationItem({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const typeColor = notification.type === "error" ? "var(--ide-accent-red)"
    : notification.type === "warning" ? "var(--ide-accent-orange)"
    : "var(--ide-accent-blue)";

  return (
    <div style={{
      background: "var(--ide-bg-popup)",
      border: "1px solid var(--ide-border)",
      borderLeft: `3px solid ${typeColor}`,
      borderRadius: "var(--ide-radius-md)",
      boxShadow: "var(--ide-shadow-md)",
      padding: "10px 14px",
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--ide-font-size-sm)", fontWeight: 500, color: "var(--ide-text-default)", marginBottom: 2 }}>{notification.title}</div>
        <div style={{ fontSize: "var(--ide-font-size-xs)", color: "var(--ide-text-muted)" }}>{notification.message}</div>
      </div>
      <button onClick={onDismiss} style={{
        border: "none",
        background: "transparent",
        color: "var(--ide-text-disabled)",
        cursor: "pointer",
        fontSize: 14,
        padding: 0,
        lineHeight: 1,
      }}>✕</button>
    </div>
  );
}

export function notify(dispatch: React.Dispatch<import("../store/ideStore").IdeAction>, type: Notification["type"], title: string, message: string) {
  dispatch({
    type: "ADD_NOTIFICATION",
    notification: {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      type,
      title,
      message,
      timestamp: Date.now(),
    },
  });
}
