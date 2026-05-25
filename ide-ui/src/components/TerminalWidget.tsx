/**
 * @see com.intellij.terminal.TerminalWidget
 * @see com.intellij.terminal.TerminalView
 *
 * Terminal widget — real PTY terminal via xterm.js + Tauri Rust backend
 * Spawns a shell process, streams I/O bidirectionally
 */

import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import {
  terminalCreate,
  terminalWrite,
  terminalResize,
  terminalKill,
  onTerminalOutput,
  onTerminalExit,
} from "../services/terminal";

interface Props {
  projectPath: string;
  visible: boolean;
}

export default function TerminalWidget({ projectPath, visible }: Props) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const unlistenRef = useRef<(() => void)[]>([]);

  const initTerminal = useCallback(async () => {
    if (!termRef.current || xtermRef.current) return;

    const xterm = new Terminal({
      fontSize: 13,
      fontFamily: "var(--ide-font-editor), 'JetBrains Mono', 'Cascadia Code', Consolas, monospace",
      theme: {
        background: "#191A1C",
        foreground: "#BCBEC4",
        cursor: "#D1D3D9",
        cursorAccent: "#191A1C",
        selectionBackground: "#2E4D89",
        black: "#191A1C",
        red: "#C54E58",
        green: "#338555",
        yellow: "#A56906",
        blue: "#3871E1",
        magenta: "#8060DB",
        cyan: "#31827B",
        white: "#D1D3D9",
        brightBlack: "#4C4F56",
        brightRed: "#E05A5A",
        brightGreen: "#4CA66A",
        brightYellow: "#C47D17",
        brightBlue: "#5A8FEF",
        brightMagenta: "#9B7DEB",
        brightCyan: "#419A93",
        brightWhite: "#FFFFFF",
      },
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 5000,
      convertEol: true,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(termRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitRef.current = fitAddon;

    try {
      const session = await terminalCreate(projectPath || undefined);
      sessionIdRef.current = session.id;

      xterm.onData(async (data) => {
        if (sessionIdRef.current) {
          await terminalWrite(sessionIdRef.current, data);
        }
      });

      const unlistenOutput = await onTerminalOutput((output) => {
        if (output.session_id === sessionIdRef.current) {
          xterm.write(output.data);
        }
      });

      const unlistenExit = await onTerminalExit((output) => {
        if (output.session_id === sessionIdRef.current) {
          xterm.write("\r\n\x1b[90m[Process exited]\x1b[0m\r\n");
        }
      });

      unlistenRef.current = [unlistenOutput, unlistenExit];
    } catch (e) {
      xterm.write(`\x1b[31mFailed to start terminal: ${e}\x1b[0m\r\n`);
    }
  }, [projectPath]);

  useEffect(() => {
    if (visible && termRef.current && !xtermRef.current) {
      initTerminal();
    }
  }, [visible, initTerminal]);

  useEffect(() => {
    if (visible && fitRef.current && xtermRef.current) {
      const timer = setTimeout(() => {
        fitRef.current?.fit();
        if (sessionIdRef.current && xtermRef.current) {
          const rows = xtermRef.current.rows;
          const cols = xtermRef.current.cols;
          terminalResize(sessionIdRef.current, cols, rows).catch(() => {});
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  useEffect(() => {
    const handleResize = () => {
      if (fitRef.current && visible) {
        fitRef.current.fit();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [visible]);

  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        terminalKill(sessionIdRef.current).catch(() => {});
      }
      unlistenRef.current.forEach(fn => fn());
      xtermRef.current?.dispose();
    };
  }, []);

  return (
    <div
      ref={termRef}
      style={{
        width: "100%",
        height: "100%",
        padding: "4px 8px",
        background: "var(--ide-bg-editor)",
      }}
    />
  );
}
