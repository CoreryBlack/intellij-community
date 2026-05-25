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

  const id = item.id;
  let content: React.ReactNode = null;

  if (id === "new.ui.settings" || id === "new.ui.experimental") content = <NewUISettings />;
  else if (id === "appearance.ui") content = <AppearanceUISettings />;
  else if (id === "appearance.toolbar") content = <ToolbarSettings />;
  else if (id === "appearance.statusbar") content = <StatusBarSettings />;
  else if (id === "accessibility.settings") content = <AccessibilitySettings />;
  else if (id === "system.settings.general") content = <SystemGeneralSettings />;
  else if (id === "system.settings.passwords") content = <PasswordSettings />;
  else if (id === "system.settings.http.proxy") content = <HttpProxySettings />;
  else if (id === "system.settings.updates") content = <UpdateSettings />;
  else if (id === "system.settings.data.sharing") content = <DataSharingSettings />;
  else if (id === "file.colors") content = <FileColorsSettings />;
  else if (id === "scopes") content = <ScopesSettings />;
  else if (id === "notifications") content = <NotificationsSettings />;
  else if (id === "quick.lists") content = <QuickListsSettings />;
  else if (id === "path.variables") content = <PathVariablesSettings />;
  else if (id === "keymap.main") content = <KeymapSettings />;
  else if (id === "editor.general.basic") content = <EditorBasicSettings />;
  else if (id === "editor.general.smart.keys") content = <SmartKeysSettings />;
  else if (id === "editor.general.appearance") content = <EditorAppearanceSettings />;
  else if (id === "editor.general.soft.wrap") content = <SoftWrapSettings />;
  else if (id === "editor.general.code.folding") content = <CodeFoldingSettings />;
  else if (id === "editor.general.editor.tabs") content = <EditorTabsSettings />;
  else if (id === "editor.general.gutter.icons") content = <GutterIconsSettings />;
  else if (id === "editor.font.primary") content = <FontSettings />;
  else if (id === "editor.color.scheme.general") content = <ColorSchemeSettings />;
  else if (id === "editor.code.style.general") content = <CodeStyleGeneralSettings />;
  else if (id === "editor.code.style.java") content = <JavaCodeStyleSettings />;
  else if (id === "editor.code.style.kotlin") content = <KotlinCodeStyleSettings />;
  else if (id === "editor.file.encodings") content = <FileEncodingsSettings />;
  else if (id === "editor.emmet.html") content = <EmmetHtmlSettings />;
  else if (id === "editor.emmet.css") content = <EmmetCssSettings />;
  else if (id === "editor.live.templates.general") content = <LiveTemplatesSettings />;
  else if (id === "editor.file.templates") content = <FileTemplatesSettings />;
  else if (id === "editor.inspections.general") content = <InspectionsGeneralSettings />;
  else if (id === "editor.inspections.java") content = <JavaInspectionsSettings />;
  else if (id === "editor.inspections.kotlin") content = <KotlinInspectionsSettings />;
  else if (id === "editor.file.types") content = <FileTypesSettings />;
  else if (id === "editor.copyright") content = <CopyrightSettings />;
  else if (id === "plugins.marketplace") content = <PluginsMarketplaceSettings />;
  else if (id === "plugins.installed") content = <PluginsInstalledSettings />;
  else if (id === "vcs.git") content = <GitSettings />;
  else if (id === "vcs.github") content = <GitHubSettings />;
  else if (id === "vcs.confirmation") content = <VcsConfirmationSettings />;
  else if (id === "vcs.changelists") content = <ChangelistsSettings />;
  else if (id === "vcs.issue.navigation") content = <IssueNavigationSettings />;
  else if (id === "vcs.commit") content = <VcsCommitSettings />;
  else if (id === "build.gradle") content = <GradleSettings />;
  else if (id === "build.maven") content = <MavenSettings />;
  else if (id === "build.compiler") content = <CompilerSettings />;
  else if (id === "build.debugger") content = <DebuggerSettings />;
  else if (id === "build.coverage") content = <CoverageSettings />;
  else if (id === "lang.java.compiler") content = <JavaCompilerSettings />;
  else if (id === "lang.java.code.coverage") content = <JavaCoverageSettings />;
  else if (id === "lang.kotlin") content = <KotlinSettings />;
  else if (id === "lang.spring.boot") content = <SpringBootSettings />;
  else if (id === "lang.sql.general") content = <SqlSettings />;
  else if (id === "lang.javascript.general") content = <JavaScriptSettings />;
  else if (id === "lang.typescript") content = <TypeScriptSettings />;
  else if (id === "tools.actions.on.save") content = <ActionsOnSaveSettings />;
  else if (id === "tools.external.tools") content = <ExternalToolsSettings />;
  else if (id === "tools.terminal") content = <TerminalSettings />;
  else if (id === "tools.diagrams") content = <DiagramsSettings />;
  else if (id === "tools.web.browsers") content = <WebBrowsersSettings />;
  else if (id === "tools.diff") content = <DiffSettings />;
  else if (id === "tools.tasks.general") content = <TasksSettings />;
  else content = <GenericSettings label={item.label} />;

  return (
    <div style={{ padding: "16px 20px" }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-default)", marginBottom: 16 }}>{item.label}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {content}
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
      <SettingRow label="Tool Window Stripe">
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

function AppearanceUISettings() {
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
      <SettingRow label="Override default fonts">
        <Checkbox checked={false} label="Override default fonts" />
      </SettingRow>
    </>
  );
}

function ToolbarSettings() {
  return (
    <>
      <SettingRow label="Show Main Toolbar">
        <Checkbox checked={true} label="Show main toolbar" />
      </SettingRow>
      <SettingRow label="Show Search Everywhere">
        <Checkbox checked={true} label="Show search everywhere button" />
      </SettingRow>
      <SettingRow label="Show Run Widget">
        <Checkbox checked={true} label="Show run widget" />
      </SettingRow>
      <SettingRow label="Show Navigation Bar">
        <Checkbox checked={false} label="Show navigation bar" />
      </SettingRow>
    </>
  );
}

function StatusBarSettings() {
  return (
    <>
      <SettingRow label="Show Status Bar">
        <Checkbox checked={true} label="Show status bar" />
      </SettingRow>
      <SettingRow label="Show Memory Indicator">
        <Checkbox checked={true} label="Show memory indicator" />
      </SettingRow>
      <SettingRow label="Show Notifications">
        <Checkbox checked={true} label="Show notification widget" />
      </SettingRow>
    </>
  );
}

function AccessibilitySettings() {
  return (
    <>
      <SettingRow label="High Contrast">
        <Checkbox checked={false} label="Use high contrast mode" />
      </SettingRow>
      <SettingRow label="Support Screen Readers">
        <Checkbox checked={false} label="Optimize for screen readers" />
      </SettingRow>
      <SettingRow label="Reduce Motion">
        <Checkbox checked={false} label="Reduce motion and animations" />
      </SettingRow>
    </>
  );
}

function SystemGeneralSettings() {
  return (
    <>
      <SettingRow label="Reopen projects on startup">
        <Checkbox checked={true} label="Reopen last project on startup" />
      </SettingRow>
      <SettingRow label="Confirm application exit">
        <Checkbox checked={true} label="Confirm before exiting" />
      </SettingRow>
      <SettingRow label="Process tab">
        <Select value="last" options={[{ value: "last", label: "Last opened tab" }, { value: "next", label: "Next tab" }, { value: "none", label: "No tab" }]} />
      </SettingRow>
      <SettingRow label="Show Tips on Startup">
        <Checkbox checked={true} label="Show tips on startup" />
      </SettingRow>
    </>
  );
}

function PasswordSettings() {
  return (
    <>
      <SettingRow label="Password Storage">
        <Select value="keychain" options={[{ value: "keychain", label: "Built-in Keychain" }, { value: "keepass", label: "KeePass" }, { value: "none", label: "Do not save" }]} />
      </SettingRow>
      <SettingRow label="Master Password">
        <input defaultValue="" placeholder="Enter master password" type="password" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
      </SettingRow>
    </>
  );
}

function HttpProxySettings() {
  return (
    <>
      <SettingRow label="Proxy Configuration">
        <Select value="no_proxy" options={[{ value: "no_proxy", label: "No proxy" }, { value: "http", label: "HTTP proxy" }, { value: "socks", label: "SOCKS proxy" }, { value: "auto_detect", label: "Auto-detect proxy" }]} />
      </SettingRow>
      <SettingRow label="Host name">
        <input defaultValue="" placeholder="proxy.example.com" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
      </SettingRow>
      <SettingRow label="Port">
        <NumberInput value={8080} min={1} max={65535} />
      </SettingRow>
      <SettingRow label="Proxy authentication">
        <Checkbox checked={false} label="Proxy authentication" />
      </SettingRow>
    </>
  );
}

function UpdateSettings() {
  return (
    <>
      <SettingRow label="Check for updates">
        <Checkbox checked={true} label="Check for updates automatically" />
      </SettingRow>
      <SettingRow label="Update Channel">
        <Select value="release" options={[{ value: "release", label: "Stable Release" }, { value: "eap", label: "Early Access Program" }, { value: "beta", label: "Beta" }]} />
      </SettingRow>
      <SettingRow label="Check interval">
        <Select value="daily" options={[{ value: "hourly", label: "Every hour" }, { value: "daily", label: "Every day" }, { value: "weekly", label: "Every week" }]} />
      </SettingRow>
    </>
  );
}

function DataSharingSettings() {
  return (
    <>
      <SettingRow label="Send usage statistics">
        <Checkbox checked={true} label="Send anonymous usage statistics to JetBrains" />
      </SettingRow>
      <SettingRow label="Share crash reports">
        <Checkbox checked={true} label="Automatically share crash reports" />
      </SettingRow>
    </>
  );
}

function FileColorsSettings() {
  return (
    <>
      <SettingRow label="Enable file colors">
        <Checkbox checked={true} label="Show file colors in project view" />
      </SettingRow>
      <SettingRow label="Use in editor tabs">
        <Checkbox checked={true} label="Show file colors in editor tabs" />
      </SettingRow>
    </>
  );
}

function ScopesSettings() {
  return (
    <>
      <SettingRow label="Scope type">
        <Select value="local" options={[{ value: "local", label: "Local" }, { value: "shared", label: "Shared (VCS)" }]} />
      </SettingRow>
    </>
  );
}

function NotificationsSettings() {
  return (
    <>
      <SettingRow label="Enable notifications">
        <Checkbox checked={true} label="Show balloon notifications" />
      </SettingRow>
      <SettingRow label="Play sound">
        <Checkbox checked={true} label="Play notification sound" />
      </SettingRow>
      <SettingRow label="Read-only notifications">
        <Checkbox checked={false} label="Show read-only notification" />
      </SettingRow>
    </>
  );
}

function QuickListsSettings() {
  return (
    <>
      <SettingRow label="Enable quick lists">
        <Checkbox checked={true} label="Enable quick lists" />
      </SettingRow>
    </>
  );
}

function PathVariablesSettings() {
  return (
    <>
      <SettingRow label="Path variables">
        <input defaultValue="" placeholder="NAME=value" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
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

function EditorBasicSettings() {
  return (
    <>
      <SettingRow label="Virtual space">
        <Select value="none" options={[{ value: "none", label: "No virtual space" }, { value: "caret", label: "Allow caret after line end" }, { value: "all", label: "Allow virtual space everywhere" }]} />
      </SettingRow>
      <SettingRow label="Strip trailing spaces">
        <Select value="modified" options={[{ value: "none", label: "None" }, { value: "modified", label: "Modified lines" }, { value: "all", label: "All lines" }]} />
      </SettingRow>
      <SettingRow label="Ensure line feed at end of file">
        <Checkbox checked={true} label="Ensure newline at EOF" />
      </SettingRow>
      <SettingRow label="Highlight matched braces">
        <Checkbox checked={true} label="Highlight matched braces" />
      </SettingRow>
      <SettingRow label="Insert paired brackets">
        <Checkbox checked={true} label="Insert paired brackets" />
      </SettingRow>
    </>
  );
}

function SmartKeysSettings() {
  return (
    <>
      <SettingRow label="Smart end">
        <Checkbox checked={true} label="Smart End (go to line end before last non-space)" />
      </SettingRow>
      <SettingRow label="Insert pair quote">
        <Checkbox checked={true} label="Insert pair quote" />
      </SettingRow>
      <SettingRow label="Reformat on paste">
        <Select value="reformat" options={[{ value: "none", label: "None" }, { value: "indent", label: "Indent only" }, { value: "reformat", label: "Reformat block" }]} />
      </SettingRow>
      <SettingRow label="Surround selection on typing">
        <Checkbox checked={true} label="Surround selection with quote or brace" />
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

function SoftWrapSettings() {
  return (
    <>
      <SettingRow label="Soft-wrap files">
        <input defaultValue="*.md; *.txt; *.rst; *.adoc" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
      </SettingRow>
      <SettingRow label="Wrap at right margin">
        <Checkbox checked={true} label="Soft-wrap at right margin" />
      </SettingRow>
      <SettingRow label="Wrap on typing">
        <Checkbox checked={false} label="Soft-wrap on typing" />
      </SettingRow>
    </>
  );
}

function CodeFoldingSettings() {
  return (
    <>
      <SettingRow label="Fold by default">
        <Checkbox checked={true} label="File header" />
      </SettingRow>
      <SettingRow label="">
        <Checkbox checked={true} label="Imports" />
      </SettingRow>
      <SettingRow label="">
        <Checkbox checked={false} label="Documentation comments" />
      </SettingRow>
      <SettingRow label="">
        <Checkbox checked={true} label="Method bodies" />
      </SettingRow>
      <SettingRow label="Show folding arrows">
        <Checkbox checked={true} label="Show code folding arrows" />
      </SettingRow>
    </>
  );
}

function EditorTabsSettings() {
  return (
    <>
      <SettingRow label="Tab placement">
        <Select value="top" options={[{ value: "top", label: "Top" }, { value: "bottom", label: "Bottom" }, { value: "left", label: "Left" }, { value: "right", label: "Right" }, { value: "none", label: "None" }]} />
      </SettingRow>
      <SettingRow label="Tab limit">
        <NumberInput value={10} min={1} max={100} />
      </SettingRow>
      <SettingRow label="Show tabs in single row">
        <Checkbox checked={false} label="Show tabs in single row" />
      </SettingRow>
      <SettingRow label="Close non-modified first">
        <Checkbox checked={false} label="Close non-modified files first" />
      </SettingRow>
      <SettingRow label="Mark modified tabs">
        <Checkbox checked={true} label="Mark modified tabs with asterisk" />
      </SettingRow>
    </>
  );
}

function GutterIconsSettings() {
  return (
    <>
      <SettingRow label="Show gutter icons">
        <Checkbox checked={true} label="Show gutter icons" />
      </SettingRow>
      <SettingRow label="Show line breakpoints">
        <Checkbox checked={true} label="Show line breakpoints" />
      </SettingRow>
      <SettingRow label="Show bookmarks">
        <Checkbox checked={true} label="Show bookmarks" />
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

function ColorSchemeSettings() {
  return (
    <>
      <SettingRow label="Scheme">
        <Select value="darcula" options={[{ value: "darcula", label: "Darcula" }, { value: "default", label: "Default" }, { value: "high-contrast", label: "High Contrast" }]} />
      </SettingRow>
      <SettingRow label="Use inherited attributes">
        <Checkbox checked={true} label="Use inherited attributes" />
      </SettingRow>
    </>
  );
}

function CodeStyleGeneralSettings() {
  return (
    <>
      <SettingRow label="Indent style">
        <Select value="spaces" options={[{ value: "spaces", label: "Spaces" }, { value: "tabs", label: "Tabs" }]} />
      </SettingRow>
      <SettingRow label="Indent size">
        <NumberInput value={4} min={1} max={16} />
      </SettingRow>
      <SettingRow label="Tab size">
        <NumberInput value={4} min={1} max={16} />
      </SettingRow>
      <SettingRow label="Continuation indent">
        <NumberInput value={8} min={1} max={16} />
      </SettingRow>
      <SettingRow label="Keep indents on empty lines">
        <Checkbox checked={false} label="Keep indents on empty lines" />
      </SettingRow>
    </>
  );
}

function JavaCodeStyleSettings() {
  return (
    <>
      <SettingRow label="Indent style">
        <Select value="spaces" options={[{ value: "spaces", label: "Spaces" }, { value: "tabs", label: "Tabs" }]} />
      </SettingRow>
      <SettingRow label="Class count to use import *">
        <NumberInput value={5} min={1} max={99} />
      </SettingRow>
      <SettingRow label="Names count to use static import *">
        <NumberInput value={3} min={1} max={99} />
      </SettingRow>
      <SettingRow label="Layout imports">
        <Select value="java" options={[{ value: "java", label: "Project default" }, { value: "eclipse", label: "Eclipse style" }]} />
      </SettingRow>
    </>
  );
}

function KotlinCodeStyleSettings() {
  return (
    <>
      <SettingRow label="Code style">
        <Select value="official" options={[{ value: "official", label: "Kotlin Coding Conventions" }, { value: "android", label: "Android Style" }]} />
      </SettingRow>
      <SettingRow label="Import layout">
        <Select value="kotlin" options={[{ value: "kotlin", label: "Project default" }, { value: "java", label: "Java style" }]} />
      </SettingRow>
    </>
  );
}

function FileEncodingsSettings() {
  return (
    <>
      <SettingRow label="Global encoding">
        <Select value="utf-8" options={[{ value: "utf-8", label: "UTF-8" }, { value: "gbk", label: "GBK" }, { value: "iso-8859-1", label: "ISO-8859-1" }, { value: "windows-1252", label: "Windows-1252" }]} />
      </SettingRow>
      <SettingRow label="Project encoding">
        <Select value="utf-8" options={[{ value: "utf-8", label: "UTF-8" }, { value: "gbk", label: "GBK" }, { value: "iso-8859-1", label: "ISO-8859-1" }]} />
      </SettingRow>
      <SettingRow label="Default encoding for properties files">
        <Select value="utf-8" options={[{ value: "utf-8", label: "UTF-8" }, { value: "iso-8859-1", label: "ISO-8859-1" }]} />
      </SettingRow>
      <SettingRow label="Create UTF-8 files with BOM">
        <Checkbox checked={false} label="Create UTF-8 files with BOM" />
      </SettingRow>
    </>
  );
}

function EmmetHtmlSettings() {
  return (
    <>
      <SettingRow label="Enable Emmet">
        <Checkbox checked={true} label="Enable HTML Emmet" />
      </SettingRow>
      <SettingRow label="Expand with Tab">
        <Checkbox checked={true} label="Expand abbreviation with Tab" />
      </SettingRow>
    </>
  );
}

function EmmetCssSettings() {
  return (
    <>
      <SettingRow label="Enable CSS Emmet">
        <Checkbox checked={true} label="Enable CSS Emmet" />
      </SettingRow>
      <SettingRow label="Fuzzy search">
        <Checkbox checked={true} label="Enable fuzzy search" />
      </SettingRow>
    </>
  );
}

function LiveTemplatesSettings() {
  return (
    <>
      <SettingRow label="Enable live templates">
        <Checkbox checked={true} label="Enable live templates" />
      </SettingRow>
      <SettingRow label="Expand with">
        <Select value="tab" options={[{ value: "tab", label: "Tab" }, { value: "space", label: "Space" }, { value: "enter", label: "Enter" }]} />
      </SettingRow>
      <SettingRow label="Reformat on expand">
        <Checkbox checked={true} label="Reformat according to style" />
      </SettingRow>
    </>
  );
}

function FileTemplatesSettings() {
  return (
    <>
      <SettingRow label="Default file template">
        <Select value="class" options={[{ value: "class", label: "Java Class" }, { value: "interface", label: "Interface" }, { value: "enum", label: "Enum" }]} />
      </SettingRow>
    </>
  );
}

function InspectionsGeneralSettings() {
  return (
    <>
      <SettingRow label="Inspection profile">
        <Select value="default" options={[{ value: "default", label: "Project Default" }, { value: "strict", label: "Strict" }]} />
      </SettingRow>
      <SettingRow label="Highlighting level">
        <Select value="all" options={[{ value: "all", label: "All" }, { value: "syntax", label: "Syntax only" }, { value: "none", label: "None" }]} />
      </SettingRow>
    </>
  );
}

function JavaInspectionsSettings() {
  return (
    <>
      <SettingRow label="Java inspection severity">
        <Select value="warning" options={[{ value: "error", label: "Error" }, { value: "warning", label: "Warning" }, { value: "weak", label: "Weak Warning" }]} />
      </SettingRow>
    </>
  );
}

function KotlinInspectionsSettings() {
  return (
    <>
      <SettingRow label="Kotlin inspection severity">
        <Select value="warning" options={[{ value: "error", label: "Error" }, { value: "warning", label: "Warning" }, { value: "weak", label: "Weak Warning" }]} />
      </SettingRow>
    </>
  );
}

function FileTypesSettings() {
  return (
    <>
      <SettingRow label="Recognized file types">
        <Select value="java" options={[{ value: "java", label: "Java" }, { value: "kotlin", label: "Kotlin" }, { value: "xml", label: "XML" }, { value: "json", label: "JSON" }]} />
      </SettingRow>
    </>
  );
}

function CopyrightSettings() {
  return (
    <>
      <SettingRow label="Copyright profile">
        <Select value="default" options={[{ value: "default", label: "Default" }, { value: "apache", label: "Apache 2.0" }, { value: "mit", label: "MIT" }]} />
      </SettingRow>
    </>
  );
}

function PluginsMarketplaceSettings() {
  return (
    <>
      <SettingRow label="Plugin repository">
        <Select value="jetbrains" options={[{ value: "jetbrains", label: "JetBrains Marketplace" }, { value: "custom", label: "Custom repository" }]} />
      </SettingRow>
      <SettingRow label="Auto-update plugins">
        <Checkbox checked={true} label="Automatically update plugins" />
      </SettingRow>
    </>
  );
}

function PluginsInstalledSettings() {
  return (
    <>
      <SettingRow label="Sort by">
        <Select value="name" options={[{ value: "name", label: "Name" }, { value: "date", label: "Install date" }, { value: "enabled", label: "Enabled/Disabled" }]} />
      </SettingRow>
      <SettingRow label="Show disabled plugins">
        <Checkbox checked={true} label="Show disabled plugins" />
      </SettingRow>
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

function GitHubSettings() {
  return (
    <>
      <SettingRow label="GitHub account">
        <input defaultValue="" placeholder="Add GitHub account" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
      </SettingRow>
      <SettingRow label="Clone using SSH">
        <Checkbox checked={true} label="Clone using SSH instead of HTTPS" />
      </SettingRow>
    </>
  );
}

function VcsConfirmationSettings() {
  return (
    <>
      <SettingRow label="Confirm on create">
        <Checkbox checked={true} label="Confirm when creating files under VCS" />
      </SettingRow>
      <SettingRow label="Confirm on delete">
        <Checkbox checked={true} label="Confirm when deleting files under VCS" />
      </SettingRow>
      <SettingRow label="Show options dialog">
        <Checkbox checked={true} label="Show options dialog before commit" />
      </SettingRow>
    </>
  );
}

function ChangelistsSettings() {
  return (
    <>
      <SettingRow label="Active changelist">
        <Select value="default" options={[{ value: "default", label: "Default" }]} />
      </SettingRow>
      <SettingRow label="Track changelists">
        <Checkbox checked={true} label="Track changes in changelists" />
      </SettingRow>
    </>
  );
}

function IssueNavigationSettings() {
  return (
    <>
      <SettingRow label="Issue pattern">
        <input defaultValue="" placeholder="e.g. ([A-Z]+-\d+)" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
      </SettingRow>
    </>
  );
}

function VcsCommitSettings() {
  return (
    <>
      <SettingRow label="Commit message template">
        <input defaultValue="" placeholder="Enter commit message template" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
      </SettingRow>
      <SettingRow label="Clear initial commit message">
        <Checkbox checked={false} label="Clear initial commit message" />
      </SettingRow>
    </>
  );
}

function GradleSettings() {
  return (
    <>
      <SettingRow label="Gradle JVM">
        <Select value="project" options={[{ value: "project", label: "Project SDK" }, { value: "java", label: "Java 17" }, { value: "java11", label: "Java 11" }]} />
      </SettingRow>
      <SettingRow label="Distribution">
        <Select value="wrapper" options={[{ value: "wrapper", label: "Gradle Wrapper" }, { value: "local", label: "Local installation" }]} />
      </SettingRow>
      <SettingRow label="Auto-import">
        <Checkbox checked={true} label="Automatically import changes" />
      </SettingRow>
    </>
  );
}

function MavenSettings() {
  return (
    <>
      <SettingRow label="Maven home">
        <input defaultValue="" placeholder="Bundled" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
      </SettingRow>
      <SettingRow label="User settings file">
        <input defaultValue="" placeholder="Default" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
      </SettingRow>
      <SettingRow label="Auto-import">
        <Checkbox checked={true} label="Automatically import changes" />
      </SettingRow>
    </>
  );
}

function CompilerSettings() {
  return (
    <>
      <SettingRow label="Build process heap size">
        <NumberInput value={1200} min={256} max={8192} />
      </SettingRow>
      <SettingRow label="Use '--release' option">
        <Checkbox checked={true} label="Use --release option for cross-compilation" />
      </SettingRow>
      <SettingRow label="Annotation processing">
        <Checkbox checked={true} label="Enable annotation processing" />
      </SettingRow>
    </>
  );
}

function DebuggerSettings() {
  return (
    <>
      <SettingRow label="Stepping">
        <Checkbox checked={true} label="Skip synthetic methods" />
      </SettingRow>
      <SettingRow label="">
        <Checkbox checked={true} label="Skip constructors" />
      </SettingRow>
      <SettingRow label="">
        <Checkbox checked={false} label="Skip class loaders" />
      </SettingRow>
    </>
  );
}

function CoverageSettings() {
  return (
    <>
      <SettingRow label="Coverage runner">
        <Select value="jacoco" options={[{ value: "jacoco", label: "JaCoCo" }, { value: "emma", label: "Emma" }]} />
      </SettingRow>
      <SettingRow label="Show coverage">
        <Select value="editor" options={[{ value: "editor", label: "In editor" }, { value: "toolwindow", label: "In tool window" }]} />
      </SettingRow>
    </>
  );
}

function JavaCompilerSettings() {
  return (
    <>
      <SettingRow label="Target bytecode version">
        <Select value="17" options={[{ value: "8", label: "Java 8" }, { value: "11", label: "Java 11" }, { value: "17", label: "Java 17" }, { value: "21", label: "Java 21" }]} />
      </SettingRow>
      <SettingRow label="Additional compiler args">
        <input defaultValue="" placeholder="-parameters" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
      </SettingRow>
    </>
  );
}

function JavaCoverageSettings() {
  return (
    <>
      <SettingRow label="Coverage runner">
        <Select value="jacoco" options={[{ value: "jacoco", label: "JaCoCo" }, { value: "emma", label: "Emma" }]} />
      </SettingRow>
    </>
  );
}

function KotlinSettings() {
  return (
    <>
      <SettingRow label="Kotlin JVM target">
        <Select value="17" options={[{ value: "8", label: "JVM 1.8" }, { value: "11", label: "JVM 11" }, { value: "17", label: "JVM 17" }, { value: "21", label: "JVM 21" }]} />
      </SettingRow>
      <SettingRow label="Language version">
        <Select value="2.0" options={[{ value: "1.9", label: "1.9" }, { value: "2.0", label: "2.0" }, { value: "2.1", label: "2.1" }]} />
      </SettingRow>
    </>
  );
}

function SpringBootSettings() {
  return (
    <>
      <SettingRow label="Auto-configuration">
        <Checkbox checked={true} label="Enable Spring Boot auto-configuration" />
      </SettingRow>
      <SettingRow label="Hide single-constructors">
        <Checkbox checked={true} label="Hide single-constructors @Autowired" />
      </SettingRow>
    </>
  );
}

function SqlSettings() {
  return (
    <>
      <SettingRow label="SQL dialect">
        <Select value="generic" options={[{ value: "generic", label: "Generic SQL" }, { value: "mysql", label: "MySQL" }, { value: "postgresql", label: "PostgreSQL" }, { value: "sqlite", label: "SQLite" }]} />
      </SettingRow>
    </>
  );
}

function JavaScriptSettings() {
  return (
    <>
      <SettingRow label="JavaScript language version">
        <Select value="ecmascript6" options={[{ value: "ecmascript5", label: "ECMAScript 5.1" }, { value: "ecmascript6", label: "ECMAScript 6+" }, { value: "flow", label: "Flow" }]} />
      </SettingRow>
    </>
  );
}

function TypeScriptSettings() {
  return (
    <>
      <SettingRow label="TypeScript version">
        <Select value="5" options={[{ value: "4", label: "TypeScript 4.x" }, { value: "5", label: "TypeScript 5.x" }]} />
      </SettingRow>
      <SettingRow label="Use TypeScript Service">
        <Checkbox checked={true} label="Use TypeScript language service" />
      </SettingRow>
    </>
  );
}

function ActionsOnSaveSettings() {
  return (
    <>
      <SettingRow label="Reformat code">
        <Checkbox checked={false} label="Reformat code on save" />
      </SettingRow>
      <SettingRow label="Optimize imports">
        <Checkbox checked={true} label="Optimize imports on save" />
      </SettingRow>
      <SettingRow label="Run code cleanup">
        <Checkbox checked={false} label="Run code cleanup on save" />
      </SettingRow>
      <SettingRow label="Organize file structure">
        <Checkbox checked={false} label="Rearrange entries on save" />
      </SettingRow>
    </>
  );
}

function ExternalToolsSettings() {
  return (
    <>
      <SettingRow label="Tool configuration">
        <input defaultValue="" placeholder="Add external tool" style={{ width: 200, height: 26, padding: "0 8px", border: "1px solid var(--control-border)", borderRadius: 4, background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, outline: "none" }} />
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

function DiagramsSettings() {
  return (
    <>
      <SettingRow label="Default layout">
        <Select value="hierarchical" options={[{ value: "hierarchical", label: "Hierarchical" }, { value: "orthogonal", label: "Orthogonal" }, { value: "circular", label: "Circular" }]} />
      </SettingRow>
      <SettingRow label="Show edge labels">
        <Checkbox checked={true} label="Show edge labels" />
      </SettingRow>
    </>
  );
}

function WebBrowsersSettings() {
  return (
    <>
      <SettingRow label="Default browser">
        <Select value="chrome" options={[{ value: "chrome", label: "Chrome" }, { value: "firefox", label: "Firefox" }, { value: "edge", label: "Edge" }, { value: "safari", label: "Safari" }]} />
      </SettingRow>
      <SettingRow label="Use custom profile">
        <Checkbox checked={false} label="Use custom browser profile" />
      </SettingRow>
    </>
  );
}

function DiffSettings() {
  return (
    <>
      <SettingRow label="Diff tool">
        <Select value="internal" options={[{ value: "internal", label: "IDEA Internal Diff" }, { value: "external", label: "External tool" }]} />
      </SettingRow>
      <SettingRow label="Merge tool">
        <Select value="internal" options={[{ value: "internal", label: "IDEA Internal Merge" }, { value: "external", label: "External tool" }]} />
      </SettingRow>
      <SettingRow label="Ignore whitespace">
        <Select value="none" options={[{ value: "none", label: "Do not ignore" }, { value: "leading", label: "Leading and trailing" }, { value: "all", label: "All whitespace" }]} />
      </SettingRow>
    </>
  );
}

function TasksSettings() {
  return (
    <>
      <SettingRow label="Issue tracker">
        <Select value="none" options={[{ value: "none", label: "None" }, { value: "jira", label: "JIRA" }, { value: "youtrack", label: "YouTrack" }, { value: "trello", label: "Trello" }]} />
      </SettingRow>
      <SettingRow label="Auto-close tasks">
        <Checkbox checked={true} label="Auto-close tasks on commit" />
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
  const [descriptor, setDescriptor] = useState<SettingsDescriptor>({
    title: "Settings",
    groups: [],
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
    show_apply_button: true,
    show_reset_button: true,
    is_modified: false,
    has_errors: false,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSettingsDescriptor().then((data) => {
      setDescriptor(data as unknown as SettingsDescriptor);
    });
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

  const handleSelect = useCallback(async (id: string) => {
    await settingsSelectConfigurable(id);
    setSelectedId(id);
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
    settingsSearch(searchQuery);
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
          <button onClick={async () => {
            await settingsReset();
          }} style={{
            padding: "5px 16px", border: "1px solid var(--control-border)", borderRadius: 4,
            background: "var(--control-bg)", color: "var(--text-default)", fontSize: 12, cursor: "pointer",
          }}>Reset</button>
          <button onClick={async () => {
            await settingsApply();
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
