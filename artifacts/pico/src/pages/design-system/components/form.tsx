import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/pico-ui/form";
import { Input } from "@workspace/pico-ui/input";
import { Button } from "@workspace/pico-ui/button";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function FormDocs() {
  const form = useForm({ defaultValues: { title: "" } });

  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Form
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A typed wrapper around react-hook-form that wires labels, controls, descriptions, and validation messages together. Compose a field with <code className="font-mono text-base bg-foreground/10 px-1 rounded-sm">FormField</code> and let the pieces handle accessibility for you.
        </p>
      </div>

      <section className="space-y-8">
 <h2 className="text-3xl font-display font-extrabold border-b-4 border-foreground pb-2">Usage</h2>
        <div className="p-8 border-4 border-foreground rounded-sm bg-background/50 flex justify-center">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(() => {})}
              className="w-full max-w-sm space-y-6"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase tracking-wide">
                      Recording title
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Q3 product walkthrough"
                        className="border-2 border-foreground font-medium"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Shown in your library and on the share page.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Save recording</Button>
            </form>
          </Form>
        </div>
        <CodeBlock code={`import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/pico-ui/form"
import { Input } from "@workspace/pico-ui/input"
import { Button } from "@workspace/pico-ui/button"

function RecordingForm() {
  const form = useForm({ defaultValues: { title: "" } })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(console.log)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recording title</FormLabel>
              <FormControl>
                <Input placeholder="Q3 product walkthrough" {...field} />
              </FormControl>
              <FormDescription>
                Shown in your library and on the share page.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save recording</Button>
      </form>
    </Form>
  )
}`} />
      </section>
    </div>
  );
}
