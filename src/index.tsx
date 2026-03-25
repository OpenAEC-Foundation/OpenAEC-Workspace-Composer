/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route, Navigate } from "@solidjs/router";
import "./styles/index.css";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { ConfigurePage } from "./pages/ConfigurePage";
import { InstallPage } from "./pages/InstallPage";
import { AboutPage } from "./pages/AboutPage";
import { GpuServerPage } from "./pages/GpuServerPage";
import { PermissionsPage } from "./pages/PermissionsPage";
import { HooksPage } from "./pages/HooksPage";
import { McpPage } from "./pages/McpPage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { CommandsPage } from "./pages/CommandsPage";
import { MemoryPage } from "./pages/MemoryPage";
import { PromptsPage } from "./pages/PromptsPage";
import { CoreFilesPage } from "./pages/CoreFilesPage";
import { AuthPage } from "./pages/AuthPage";
import { GitPage } from "./pages/GitPage";
import { PresetsPage } from "./pages/PresetsPage";
import { TeamsPage } from "./pages/TeamsPage";
import { ManageOverviewPage } from "./pages/ManageOverviewPage";
import { ManageProjectsPage } from "./pages/ManageProjectsPage";

import { ManageLessonsPage } from "./pages/ManageLessonsPage";
import { ManageSessionsPage } from "./pages/ManageSessionsPage";
import { ManageIntegrationsPage } from "./pages/ManageIntegrationsPage";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

render(
  () => (
    <Router root={AppLayout}>
      <Route path="/" component={() => <Navigate href="/workspace" />} />
      <Route path="/packages" component={() => <Navigate href="/workspace" />} />
      <Route path="/workspace" component={WorkspacePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/configure" component={ConfigurePage} />
      <Route path="/permissions" component={PermissionsPage} />
      <Route path="/hooks" component={HooksPage} />
      <Route path="/mcp" component={McpPage} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/install" component={InstallPage} />
      <Route path="/gpu-server" component={GpuServerPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/commands" component={CommandsPage} />
      <Route path="/memory" component={MemoryPage} />
      <Route path="/prompts" component={PromptsPage} />
      <Route path="/core-files" component={CoreFilesPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/git" component={GitPage} />
      <Route path="/presets" component={PresetsPage} />
      <Route path="/teams" component={TeamsPage} />
      <Route path="/manage" component={ManageOverviewPage} />
      <Route path="/manage/projects" component={ManageProjectsPage} />

      <Route path="/manage/lessons" component={ManageLessonsPage} />
      <Route path="/manage/sessions" component={ManageSessionsPage} />
      <Route path="/manage/integrations" component={ManageIntegrationsPage} />
    </Router>
  ),
  root
);
