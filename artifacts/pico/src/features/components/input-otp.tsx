import { Section } from "@/components/docs/shared";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@workspace/pico-ui/input-otp";
import { Label } from "@workspace/pico-ui/label";
import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function InputOTPDocs() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
 <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground">
          Input OTP
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A segmented field for entering one-time passcodes, like the email code that protects a private recording.
        </p>
      </div>

      <Section title="Usage">
        <div className="p-8 border-2 border-foreground rounded-sm bg-background/50 flex justify-center">
          <div className="space-y-2 text-center">
            <Label className="uppercase tracking-wide">Verification code</Label>
            <InputOTP maxLength={6}>
              <InputOTPGroup>
                <InputOTPSlot index={0} className="border border-foreground" />
                <InputOTPSlot index={1} className="border border-foreground" />
                <InputOTPSlot index={2} className="border border-foreground" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} className="border border-foreground" />
                <InputOTPSlot index={4} className="border border-foreground" />
                <InputOTPSlot index={5} className="border border-foreground" />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>
        <CodeBlock code={`import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@workspace/pico-ui/input-otp"

<InputOTP maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>`} />
      </Section>
    </div>
  );
}
