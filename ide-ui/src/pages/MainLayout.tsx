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
 *
 * Layout mirrors official IntelliJ Islands:
 *   IdeRootPane (vertical stack)
 *   ├─ MainToolbar
 *   └─ contentPane [BorderLayout]
 *       ├─ WEST:  ToolWindowLeftToolbar (40px full-height button strip)
 *       ├─ CENTER: SidebarContent + EditorArea + BottomPanel
 *       └─ SOUTH: StatusBar
 */
export default function MainLayout({ projectPath, theme, onToggleTheme, onBackToWelcome }: Props) {
  const [activeToolWindow, setActiveToolWindow] = useState<ToolWindow>("project");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [bottomPanelTab, setBottomPanelTab] = useState<"terminal" | "problems" | "services">("terminal");

  const currentProject = projectPath.split("/").pop() || "AstralLight";

  return (
    <div style={{
      display:"flex",flexDirection:"column",height:"100%",background:"var(--ide-bg-main)",
      overflow:"hidden"
    }}>
      {/* ==== Header: MainToolbar (official: IdeRootPane toolbar slot) ==== */}
      <TopToolbar
        projectName={currentProject}
        onBackToWelcome={onBackToWelcome}
        theme={theme}
        onToggleTheme={onToggleTheme}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        showBottomPanel={showBottomPanel}
        onToggleBottomPanel={() => setShowBottomPanel(!showBottomPanel)}
      />

      {/* ==== contentPane [BorderLayout: WEST | CENTER | SOUTH] ====
           @see ToolWindowPaneNewButtonManager.wrapWithControls
           WEST = ToolWindowLeftToolbar (40px, full height top→bottom)
           CENTER = Sidebar + EditorArea + BottomPanel
           SOUTH = StatusBar (below, not inside this flex container) ==== */}
      <div style={{ flex:1,display:"flex",overflow:"hidden",minWidth:0,minHeight:0 }}>
        {/* ==== WEST: ToolWindowLeftToolbar (40px button strip, full height) ====
             @see com.intellij.toolWindow.ToolWindowLeftToolbar
             This runs from toolbar bottom → statusbar top, unbroken. ==== */}
        <ToolButtonStrip
          activeTool={activeToolWindow}
          onSelectTool={setActiveToolWindow}
        />

        {/* ==== CENTER: ToolWindowPane content area ====
             @see com.intellij.toolWindow.ToolWindowPane
             This contains the sidebar content panel + editor area.
             Sidebar slides OUT from the button strip, not IN from the edge. ==== */}
        {showSidebar && (
          <Sidebar activeTool={activeToolWindow} />
        )}

        {/* Editor + BottomPanel share the remaining space */}
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0 }}>
          <EditorArea />
          {showBottomPanel && (
            <BottomPanel
              bottomPanelTab={bottomPanelTab}
              onBottomPanelTab={setBottomPanelTab}
              onHide={() => setShowBottomPanel(false)}
            />
          )}
        </div>
      </div>

      {/* ==== SOUTH: StatusBar ====
           @see com.intellij.openapi.wm.impl.status.IdeStatusBarImpl
           Below the contentPane BorderLayout. ==== */}
      <StatusBar
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    </div>
  );
}
