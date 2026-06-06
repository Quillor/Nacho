import {
  MousePointerClick,
  Megaphone,
  Inbox,
  Loader2,
  PartyPopper,
  TriangleAlert,
  FormInput,
  Trash2,
  Bell,
  HelpCircle,
  KeyRound,
  Share2,
} from "lucide-react";
import { DoDont, Scenario } from "./voice-and-tone-components";

/** The "Writing by Scenario" section — every place Nacho puts words, each with
 *  a recommended pattern and real do/don't pairs. Extracted from the page so
 *  the page file stays focused on layout. */
export function ScenariosSection() {
  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h2 className="border-b-2 border-foreground pb-2 font-display text-3xl font-extrabold">
          Writing by Scenario
        </h2>
        <p className="max-w-2xl text-lg font-medium leading-relaxed text-foreground/80">
          Every place we put words, with a recommended pattern and a real
          do/don't pair. When in doubt, copy the “Do”.
        </p>
      </div>

      <div className="space-y-8">
        <Scenario
          index="Scenario 01"
          title="Buttons & CTAs"
          icon={<MousePointerClick className="h-7 w-7 text-foreground" />}
          pattern="Lead with a verb, name the outcome, keep it to 1–3 words. Title Case or UPPERCASE to match the chunky type. Never make the user guess what happens when they tap."
        >
          <DoDont
            do="Start Recording Free"
            dont="Click here to begin your recording session"
          />
          <DoDont do="Publish & Get Link" dont="Submit" />
          <DoDont do="Copy link" dont="Proceed" />
        </Scenario>

        <Scenario
          index="Scenario 02"
          title="Headings & Marketing Copy"
          icon={<Megaphone className="h-7 w-7 text-foreground" />}
          pattern="This is our loudest voice. Make a bold claim, use punchy rhythm, and let the personality rip. Subheads do the explaining; headlines just land the punch."
        >
          <DoDont
            do="Send a video, not a novel."
            dont="A modern solution for asynchronous video communication"
          />
          <DoDont
            do="You speak 7x faster than you type. Why are you still typing?"
            dont="Our platform leverages video to improve team productivity"
          />
          <DoDont do="Power Moves" dont="Key Features Overview" />
        </Scenario>

        <Scenario
          index="Scenario 03"
          title="Empty States"
          icon={<Inbox className="h-7 w-7 text-foreground" />}
          pattern="Treat empty as a starting line, not a void. Say what goes here, then point at the one action that fills it. Encouraging, never apologetic."
        >
          <DoDont
            do="No recordings yet. Hit record, talk it out, and your video will show up right here."
            dont="You have no data to display at this time."
          />
          <DoDont
            do="Nothing published yet — your share links will live here once you do."
            dont="Empty."
          />
        </Scenario>

        <Scenario
          index="Scenario 04"
          title="Loading & In-Progress"
          icon={<Loader2 className="h-7 w-7 text-foreground" />}
          pattern="Name the step so waiting feels like progress, not a hang. Present-tense verb + “…”. Be specific (transcribing, uploading) over a generic spinner."
        >
          <DoDont do="Building preview…" dont="Please wait…" />
          <DoDont do="Publishing…" dont="Loading" />
          <DoDont
            do="Recording — go on, say your piece."
            dont="Process running, do not close this window."
          />
        </Scenario>

        <Scenario
          index="Scenario 05"
          title="Success Confirmations"
          icon={<PartyPopper className="h-7 w-7 text-foreground" />}
          pattern="Celebrate, then get out of the way. One upbeat headline, one line on what to do next if there is one. Earn the exclamation mark — don't overuse it."
        >
          <DoDont
            do="Published! Your share link is ready."
            dont="The operation completed successfully."
          />
          <DoDont
            do="Link copied — share it anywhere."
            dont="Copy action successful."
          />
          <DoDont
            do="Saved. Your changes are stored locally."
            dont="Data persisted."
          />
        </Scenario>

        <Scenario
          index="Scenario 06"
          title="Errors & Permission Failures"
          icon={<TriangleAlert className="h-7 w-7 text-foreground" />}
          pattern="Drop the swagger, never blame the user. Say what happened in plain words, then the one thing they can try next. No codes, no jargon, no “oops”."
        >
          <DoDont
            do="Couldn't start recording. Permission was denied or no source was selected."
            dont="Error 0x004: getUserMedia request rejected."
          />
          <DoDont
            do="Publish failed. Something went wrong uploading your recording — give it another go."
            dont="Upload error. Try again."
          />
          <DoDont
            do="Recording not found. This link may have been removed."
            dont="404: Resource does not exist."
          />
        </Scenario>

        <Scenario
          index="Scenario 07"
          title="Form Labels, Placeholders & Helper Text"
          icon={<FormInput className="h-7 w-7 text-foreground" />}
          pattern="Labels are short nouns in UPPERCASE. Placeholders show a real example, never repeat the label. Helper text explains the why or the consequence in one calm line. Validation says what's wrong and how to fix it."
        >
          <DoDont
            do="Label: Display name · Placeholder: Jane Doe · Helper: Shown in the app instead of your email."
            dont="Label: Display name · Placeholder: Enter display name here"
          />
          <DoDont
            do="Placeholder: Add context, links, or next steps…"
            dont="Placeholder: Description"
          />
          <DoDont
            do="Passwords don't match. Make sure both new password fields are identical."
            dont="Invalid input."
          />
        </Scenario>

        <Scenario
          index="Scenario 08"
          title="Confirmations & Destructive Actions"
          icon={<Trash2 className="h-7 w-7 text-foreground" />}
          pattern="Slow the user down with specifics. Title asks a clear yes/no question. Body names exactly what's removed, what survives, and whether it's reversible. The confirm button repeats the verb — never just “OK”."
        >
          <DoDont
            do="Delete this recording? This removes the local copy from this device. Published share links will keep working."
            dont="Are you sure? This action cannot be undone."
          />
          <DoDont
            do="Delete your account? This permanently deletes your Nacho account. This cannot be undone."
            dont="Confirm account removal."
          />
          <DoDont
            do="Confirm button: Delete · Clear everything · Delete account"
            dont="Confirm button: OK · Yes · Submit"
          />
        </Scenario>

        <Scenario
          index="Scenario 09"
          title="Toasts & Notifications"
          icon={<Bell className="h-7 w-7 text-foreground" />}
          pattern="A title alone often does the job; add one supporting line only when it helps. Past-tense for done, present-tense for happening. Keep it glanceable — it vanishes in seconds."
        >
          <DoDont do="Recording deleted" dont="Item successfully deleted." />
          <DoDont
            do="Verification sent. Enter the code we sent to you@example.com."
            dont="A verification email has been dispatched to your inbox."
          />
          <DoDont do="Name updated" dont="Your profile changes have been saved to the server." />
        </Scenario>

        <Scenario
          index="Scenario 10"
          title="Tooltips & Microcopy"
          icon={<HelpCircle className="h-7 w-7 text-foreground" />}
          pattern="Tiny, helpful, no full stops needed. Explain what a control does or why it's disabled. Never restate the obvious label — add the thing the icon can't say."
        >
          <DoDont
            do="Not supported in this browser"
            dont="This feature is currently unavailable due to browser limitations."
          />
          <DoDont
            do="Live preview appears here"
            dont="Video preview region placeholder"
          />
          <DoDont
            do="Every recording lives on this device until you publish it."
            dont="Local storage notice."
          />
        </Scenario>

        <Scenario
          index="Scenario 11"
          title="Auth Screens"
          icon={<KeyRound className="h-7 w-7 text-foreground" />}
          pattern="Warm and frictionless — the user just wants in. Welcome them, keep field labels plain, and make the sign-in / sign-up switch obvious. Save the swagger for after they're through the door."
        >
          <DoDont
            do="Welcome back. Sign in to grab your library."
            dont="Authentication required. Please provide credentials."
          />
          <DoDont
            do="New here? Create an account — it's free."
            dont="Registration form. Complete all fields to continue."
          />
          <DoDont
            do="Signed in as you@example.com"
            dont="Current session user identity confirmed."
          />
        </Scenario>

        <Scenario
          index="Scenario 12"
          title="Public Shared-View Copy"
          icon={<Share2 className="h-7 w-7 text-foreground" />}
          pattern="The viewer may have never heard of us. Keep the focus on the video, label sections plainly, and end with a light, branded invitation — never a hard sell."
        >
          <DoDont
            do="Made with Nacho — Record your own"
            dont="Sign up now to unlock all premium features!"
          />
          <DoDont
            do="Section heading: Transcript · Chapters"
            dont="Section heading: Auto-generated textual content"
          />
          <DoDont
            do="Recording not found. This link may have been removed."
            dont="The requested resource returned a null response."
          />
        </Scenario>
      </div>
    </section>
  );
}
