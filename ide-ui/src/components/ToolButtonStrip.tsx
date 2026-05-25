/**
 * @see com.intellij.toolWindow.ToolWindowLeftToolbar
 * @see com.intellij.toolWindow.ToolWindowToolbar (base class)
 * @see com.intellij.openapi.wm.impl.SquareStripeButton
 *
 * Official ToolWindowLeftToolbar layout:
 *   BorderLayout
 *   ├─ NORTH: topWrapper → topStripe (StripeV2, anchor=LEFT)
 *   │    border: customLineTop(MainToolbar.borderColor)
 *   ├─ CENTER: moreButton (MoreSquareStripeButton)
 *   └─ SOUTH: bottomStripe (StripeV2, anchor=BOTTOM)
 *
 * Key parameters:
 *   - width: 40px (from JBUI.CurrentTheme.Toolbar.stripeToolbarButtonSize)
 *   - background: stripeBackground() = layer1-bg
 *   - border: customLineRight(borderColor)
 *   - buttonSize: stripeToolbarButtonSize() = 40px
 *   - iconSize: stripeToolbarButtonIconSize() = 20px
 *   - buttonArc: stripeButtonArc() = 8px
 *   - SquareStripeButton: icon-only, transparent bg, hover=toolbar-bg-hovered
 *   - Selected button: background=toolbar-selected-bg (#2E4D89)
 *
 * topStripe buttons (LEFT anchor): Project, Search, Git, Run, Structure
 * bottomStripe buttons (BOTTOM anchor): Terminal, Problems, Services, Build
 */

type ToolWindow = "project" | "search" | "git" | "run" | "structure";

interface Props {
  activeTool: ToolWindow;
  onSelectTool: (tool: ToolWindow) => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  showBottomPanel: boolean;
  onToggleBottomPanel: () => void;
}

const TOP_STRIPE_TOOLS: { id: ToolWindow; icon: string; title: string }[] = [
  { id: "project", icon: "project", title: "Project (Alt+1)" },
  { id: "search", icon: "find", title: "Search (Shift+Shift)" },
  { id: "git", icon: "vcs", title: "Git (Alt+9)" },
  { id: "run", icon: "run", title: "Run (Alt+4)" },
  { id: "structure", icon: "structure", title: "Structure (Alt+7)" },
];

function ToolIcon({ type, size = 20 }: { type: string; size?: number }) {
  const iconMap: Record<string, string> = {
    project: "project",
    find: "find",
    vcs: "vcs",
    run: "run",
    structure: "structure",
    services: "services",
    problems: "problems",
  };
  const officialName = iconMap[type];
  if (officialName) {
    return <img src={`/icons/${officialName}.svg`} width={size} height={size} alt="" style={{ display: "block" }} />;
  }
  if (type === "terminal") {
    return <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor"><path d="M3 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm2 3l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (type === "collapse") {
    return <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 4l5 6-5 6" /></svg>;
  }
  return null;
}

export default function ToolButtonStrip({ activeTool, onSelectTool, showSidebar, onToggleSidebar, showBottomPanel, onToggleBottomPanel }: Props) {
  const btnStyle = (isActive: boolean): React.CSSProperties => ({
    width: "var(--toolbar-stripe-button-width)",
    height: "var(--toolbar-stripe-button-height)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: "var(--toolbar-stripe-button-arc)",
    cursor: "pointer",
    color: isActive ? "var(--toolbar-selected-fg)" : "var(--ide-text-muted)",
    background: isActive ? "var(--toolbar-selected-bg)" : "transparent",
    transition: "all var(--ide-transition-fast)",
    padding: 0,
    flexShrink: 0,
  });

  return (
    <div style={{
      width: "var(--ide-button-strip-width)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "4px 4px",
      flexShrink: 0,
      gap: 2,
      background: "var(--toolbar-stripe-bg)",
      borderRight: "1px solid var(--ide-border-toolbar)",
    }}>
      {/* ═══════ topStripe (StripeV2, anchor=LEFT) ═══════
       * @see com.intellij.toolWindow.StripeV2
       * Contains tool window buttons for LEFT anchor: Project, Search, Git, Run, Structure
       * Each button is a SquareStripeButton
       */}
      {TOP_STRIPE_TOOLS.map(t => (
        <button
          key={t.id}
          style={btnStyle(activeTool === t.id && showSidebar)}
          onClick={() => {
            if (activeTool === t.id && showSidebar) {
              onToggleSidebar();
            } else {
              if (!showSidebar) onToggleSidebar();
              onSelectTool(t.id);
            }
          }}
          title={t.title}
          onMouseOver={e => {
            if (activeTool !== t.id || !showSidebar) {
              e.currentTarget.style.background = "var(--toolbar-bg-hovered)";
            }
          }}
          onMouseOut={e => {
            if (activeTool !== t.id || !showSidebar) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <ToolIcon type={t.icon} />
        </button>
      ))}

      {/* ═══════ moreButton (CENTER, flex spacer) ═══════
       * @see com.intellij.toolWindow.MoreSquareStripeButton
       * In official UI, this shows hidden tool windows
       */}
      <div style={{ flex: 1 }} />

      {/* ═══════ bottomStripe (StripeV2, anchor=BOTTOM) ═══════
       * @see com.intellij.toolWindow.StripeV2
       * Contains tool window buttons for BOTTOM anchor: Terminal, Problems, Services
       * These toggle the bottom panel
       */}
      <button
        style={btnStyle(showBottomPanel)}
        onClick={onToggleBottomPanel}
        title="Terminal (Alt+F12)"
        onMouseOver={e => {
          if (!showBottomPanel) e.currentTarget.style.background = "var(--toolbar-bg-hovered)";
        }}
        onMouseOut={e => {
          if (!showBottomPanel) e.currentTarget.style.background = "transparent";
        }}
      >
        <ToolIcon type="terminal" />
      </button>

      <button
        style={btnStyle(false)}
        title="Problems"
        onMouseOver={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
        onMouseOut={e => e.currentTarget.style.background = "transparent"}
      >
        <ToolIcon type="problems" />
      </button>

      <button
        style={btnStyle(false)}
        title="Services"
        onMouseOver={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
        onMouseOut={e => e.currentTarget.style.background = "transparent"}
      >
        <ToolIcon type="services" />
      </button>
    </div>
  );
}
