import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import BlankPage from "@/pages/blank";
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
    <Switch>
      {/* Root route is blank */}
      <Route path="/" component={BlankPage} />
      
      {/* All design system routes wrapped in layout */}
      <Route path="/design-system/*?">
        <DocsLayout>
          <Switch>
            <Route path="/design-system" component={Introduction} />
            <Route path="/design-system/installation" component={Installation} />
            
            {/* Foundations */}
            <Route path="/design-system/foundations/colors" component={Colors} />
            <Route path="/design-system/foundations/typography" component={Typography} />
            <Route path="/design-system/foundations/spacing" component={Spacing} />
            <Route path="/design-system/foundations/shadows" component={Shadows} />
            <Route path="/design-system/foundations/radius" component={Radius} />

            {/* Components */}
            <Route path="/design-system/components/button" component={ButtonDocs} />
            <Route path="/design-system/components/badge" component={BadgeDocs} />
            <Route path="/design-system/components/card" component={CardDocs} />
            <Route path="/design-system/components/input" component={InputDocs} />
            <Route path="/design-system/components/alert" component={AlertDocs} />
            <Route path="/design-system/components/tabs" component={TabsDocs} />
            <Route path="/design-system/components/switch" component={SwitchDocs} />
            <Route path="/design-system/components/checkbox" component={CheckboxDocs} />
            <Route path="/design-system/components/avatar" component={AvatarDocs} />
            <Route path="/design-system/components/dialog" component={DialogDocs} />

            <Route component={NotFound} />
          </Switch>
        </DocsLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
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
