import { Section } from "@/components/docs/shared";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/pico-ui/chart";
import { CodeBlock } from "@workspace/pico-ui/code-block";

const chartData = [
  { day: "Mon", views: 186 },
  { day: "Tue", views: 305 },
  { day: "Wed", views: 237 },
  { day: "Thu", views: 273 },
  { day: "Fri", views: 409 },
  { day: "Sat", views: 124 },
  { day: "Sun", views: 98 },
];

const chartConfig = {
  views: {
    label: "Views",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

export default function ChartDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Chart
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Built on Recharts, themed with Pico tokens. Wrap any chart in <code>ChartContainer</code> and feed it a config — perfect for showing how many views a shared recording pulled this week.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <div className="w-full max-w-xl bg-card border border-foreground shadow-sm rounded-sm p-6">
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="views" fill="var(--color-views)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
        <CodeBlock code={`import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/pico-ui/chart"

const chartData = [
  { day: "Mon", views: 186 },
  { day: "Tue", views: 305 },
  { day: "Wed", views: 237 },
]

const chartConfig = {
  views: { label: "Views", color: "hsl(var(--primary))" },
} satisfies ChartConfig

<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <BarChart data={chartData}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="day" tickLine={false} axisLine={false} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="views" fill="var(--color-views)" radius={4} />
  </BarChart>
</ChartContainer>`} />
      </Section>
    </div>
  );
}
