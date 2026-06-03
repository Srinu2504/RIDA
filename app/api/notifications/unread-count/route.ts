import { NextResponse } from "next/server";
import { countVisibleUnreadNotifications } from "@/lib/notifications";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const count = await countVisibleUnreadNotifications(userId);

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

