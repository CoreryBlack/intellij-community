/**
 * @see com.intellij.terminal.TerminalView
 * @see com.intellij.terminal.TerminalWidget
 *
 * Terminal service — bridges Tauri Rust PTY backend to frontend
 * Manages terminal sessions, listens for output events
 */

import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface TerminalSession {
  id: string;
  shell: string;
  cwd: string;
  running: boolean;
}

export interface TerminalOutput {
  session_id: string;
  data: string;
}

export async function terminalCreate(cwd?: string): Promise<TerminalSession> {
  return await invoke<TerminalSession>("terminal_create", { cwd: cwd || null });
}

export async function terminalWrite(sessionId: string, data: string): Promise<void> {
  return await invoke("terminal_write", { sessionId, data });
}

export async function terminalResize(sessionId: string, cols: number, rows: number): Promise<void> {
  return await invoke("terminal_resize", { sessionId, cols, rows });
}

export async function terminalKill(sessionId: string): Promise<void> {
  return await invoke("terminal_kill", { sessionId });
}

export async function terminalList(): Promise<TerminalSession[]> {
  return await invoke<TerminalSession[]>("terminal_list");
}

export async function runCommand(command: string, cwd?: string): Promise<string> {
  return await invoke<string>("run_command", { command, cwd: cwd || null });
}

export function onTerminalOutput(callback: (output: TerminalOutput) => void): Promise<UnlistenFn> {
  return listen<TerminalOutput>("terminal-output", (event) => callback(event.payload));
}

export function onTerminalExit(callback: (output: TerminalOutput) => void): Promise<UnlistenFn> {
  return listen<TerminalOutput>("terminal-exit", (event) => callback(event.payload));
}
