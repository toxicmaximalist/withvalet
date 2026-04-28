import Link from "next/link";

import { signupAction } from "@/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { TextInput } from "@/components/form-controls";
import { NoticeBanner } from "@/components/notice-banner";
import { SubmitButton } from "@/components/submit-button";
import { redirectIfAuthenticated } from "@/lib/auth";
import { getMessageValue } from "@/lib/navigation";

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  await redirectIfAuthenticated();
  const params = await searchParams;

  return (
    <AuthShell
      title="Create your account"
      description="Set up a personal account first, then create or join a workspace after sign up."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-foreground transition hover:text-accent-foreground">
            Back to login
          </Link>
        </>
      }
    >
      <NoticeBanner
        className="mb-5 rounded-2xl border-white/10 bg-white/[0.035] text-left text-foreground"
        error={getMessageValue(params.error)}
        success={getMessageValue(params.success)}
      />

      <form action={signupAction} className="space-y-4 text-left">
        <div>
          <label htmlFor="fullName" className="mb-2 block text-sm text-foreground/92">
            Full name
          </label>
          <TextInput
            id="fullName"
            name="fullName"
            placeholder="Enter your full name..."
            className="h-14 rounded-2xl border-white/20 bg-white/[0.04] px-5 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,255,255,0.02)] placeholder:text-muted-foreground focus:border-white/35 focus:bg-white/[0.05] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_0_24px_rgba(251,75,78,0.08)]"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm text-foreground/92">
            Email address
          </label>
          <TextInput
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email address..."
            className="h-14 rounded-2xl border-white/20 bg-white/[0.04] px-5 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,255,255,0.02)] placeholder:text-muted-foreground focus:border-white/35 focus:bg-white/[0.05] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_0_24px_rgba(251,75,78,0.08)]"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm text-foreground/92">
            Password
          </label>
          <TextInput
            id="password"
            name="password"
            type="password"
            placeholder="Create a password..."
            className="h-14 rounded-2xl border-white/20 bg-white/[0.04] px-5 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(255,255,255,0.02)] placeholder:text-muted-foreground focus:border-white/35 focus:bg-white/[0.05] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_0_24px_rgba(251,75,78,0.08)]"
            required
          />
        </div>
        <SubmitButton
          pendingLabel="Creating account..."
          className="mt-2 h-13 w-full rounded-full border-white/5 bg-white/[0.08] px-5 text-base font-medium text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:scale-100 hover:border-white/10 hover:bg-white/[0.11] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_30px_rgba(0,0,0,0.25)]"
        >
          Continue with email
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
