/**
 * @see com.intellij.openapi.wm.impl.status.IdeStatusBarImpl
 *
 * Official IdeStatusBarImpl layout:
 *   BorderLayout
 *   ├─ WEST:   leftPanel (BoxLayout.X_AXIS)
 *   │    border: empty(0,4,0,1)
 *   │    Contains: Git branch widget, Problems widget
 *   ├─ CENTER: centerPanel (BorderLayout)
 *   │    Contains: InfoAndProgressPanel (messages, progress bars)
 *   └─ EAST:   rightPanel (GridBagLayout)
 *        border: emptyLeft(1)
 *        Contains: cursor position, encoding, line separator, language, etc.
 *
 * Key parameters:
 *   - height: 28px
 *   - topBorderWidth: 1px
 *   - horizontal padding: 10px (from CompoundBorder outer empty(0,10))
 *   - item height: 24px
 *   - font: JBUI.CurrentTheme.StatusBar.font()
 *   - background: layer1-bg (#26282C)
 *   - Widget hover: bg-hover effect
 *   - leftPanel widgets: no hover effect
 *   - rightPanel widgets: hover effect
 */

interface Props {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export default function StatusBar({ theme, onToggleTheme }: Props) {
  const widget = (hover = false): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    padding: "0 7px",
    height: "var(--ide-status-bar-item-height)",
    borderRadius: "var(--ide-radius-sm)",
    cursor: hover ? "pointer" : "default",
    color: "var(--ide-text-muted)",
    fontSize: "var(--ide-font-size-xs)",
    transition: "background var(--ide-transition-fast)",
  });

  return (
    <div style={{
      height: "var(--ide-status-bar-height)",
      display: "flex",
      alignItems: "center",
      background: "var(--ide-bg-statusbar)",
      borderTop: "var(--ide-status-bar-top-border) solid var(--ide-border-toolbar)",
      padding: "0 var(--ide-status-bar-padding-h)",
      flexShrink: 0,
      fontSize: "var(--ide-font-size-xs)",
    }}>
      {/* ═══════ WEST: leftPanel ═══════
       * @see IdeStatusBarImpl leftPanel
       * border: empty(0,4,0,1)
       * Contains: Git branch, Problems count
       * No hover effect on left panel widgets
       */}
      <div style={{ display: "flex", alignItems: "center", gap: 1, paddingRight: 4, borderRight: "1px solid var(--ide-border-subtle)" }}>
        <span style={{
          ...widget(),
          background: "var(--ide-bg-active)",
          fontWeight: 500,
          color: "var(--ide-text-default)",
        }}>
          ⎇ main
        </span>
        <span style={widget()}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--ide-accent-green)" style={{ marginRight: 2 }}>
            <path d="M8 0a1.5 1.5 0 0 1 1.5 1.5v3.79l2.71 2.71a1.5 1.5 0 0 1-2.12 2.12L8 7.91l-2.09 2.09A1.5 1.5 0 1 1 3.79 8L6.5 5.29V1.5A1.5 1.5 0 0 1 8 0z" />
          </svg>
          0 problems
        </span>
      </div>

      {/* ═══════ CENTER: centerPanel ═══════
       * @see IdeStatusBarImpl centerPanel
       * Contains: InfoAndProgressPanel (messages, build progress)
       */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 8px" }}>
        <span style={{ color: "var(--ide-text-secondary)", fontSize: "var(--ide-font-size-xs)" }}>Ready</span>
      </div>

      {/* ═══════ EAST: rightPanel ═══════
       * @see IdeStatusBarImpl rightPanel
       * border: emptyLeft(1)
       * Contains: cursor position, encoding, line separator, language
       * Has hover effect on right panel widgets
       */}
      <div style={{ display: "flex", alignItems: "center", gap: 1, paddingLeft: 4, borderLeft: "1px solid var(--ide-border-subtle)" }}>
        <span style={widget()}>Ln 12, Col 20</span>
        <span style={widget(true)}
          onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >UTF-8</span>
        <span style={widget(true)}
          onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >Spaces: 4</span>
        <span style={widget(true)}
          onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >CRLF</span>
        <span style={{
          ...widget(true),
          color: "var(--ide-text-default)",
          fontWeight: 500,
        }}
          onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >Java</span>
        <span style={widget()}>🔒</span>

        <button style={widget(true)}
          onClick={onToggleTheme}
          title="Toggle theme"
          onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          {theme === "dark" ? (
            <><svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z" /></svg> Dark</>
          ) : (
            <><svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.45 0 .89-.065a.77.77 0 0 1 .67.665c-.125 3.401-2.938 6.127-6.396 6.127A6.68 6.68 0 0 1 3.3 16.64 6.7 6.7 0 0 1 .278 6.465C.278 3.005 3.018.24 6 .278z" /></svg> Light</>
          )}
        </button>
      </div>
    </div>
  );
}
