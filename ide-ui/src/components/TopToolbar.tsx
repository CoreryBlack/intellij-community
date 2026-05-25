/**
 * @see com.intellij.openapi.wm.impl.headertoolbar.MainToolbar
 *
 * Official MainToolbar layout:
 *   HorizontalLayout(layoutGap = 10)
 *   ├─ [LEFT]   MainMenuWithButton (hamburger menu + project name popup)
 *   ├─ [CENTER] ActionToolbar (Search Everywhere + Run + Debug)
 *   └─ [RIGHT]  ActionToolbar (VCS commit/push/pull + Search + Settings)
 *
 * Key parameters:
 *   - layoutGap = 10 (horizontal spacing between groups)
 *   - buttonInsets: top=2, left=6, bottom=2, right=6
 *   - HeaderToolbarButtonLook: transparent bg, no border, hover=toolbar-bg-hovered
 *   - experimentalToolbarFont: 13px
 *   - COMPRESSING_STRATEGY: shrinks when space insufficient
 *   - toolbarHeight: 44px
 *   - background: layer1-bg (#26282C)
 *   - border: customLineBottom(borderColor)
 */

interface Props {
  projectName: string;
  onBackToWelcome: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onSearchEverywhere: () => void;
}

export default function TopToolbar({ projectName, onBackToWelcome, theme, onToggleTheme, onSearchEverywhere }: Props) {
  const toolbarBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    minWidth: 30,
    padding: "var(--toolbar-button-insets-top) var(--toolbar-button-insets-right) var(--toolbar-button-insets-bottom) var(--toolbar-button-insets-left)",
    border: "none",
    borderRadius: "var(--toolbar-button-arc)",
    background: "transparent",
    color: "var(--ide-text-muted)",
    cursor: "pointer",
    fontSize: "var(--ide-font-toolbar)",
    transition: "background var(--ide-transition-fast)",
    flexShrink: 0,
  };

  return (
    <div style={{
      height: "var(--ide-toolbar-height)",
      display: "flex",
      alignItems: "center",
      background: "var(--ide-bg-toolbar)",
      borderBottom: "1px solid var(--ide-border-toolbar)",
      padding: "0 6px",
      flexShrink: 0,
      gap: "var(--ide-main-toolbar-layout-gap)",
    }}>
      {/* ═══════ LEFT: MainMenuWithButton ═══════
       * @see com.intellij.openapi.wm.impl.headertoolbar.MainMenuWithButton
       * Hamburger menu button + Project name dropdown
       * In New UI, the classic menu bar is replaced by a hamburger button
       */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        {/* Hamburger menu button — opens main menu */}
        <button
          style={toolbarBtn}
          onClick={onBackToWelcome}
          title="Main Menu"
          onMouseOver={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="3" width="12" height="2" rx="1" />
            <rect x="2" y="7" width="12" height="2" rx="1" />
            <rect x="2" y="11" width="12" height="2" rx="1" />
          </svg>
        </button>

        {/* Project name button — opens project/recent projects popup */}
        <button style={{
          ...toolbarBtn,
          gap: 4,
          padding: "2px 8px",
          fontWeight: 600,
          color: "var(--ide-text-default)",
          fontSize: "var(--ide-font-toolbar)",
        }}
          title="Recent Projects"
          onMouseOver={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          <span>{projectName}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ color: "var(--ide-text-disabled)" }}>
            <path d="M2 3l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ═══════ CENTER: Search + Run + Debug ═══════
       * @see MainToolbar center ActionToolbar
       * Search Everywhere input + Run configuration + Debug button
       */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2, justifyContent: "center", minWidth: 0 }}>
        {/* Search Everywhere — Double Shift */}
        <button style={{
          ...toolbarBtn,
          gap: 6,
          padding: "2px 12px",
          color: "var(--ide-text-secondary)",
          fontSize: "var(--ide-font-size-sm)",
          flexShrink: 1,
          minWidth: 120,
          maxWidth: 280,
        }}
          title="Search Everywhere (Double Shift)"
          onClick={onSearchEverywhere}
          onMouseOver={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10 10l4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Search</span>
        </button>

        {/* Run configuration selector */}
        <button style={{
          ...toolbarBtn,
          gap: 4,
          padding: "2px 8px",
          color: "var(--ide-text-default)",
          fontSize: "var(--ide-font-size-sm)",
        }}
          title="Run Configuration"
          onMouseOver={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="var(--ide-accent-green)">
            <path d="M4 2v12l10-6z" />
          </svg>
          <span>AstralMonitorApplication</span>
          <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" style={{ color: "var(--ide-text-disabled)" }}>
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Run button */}
        <button style={{
          ...toolbarBtn,
          color: "var(--ide-accent-green)",
        }}
          title="Run (Shift+F10)"
          onMouseOver={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2v12l10-6z" />
          </svg>
        </button>

        {/* Debug button */}
        <button style={{
          ...toolbarBtn,
          color: "var(--ide-text-muted)",
        }}
          title="Debug (Shift+F9)"
          onMouseOver={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5 2v4H3v4h2v4h2v-4h2V6H9V2H7zm6 3v6h2V5h-2z" />
          </svg>
        </button>
      </div>

      {/* ═══════ RIGHT: VCS + Search + Settings ═══════
       * @see MainToolbar right ActionToolbar
       * Git branch + Commit + Push + Search Everywhere + Settings
       */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
        {/* Git branch selector */}
        <button style={{
          ...toolbarBtn,
          gap: 4,
          padding: "2px 8px",
          color: "var(--ide-text-default)",
          fontSize: "var(--ide-font-size-xs)",
          border: "1px solid var(--ide-border)",
        }}
          title="Git Branch"
          onMouseOver={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="var(--ide-accent-blue)">
            <path d="M8 0C5.8 0 4 1.8 4 4c0 1.5.8 2.8 2 3.5V15h4V7.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4zm0 1.5c1.4 0 2.5 1.1 2.5 2.5S9.4 7.5 8 7.5 5.5 6.4 5.5 5 6.6 2.5 8 2.5z" />
          </svg>
          main
          <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" style={{ color: "var(--ide-text-disabled)" }}>
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Commit */}
        <button style={toolbarBtn} title="Commit (Ctrl+K)"
          onMouseOver={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17h8v-3.26C13.81 12.47 15 10.38 15 8a7 7 0 0 0-7-7zM4 9H2V7h2v2zm3 3H5v-2h2v2zm0-3H5V7h2v2zm3 3H8v-2h2v2zm0-3H8V7h2v2zm3 3h-2v-2h2v2zm0-3h-2V7h2v2z" />
          </svg>
        </button>

        {/* Push */}
        <button style={toolbarBtn} title="Push (Ctrl+Shift+K)"
          onMouseOver={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M13 7L8 2 3 7h2v6h6V7h2z" />
          </svg>
        </button>

        {/* Separator */}
        <div style={{ width: 1, height: 18, background: "var(--ide-border-toolbar)", margin: "0 2px" }} />

        {/* Search Everywhere */}
        <button style={toolbarBtn} title="Search Everywhere (Double Shift)"
          onMouseOver={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M10 10l4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>

        {/* Settings / Theme toggle */}
        <button style={toolbarBtn} onClick={onToggleTheme} title="Toggle Theme"
          onMouseOver={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          {theme === "dark" ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.45 0 .89-.065a.77.77 0 0 1 .67.665c-.125 3.401-2.938 6.127-6.396 6.127A6.68 6.68 0 0 1 3.3 16.64 6.7 6.7 0 0 1 .278 6.465C.278 3.005 3.018.24 6 .278z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
