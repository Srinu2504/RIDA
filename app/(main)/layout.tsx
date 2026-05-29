import { AppUserProvider } from "@/components/shared/user-context";
import { getAppUser } from "@/lib/current-user";
import { MainNav } from "@/components/shared/main-nav";
import { BottomNav } from "@/components/shared/bottom-nav";
import { MessagingMascot } from "@/components/messaging/messaging-mascot";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAppUser();

  return (
    <AppUserProvider user={user}>
      <div className="min-h-screen bg-[#f4f2ee] pb-16 md:pb-0">
        <MainNav />
        {children}
        <MessagingMascot />
        <BottomNav />
      </div>
    </AppUserProvider>
  );
}
