/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import "./styles.css";
import { AppLayout } from "./layouts/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { PackagesPage } from "./pages/PackagesPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { ConfigurePage } from "./pages/ConfigurePage";
import { InstallPage } from "./pages/InstallPage";
import { AboutPage } from "./pages/AboutPage";
import { GpuServerPage } from "./pages/GpuServerPage";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

render(
  () => (
    <Router root={AppLayout}>
      <Route path="/" component={DashboardPage} />
      <Route path="/packages" component={PackagesPage} />
      <Route path="/workspace" component={WorkspacePage} />
      <Route path="/configure" component={ConfigurePage} />
      <Route path="/install" component={InstallPage} />
      <Route path="/gpu-server" component={GpuServerPage} />
      <Route path="/about" component={AboutPage} />
    </Router>
  ),
  root
);
