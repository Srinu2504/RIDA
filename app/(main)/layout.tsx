import { AppUserProvider } from "@/components/shared/user-context";
import { getSession } from "@/lib/session";
import { MainNav } from "@/components/shared/main-nav";
import { BottomNav } from "@/components/shared/bottom-nav";
import { MessagingWidget } from "@/components/messaging/messaging-widget";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.user?.id
    ? { id: session.user.id, fullName: session.user.fullName }
    : null;

  return (
    <AppUserProvider user={user}>
      <div className="min-h-screen bg-[#f4f2ee] pb-16 md:pb-0">
        <MainNav />
        {children}
        <MessagingWidget />
        <BottomNav />
      </div>
    </AppUserProvider>
  );
}
