import { useState } from "react";
import TopToolbar from "../components/TopToolbar";
import Sidebar from "../components/Sidebar";
import StatusBar from "../components/StatusBar";
import EditorArea from "../components/EditorArea";

interface Props {
  projectPath: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onBackToWelcome: () => void;
}

type ToolWindow = "project" | "structure" | "commit" | "services";

export default function MainLayout({ projectPath, theme, onToggleTheme, onBackToWelcome }: Props) {
  const [activeToolWindow, setActiveToolWindow] = useState<ToolWindow>("project");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [bottomPanelTab, setBottomPanelTab] = useState<"terminal" | "problems" | "services">("terminal");

  const currentProject = projectPath.split("/").pop() || "untitled";

  return (
    <div style={{
      display:"flex",flexDirection:"column",height:"100%",background:"var(--ide-bg-main)"
    }}>
      <TopToolbar
        projectName={currentProject}
        onBackToWelcome={onBackToWelcome}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
        {showSidebar && (
          <Sidebar
            activeTool={activeToolWindow}
            onSelectTool={setActiveToolWindow}
          />
        )}

        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0 }}>
          <EditorArea
            showBottomPanel={showBottomPanel}
            bottomPanelTab={bottomPanelTab}
            onShowBottomPanel={setShowBottomPanel}
            onBottomPanelTab={setBottomPanelTab}
          />
        </div>
      </div>

      <StatusBar
        projectName={currentProject}
        theme={theme}
        onToggleTheme={onToggleTheme}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        showBottomPanel={showBottomPanel}
        onToggleBottomPanel={() => setShowBottomPanel(!showBottomPanel)}
      />
    </div>
  );
}
