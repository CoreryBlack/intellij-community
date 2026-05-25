import { useState } from "react";

interface Props {
  activeFile?: string;
}

interface OpenFile {
  name: string; path: string; lang: string; modified: boolean;
}

const OPENED_FILES: OpenFile[] = [
  { name:"UserControllerImpl.java", path:"src/main/java/com/corvertrack/monitor/controller/UserControllerImpl.java", lang:"java", modified:false },
  { name:"PortalsControllerImpl.java", path:"src/main/java/com/corvertrack/monitor/controller/PortalsControllerImpl.java", lang:"java", modified:false },
  { name:"AstralMonitorApplication.java", path:"src/main/java/com/corvertrack/monitor/AstralMonitorApplication.java", lang:"java", modified:true },
];

function JavaCode() {
  return (<pre style={{ fontFamily:"var(--ide-font-editor)",fontSize:"var(--ide-font-size-sm)",lineHeight:"20px",color:"var(--ide-text-primary)",whiteSpace:"pre",padding:"0 16px 100px",margin:0 }}>
    <code>
<span style={{color:"#C586C0"}}>package</span> <span style={{color:"#4EC9B0"}}>com.corvertrack.monitor</span>;{"\n"}
{"\n"}
<span style={{color:"#C586C0"}}>import</span> {"\n"}
{"  "}<span style={{color:"#4FC1FF"}}>org.springframework.boot.autoconfigure.SpringBootApplication</span>,{"\n"}
{"  "}<span style={{color:"#4FC1FF"}}>DataSourceAutoConfiguration</span>.<span style={{color:"#4EC9B0"}}>class</span>,{"\n"}
{"  "}<span style={{color:"#4FC1FF"}}>JdbcRequestAutoConfiguration</span>.<span style={{color:"#4EC9B0"}}>class</span>,{"\n"}
{"  "}<span style={{color:"#4FC1FF"}}>DataSourceTransactionManagerAutoConfiguration</span>.<span style={{color:"#4EC9B0"}}>class</span>,{"\n"}
{"  "}<span style={{color:"#4FC1FF"}}>HibernateJpaAutoConfiguration</span>.<span style={{color:"#4EC9B0"}}>class</span>,{"\n"}
{"  "}<span style={{color:"#4FC1FF"}}>NacosConfigAutoConfiguration</span>.<span style={{color:"#4EC9B0"}}>class</span>,{"\n"}
{"  "}<span style={{color:"#4FC1FF"}}>RedisAutoConfiguration</span>.<span style={{color:"#4EC9B0"}}>class</span>;{"\n"}
{"\n"}
<span style={{color:"#DCDCAA"}}>@Slf4j</span>{"\n"}
<span style={{color:"#DCDCAA"}}>@EnableWebMvc</span>{"\n"}
<span style={{color:"#C586C0"}}>public class</span> <span style={{color:"#4EC9B0"}}>AstralMonitorApplication</span> {"{"}{"\n"}
{"\n"}
{"    "}<span style={{color:"#C586C0"}}>public static void</span> <span style={{color:"#DCDCAA"}}>main</span>(String[] args) {"{"}{"\n"}
{"        "}SpringApplication.<span style={{color:"#DCDCAA"}}>run</span>(AstralMonitorApplication.<span style={{color:"#569CD6"}}>class</span>, args);{"\n"}
{"    }"}{"\n"}
{"}"}
    </code>
  </pre>);
}

export default function EditorArea({}: Props) {
  const [activeFile, setActiveFile] = useState(OPENED_FILES[2]);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const parts = activeFile.path.split("/");
  const lineCount = 18;

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>

      {/* ===== Tabs row ===== */}
      <div style={{
        height:36,display:"flex",alignItems:"flex-end",gap:0,padding:"0 8px",
        flexShrink:0,background:"var(--ide-bg-toolbar)",borderBottom:"1px solid var(--ide-border-subtle)"
      }}>
        {OPENED_FILES.map(f => {
          const isActive = activeFile.path === f.path;
          const isHovered = hoveredTab === f.path;
          return (
            <div key={f.path}
              onClick={() => setActiveFile(f)}
              onMouseEnter={() => setHoveredTab(f.path)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                display:"flex",alignItems:"center",gap:6,height:32,padding:"0 12px",
                borderRadius:"var(--ide-radius-sm) var(--ide-radius-sm) 0 0",
                background:isActive ? "var(--ide-bg-main)" : isHovered ? "var(--ide-bg-hover)" : "transparent",
                borderBottom: isActive ? "2px solid var(--ide-accent-blue)" : "2px solid transparent",
                cursor:"pointer",flexShrink:0,minWidth:0,transition:"all 0.12s",
                color:isActive ? "var(--ide-text-primary)" : "var(--ide-text-secondary)",
                fontSize:"var(--ide-font-size-sm)",
                position:"relative" as const,
                marginRight:1
              }}>
              <span style={{ fontSize:11,flexShrink:0 }}>☕</span>
              <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:isActive ? 500 : 400 }}>{f.name}</span>
              {f.modified && <span style={{ color:"var(--ide-accent-blue)",fontSize:14,lineHeight:1,marginLeft:2 }}>●</span>}
              {(isHovered || isActive) && (
                <button style={{
                  width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",
                  border:"none",background:"transparent",color:"var(--ide-text-disabled)",cursor:"pointer",
                  borderRadius:"var(--ide-radius-xs)",fontSize:14,flexShrink:0,padding:0,
                  transition:"all 0.08s"
                }} onClick={e=>e.stopPropagation()}>✕</button>
              )}
            </div>
          );
        })}
      </div>

      {/* ===== Breadcrumb navigation ===== */}
      <div style={{
        display:"flex",alignItems:"center",height:26,padding:"0 12px",
        background:"var(--ide-bg-main)",borderBottom:"1px solid var(--ide-border-subtle)",
        fontSize:"var(--ide-font-size-xs)",flexShrink:0,gap:3
      }}>
        {parts.map((p,i) => (<span key={i} style={{ display:"flex",alignItems:"center",gap:3 }}>
          {i > 0 && <span style={{ color:"var(--ide-text-disabled)",fontSize:9 }}>›</span>}
          <span style={{
            color:i===parts.length-1 ? "var(--ide-text-primary)" : "var(--ide-accent-blue)",
            cursor:i===parts.length-1 ? "default" : "pointer",
            fontWeight:i===parts.length-1 ? 500 : 400,
            transition:"color 0.08s"
          }}
          onMouseOver={e => { if(i<parts.length-1) e.currentTarget.style.color="var(--ide-text-primary)"; }}
          onMouseOut={e => { if(i<parts.length-1) e.currentTarget.style.color="var(--ide-accent-blue)"; }}>{p}</span>
        </span>))}
        <span style={{ flex:1 }} />
        <span style={{
          display:"inline-flex",alignItems:"center",gap:3,padding:"1px 6px",
          background:"var(--ide-bg-selected-muted)",borderRadius:"var(--ide-radius-sm)",
          color:"var(--ide-accent-blue-light)",fontSize:"var(--ide-font-size-xs)",fontWeight:500
        }}>⌃ 1 New</span>
      </div>

      {/* ===== Editor content ===== */}
      <div style={{ flex:1,display:"flex",overflow:"hidden",background:"var(--ide-bg-main)" }}>
        {/* Line numbers gutter */}
        <div style={{
          width:52,flexShrink:0,background:"var(--ide-bg-main)",
          borderRight:"1px solid var(--ide-border-subtle)",textAlign:"right",
          padding:"8px 10px 0 0",userSelect:"none",display:"flex",flexDirection:"column"
        }}>
          {Array.from({length:lineCount},(_,i)=>(
            <div key={i} style={{
              height:20,fontSize:"var(--ide-font-size-xs)",
              color:i===11 ? "var(--ide-accent-blue)" : "var(--ide-text-disabled)",
              lineHeight:"20px",fontFamily:"var(--ide-font-editor)",
              fontWeight:i===11 ? 600 : 400,transition:"all 0.05s"
            }}>{i+1}</div>
          ))}
        </div>

        {/* Code area */}
        <div style={{ flex:1,overflow:"auto",padding:"8px 0 0 0" }}>
          <JavaCode />
        </div>
      </div>
    </div>
  );
}
