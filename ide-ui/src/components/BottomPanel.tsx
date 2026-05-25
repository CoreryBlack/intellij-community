/**
 * @see com.intellij.openapi.wm.impl.status.IdeStatusBarImpl
 * @see com.intellij.openapi.application.impl.islands.IslandsUICustomization
 *
 * Official bottom tool window (in verticalSplitter.lastComponent) wrapped in Island:
 *
 *   XNextIslandHolder (Island container)
 *   └─ InternalDecoratorImpl
 *       ├─ TitleBar (tab bar: Terminal / Problems / Services + action buttons)
 *       └─ ContentPanel (terminal output / problems list / services tree)
 *
 * Island visual treatment:
 *   - borderRadius: var(--island-arc) = 20px
 *   - borderWidth: var(--island-border-width) = 6px
 *   - borderColor: var(--island-border-color) = #191A1C
 *   - Island.ToolWindow.border padding: 3px
 *   - Full width of the center area (not including button strip)
 */

interface Props {
  bottomPanelTab: "terminal" | "problems" | "services";
  onBottomPanelTab: (tab: "terminal" | "problems" | "services") => void;
  onHide: () => void;
}

const BOTTOM_TABS = [
  { id: "terminal" as const, label: "Terminal" },
  { id: "problems" as const, label: "Problems" },
  { id: "services" as const, label: "Services" },
];

export default function BottomPanel({ bottomPanelTab, onBottomPanelTab, onHide }: Props) {
  return (
    <div style={{
      flex: "0 0 38%",
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      borderRadius: "var(--island-arc)",
      background: "var(--island-border-color)",
      padding: "var(--island-tool-window-padding)",
    }}>
      {/* Island inner content */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
        borderRadius: "calc(var(--island-arc) - var(--island-tool-window-padding))",
        background: "var(--ide-bg-tool-window)",
      }}>

        {/* ═══════ TitleBar ═══════
         * @see InternalDecorator TitleBar
         * Tab buttons + action buttons (right side)
         */}
        <div style={{
          height: 30,
          display: "flex",
          alignItems: "center",
          background: "var(--ide-bg-tool-window)",
          padding: "0 8px",
          gap: 0,
          flexShrink: 0,
        }}>
          {BOTTOM_TABS.map(t => (
            <div key={t.id} style={{
              padding: "4px 14px",
              fontSize: "var(--ide-font-size-xs)",
              cursor: "pointer",
              borderRadius: "var(--ide-radius-sm) var(--ide-radius-sm) 0 0",
              transition: "background var(--ide-transition-fast)",
              color: bottomPanelTab === t.id ? "var(--ide-text-default)" : "var(--ide-text-muted)",
              background: bottomPanelTab === t.id ? "var(--ide-bg-tool-window)" : "transparent",
              fontWeight: bottomPanelTab === t.id ? 500 : 400,
              position: "relative" as const,
            }}
              onClick={() => onBottomPanelTab(t.id)}
              onMouseOver={e => { if (bottomPanelTab !== t.id) e.currentTarget.style.background = "var(--ide-bg-hover)"; }}
              onMouseOut={e => { if (bottomPanelTab !== t.id) e.currentTarget.style.background = "transparent"; }}
            >
              {t.label}
              {bottomPanelTab === t.id && (
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: "var(--editor-tab-underline-arc)",
                  right: "var(--editor-tab-underline-arc)",
                  height: "var(--editor-tab-underline-height)",
                  background: "var(--editor-tab-selected-border)",
                  borderRadius: "var(--editor-tab-underline-arc) var(--editor-tab-underline-arc) 0 0",
                }} />
              )}
            </div>
          ))}

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
            <button style={{
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "transparent",
              color: "var(--ide-text-secondary)",
              cursor: "pointer",
              borderRadius: "var(--ide-radius-xs)",
              fontSize: 11,
              transition: "background var(--ide-transition-fast)",
              padding: 0,
            }}
              title="Clear"
              onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >🗑</button>
            <button style={{
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "transparent",
              color: "var(--ide-text-secondary)",
              cursor: "pointer",
              borderRadius: "var(--ide-radius-xs)",
              fontSize: 11,
              transition: "background var(--ide-transition-fast)",
              padding: 0,
            }}
              title="Scroll to end"
              onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >⬇</button>
            <button onClick={onHide} style={{
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "transparent",
              color: "var(--ide-text-disabled)",
              cursor: "pointer",
              borderRadius: "var(--ide-radius-xs)",
              fontSize: 11,
              transition: "background var(--ide-transition-fast)",
              padding: 0,
            }}
              onMouseOver={e => e.currentTarget.style.background = "var(--ide-bg-hover)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >✕</button>
          </div>
        </div>

        {/* ═══════ ContentPanel ═══════ */}
        <div style={{ flex: 1, overflow: "auto", background: "var(--ide-bg-editor)", padding: "8px 12px", minHeight: 0 }}>
          {bottomPanelTab === "terminal" && (
            <pre style={{
              fontFamily: "var(--ide-font-editor)",
              fontSize: "var(--ide-font-size-xs)",
              lineHeight: "17px",
              whiteSpace: "pre-wrap",
              margin: 0,
              color: "var(--ide-text-editor)",
            }}>
{`07:17:34.486 DEBUG [reactor-http-nio-4] [] r.s.c.o.h.f.FilteringWebHandler  Sorted gatewayFilterFactories: [[GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapt.GlobalFilterAdapter$$Lambda$1145/0x00007fb7a407d828}, order = -2147483648], [GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapter.NettyWriteResponseFilter$$Lambda$1146/0x00007fb7a407e0b8}, order = -1], [GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapter.ForwardPathFilter$$Lambda$1147/0x00007fb7a407e700}, order = 0], [GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapter.GatewayToGlobalFilter$$Lambda$1148/0x00007fb7a407ed50}, order = 2147483647]]
07:17:34.491 DEBUG [reactor-http-nio-4] [] c.a.p.f.d.ObservedResponseHeadersDefilter  Client observation for HTTP request [name=client.request;remote=null;error=null;context-names=[http]
07:17:34.551 DEBUG [reactor-http-nio-4] [] a.c.p.h.f.ObservedResponseHeadersDefilter  Will instrument the response [name=client.request;null];error=null;co
07:17:34.973 DEBUG [reactor-http-nio-5] [] r.s.c.p.h.f.ObservedResponseHeadersDefilter  Client observation for HTTP request [name=client.request;remote=null;error=null;context-names=[http]
07:17:35.172 DEBUG [reactor-http-nio-5] [] o.s.c.p.h.f.ObservedResponseHeadersDefilter  Will instrument the response [name=client.request;remote=null;context-names=[http]
07:17:37.117 DEBUG [reactor-http-nio-5] [] .r.s.c.p.h.r.RoutePredicateHandlerMapping   [Mapping exchange=[Exchange http://localhost/cloud/gateway?handlerId=filtering-handler&vrd6...
07:17:37.117 DEBUG [reactor-http-nio-5] [] r.s.c.p.h.f.FilteringWebHandler   Sorted gatewayFilterFactories: [[GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapt.GlobalFilterAdapter$$Lambda$1145/0x00007fb7a407d828}, order = -2147483648], [GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapter.NettyWriteResponseFilter$$Lambda$1146/0x00007fb7a407e0b8}, order = -1], [GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapter.ForwardPathFilter$$Lambda$1147/0x00007fb7a407e700}, order = 0], [GatewayFilterAdapter{delegate=org.springframework.cloud.gateway.filter.adapter.GatewayToGlobalFilter$$Lambda$1148/0x00007fb7a407ed50}, order = 2147483647]]
07:17:37.117 DEBUG [reactor-http-nio-5] [] c.a.p.f.d.ObservedResponseHeadersDefilter  Client observation for HTTP request [name=client.request;remote=null;error=null;context-names=[http]`}
            </pre>
          )}
          {bottomPanelTab === "problems" && (
            <div style={{ color: "var(--ide-text-disabled)", fontSize: "var(--ide-font-size-sm)", textAlign: "center", paddingTop: 20 }}>
              No problems detected
            </div>
          )}
          {bottomPanelTab === "services" && (
            <div style={{ color: "var(--ide-text-disabled)", fontSize: "var(--ide-font-size-sm)", textAlign: "center", paddingTop: 20 }}>
              No services running
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
