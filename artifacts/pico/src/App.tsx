import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@workspace/pico-ui/toaster";
import { TooltipProvider } from "@workspace/pico-ui/tooltip";

import NotFound from "@/pages/not-found";
import { DocsLayout } from "@/components/layout/DocsLayout";

// Docs pages, imported via each feature's public barrel.
import { Introduction, Installation, FigmaPlugin } from "@/features/getting-started";
import { ContentGuidelines } from "@/features/guidelines";
import {
  Colors,
  Logo,
  Typography,
  Spacing,
  Shadows,
  Radius,
  Imagery,
} from "@/features/foundations";
import {
  ButtonDocs,
  BadgeDocs,
  CardDocs,
  InputDocs,
  AlertDocs,
  TabsDocs,
  SwitchDocs,
  CheckboxDocs,
  AvatarDocs,
  DialogDocs,
  LabelDocs,
  SelectDocs,
  AlertDialogDocs,
  ToastDocs,
  AccordionDocs,
  AspectRatioDocs,
  BreadcrumbDocs,
  CollapsibleDocs,
  CommandDocs,
  ContextMenuDocs,
  DrawerDocs,
  DropdownMenuDocs,
  EmptyDocs,
  HoverCardDocs,
  InputOTPDocs,
  KbdDocs,
  PaginationDocs,
  PopoverDocs,
  ProgressDocs,
  RadioGroupDocs,
  ScrollAreaDocs,
  SeparatorDocs,
  SheetDocs,
  SkeletonDocs,
  SliderDocs,
  SpinnerDocs,
  TableDocs,
  TextareaDocs,
  ToggleDocs,
  ToggleGroupDocs,
  TooltipDocs,
  ButtonGroupDocs,
  CalendarDocs,
  CarouselDocs,
  ChartDocs,
  FieldDocs,
  FormDocs,
  InputGroupDocs,
  ItemDocs,
  MenubarDocs,
  NavigationMenuDocs,
  ResizableDocs,
  SidebarDocs,
  SonnerDocs,
} from "@/features/components";
import {
  PatternsOverview,
  FormsPattern,
  LayoutPattern,
  EmptyStatesPattern,
  LoadingPattern,
  FeedbackPattern,
  ConfirmationPattern,
  CardsListsPattern,
  OverlaysPattern,
} from "@/features/patterns";

const queryClient = new QueryClient();

function Router() {
  return (
    <DocsLayout>
      <Switch>
        <Route path="/" component={Introduction} />
        <Route path="/installation" component={Installation} />
        <Route path="/figma-plugin" component={FigmaPlugin} />

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
