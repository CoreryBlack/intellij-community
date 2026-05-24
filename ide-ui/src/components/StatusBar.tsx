interface Props {
  projectName: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  showBottomPanel: boolean;
  onToggleBottomPanel: () => void;
}

export default function StatusBar({
  theme, onToggleTheme, showSidebar, onToggleSidebar, showBottomPanel, onToggleBottomPanel,
}: Props) {
  const seg = (c: React.CSSProperties = {}): React.CSSProperties => ({
    display:"flex",alignItems:"center",gap:3,padding:"0 8px",height:22,
    borderRadius:"var(--ide-radius-sm)",cursor:"pointer",
    color:"var(--ide-text-secondary)",fontSize:"var(--ide-font-size-xs)",
    transition:"all 0.1s",...c
  });

  return (
    <div style={{
      height:"var(--ide-status-bar-height)",display:"flex",alignItems:"center",
      justifyContent:"space-between",background:"var(--ide-bg-statusbar)",
      borderTop:"1px solid var(--ide-border-subtle)",padding:"0 6px",flexShrink:0
    }}>
      <div style={{ display:"flex",alignItems:"center",gap:2 }}>
        <button style={{ ...seg(),padding:"0 5px" }} onClick={onToggleSidebar}>
          <span style={{ fontSize:9 }}>{showSidebar ? "◀" : "▶"}</span>
        </button>
        <button style={{ ...seg(),padding:"0 5px" }} onClick={onToggleBottomPanel}>
          <span style={{ fontSize:9 }}>{showBottomPanel ? "▼" : "▲"}</span>
        </button>
        <span style={seg({ cursor:"default" })}>⎇ main</span>
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:2 }}>
        <span style={seg({ cursor:"default" })}>Ln 1, Col 1</span>
        <span style={seg({ cursor:"default" })}>UTF-8</span>
        <span style={seg({ cursor:"default" })}>Spaces: 2</span>
        <span style={seg({ cursor:"default" })}>TSX</span>
        <button style={seg()} onClick={onToggleTheme} title="Toggle theme">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            {theme === "dark"
              ? <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z"/>
              : <path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.45 0 .89-.065a.77.77 0 0 1 .67.665c-.125 3.401-2.938 6.127-6.396 6.127A6.68 6.68 0 0 1 3.3 16.64 6.7 6.7 0 0 1 .278 6.465C.278 3.005 3.018.24 6 .278z"/>}
          </svg>
        </button>
      </div>
    </div>
  );
}
