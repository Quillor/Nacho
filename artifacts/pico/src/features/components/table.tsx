import { Section } from "@/components/docs/shared";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@workspace/pico-ui/table";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function TableDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Table
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          Lays out structured data — like a list of recordings with views and dates — in clean rows and columns.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex items-center justify-center">
          <div className="w-full max-w-xl bg-background p-4 border border-foreground shadow-sm rounded-sm">
            <Table>
              <TableCaption>Your three most recent recordings.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Recording</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-bold">Onboarding walkthrough</TableCell>
                  <TableCell>Published</TableCell>
                  <TableCell className="text-right">1,204</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold">Bug repro #482</TableCell>
                  <TableCell>Private</TableCell>
                  <TableCell className="text-right">37</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold">Standup recap</TableCell>
                  <TableCell>Published</TableCell>
                  <TableCell className="text-right">562</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        <CodeBlock code={`import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@workspace/pico-ui/table"

<Table>
  <TableCaption>Your three most recent recordings.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Recording</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Views</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-bold">Onboarding walkthrough</TableCell>
      <TableCell>Published</TableCell>
      <TableCell className="text-right">1,204</TableCell>
    </TableRow>
  </TableBody>
</Table>`} />
      </Section>
    </div>
  );
}
