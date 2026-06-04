import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import { DocsLayout } from "@/components/layout/DocsLayout";

// Docs Pages
import Introduction from "@/pages/design-system/introduction";
import Installation from "@/pages/design-system/installation";
import Colors from "@/pages/design-system/foundations/colors";
import Typography from "@/pages/design-system/foundations/typography";
import Spacing from "@/pages/design-system/foundations/spacing";
import Shadows from "@/pages/design-system/foundations/shadows";
import Radius from "@/pages/design-system/foundations/radius";

import ButtonDocs from "@/pages/design-system/components/button";
import BadgeDocs from "@/pages/design-system/components/badge";
import CardDocs from "@/pages/design-system/components/card";
import InputDocs from "@/pages/design-system/components/input";
import AlertDocs from "@/pages/design-system/components/alert";
import TabsDocs from "@/pages/design-system/components/tabs";
import SwitchDocs from "@/pages/design-system/components/switch";
import CheckboxDocs from "@/pages/design-system/components/checkbox";
import AvatarDocs from "@/pages/design-system/components/avatar";
import DialogDocs from "@/pages/design-system/components/dialog";

const queryClient = new QueryClient();

function Router() {
  return (
    <DocsLayout>
      <Switch>
        <Route path="/" component={Introduction} />
        <Route path="/installation" component={Installation} />

        {/* Foundations */}
        <Route path="/foundations/colors" component={Colors} />
        <Route path="/foundations/typography" component={Typography} />
        <Route path="/foundations/spacing" component={Spacing} />
        <Route path="/foundations/shadows" component={Shadows} />
        <Route path="/foundations/radius" component={Radius} />

        {/* Components */}
        <Route path="/components/button" component={ButtonDocs} />
        <Route path="/components/badge" component={BadgeDocs} />
        <Route path="/components/card" component={CardDocs} />
        <Route path="/components/input" component={InputDocs} />
        <Route path="/components/alert" component={AlertDocs} />
        <Route path="/components/tabs" component={TabsDocs} />
        <Route path="/components/switch" component={SwitchDocs} />
        <Route path="/components/checkbox" component={CheckboxDocs} />
        <Route path="/components/avatar" component={AvatarDocs} />
        <Route path="/components/dialog" component={DialogDocs} />

        <Route component={NotFound} />
      </Switch>
    </DocsLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
