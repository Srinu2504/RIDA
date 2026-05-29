import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SavedPageClient } from "./saved-client";

export default async function SavedPage() {
  const session = await getServerSession(authOptions);

  return <SavedPageClient currentUserId={session?.user?.id ?? ""} />;
}
