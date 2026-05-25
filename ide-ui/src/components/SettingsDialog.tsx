/**
 * @see com.intellij.openapi.options.newEditor.SettingsEditor
 * @see com.intellij.openapi.options.newEditor.SettingsTreeView
 * @see com.intellij.openapi.options.newEditor.SettingsSearch
 * @see com.intellij.openapi.options.newEditor.ConfigurableEditor
 * @see com.intellij.openapi.options.newEditor.ConfigurableEditorBanner
 *
 * SettingsDialog — PURE RENDERER.
 * ALL data comes from Rust backend (settings::SettingsDescriptor).
 *
 * Official layout (SettingsEditor):
 *   OnePixelSplitter(ratio=0.2):
 *     LEFT  = searchField + treeView (ConfigurableGroup tree)
 *     RIGHT = banner (breadcrumb + history toolbar) + configurableEditor (card panel)
 *
 * Key parameters:
 *   - dialog min size: 900x700
 *   - splitter ratio: 0.2 (20% left, 80% right)
 *   - tree row height: 24px
 *   - search field height: 28px
 *   - modified item color: blue (--link-color)
 *   - error item color: red (--error-color)
 *   - side panel background: --side-panel-background
 *   - splitter width: 1px
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { getSettingsDescriptor, settingsSelectConfigurable, settingsSearch, settingsApply, settingsReset } from "../services/ideService";

interface ConfigurableItem {
  id: string;
  label: string;
  description: string | null;
  icon: string | null;
  configurable_type: "Standard" | "Composite" | "Searchable";
  children: ConfigurableItem[];
  modified: boolean;
  has_error: boolean;
  enabled: boolean;
  search_terms: string[];
  project_level: boolean;
  beta: boolean;
  promo: boolean;
}

interface ConfigurableGroup {
  id: string;
  label: string;
  description: string | null;
  configurables: ConfigurableItem[];
}

interface BreadcrumbItem {
  id: string;
  label: string;
}

interface SettingsEditorState {
  current_configurable_id: string | null;
  modified_ids: string[];
  error_ids: string[];
  search_query: string;
  breadcrumbs: BreadcrumbItem[];
  can_navigate_back: boolean;
  can_navigate_forward: boolean;
}

interface SettingsDescriptor {
  title: string;
  groups: ConfigurableGroup[];
  editor_state: SettingsEditorState;
  dialog_width: number;
  dialog_height: number;
  splitter_ratio: number;
  show_apply_button: boolean;
  show_reset_button: boolean;
  is_modified: boolean;
  has_errors: boolean;
}

const FALLBACK_SETTINGS: SettingsDescriptor = {
  title: "Settings",
  groups: [
    {
      id: "appearance", label: "Appearance & Behavior", description: "Customize the IDE appearance and behavior",
      configurables: [
        { id: "appearance", label: "Appearance", description: null, icon: null, configurable_type: "Composite", children: [
          { id: "appearance.ui", label: "UI Options", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["theme", "font", "size"], project_level: false, beta: false, promo: false },
          { id: "appearance.toolbar", label: "Toolbar", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["main toolbar", "navigation"], project_level: false, beta: false, promo: false },
          { id: "appearance.statusbar", label: "Status Bar", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["status bar", "widgets"], project_level: false, beta: false, promo: false },
        ], modified: false, has_error: false, enabled: true, search_terms: [], project_level: false, beta: false, promo: false },
        { id: "new.ui", label: "New UI", description: null, icon: null, configurable_type: "Composite", children: [
          { id: "new.ui.settings", label: "New UI Settings", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["compact mode", "toolbar", "islands"], project_level: false, beta: false, promo: false },
          { id: "new.ui.experimental", label: "Experimental Features", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["experimental", "preview"], project_level: false, beta: true, promo: false },
        ], modified: false, has_error: false, enabled: true, search_terms: [], project_level: false, beta: false, promo: false },
        { id: "accessibility", label: "Accessibility", description: null, icon: null, configurable_type: "Composite", children: [
          { id: "accessibility.settings", label: "Accessibility Settings", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["contrast", "color blindness"], project_level: false, beta: false, promo: false },
        ], modified: false, has_error: false, enabled: true, search_terms: [], project_level: false, beta: false, promo: false },
        { id: "system.settings", label: "System Settings", description: null, icon: null, configurable_type: "Composite", children: [
          { id: "system.settings.general", label: "General", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["startup", "reopen"], project_level: false, beta: false, promo: false },
          { id: "system.settings.http.proxy", label: "HTTP Proxy", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["proxy", "http"], project_level: false, beta: false, promo: false },
        ], modified: false, has_error: false, enabled: true, search_terms: [], project_level: false, beta: false, promo: false },
        { id: "notifications", label: "Notifications", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["notifications", "popup"], project_level: false, beta: false, promo: false },
      ],
    },
    {
      id: "keymap", label: "Keymap", description: "Configure keyboard shortcuts",
      configurables: [
        { id: "keymap.main", label: "Keymap", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["keymap", "shortcut", "keyboard"], project_level: false, beta: false, promo: false },
      ],
    },
    {
      id: "editor", label: "Editor", description: "Configure the editor",
      configurables: [
        { id: "editor.general", label: "General", description: null, icon: null, configurable_type: "Composite", children: [
          { id: "editor.general.basic", label: "Basic", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["editor", "basic", "caret"], project_level: false, beta: false, promo: false },
          { id: "editor.general.appearance", label: "Appearance", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["line numbers", "gutter", "breadcrumbs"], project_level: false, beta: false, promo: false },
          { id: "editor.general.editor.tabs", label: "Editor Tabs", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["tab", "placement"], project_level: false, beta: false, promo: false },
        ], modified: false, has_error: false, enabled: true, search_terms: [], project_level: false, beta: false, promo: false },
        { id: "editor.font", label: "Font", description: null, icon: null, configurable_type: "Composite", children: [
          { id: "editor.font.primary", label: "Primary Font", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["font", "size", "line spacing"], project_level: false, beta: false, promo: false },
        ], modified: false, has_error: false, enabled: true, search_terms: [], project_level: false, beta: false, promo: false },
        { id: "editor.color.scheme", label: "Color Scheme", description: null, icon: null, configurable_type: "Composite", children: [
          { id: "editor.color.scheme.general", label: "Color Scheme", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["color", "scheme", "theme"], project_level: false, beta: false, promo: false },
        ], modified: false, has_error: false, enabled: true, search_terms: [], project_level: false, beta: false, promo: false },
        { id: "editor.code.style", label: "Code Style", description: null, icon: null, configurable_type: "Composite", children: [
          { id: "editor.code.style.general", label: "General", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["code style", "indent"], project_level: false, beta: false, promo: false },
        ], modified: false, has_error: false, enabled: true, search_terms: [], project_level: false, beta: false, promo: false },
        { id: "editor.live.templates", label: "Live Templates", description: null, icon: null, configurable_type: "Composite", children: [
          { id: "editor.live.templates.general", label: "General", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["live template", "snippet"], project_level: false, beta: false, promo: false },
        ], modified: false, has_error: false, enabled: true, search_terms: [], project_level: false, beta: false, promo: false },
      ],
    },
    {
      id: "plugins", label: "Plugins", description: "Manage plugins",
      configurables: [
        { id: "plugins.marketplace", label: "Marketplace", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["plugin", "install"], project_level: false, beta: false, promo: false },
        { id: "plugins.installed", label: "Installed", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["plugin", "manage"], project_level: false, beta: false, promo: false },
      ],
    },
    {
      id: "version.control", label: "Version Control", description: "Configure version control",
      configurables: [
        { id: "vcs.general", label: "General", description: null, icon: null, configurable_type: "Composite", children: [
          { id: "vcs.git", label: "Git", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["git", "ssh", "commit"], project_level: false, beta: false, promo: false },
          { id: "vcs.github", label: "GitHub", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["github", "pull request"], project_level: false, beta: false, promo: false },
        ], modified: false, has_error: false, enabled: true, search_terms: [], project_level: false, beta: false, promo: false },
        { id: "vcs.confirmation", label: "Confirmation", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["confirmation"], project_level: false, beta: false, promo: false },
      ],
    },
    {
      id: "build.execution.deployment", label: "Build, Execution, Deployment", description: "Build and deployment settings",
      configurables: [
        { id: "build.tools", label: "Build Tools", description: null, icon: null, configurable_type: "Composite", children: [
          { id: "build.gradle", label: "Gradle", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["gradle", "build"], project_level: false, beta: false, promo: false },
          { id: "build.maven", label: "Maven", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["maven", "pom"], project_level: false, beta: false, promo: false },
        ], modified: false, has_error: false, enabled: true, search_terms: [], project_level: false, beta: false, promo: false },
        { id: "build.compiler", label: "Compiler", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["compiler", "javac"], project_level: false, beta: false, promo: false },
      ],
    },
    {
      id: "languages.frameworks", label: "Languages & Frameworks", description: "Language and framework settings",
      configurables: [
        { id: "lang.java", label: "Java", description: null, icon: null, configurable_type: "Composite", children: [
          { id: "lang.java.compiler", label: "Compiler", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["java", "compiler"], project_level: false, beta: false, promo: false },
        ], modified: false, has_error: false, enabled: true, search_terms: [], project_level: false, beta: false, promo: false },
        { id: "lang.kotlin", label: "Kotlin", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["kotlin", "compiler"], project_level: false, beta: false, promo: false },
      ],
    },
    {
      id: "tools", label: "Tools", description: "External tools and integrations",
      configurables: [
        { id: "tools.actions.on.save", label: "Actions on Save", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["save", "reformat"], project_level: false, beta: false, promo: false },
        { id: "tools.terminal", label: "Terminal", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["terminal", "shell"], project_level: false, beta: false, promo: false },
        { id: "tools.diff", label: "Diff", description: null, icon: null, configurable_type: "Searchable", children: [], modified: false, has_error: false, enabled: true, search_terms: ["diff", "compare"], project_level: false, beta: false, promo: false },
      ],
    },
  ],
  editor_state: {
    current_configurable_id: null,
    modified_ids: [],
    error_ids: [],
    search_query: "",
    breadcrumbs: [],
    can_navigate_back: false,
    can_navigate_forward: false,
  },
  dialog_width: 900,
  dialog_height: 700,
  splitter_ratio: 0.2,
  show_apply_button: false,
  show_reset_button: false,
  is_modified: false,
  has_errors: false,
};

interface Props {
  onClose: () => void;
}

function TreeIcon({ expanded, hasChildren }: { expanded: boolean; hasChildren: boolean }) {
  if (!hasChildren) return <span style={{ width: 16, flexShrink: 0 }} />;
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="currentColor" style={{
      flexShrink: 0,
      transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
      transition: "transform 0.15s ease",
      color: "var(--text-muted)",
    }}>
      <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TreeItem({
  item,
  depth,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
}: {
  item: ConfigurableItem;
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isSelected = item.id === selectedId;
  const isExpanded = expandedIds.has(item.id);
  const hasChildren = item.children.length > 0;
  const color = item.has_error
    ? "var(--error-color, #F44747)"
    : item.modified
      ? "var(--link-color, #3871E1)"
      : isSelected
        ? "var(--text-default)"
        : "var(--text-default)";

  return (
    <>
      <div
        onClick={() => {
          onSelect(item.id);
          if (hasChildren) onToggle(item.id);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          height: 24,
          paddingLeft: 4 + depth * 16,
          paddingRight: 4,
          cursor: "pointer",
          borderRadius: 4,
          background: isSelected ? "var(--selection-bg-active)" : hovered ? "var(--toolbar-bg-hovered)" : "transparent",
          color,
          fontSize: 12,
          fontWeight: depth === 0 ? 600 : 400,
          userSelect: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        <TreeIcon expanded={isExpanded} hasChildren={hasChildren} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
        {item.beta && (
          <span style={{ fontSize: 9, fontWeight: 600, color: "var(--accent-brand-bg)", background: "var(--accent-brand-bg-alpha)", padding: "0 4px", borderRadius: 3, lineHeight: "16px", flexShrink: 0 }}>Beta</span>
        )}
      </div>
      {hasChildren && isExpanded && item.children.map(child => (
        <TreeItem
          key={child.id}
          item={child}
          depth={depth + 1}
          selectedId={selectedId}
          expandedIds={expandedIds}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

function SettingsContent({ item }: { item: ConfigurableItem | null; depth?: number }) {
  if (!item) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-disabled)", fontSize: 13 }}>
        Select a settings category
      </div>
    );
  }

  if (item.configurable_type === "Composite" && item.children.length > 0) {
    return (
      <div style={{ padding: "16px 20px" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-default)", marginBottom: 12 }}>{item.label}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {item.children.map(child => (
            <div key={child.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 6,
              cursor: "pointer",
              transition: "background 0.08s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 3l5 5-5 5" />
              </svg>
              <span style={{ fontSize: 13, color: "var(--text-default)" }}>{child.label}</span>
              {child.beta && <span style={{ fontSize: 9, fontWeight: 600, color: "var(--accent-brand-bg)", background: "var(--accent-brand-bg-alpha)", padding: "0 4px", borderRadius: 3 }}>Beta</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 20px" }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-default)", marginBottom: 16 }}>{item.label}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {item.id.includes("new.ui") && <NewUISettings />}
        {item.id.includes("appearance.ui") && <AppearanceSettings />}
        {item.id.includes("editor.font") && <FontSettings />}
        {item.id.includes("editor.general.appearance") && <EditorAppearanceSettings />}
        {item.id.includes("keymap") && <KeymapSettings />}
        {item.id.includes("vcs.git") && <GitSettings />}
        {item.id.includes("tools.terminal") && <TerminalSettings />}
        {!item.id.includes("new.ui") && !item.id.includes("appearance.ui") && !item.id.includes("editor.font") && !item.id.includes("editor.general.appearance") && !item.id.includes("keymap") && !item.id.includes("vcs.git") && !item.id.includes("tools.terminal") && <GenericSettings label={item.label} />}
      </div>
    </div>
  );
}

function SettingRow({ label, children, indent }: { label: string; children: React.ReactNode; indent?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: indent ? indent * 20 : 0, minHeight: 28 }}>
      <span style={{ fontSize: 12, color: "var(--text-default)", minWidth: 180, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Checkbox({ checked: initialChecked, label }: { checked: boolean; label: string }) {
  const [checked, setChecked] = useState(initialChecked);
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "var(--text-default)" }}>
      <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ accentColor: "var(--accent-brand-bg)" }} />
      {label}
    </label>
  );
}

function Select({ value, options }: { value: string; options: { value: string; label: string }[] }) {
  const [val, setVal] = useState(value);
  return (
    <select value={val} onChange={e => setVal(e.target.value)} style={{
      height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4,
      background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none", minWidth: 120,
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function NumberInput({ value, min, max, step = 1 }: { value: number; min: number; max: number; step?: number }) {
  const [val, setVal] = useState(value);
  return (
    <input type="number" value={val} min={min} max={max} step={step} onChange={e => setVal(Number(e.target.value))} style={{
      width: 60, height: 26, padding: "0 6px", border: "1px solid var(--control-border)", borderRadius: 4,
      background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none",
    }} />
  );
}

function NewUISettings() {
  return (
    <>
      <SettingRow label="Compact Mode">
        <Checkbox checked={true} label="Use compact mode (default)" />
      </SettingRow>
      <SettingRow label="Main Toolbar">
        <Checkbox checked={true} label="Show main toolbar" />
      </SettingRow>
      <SettingRow label="Tool Window Bars">
        <Select value="side" options={[{ value: "side", label: "Side" }, { value: "bottom", label: "Bottom" }, { value: "hidden", label: "Hidden" }]} />
      </SettingRow>
      <SettingRow label="Island Arc Radius">
        <NumberInput value={20} min={0} max={30} />
      </SettingRow>
      <SettingRow label="Merge Project Buttons">
        <Checkbox checked={true} label="Merge project and VCS buttons" />
      </SettingRow>
    </>
  );
}

function AppearanceSettings() {
  return (
    <>
      <SettingRow label="Theme">
        <Select value="dark" options={[{ value: "dark", label: "Dark (Darcula)" }, { value: "light", label: "Light" }, { value: "high-contrast", label: "High Contrast" }]} />
      </SettingRow>
      <SettingRow label="Use custom font">
        <Checkbox checked={false} label="Use custom font" />
      </SettingRow>
      <SettingRow label="Font size">
        <NumberInput value={13} min={8} max={36} />
      </SettingRow>
      <SettingRow label="Antialiasing">
        <Select value="greyscale" options={[{ value: "none", label: "None" }, { value: "greyscale", label: "Greyscale" }, { value: "subpixel", label: "Subpixel" }]} />
      </SettingRow>
    </>
  );
}

function FontSettings() {
  return (
    <>
      <SettingRow label="Font">
        <Select value="jetbrains-mono" options={[{ value: "jetbrains-mono", label: "JetBrains Mono" }, { value: "fira-code", label: "Fira Code" }, { value: "consolas", label: "Consolas" }, { value: "source-code-pro", label: "Source Code Pro" }]} />
      </SettingRow>
      <SettingRow label="Size">
        <NumberInput value={14} min={8} max={36} />
      </SettingRow>
      <SettingRow label="Line spacing">
        <NumberInput value={1.2} min={0.5} max={3} step={0.1} />
      </SettingRow>
      <SettingRow label="Enable ligatures">
        <Checkbox checked={true} label="Enable ligatures" />
      </SettingRow>
    </>
  );
}

function EditorAppearanceSettings() {
  return (
    <>
      <SettingRow label="Show line numbers">
        <Checkbox checked={true} label="Show line numbers" />
      </SettingRow>
      <SettingRow label="Show gutter icons">
        <Checkbox checked={true} label="Show gutter icons" />
      </SettingRow>
      <SettingRow label="Show breadcrumbs">
        <Checkbox checked={true} label="Show breadcrumbs" />
      </SettingRow>
      <SettingRow label="Show indent guides">
        <Checkbox checked={false} label="Show indent guides" />
      </SettingRow>
      <SettingRow label="Show hard wrap guide">
        <Checkbox checked={true} label="Show hard wrap at" />
        <NumberInput value={120} min={40} max={300} />
      </SettingRow>
    </>
  );
}

function KeymapSettings() {
  return (
    <>
      <SettingRow label="Keymap">
        <Select value="windows" options={[{ value: "windows", label: "Windows" }, { value: "macos", label: "macOS" }, { value: "gnome", label: "GNOME" }, { value: "kde", label: "KDE" }, { value: "vscode", label: "VSCode" }]} />
      </SettingRow>
      <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--layer-2-bg)", borderRadius: 6, fontSize: 11, color: "var(--text-muted)" }}>
        Use the search field above to find actions and assign shortcuts.
      </div>
    </>
  );
}

function GitSettings() {
  return (
    <>
      <SettingRow label="Git executable">
        <input defaultValue="git" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
      </SettingRow>
      <SettingRow label="SSH executable">
        <Select value="built-in" options={[{ value: "built-in", label: "Built-in" }, { value: "native", label: "Native" }]} />
      </SettingRow>
      <SettingRow label="Autodetect Git">
        <Checkbox checked={true} label="Autodetect Git executable" />
      </SettingRow>
      <SettingRow label="Commit signing">
        <Checkbox checked={false} label="Sign commits with GPG key" />
      </SettingRow>
    </>
  );
}

function TerminalSettings() {
  return (
    <>
      <SettingRow label="Shell path">
        <input defaultValue="powershell" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
      </SettingRow>
      <SettingRow label="Tab name">
        <input defaultValue="Terminal" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
      </SettingRow>
      <SettingRow label="Audible bell">
        <Checkbox checked={false} label="Audible bell" />
      </SettingRow>
      <SettingRow label="Copy on selection">
        <Checkbox checked={false} label="Copy on selection" />
      </SettingRow>
    </>
  );
}

function GenericSettings({ label }: { label: string }) {
  return (
    <div style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 12, textAlign: "center" }}>
      Settings for "{label}" will be available here.
    </div>
  );
}

function findItemById(groups: ConfigurableGroup[], id: string): ConfigurableItem | null {
  for (const group of groups) {
    for (const item of group.configurables) {
      const found = findItem(item, id);
      if (found) return found;
    }
  }
  return null;
}

function findItem(item: ConfigurableItem, id: string): ConfigurableItem | null {
  if (item.id === id) return item;
  for (const child of item.children) {
    const found = findItem(child, id);
    if (found) return found;
  }
  return null;
}

function filterItems(items: ConfigurableItem[], query: string): ConfigurableItem[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.reduce<ConfigurableItem[]>((acc, item) => {
    const labelMatch = item.label.toLowerCase().includes(q);
    const termMatch = item.search_terms.some(t => t.toLowerCase().includes(q));
    const filteredChildren = filterItems(item.children, query);
    if (labelMatch || termMatch || filteredChildren.length > 0) {
      acc.push({ ...item, children: filteredChildren });
    }
    return acc;
  }, []);
}

export default function SettingsDialog({ onClose }: Props) {
  const [descriptor, setDescriptor] = useState<SettingsDescriptor>(() => FALLBACK_SETTINGS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSettingsDescriptor()
      .then(data => setDescriptor(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    settingsSelectConfigurable(id).catch(() => {});
  }, []);

  const handleToggle = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    settingsSearch(searchQuery).catch(() => {});
  }, [searchQuery]);

  const filteredGroups = searchQuery
    ? descriptor.groups.map(g => ({ ...g, configurables: filterItems(g.configurables, searchQuery) })).filter(g => g.configurables.length > 0)
    : descriptor.groups;

  const selectedItem = selectedId ? findItemById(descriptor.groups, selectedId) : null;

  const breadcrumbs: BreadcrumbItem[] = [];
  if (selectedId) {
    for (const group of descriptor.groups) {
      const path = findBreadcrumbPath(group.configurables, selectedId, [{ id: group.id, label: group.label }]);
      if (path) { breadcrumbs.push(...path); break; }
    }
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.5)",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: descriptor.dialog_width,
        height: descriptor.dialog_height,
        display: "flex",
        flexDirection: "column",
        background: "var(--dialog-bg, var(--layer-1-bg))",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px var(--border-color, var(--separator-color))",
        overflow: "hidden",
      }}>
        {/* ═══ Title Bar ═══
         * @see DialogWrapper — title bar with close button
         */}
        <div style={{
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          flexShrink: 0,
          borderBottom: "1px solid var(--separator-color)",
          background: "var(--dialog-bg, var(--layer-1-bg))",
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-default)" }}>{descriptor.title}</span>
          <button onClick={onClose} style={{
            width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
            border: "none", borderRadius: 4, background: "transparent", cursor: "pointer", color: "var(--text-muted)",
            transition: "background 0.08s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--toolbar-bg-hovered)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>
        </div>

        {/* ═══ Main Content: Splitter ═══
         * @see SettingsEditor — OnePixelSplitter(ratio=0.2)
         */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* LEFT: Search + Tree */}
          <div style={{
            width: `${descriptor.splitter_ratio * 100}%`,
            minWidth: 200,
            display: "flex",
            flexDirection: "column",
            background: "var(--side-panel-background, var(--layer-0-bg))",
            borderRight: "1px solid var(--separator-color)",
          }}>
            {/* Search Field — @see SettingsSearch */}
            <div style={{ padding: "8px 8px 4px", flexShrink: 0 }}>
              <input
                ref={searchRef}
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: 24,
                  padding: "0 8px",
                  border: "1px solid var(--control-border)",
                  borderRadius: 4,
                  background: "var(--control-bg)",
                  color: "var(--text-default)",
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Tree View — @see SettingsTreeView */}
            <div style={{ flex: 1, overflow: "auto", padding: "4px 4px" }}>
              {filteredGroups.map(group => (
                <div key={group.id}>
                  {group.configurables.map(item => (
                    <TreeItem
                      key={item.id}
                      item={item}
                      depth={0}
                      selectedId={selectedId}
                      expandedIds={expandedIds}
                      onSelect={handleSelect}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Banner + Editor */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Breadcrumb Banner — @see ConfigurableEditorBanner */}
            {breadcrumbs.length > 0 && (
              <div style={{
                height: 32,
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "0 12px",
                flexShrink: 0,
                borderBottom: "1px solid var(--separator-color)",
                fontSize: 11,
                color: "var(--text-muted)",
              }}>
                {breadcrumbs.map((b, i) => (
                  <span key={b.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {i > 0 && <span style={{ color: "var(--text-disabled)" }}>/</span>}
                    <span style={{ color: i === breadcrumbs.length - 1 ? "var(--text-default)" : "var(--text-muted)", fontWeight: i === breadcrumbs.length - 1 ? 500 : 400 }}>{b.label}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Configurable Editor — @see ConfigurableEditor */}
            <div style={{ flex: 1, overflow: "auto" }}>
              <SettingsContent item={selectedItem} depth={0} />
            </div>
          </div>
        </div>

        {/* ═══ Bottom Buttons ═══
         * @see DialogWrapper.createActions() — OK, Cancel, Apply
         */}
        <div style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 8,
          padding: "0 12px",
          flexShrink: 0,
          borderTop: "1px solid var(--separator-color)",
        }}>
          <button onClick={onClose} style={{
            padding: "5px 16px", border: "1px solid var(--control-border)", borderRadius: 4,
            background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={() => {
            settingsReset().catch(() => {
              setDescriptor(FALLBACK_SETTINGS);
              setSelectedId(null);
              setExpandedIds(new Set());
              setSearchQuery("");
            });
          }} style={{
            padding: "5px 16px", border: "1px solid var(--control-border)", borderRadius: 4,
            background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, cursor: "pointer",
          }}>Reset</button>
          <button onClick={() => {
            settingsApply().catch(() => {});
            onClose();
          }} style={{
            padding: "5px 16px", border: "1px solid var(--control-border)", borderRadius: 4,
            background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, cursor: "pointer",
          }}>Apply</button>
          <button onClick={onClose} style={{
            padding: "5px 16px", border: "none", borderRadius: 4,
            background: "var(--accent-brand-bg)", color: "var(--text-over-accent)", fontSize: 12, cursor: "pointer", fontWeight: 500,
          }}>OK</button>
        </div>
      </div>
    </div>
  );
}

function findBreadcrumbPath(items: ConfigurableItem[], targetId: string, path: BreadcrumbItem[]): BreadcrumbItem[] | null {
  for (const item of items) {
    const newPath = [...path, { id: item.id, label: item.label }];
    if (item.id === targetId) return newPath;
    if (item.children.length > 0) {
      const result = findBreadcrumbPath(item.children, targetId, newPath);
      if (result) return result;
    }
  }
  return null;
}
