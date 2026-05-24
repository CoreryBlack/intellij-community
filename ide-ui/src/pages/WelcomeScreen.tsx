import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";

interface Props {
  onOpenProject: (path: string) => void;
  onNewProject: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

const PROJECTS = [
  { name:"intellij-community", path:"E:/OfficialVersion/intellij-community", time:"Just now" },
  { name:"ide-ui", path:"E:/OfficialVersion/intellij-community/ide-ui", time:"2 min ago" },
  { name:"my-react-app", path:"E:/Projects/my-react-app", time:"Yesterday" },
  { name:"rust-toolkit", path:"E:/Projects/rust-toolkit", time:"3 days ago" },
];

const actionBtn: React.CSSProperties = {
  display:"flex",flexDirection:"column",alignItems:"center",gap:6,
  padding:"16px 24px",borderRadius:"var(--ide-radius-lg)",cursor:"pointer",
  border:"1px solid var(--ide-border)",background:"var(--ide-bg-card)",
  color:"var(--ide-text-primary)",fontSize:"var(--ide-font-size-sm)",fontWeight:500,
  transition:"all 0.12s",minWidth:100,
};

export default function WelcomeScreen({ onOpenProject, onNewProject, theme, onToggleTheme }: Props) {
  const [version, setVersion] = useState("");

  useEffect(() => {
    invoke<string>("get_ide_version").then(setVersion).catch(() => setVersion("IntelliJ IDEA 2025.1"));
  }, []);

  return (
    <div style={{
      display:"flex",flexDirection:"column",height:"100%",alignItems:"center",
      background:"var(--ide-bg-main)",overflow:"auto"
    }}>
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"64px 24px 32px",gap:6 }}>
        <div style={{
          width:80,height:80,borderRadius:"var(--ide-radius-xl)",background:"var(--ide-bg-card)",
          display:"flex",alignItems:"center",justifyContent:"center",
          border:"1px solid var(--ide-border)",marginBottom:8
        }}>
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="var(--ide-accent-blue)"/>
            <text x="24" y="32" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">IJ</text>
          </svg>
        </div>
        <h1 style={{ fontSize:28,fontWeight:600,color:"var(--ide-text-accent)",letterSpacing:"-0.5px" }}>IntelliJ IDEA</h1>
        <p style={{ fontSize:"var(--ide-font-size-md)",color:"var(--ide-text-secondary)" }}>{version}</p>
      </div>

      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:32,padding:"0 24px",maxWidth:560,width:"100%" }}>
        {/* Quick actions */}
        <div style={{ display:"flex",gap:12,justifyContent:"center",width:"100%" }}>
          <div style={actionBtn}
            onClick={onNewProject}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--ide-accent-blue)">
              <path d="M12 5a.75.75 0 0 1 .75.75v5.5h5.5a.75.75 0 0 1 0 1.5h-5.5v5.5a.75.75 0 0 1-1.5 0v-5.5h-5.5a.75.75 0 0 1 0-1.5h5.5v-5.5A.75.75 0 0 1 12 5z"/>
            </svg>
            <span>New Project</span>
          </div>
          <div style={actionBtn}
            onClick={() => onOpenProject("")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--ide-accent-blue-light)">
              <path d="M3.75 4a.75.75 0 0 0-.75.75v14.5c0 .414.336.75.75.75h16.5a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-7.25a.75.75 0 0 1-.53-.22L10.28 6.28a.75.75 0 0 0-.53-.22H3.75z"/>
            </svg>
            <span>Open</span>
          </div>
          <div style={actionBtn}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--ide-accent-green)">
              <path d="M3.75 4a.75.75 0 0 0-.75.75v14.5c0 .414.336.75.75.75h16.5a.75.75 0 0 0 .75-.75V9.75a.75.75 0 0 0-.75-.75h-7.25a.75.75 0 0 1-.53-.22L10.28 6.28a.75.75 0 0 0-.53-.22H3.75z"/>
              <path d="M18.5 15l-3 3-3-3M15.5 18v-6"/>
            </svg>
            <span>Get from VCS</span>
          </div>
        </div>

        {/* Recent projects */}
        <div style={{ width:"100%" }}>
          <h2 style={{ fontSize:"var(--ide-font-size-xs)",fontWeight:600,color:"var(--ide-text-secondary)",
            textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10,paddingLeft:4 }}>Recent Projects</h2>
          <div style={{ display:"flex",flexDirection:"column",gap:2 }}>
            {PROJECTS.map(p => (
              <div key={p.path}
                onClick={() => onOpenProject(p.path)}
                style={{
                  display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
                  borderRadius:"var(--ide-radius-md)",cursor:"pointer",
                  background:"var(--ide-bg-card)",border:"1px solid transparent",
                  transition:"all 0.1s"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--ide-border)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; }}>
                <div style={{
                  width:32,height:32,borderRadius:"var(--ide-radius-sm)",
                  background:"var(--ide-button-secondary-bg)",display:"flex",
                  alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--ide-accent-blue)">
                    <path d="M2.75 2.5a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h10.5a.75.75 0 0 0 .75-.75V6.25a.75.75 0 0 0-.75-.75H8.75a.75.75 0 0 1-.53-.22L6.78 3.78a.75.75 0 0 0-.53-.22H2.75z"/>
                  </svg>
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:"var(--ide-font-size-md)",fontWeight:500,color:"var(--ide-text-primary)",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</div>
                  <div style={{ fontSize:"var(--ide-font-size-xs)",color:"var(--ide-text-secondary)",marginTop:1,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.path}</div>
                </div>
                <span style={{ fontSize:"var(--ide-font-size-xs)",color:"var(--ide-text-disabled)",flexShrink:0 }}>{p.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",
        padding:"10px 20px",borderTop:"1px solid var(--ide-border-subtle)",marginTop:"auto",
        background:"var(--ide-bg-panel)"
      }}>
        <button onClick={onToggleTheme} style={{
          display:"flex",alignItems:"center",gap:6,padding:"4px 8px",borderRadius:"var(--ide-radius-sm)",
          border:"none",background:"var(--ide-button-secondary-bg)",color:"var(--ide-text-secondary)",
          cursor:"pointer",fontSize:"var(--ide-font-size-xs)",transition:"all 0.1s" }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            {theme==="dark"
              ? <path d="M8 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 1zm0 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
              : <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.45 0 .89-.065a.77.77 0 0 1 .67.665c-.125 3.401-2.938 6.127-6.396 6.127A6.68 6.68 0 0 1 3.3 16.64 6.7 6.7 0 0 1 .278 6.465C.278 3.005 3.018.24 6 .278z"/>}
          </svg>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <button style={{ border:"none",background:"transparent",color:"var(--ide-text-secondary)",
            cursor:"pointer",fontSize:"var(--ide-font-size-xs)",borderRadius:"var(--ide-radius-sm)",
            padding:"2px 6px",transition:"all 0.1s" }}>Settings</button>
          <button style={{ border:"none",background:"transparent",color:"var(--ide-text-secondary)",
            cursor:"pointer",fontSize:"var(--ide-font-size-xs)",borderRadius:"var(--ide-radius-sm)",
            padding:"2px 6px",transition:"all 0.1s" }}>About</button>
        </div>
      </div>
    </div>
  );
}
