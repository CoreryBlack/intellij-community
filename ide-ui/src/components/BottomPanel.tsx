interface Props {
  bottomPanelTab: "terminal" | "problems" | "services";
  onBottomPanelTab: (tab: "terminal" | "problems" | "services") => void;
  onHide: () => void;
}

const BOTTOM_PANEL_APPS = [
  { name:"Spring Boot", status:"ready" as const },
  { name:"AstralChatApplication", status:"port" as const },
  { name:"AstralMonitorApplication", status:"port" as const },
  { name:"TestGroupApplication", status:"port" as const },
];

export default function BottomPanel({ bottomPanelTab, onBottomPanelTab, onHide }: Props) {
  return (
    <div style={{
      flex:"0 0 38%",display:"flex",flexDirection:"column",
      borderTop:"1px solid var(--ide-border)",minHeight:0,
      background:"var(--ide-bg-panel)"
    }}>
      {/* Tab bar */}
      <div style={{
        height:30,display:"flex",alignItems:"center",
        background:"var(--ide-bg-toolbar)",borderBottom:"1px solid var(--ide-border-subtle)",
        padding:"0 8px",gap:0,flexShrink:0
      }}>
        {([
          {id:"terminal" as const, label:"运行"},
          {id:"problems" as const, label:"问题"},
          {id:"services" as const, label:"服务"},
        ]).map(t => (
          <div key={t.id} style={{
            padding:"4px 14px",fontSize:"var(--ide-font-size-xs)",cursor:"pointer",
            borderRadius:"var(--ide-radius-sm) var(--ide-radius-sm) 0 0",transition:"all 0.1s",
            color:bottomPanelTab===t.id ? "var(--ide-text-primary)" : "var(--ide-text-secondary)",
            background:bottomPanelTab===t.id ? "var(--ide-bg-panel)" : "transparent",
            fontWeight:bottomPanelTab===t.id ? 500 : 400,
          }}
          onClick={()=>onBottomPanelTab(t.id)}>
            {t.label}
          </div>
        ))}

        <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4 }}>
          <button style={{
            width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",
            border:"none",background:"transparent",color:"var(--ide-text-secondary)",cursor:"pointer",
            borderRadius:"var(--ide-radius-xs)",fontSize:12,transition:"all 0.08s"
          }} title="Clear">🗑</button>
          <button style={{
            width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",
            border:"none",background:"transparent",color:"var(--ide-text-secondary)",cursor:"pointer",
            borderRadius:"var(--ide-radius-xs)",fontSize:12,transition:"all 0.08s"
          }} title="Scroll to end">⬇</button>
          <button onClick={onHide} style={{
            width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",
            border:"none",background:"transparent",color:"var(--ide-text-disabled)",
            cursor:"pointer",borderRadius:"var(--ide-radius-xs)",fontSize:12
          }}>✕</button>
        </div>
      </div>

      {/* Body: mini tree + terminal */}
      <div style={{ flex:1,display:"flex",overflow:"hidden",minHeight:0 }}>
        {/* Mini project tree */}
        <div style={{
          width:200,flexShrink:0,display:"flex",flexDirection:"column",
          borderRight:"1px solid var(--ide-border-subtle)",
          background:"var(--ide-bg-panel)",overflow:"hidden"
        }}>
          <div style={{
            height:28,display:"flex",alignItems:"center",padding:"0 10px",
            borderBottom:"1px solid var(--ide-border-subtle)",flexShrink:0,
            fontSize:"var(--ide-font-size-xs)",fontWeight:600,color:"var(--ide-text-secondary)",
            textTransform:"uppercase",letterSpacing:0.5
          }}>运行</div>
          <div style={{ flex:1,overflow:"auto",padding:"2px 0" }}>
            {BOTTOM_PANEL_APPS.map((app,i) => (
              <div key={i} style={{
                display:"flex",alignItems:"center",gap:6,height:26,
                padding:"0 10px",margin:"0 3px",borderRadius:"var(--ide-radius-sm)",
                fontSize:"var(--ide-font-size-xs)",color:"var(--ide-text-primary)",
                cursor:"pointer",transition:"background 0.08s"
              }}
              onMouseOver={e=>e.currentTarget.style.background="var(--ide-bg-hover)"}
              onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill={app.status==="ready" ? "var(--ide-accent-green)" : "var(--ide-accent-red)"}>
                  <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 1.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z"/>
                </svg>
                <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{app.name}</span>
                <span style={{
                  marginLeft:"auto",fontSize:9,flexShrink:0,
                  color:app.status==="ready" ? "var(--ide-accent-green)" : "var(--ide-accent-red)"
                }}>{app.status==="ready" ? "●READY" : "●0000"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal output */}
        <div style={{ flex:1,overflow:"auto",background:"var(--ide-bg-main)",padding:"8px 12px",minHeight:0 }}>
          <pre style={{
            fontFamily:"var(--ide-font-editor)",fontSize:"var(--ide-font-size-xs)",
            lineHeight:"17px",whiteSpace:"pre-wrap",margin:0,color:"var(--ide-text-primary)"
          }}>
{`07:17:34.486 DEBUG [reactor-http-nio-4] [] r.s.c.o.h.f.FilteringWebHandler  Sorted gatewayFilterFactories: [[GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapt.GlobalFilterAdapter$$Lambda$1145/0x00007fb7a407d828}, order = -2147483648], [GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapter.NettyWriteResponseFilter$$Lambda$1146/0x00007fb7a407e0b8}, order = -1], [GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapter.ForwardPathFilter$$Lambda$1147/0x00007fb7a407e700}, order = 0], [GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapter.GatewayToGlobalFilter$$Lambda$1148/0x00007fb7a407ed50}, order = 2147483647]]
07:17:34.491 DEBUG [reactor-http-nio-4] [] c.a.p.f.d.ObservedResponseHeadersDefilter  Client observation for HTTP request [name=client.request;remote=null;error=null;context-names=[http]
07:17:34.551 DEBUG [reactor-http-nio-4] [] a.c.p.h.f.ObservedResponseHeadersDefilter  Will instrument the response [name=client.request;null];error=null;co
07:17:34.973 DEBUG [reactor-http-nio-5] [] r.s.c.p.h.f.ObservedResponseHeadersDefilter  Client observation for HTTP request [name=client.request;remote=null;error=null;context-names=[http]
07:17:35.172 DEBUG [reactor-http-nio-5] [] o.s.c.p.h.f.ObservedResponseHeadersDefilter  Will instrument the response [name=client.request;remote=null;error=null;context-names=[http]
07:17:37.117 DEBUG [reactor-http-nio-5] [] .r.s.c.p.h.r.RoutePredicateHandlerMapping   [Mapping exchange=[Exchange http://localhost/cloud/gateway?handlerId=filtering-handler&vrd6...
07:17:37.117 DEBUG [reactor-http-nio-5] [] r.s.c.p.h.f.FilteringWebHandler   Sorted gatewayFilterFactories: [[GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapt.GlobalFilterAdapter$$Lambda$1145/0x00007fb7a407d828}, order = -2147483648], [GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapter.NettyWriteResponseFilter$$Lambda$1146/0x00007fb7a407e0b8}, order = -1], [GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapter.ForwardPathFilter$$Lambda$1147/0x00007fb7a407e700}, order = 0], [GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapter.GatewayToGlobalFilter$$Lambda$1148/0x00007fb7a407ed50}, order = 2147483647]]
07:17:37.117 DEBUG [reactor-http-nio-5] [] c.a.p.f.d.ObservedResponseHeadersDefilter  Client observation for HTTP request [name=client.request;remote=null;error=null;context-names=[http]`}
          </pre>
        </div>
      </div>
    </div>
  );
}
