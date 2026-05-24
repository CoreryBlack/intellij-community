import { useState } from "react";
import "./styles/global.css";
import WelcomeScreen from "./pages/WelcomeScreen";
import MainLayout from "./pages/MainLayout";

type Page = "welcome" | "main";

export default function App() {
  const [page, setPage] = useState<Page>("welcome");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [projectPath, setProjectPath] = useState<string>("E:/OfficialVersion/intellij-community/ide-ui");

  const handleOpenProject = (path: string) => {
    setProjectPath(path);
    setPage("main");
  };

  const handleNewProject = () => {
    setPage("main");
  };

  const handleBackToWelcome = () => {
    setPage("welcome");
    setProjectPath("");
  };

  return (
    <div className={theme === "light" ? "light" : ""} style={{ height: "100%", width: "100%" }}>
      {page === "welcome" ? (
        <WelcomeScreen
          onOpenProject={handleOpenProject}
          onNewProject={handleNewProject}
          theme={theme}
          onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        />
      ) : (
        <MainLayout
          projectPath={projectPath}
          theme={theme}
          onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          onBackToWelcome={handleBackToWelcome}
        />
      )}
    </div>
  );
}
