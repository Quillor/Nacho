import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@workspace/pico-ui/toaster";
import { TooltipProvider } from "@workspace/pico-ui/tooltip";

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
import AccordionDocs from "@/pages/design-system/components/accordion";
import AspectRatioDocs from "@/pages/design-system/components/aspect-ratio";
import BreadcrumbDocs from "@/pages/design-system/components/breadcrumb";
import CollapsibleDocs from "@/pages/design-system/components/collapsible";
import CommandDocs from "@/pages/design-system/components/command";
import ContextMenuDocs from "@/pages/design-system/components/context-menu";
import DrawerDocs from "@/pages/design-system/components/drawer";
import DropdownMenuDocs from "@/pages/design-system/components/dropdown-menu";
import EmptyDocs from "@/pages/design-system/components/empty";
import HoverCardDocs from "@/pages/design-system/components/hover-card";
import InputOTPDocs from "@/pages/design-system/components/input-otp";
import KbdDocs from "@/pages/design-system/components/kbd";
import PaginationDocs from "@/pages/design-system/components/pagination";
import PopoverDocs from "@/pages/design-system/components/popover";
import ProgressDocs from "@/pages/design-system/components/progress";
import RadioGroupDocs from "@/pages/design-system/components/radio-group";
import ScrollAreaDocs from "@/pages/design-system/components/scroll-area";
import SeparatorDocs from "@/pages/design-system/components/separator";
import SheetDocs from "@/pages/design-system/components/sheet";
import SkeletonDocs from "@/pages/design-system/components/skeleton";
import SliderDocs from "@/pages/design-system/components/slider";
import SpinnerDocs from "@/pages/design-system/components/spinner";
import TableDocs from "@/pages/design-system/components/table";
import TextareaDocs from "@/pages/design-system/components/textarea";
import ToggleDocs from "@/pages/design-system/components/toggle";
import ToggleGroupDocs from "@/pages/design-system/components/toggle-group";
import TooltipDocs from "@/pages/design-system/components/tooltip";
import ButtonGroupDocs from "@/pages/design-system/components/button-group";
import CalendarDocs from "@/pages/design-system/components/calendar";
import CarouselDocs from "@/pages/design-system/components/carousel";
import ChartDocs from "@/pages/design-system/components/chart";
import FieldDocs from "@/pages/design-system/components/field";
import FormDocs from "@/pages/design-system/components/form";
import InputGroupDocs from "@/pages/design-system/components/input-group";
import ItemDocs from "@/pages/design-system/components/item";
import MenubarDocs from "@/pages/design-system/components/menubar";
import NavigationMenuDocs from "@/pages/design-system/components/navigation-menu";
import ResizableDocs from "@/pages/design-system/components/resizable";
import SidebarDocs from "@/pages/design-system/components/sidebar";
import SonnerDocs from "@/pages/design-system/components/sonner";

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
        <Route path="/components/accordion" component={AccordionDocs} />
        <Route path="/components/aspect-ratio" component={AspectRatioDocs} />
        <Route path="/components/breadcrumb" component={BreadcrumbDocs} />
        <Route path="/components/collapsible" component={CollapsibleDocs} />
        <Route path="/components/command" component={CommandDocs} />
        <Route path="/components/context-menu" component={ContextMenuDocs} />
        <Route path="/components/drawer" component={DrawerDocs} />
        <Route path="/components/dropdown-menu" component={DropdownMenuDocs} />
        <Route path="/components/empty" component={EmptyDocs} />
        <Route path="/components/hover-card" component={HoverCardDocs} />
        <Route path="/components/input-otp" component={InputOTPDocs} />
        <Route path="/components/kbd" component={KbdDocs} />
        <Route path="/components/pagination" component={PaginationDocs} />
        <Route path="/components/popover" component={PopoverDocs} />
        <Route path="/components/progress" component={ProgressDocs} />
        <Route path="/components/radio-group" component={RadioGroupDocs} />
        <Route path="/components/scroll-area" component={ScrollAreaDocs} />
        <Route path="/components/separator" component={SeparatorDocs} />
        <Route path="/components/sheet" component={SheetDocs} />
        <Route path="/components/skeleton" component={SkeletonDocs} />
        <Route path="/components/slider" component={SliderDocs} />
        <Route path="/components/spinner" component={SpinnerDocs} />
        <Route path="/components/table" component={TableDocs} />
        <Route path="/components/textarea" component={TextareaDocs} />
        <Route path="/components/toggle" component={ToggleDocs} />
        <Route path="/components/toggle-group" component={ToggleGroupDocs} />
        <Route path="/components/tooltip" component={TooltipDocs} />
        <Route path="/components/button-group" component={ButtonGroupDocs} />
        <Route path="/components/calendar" component={CalendarDocs} />
        <Route path="/components/carousel" component={CarouselDocs} />
        <Route path="/components/chart" component={ChartDocs} />
        <Route path="/components/field" component={FieldDocs} />
        <Route path="/components/form" component={FormDocs} />
        <Route path="/components/input-group" component={InputGroupDocs} />
        <Route path="/components/item" component={ItemDocs} />
        <Route path="/components/menubar" component={MenubarDocs} />
        <Route path="/components/navigation-menu" component={NavigationMenuDocs} />
        <Route path="/components/resizable" component={ResizableDocs} />
        <Route path="/components/sidebar" component={SidebarDocs} />
        <Route path="/components/sonner" component={SonnerDocs} />

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
