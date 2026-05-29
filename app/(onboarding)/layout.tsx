import { OnboardingSession } from "@/components/shared/onboarding-session";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingSession>
      <div className="min-h-screen bg-cream-bg px-4 py-10">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold tracking-wide text-green-primary">
            RIDA
          </h1>
          <p className="mt-1 text-[11px] text-text-muted">
            Set up your professional profile
          </p>
        </div>
        {children}
      </div>
    </OnboardingSession>
  );
}
