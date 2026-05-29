import { OnboardingSession } from "@/components/shared/onboarding-session";

export default function SetupProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OnboardingSession>{children}</OnboardingSession>;
}
