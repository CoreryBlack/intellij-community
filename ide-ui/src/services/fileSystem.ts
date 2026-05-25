/**
 * @see com.intellij.openapi.vfs.VirtualFileManager
 * @see com.intellij.openapi.vfs.VirtualFile
 *
 * File system service — bridges Tauri backend (Rust) to frontend
 * All file operations go through Tauri invoke commands
 */

import { invoke } from "@tauri-apps/api/core";
import type { DirEntry } from "../store/ideStore";

export async function readDirectory(path: string): Promise<DirEntry[]> {
  try {
    const entries = await invoke<DirEntry[]>("read_directory", { path });
    return entries.sort((a, b) => {
      if (a.is_dir && !b.is_dir) return -1;
      if (!a.is_dir && b.is_dir) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}

export async function readFileContent(path: string): Promise<string> {
  try {
    return await invoke<string>("read_file_content", { path });
  } catch {
    return "";
  }
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    return await invoke<boolean>("file_exists", { path });
  } catch {
    return false;
  }
}

export async function isDirectory(path: string): Promise<boolean> {
  try {
    return await invoke<boolean>("is_directory", { path });
  } catch {
    return false;
  }
}

export function getFileLang(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    java: "java",
    kt: "kotlin",
    kts: "kotlin",
    rs: "rust",
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    go: "go",
    xml: "xml",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    md: "markdown",
    sql: "sql",
    sh: "shell",
    bat: "shell",
    ps1: "shell",
    properties: "properties",
    gradle: "groovy",
    groovy: "groovy",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
  };
  return langMap[ext] || "text";
}

export function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["java"].includes(ext)) return "☕";
  if (["kt", "kts"].includes(ext)) return "🟣";
  if (["rs"].includes(ext)) return "🦀";
  if (["ts", "tsx"].includes(ext)) return "🔷";
  if (["js", "jsx"].includes(ext)) return "🟡";
  if (["py"].includes(ext)) return "🐍";
  if (["xml", "html"].includes(ext)) return "📄";
  if (["json"].includes(ext)) return "📋";
  if (["md"].includes(ext)) return "📝";
  if (["css", "scss"].includes(ext)) return "🎨";
  if (["yaml", "yml", "toml"].includes(ext)) return "⚙";
  if (["sql"].includes(ext)) return "🗃";
  if (["sh", "bat"].includes(ext)) return "🖥";
  if (["gradle"].includes(ext)) return "🧩";
  if (name === "pom.xml") return "📦";
  if (name === "Cargo.toml") return "🦀";
  if (name === "package.json") return "📦";
  if (name === "README.md") return "📖";
  if (name.startsWith(".")) return "⚙";
  return "📄";
}
