import { useState } from "react";
import TopToolbar from "../components/TopToolbar";
import ToolButtonStrip from "../components/ToolButtonStrip";
import Sidebar from "../components/Sidebar";
import StatusBar from "../components/StatusBar";
import EditorArea from "../components/EditorArea";
import BottomPanel from "../components/BottomPanel";

interface Props {
  projectPath: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onBackToWelcome: () => void;
}

type ToolWindow = "project" | "search" | "git" | "run" | "structure";

/**
 * @see com.intellij.openapi.wm.impl.IdeRootPane.CustomHeaderRootLayout
 * @see com.intellij.toolWindow.ToolWindowPaneNewButtonManager.wrapWithControls
 * @see com.intellij.openapi.application.impl.islands.IslandsUICustomization
 *
 * Official IntelliJ Islands layout:
 *
 *   IdeRootPane (CustomHeaderRootLayout, vertical stack)
 *   ├─ MainToolbar (HorizontalLayout, gap=10)
 *   └─ contentPane [BorderLayout]
 *       ├─ WEST:  ToolWindowLeftToolbar (40px, full height, topStripe + bottomStripe + moreButton)
 *       ├─ CENTER: ToolWindowPane (JLayeredPane)
 *       │    └─ horizontalSplitter (ThreeComponentsSplitter)
 *       │         ├─ firstComponent → LEFT tool window (Island, arc=20)
 *       │         ├─ innerComponent → verticalSplitter
 *       │         │    ├─ firstComponent → TOP tool window (unused)
 *       │         │    ├─ innerComponent → EditorsSplitters (Island, arc=20)
 *       │         │    └─ lastComponent → BOTTOM tool window (Island, arc=20)
 *       │         └─ lastComponent → RIGHT tool window (unused)
 *       ├─ EAST:  ToolWindowRightToolbar (unused by default)
 *       └─ SOUTH: IdeStatusBarImpl (BorderLayout: WEST | CENTER | EAST)
 *
 * Island visual treatment:
 *   - Each Island: borderRadius=20px, borderWidth=6px, borderColor=layer0-bg
 *   - Islands.float on layer1-bg (#26282C dark) with emptyGap=4px between them
 *   - Tool window Island padding: 3px
 *   - Editor Island padding: 2px
 */
export default function MainLayout({ projectPath, theme, onToggleTheme, onBackToWelcome }: Props) {
  const [activeToolWindow, setActiveToolWindow] = useState<ToolWindow>("project");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [bottomPanelTab, setBottomPanelTab] = useState<"terminal" | "problems" | "services">("terminal");

  const currentProject = projectPath.split("/").pop() || "AstralLight";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "var(--ide-bg-main)",
      overflow: "hidden",
    }}>
      {/* ═══════ NORTH: MainToolbar ═══════
       * @see com.intellij.openapi.wm.impl.headertoolbar.MainToolbar
       * HorizontalLayout(gap=10): LEFT(hamburger+project) | CENTER(search+run+debug) | RIGHT(vcs+settings)
       */}
      <TopToolbar
        projectName={currentProject}
        onBackToWelcome={onBackToWelcome}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      {/* ═══════ contentPane [BorderLayout: WEST | CENTER | SOUTH] ═══════
       * @see ToolWindowPaneNewButtonManager.wrapWithControls
       * JPanel(BorderLayout): add(pane, CENTER); add(left, WEST); add(right, EAST)
       */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0, minHeight: 0 }}>

        {/* ── WEST: ToolWindowLeftToolbar ──
         * @see com.intellij.toolWindow.ToolWindowLeftToolbar
         * BorderLayout: NORTH(topWrapper→topStripe) | CENTER(moreButton) | SOUTH(bottomStripe)
         * Width: 40px, full height from toolbar bottom → statusbar top
         * Background: stripeBackground() = layer1-bg
         * Border: customLineRight(borderColor)
         */}
        <ToolButtonStrip
          activeTool={activeToolWindow}
          onSelectTool={setActiveToolWindow}
          showSidebar={showSidebar}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          showBottomPanel={showBottomPanel}
          onToggleBottomPanel={() => setShowBottomPanel(!showBottomPanel)}
        />

        {/* ── CENTER: ToolWindowPane ──
         * @see com.intellij.toolWindow.ToolWindowPane
         * Contains horizontalSplitter → verticalSplitter → EditorsSplitters
         * Islands.emptyGap = 4px between button strip and tool window pane
         * @see IslandsUICustomization: toolWindowPaneParent.border = empty(0, left, 0, right)
         */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
          minHeight: 0,
          padding: "var(--island-empty-gap)",
          gap: "var(--island-empty-gap)",
        }}>
          {/* horizontalSplitter: firstComponent(LEFT) + innerComponent(CENTER) */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden", gap: "var(--island-empty-gap)", minHeight: 0 }}>
            {/* firstComponent → LEFT tool window (Island) */}
            {showSidebar && (
              <Sidebar activeTool={activeToolWindow} />
            )}

            {/* innerComponent → verticalSplitter: innerComponent(EditorsSplitters) + lastComponent(BOTTOM) */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", gap: "var(--island-empty-gap)", minWidth: 0, minHeight: 0 }}>
              {/* innerComponent → EditorsSplitters (Island) */}
              <EditorArea />

              {/* lastComponent → BOTTOM tool window (Island) */}
              {showBottomPanel && (
                <BottomPanel
                  bottomPanelTab={bottomPanelTab}
                  onBottomPanelTab={setBottomPanelTab}
                  onHide={() => setShowBottomPanel(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ SOUTH: IdeStatusBarImpl ═══════
       * @see com.intellij.openapi.wm.impl.status.IdeStatusBarImpl
       * BorderLayout: WEST(leftPanel) | CENTER(centerPanel→InfoAndProgress) | EAST(rightPanel)
       * Height: 28px, topBorderWidth: 1px, padding: 0 10px
       */}
      <StatusBar theme={theme} onToggleTheme={onToggleTheme} />
    </div>
  );
}
