interface Props {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export default function StatusBar({
  theme, onToggleTheme,
}: Props) {
  const seg = (c: React.CSSProperties = {}): React.CSSProperties => ({
    display:"inline-flex",alignItems:"center",gap:3,padding:"0 7px",height:24,
    borderRadius:"var(--ide-radius-sm)",cursor:"pointer",
    color:"var(--ide-text-secondary)",fontSize:"var(--ide-font-size-xs)",
    transition:"all 0.1s",...c
  });

  return (
    <div style={{
      height:"var(--ide-status-bar-height)",display:"flex",alignItems:"center",
      justifyContent:"space-between",background:"var(--ide-bg-statusbar)",
      borderTop:"1px solid var(--ide-border-subtle)",padding:"0 4px",flexShrink:0,
      fontSize:"var(--ide-font-size-xs)"
    }}>
      {/* Left: Git info */}
      <div style={{ display:"flex",alignItems:"center",gap:1 }}>
        <span style={{
          ...seg({ cursor:"default" }),
          background:"var(--ide-bg-active)",fontWeight:500,color:"var(--ide-text-primary)"
        }}>
          ⎇ main
        </span>
        <span style={seg({ cursor:"default" })}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="var(--ide-accent-green)" style={{ marginRight:2 }}><path d="M8 0a1.5 1.5 0 0 1 1.5 1.5v3.79l2.71 2.71a1.5 1.5 0 0 1-2.12 2.12L8 7.91l-2.09 2.09A1.5 1.5 0 1 1 3.79 8L6.5 5.29V1.5A1.5 1.5 0 0 1 8 0z"/></svg>
          0 problems
        </span>
      </div>

      {/* Right section */}
      <div style={{ display:"flex",alignItems:"center",gap:1 }}>
        <span style={seg({ cursor:"default" })}>Ln 12, Col 20</span>
        <span style={seg({ cursor:"default" })}>UTF-8</span>
        <span style={seg({ cursor:"default" })}>Spaces: 4</span>
        <span style={seg({ cursor:"default" })}>CRLF</span>
        <span style={{
          ...seg({ cursor:"default" }),
          color:"var(--ide-text-primary)",fontWeight:500
        }}>Java</span>
        <span style={seg({ cursor:"default" })}>🔒</span>

        <button style={seg()} onClick={onToggleTheme} title="Toggle theme">
          {theme === "dark"
            ? <><svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z"/></svg> Dark</>
            : <><svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.45 0 .89-.065a.77.77 0 0 1 .67.665c-.125 3.401-2.938 6.127-6.396 6.127A6.68 6.68 0 0 1 3.3 16.64 6.7 6.7 0 0 1 .278 6.465C.278 3.005 3.018.24 6 .278z"/></svg> Light</>
          }
        </button>
      </div>
    </div>
  );
}
