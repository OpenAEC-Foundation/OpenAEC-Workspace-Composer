/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route, Navigate } from "@solidjs/router";
import "./styles.css";
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
import { SyncPage } from "./pages/SyncPage";

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
      <Route path="/sync" component={SyncPage} />
      <Route path="/about" component={AboutPage} />
    </Router>
  ),
  root
);
