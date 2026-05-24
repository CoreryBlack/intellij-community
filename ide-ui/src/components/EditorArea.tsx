import { useState } from "react";

interface Props {
  showBottomPanel: boolean;
  bottomPanelTab: "terminal" | "problems" | "services";
  onShowBottomPanel: (show: boolean) => void;
  onBottomPanelTab: (tab: "terminal" | "problems" | "services") => void;
}

interface OpenFile {
  name: string; path: string; lang: string; modified: boolean;
}

const OPENED_FILES: OpenFile[] = [
  { name:"App.tsx", path:"ide-ui/src/App.tsx", lang:"tsx", modified:false },
  { name:"TopToolbar.tsx", path:"ide-ui/src/components/TopToolbar.tsx", lang:"tsx", modified:true },
  { name:"lib.rs", path:"ide-ui/src-tauri/src/lib.rs", lang:"rust", modified:false },
  { name:"Sidebar.tsx", path:"ide-ui/src/components/Sidebar.tsx", lang:"tsx", modified:false },
  { name:"theme.css", path:"ide-ui/src/styles/theme.css", lang:"css", modified:false },
];

const TERM = `$ npm run dev\n> intellij-ide@0.1.0 dev\n> vite\n VITE v6.4.2 ready in 433ms\n → Local:   http://localhost:1420/`;

function getIcon(lang: string) { const m:Record<string,string>={ rust:"🦀",css:"🎨",tsx:"⚛",ts:"⚛" }; return m[lang]||"📄"; }

function RustCode() {
  return (<pre style={{ fontFamily:"var(--ide-font-editor)",fontSize:"var(--ide-font-size-sm)",lineHeight:"19px",color:"var(--ide-text-primary)",whiteSpace:"pre",padding:"0 20px",margin:0 }}>
    <code>
      <span style={{color:"var(--ide-accent-orange)"}}>use</span> std::sync::Mutex;{"\n"}
      <span style={{color:"var(--ide-accent-orange)"}}>use</span> tauri::State;{"\n\n"}
      <span style={{color:"var(--ide-accent-purple)"}}>#[tauri::command]</span>{"\n"}
      <span style={{color:"var(--ide-accent-orange)"}}>fn</span> <span style={{color:"var(--ide-accent-yellow)"}}>greet</span>(name: &str) -&gt; String {"{"}{"\n"}
      {"    "}<span style={{color:"var(--ide-accent-yellow)"}}>format!</span>(<span style={{color:"var(--ide-accent-green)"}}>"Hello from Rust!"</span>, name){"\n"}
      {"}"}{"\n\n"}
      <span style={{color:"var(--ide-accent-orange)"}}>pub fn</span> <span style={{color:"var(--ide-accent-yellow)"}}>run</span>() {"{"}{"\n"}
      {"    "}tauri::Builder::<span style={{color:"var(--ide-accent-yellow)"}}>default</span>(){"\n"}
      {"        "}.<span style={{color:"var(--ide-accent-yellow)"}}>run</span>(tauri::<span style={{color:"var(--ide-accent-yellow)"}}>generate_context!</span>()){"\n"}
      {"        "}.<span style={{color:"var(--ide-accent-yellow)"}}>expect</span>(<span style={{color:"var(--ide-accent-green)"}}>"error"</span>);{"\n"}
      {"}"}
    </code>
  </pre>);
}

function TsxCode() {
  return (<pre style={{ fontFamily:"var(--ide-font-editor)",fontSize:"var(--ide-font-size-sm)",lineHeight:"19px",color:"var(--ide-text-primary)",whiteSpace:"pre",padding:"0 20px",margin:0 }}>
    <code>
      <span style={{color:"var(--ide-accent-orange)"}}>import</span> {"{"} useState {"}"} <span style={{color:"var(--ide-accent-orange)"}}>from</span> <span style={{color:"var(--ide-accent-green)"}}>"react"</span>;{"\n"}
      <span style={{color:"var(--ide-accent-orange)"}}>import</span> <span style={{color:"var(--ide-accent-green)"}}>"./styles/global.css"</span>;{"\n\n"}
      <span style={{color:"var(--ide-accent-orange)"}}>export default function</span> <span style={{color:"var(--ide-accent-yellow)"}}>App</span>() {"{"}{"\n"}
      {"  "}<span style={{color:"var(--ide-accent-orange)"}}>const</span> [page, setPage] = <span style={{color:"var(--ide-accent-yellow)"}}>useState</span>(<span style={{color:"var(--ide-accent-green)"}}>"welcome"</span>);{"\n"}
      {"  "}<span style={{color:"var(--ide-accent-orange)"}}>const</span> [theme, setTheme] = <span style={{color:"var(--ide-accent-yellow)"}}>useState</span>(<span style={{color:"var(--ide-accent-green)"}}>"dark"</span>);{"\n\n"}
      {"  "}<span style={{color:"var(--ide-accent-orange)"}}>return</span> ({"\n"}
      {"    "}&lt;<span style={{color:"var(--ide-accent-blue)"}}>div</span>&gt;{"\n"}
      {"      "}{"page === \"welcome\" ? WelcomeScreen : MainLayout"}{"\n"}
      {"    "}&lt;/<span style={{color:"var(--ide-accent-blue)"}}>div</span>&gt;{"\n"}
      {"  "});{"\n"}
      {"}"}
    </code>
  </pre>);
}

function CssCode() {
  return (<pre style={{ fontFamily:"var(--ide-font-editor)",fontSize:"var(--ide-font-size-sm)",lineHeight:"19px",color:"var(--ide-text-primary)",whiteSpace:"pre",padding:"0 20px",margin:0 }}>
    <code>
      <span style={{color:"var(--ide-accent-purple)"}}>:root</span> {"{"}{"\n"}
      {"  "}<span style={{color:"var(--ide-accent-cyan)"}}>--ide-bg-main</span>: <span style={{color:"var(--ide-accent-green)"}}>#1E1F22</span>;{"\n"}
      {"  "}<span style={{color:"var(--ide-accent-cyan)"}}>--ide-bg-panel</span>: <span style={{color:"var(--ide-accent-green)"}}>#2B2D30</span>;{"\n"}
      {"  "}<span style={{color:"var(--ide-accent-cyan)"}}>--ide-text-primary</span>: <span style={{color:"var(--ide-accent-green)"}}>#CED0D6</span>;{"\n"}
      {"}"}{"\n\n"}
      <span style={{color:"var(--ide-accent-purple)"}}>.light</span> {"{"}{"\n"}
      {"  "}<span style={{color:"var(--ide-accent-cyan)"}}>--ide-bg-main</span>: <span style={{color:"var(--ide-accent-green)"}}>#FFFFFF</span>;{"\n"}
      {"  "}<span style={{color:"var(--ide-accent-cyan)"}}>--ide-text-primary</span>: <span style={{color:"var(--ide-accent-green)"}}>#1C1E21</span>;{"\n"}
      {"}"}
    </code>
  </pre>);
}

export default function EditorArea({ showBottomPanel,bottomPanelTab,onShowBottomPanel,onBottomPanelTab }: Props) {
  const [activeFile, setActiveFile] = useState(OPENED_FILES[1]);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const parts = activeFile.path.split("/");

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
      {/* Tabs row */}
      <div style={{ height:38,display:"flex",alignItems:"flex-end",gap:2,padding:"4px 8px 0",flexShrink:0,
        background:"var(--ide-bg-main)",borderBottom:"1px solid var(--ide-border-subtle)" }}>
        {OPENED_FILES.map(f => (
          <div key={f.path}
            onClick={() => setActiveFile(f)}
            onMouseEnter={() => setHoveredTab(f.path)}
            onMouseLeave={() => setHoveredTab(null)}
            style={{
              display:"flex",alignItems:"center",gap:5,height:28,padding:"0 12px",
              borderRadius:"var(--ide-radius-md) var(--ide-radius-md) 0 0",
              background:activeFile.path===f.path?"var(--ide-tab-bg)":"transparent",
              border:"1px solid "+(activeFile.path===f.path?"var(--ide-tab-border)":"transparent"),
              borderBottom:activeFile.path===f.path?"none":"1px solid transparent",
              cursor:"pointer",flexShrink:0,minWidth:0,transition:"all 0.12s",
              color:"var(--ide-text-primary)",fontSize:"var(--ide-font-size-sm)",
              position:"relative" as const
            }}>
            <span style={{ fontSize:11,flexShrink:0 }}>{getIcon(f.lang)}</span>
            <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{f.name}</span>
            {f.modified && <span style={{ color:"var(--ide-accent-blue)",fontSize:16,lineHeight:1 }}>●</span>}
            {(hoveredTab===f.path || activeFile.path===f.path) && (
              <button style={{ width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",
                border:"none",background:"transparent",color:"var(--ide-text-disabled)",cursor:"pointer",
                borderRadius:"50%",fontSize:13,flexShrink:0 }} onClick={e=>e.stopPropagation()}>×</button>
            )}
          </div>
        ))}
        <div style={{ flex:1 }} />
      </div>

      {/* Breadcrumb */}
      <div style={{ display:"flex",alignItems:"center",height:24,padding:"0 12px",
        background:"var(--ide-bg-panel)",borderBottom:"1px solid var(--ide-border-subtle)",
        fontSize:"var(--ide-font-size-xs)",flexShrink:0,gap:2 }}>
        {parts.map((p,i) => (<span key={i} style={{ display:"flex",alignItems:"center",gap:2 }}>
          {i>0 && <span style={{ color:"var(--ide-text-disabled)" }}>/</span>}
          <span style={{ color:i===parts.length-1?"var(--ide-text-primary)":"var(--ide-text-secondary)",cursor:i===parts.length-1?"default":"pointer",fontWeight:i===parts.length-1?500:400 }}>{p}</span>
        </span>))}
      </div>

      {/* Editor */}
      <div style={{ flex:1,display:"flex",overflow:"auto" }}>
        <div style={{ width:48,flexShrink:0,background:"var(--ide-bg-panel)",
          borderRight:"1px solid var(--ide-border-subtle)",textAlign:"right",
          padding:"8px 8px 0 0",userSelect:"none" }}>
          {Array.from({length:20},(_,i)=>(
            <div key={i} style={{ height:19,fontSize:"var(--ide-font-size-xs)",
              color:i===0?"var(--ide-accent-blue)":"var(--ide-text-disabled)",
              lineHeight:"19px",fontFamily:"var(--ide-font-editor)",fontWeight:i===0?600:400 }}>{i+1}</div>
          ))}
        </div>
        <div style={{ flex:1,overflow:"auto",padding:"8px 0" }}>
          {activeFile.lang==="rust" ? <RustCode /> : activeFile.lang==="css" ? <CssCode /> : <TsxCode />}
        </div>
      </div>

      {/* Bottom panel */}
      {showBottomPanel && (
        <div style={{ height:180,display:"flex",flexDirection:"column",borderTop:"1px solid var(--ide-border)",flexShrink:0 }}>
          <div style={{ height:28,display:"flex",alignItems:"center",background:"var(--ide-bg-panel)",
            borderBottom:"1px solid var(--ide-border-subtle)",padding:"0 4px",gap:2,flexShrink:0 }}>
            {(["terminal","problems","services"] as const).map(t=>(
              <div key={t} style={{ padding:"3px 8px",fontSize:"var(--ide-font-size-xs)",cursor:"pointer",
                borderRadius:"var(--ide-radius-sm)",transition:"all 0.1s",
                color:bottomPanelTab===t?"var(--ide-text-primary)":"var(--ide-text-secondary)",
                background:bottomPanelTab===t?"var(--ide-bg-active)":"transparent" }}
                onClick={() => onBottomPanelTab(t)}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </div>
            ))}
            <div style={{ flex:1 }}/>
            <button onClick={()=>onShowBottomPanel(false)} style={{ width:20,height:20,display:"flex",alignItems:"center",
              justifyContent:"center",border:"none",background:"transparent",color:"var(--ide-text-disabled)",
              cursor:"pointer",borderRadius:"var(--ide-radius-xs)",fontSize:10 }}>✕</button>
          </div>
          <div style={{ flex:1,overflow:"auto",background:"var(--ide-bg-main)" }}>
            {bottomPanelTab==="terminal" && <pre style={{ fontFamily:"var(--ide-font-editor)",
              fontSize:"var(--ide-font-size-sm)",color:"var(--ide-text-primary)",padding:"8px 12px",
              lineHeight:"19px",whiteSpace:"pre-wrap",margin:0 }}>{TERM}</pre>}
            {bottomPanelTab==="problems" && <div style={{ display:"flex",alignItems:"center",justifyContent:"center",
              height:"100%",color:"var(--ide-text-disabled)",fontSize:"var(--ide-font-size-sm)" }}>No problems ✓</div>}
            {bottomPanelTab==="services" && <div style={{ display:"flex",alignItems:"center",justifyContent:"center",
              height:"100%",color:"var(--ide-text-disabled)",fontSize:"var(--ide-font-size-sm)" }}>No services</div>}
          </div>
        </div>
      )}
    </div>
  );
}
