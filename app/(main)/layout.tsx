import { MainNav } from "@/components/shared/main-nav";
import { BottomNav } from "@/components/shared/bottom-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-bg pb-16 md:pb-0">
      <MainNav />
      {children}
      <BottomNav />
    </div>
  );
}
