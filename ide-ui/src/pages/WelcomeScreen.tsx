/**
 * @see com.intellij.openapi.wm.impl.welcomeScreen.FlatWelcomeFrame
 *
 * Official FlatWelcomeFrame layout:
 *   Default size: 800x650 (Tabbed mode)
 *   Position: screen centered, Y offset 1/3
 *
 *   Structure (Tabbed / New UI):
 *   ┌─────────────────────────────────────────────────┐
 *   │  ┌───────────────────────────────────────────┐  │
 *   │  │  Logo + "IntelliJ IDEA" + version         │  │
 *   │  │  (centered, top area)                      │  │
 *   │  └───────────────────────────────────────────┘  │
 *   │                                                  │
 *   │  ┌───────────────────────────────────────────┐  │
 *   │  │  Quick Actions: New | Open | Get from VCS │  │
 *   │  │  (horizontal row, centered)                │  │
 *   │  └───────────────────────────────────────────┘  │
 *   │                                                  │
 *   │  ┌───────────────────────────────────────────┐  │
 *   │  │  Recent Projects (list)                    │  │
 *   │  │  ┌─ Project icon + name + path + time ──┐ │  │
 *   │  │  │  ...                                  │ │  │
 *   │  │  └──────────────────────────────────────┘ │  │
 *   │  └───────────────────────────────────────────┘  │
 *   │                                                  │
 *   │  ┌───────────────────────────────────────────┐  │
 *   │  │  Footer: Theme | Settings | About          │  │
 *   │  └───────────────────────────────────────────┘  │
 *   └─────────────────────────────────────────────────┘
 *
 * Colors (from FlatWelcomeFrame + WelcomeScreenUIManager):
 *   - Main background: dialog-bg = #191A1C (Dark)
 *   - SidePanel background: dialog-bg = #191A1C
 *   - Banner background: dialog-bg-inline = #212326
 *   - Projects actions background: #2B2D30
 *   - Link icon color: #AFB1B3 (Dark)
 *   - Link button border: empty(8, 20)
 */

import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";

interface Props {
  onOpenProject: (path: string) => void;
  onNewProject: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

const PROJECTS = [
  { name: "AstralLight", path: "E:/Projects/AstralLight", time: "Just now" },
  { name: "intellij-community", path: "E:/OfficialVersion/intellij-community", time: "2 min ago" },
  { name: "ide-ui", path: "E:/OfficialVersion/intellij-community/ide-ui", time: "Yesterday" },
  { name: "rust-toolkit", path: "E:/Projects/rust-toolkit", time: "3 days ago" },
];

export default function WelcomeScreen({ onOpenProject, onNewProject, theme, onToggleTheme }: Props) {
  const [version, setVersion] = useState("");

  useEffect(() => {
    invoke<string>("get_ide_version").then(setVersion).catch(() => setVersion("IntelliJ IDEA 2025.1"));
  }, []);

  const linkBtn: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "8px 20px",
    border: "none",
    background: "transparent",
    color: "var(--ide-text-primary)",
    fontSize: "var(--ide-font-size-sm)",
    fontWeight: 500,
    cursor: "pointer",
    borderRadius: "var(--ide-radius-md)",
    transition: "background var(--ide-transition-fast)",
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "var(--ide-bg-dialog)",
      overflow: "auto",
    }}>
      {/* ═══════ Main content area ═══════
       * @see FlatWelcomeFrame — centered, max width 800px
       */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "64px 24px 32px",
        maxWidth: 800,
        width: "100%",
        margin: "0 auto",
      }}>

        {/* ═══════ Logo + Title ═══════
         * @see FlatWelcomeFrame — logo centered, title below
         */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          marginBottom: 40,
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: "var(--island-arc)",
            background: "linear-gradient(135deg, #FE2857 0%, #FF6584 25%, #FC801D 50%, #FFC700 75%, #3871E1 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
            boxShadow: "0 4px 16px rgba(56,113,225,0.3)",
          }}>
            <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="8" width="32" height="32" rx="6" fill="rgba(0,0,0,0.3)" />
              <text x="24" y="33" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="var(--ide-font-ui)">IJ</text>
            </svg>
          </div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 600,
            color: "var(--ide-text-accent)",
            letterSpacing: "-0.3px",
          }}>IntelliJ IDEA</h1>
          <p style={{
            fontSize: "var(--ide-font-size-sm)",
            color: "var(--ide-text-secondary)",
          }}>{version}</p>
        </div>

        {/* ═══════ Quick Actions ═══════
         * @see FlatWelcomeFrame — "Projects" tab actions
         * New Project | Open | Get from VCS
         * Link buttons with icon + text, border: empty(8,20)
         */}
        <div style={{
          display: "flex",
          gap: 4,
          justifyContent: "center",
          width: "100%",
          marginBottom: 40,
        }}>
          <button style={linkBtn}
            onClick={onNewProject}
            onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="24" height="24" rx="6" fill="var(--ide-bg-card)" stroke="var(--ide-border)" strokeWidth="1" />
              <path d="M14 8v12M8 14h12" stroke="var(--ide-accent-blue)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>New Project</span>
          </button>

          <button style={linkBtn}
            onClick={() => onOpenProject("")}
            onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="24" height="24" rx="6" fill="var(--ide-bg-card)" stroke="var(--ide-border)" strokeWidth="1" />
              <path d="M8 10h5l2 2h5v8H8V10z" fill="var(--ide-accent-yellow)" stroke="var(--ide-accent-yellow)" strokeWidth="0.5" />
            </svg>
            <span>Open</span>
          </button>

          <button style={linkBtn}
            onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="24" height="24" rx="6" fill="var(--ide-bg-card)" stroke="var(--ide-border)" strokeWidth="1" />
              <circle cx="10" cy="14" r="4" fill="none" stroke="var(--ide-accent-green)" strokeWidth="1.5" />
              <path d="M14 14h6M17 11l3 3-3 3" stroke="var(--ide-accent-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Get from VCS</span>
          </button>
        </div>

        {/* ═══════ Recent Projects ═══════
         * @see FlatWelcomeFrame — project list
         * Each item: project icon + name + path + time
         * Background: projects actions bg = #2B2D30 (Dark)
         */}
        <div style={{ width: "100%" }}>
          <h2 style={{
            fontSize: "var(--ide-font-size-xs)",
            fontWeight: 600,
            color: "var(--ide-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 8,
            paddingLeft: 4,
          }}>Recent Projects</h2>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            borderRadius: "var(--island-arc)",
            background: "var(--island-border-color)",
            padding: "var(--island-tool-window-padding)",
          }}>
            <div style={{
              borderRadius: "calc(var(--island-arc) - var(--island-tool-window-padding))",
              background: "var(--ide-bg-tool-window)",
              overflow: "hidden",
            }}>
              {PROJECTS.map((p, i) => (
                <div key={p.path}
                  onClick={() => onOpenProject(p.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    cursor: "pointer",
                    transition: "background var(--ide-transition-fast)",
                    borderBottom: i < PROJECTS.length - 1 ? "1px solid var(--ide-border-subtle)" : "none",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--ide-radius-sm)",
                    background: "var(--ide-bg-card)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--ide-accent-blue)">
                      <path d="M2.75 2.5a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h10.5a.75.75 0 0 0 .75-.75V6.25a.75.75 0 0 0-.75-.75H8.75a.75.75 0 0 1-.53-.22L6.78 3.78a.75.75 0 0 0-.53-.22H2.75z" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "var(--ide-font-size-md)",
                      fontWeight: 500,
                      color: "var(--ide-text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>{p.name}</div>
                    <div style={{
                      fontSize: "var(--ide-font-size-xs)",
                      color: "var(--ide-text-secondary)",
                      marginTop: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>{p.path}</div>
                  </div>
                  <span style={{
                    fontSize: "var(--ide-font-size-xs)",
                    color: "var(--ide-text-disabled)",
                    flexShrink: 0,
                  }}>{p.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ Footer ═══════
       * @see FlatWelcomeFrame footer
       * Theme toggle | Settings | About
       */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "8px 20px",
        borderTop: "1px solid var(--ide-border-subtle)",
        background: "var(--ide-bg-dialog)",
        flexShrink: 0,
      }}>
        <button onClick={onToggleTheme} style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 8px",
          borderRadius: "var(--ide-radius-sm)",
          border: "none",
          background: "transparent",
          color: "var(--ide-text-secondary)",
          cursor: "pointer",
          fontSize: "var(--ide-font-size-xs)",
          transition: "background var(--ide-transition-fast)",
        }}
          onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
          onMouseOut={e => e.currentTarget.style.background = "transparent"}
        >
          {theme === "dark" ? "☀ Light" : "🌙 Dark"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button style={{
            border: "none",
            background: "transparent",
            color: "var(--ide-text-secondary)",
            cursor: "pointer",
            fontSize: "var(--ide-font-size-xs)",
            borderRadius: "var(--ide-radius-sm)",
            padding: "4px 8px",
            transition: "background var(--ide-transition-fast)",
          }}
            onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}
          >⚙ Settings</button>
          <button style={{
            border: "none",
            background: "transparent",
            color: "var(--ide-text-secondary)",
            cursor: "pointer",
            fontSize: "var(--ide-font-size-xs)",
            borderRadius: "var(--ide-radius-sm)",
            padding: "4px 8px",
            transition: "background var(--ide-transition-fast)",
          }}
            onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}
          >About</button>
        </div>
      </div>
    </div>
  );
}
