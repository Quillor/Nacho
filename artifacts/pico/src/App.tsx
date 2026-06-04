import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import { DocsLayout } from "@/components/layout/DocsLayout";

// Docs Pages
import Introduction from "@/pages/design-system/introduction";
import Installation from "@/pages/design-system/installation";
import ContentGuidelines from "@/pages/design-system/content-guidelines";
import Colors from "@/pages/design-system/foundations/colors";
import Logo from "@/pages/design-system/foundations/logo";
import Typography from "@/pages/design-system/foundations/typography";
import Spacing from "@/pages/design-system/foundations/spacing";
import Shadows from "@/pages/design-system/foundations/shadows";
import Radius from "@/pages/design-system/foundations/radius";
import Imagery from "@/pages/design-system/foundations/imagery";

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
import LabelDocs from "@/pages/design-system/components/label";
import SelectDocs from "@/pages/design-system/components/select";
import AlertDialogDocs from "@/pages/design-system/components/alert-dialog";
import ToastDocs from "@/pages/design-system/components/toast";

import PatternsOverview from "@/pages/design-system/patterns/overview";
import FormsPattern from "@/pages/design-system/patterns/forms";
import LayoutPattern from "@/pages/design-system/patterns/layout";
import EmptyStatesPattern from "@/pages/design-system/patterns/empty-states";
import LoadingPattern from "@/pages/design-system/patterns/loading";
import FeedbackPattern from "@/pages/design-system/patterns/feedback";
import ConfirmationPattern from "@/pages/design-system/patterns/confirmation";
import CardsListsPattern from "@/pages/design-system/patterns/cards-lists";
import OverlaysPattern from "@/pages/design-system/patterns/overlays";

const queryClient = new QueryClient();

function Router() {
  return (
    <DocsLayout>
      <Switch>
        <Route path="/" component={Introduction} />
        <Route path="/installation" component={Installation} />

        {/* Guidelines */}
        <Route path="/guidelines/voice-and-tone" component={ContentGuidelines} />

        {/* Foundations */}
        <Route path="/foundations/logo" component={Logo} />
        <Route path="/foundations/colors" component={Colors} />
        <Route path="/foundations/typography" component={Typography} />
        <Route path="/foundations/spacing" component={Spacing} />
        <Route path="/foundations/shadows" component={Shadows} />
        <Route path="/foundations/radius" component={Radius} />
        <Route path="/foundations/imagery" component={Imagery} />

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
        <Route path="/components/label" component={LabelDocs} />
        <Route path="/components/select" component={SelectDocs} />
        <Route path="/components/alert-dialog" component={AlertDialogDocs} />
        <Route path="/components/toast" component={ToastDocs} />

        {/* Patterns */}
        <Route path="/patterns" component={PatternsOverview} />
        <Route path="/patterns/forms" component={FormsPattern} />
        <Route path="/patterns/layout" component={LayoutPattern} />
        <Route path="/patterns/empty-states" component={EmptyStatesPattern} />
        <Route path="/patterns/loading" component={LoadingPattern} />
        <Route path="/patterns/feedback" component={FeedbackPattern} />
        <Route path="/patterns/confirmation" component={ConfirmationPattern} />
        <Route path="/patterns/cards-lists" component={CardsListsPattern} />
        <Route path="/patterns/overlays" component={OverlaysPattern} />

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
