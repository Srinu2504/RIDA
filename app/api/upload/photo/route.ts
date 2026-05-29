import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { uploadProfilePhoto } from "@/lib/cloudinary";
import { isClinicalRole } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await requireSession();

    if (!isClinicalRole(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json(
        { error: "Cloudinary not configured", url: image },
        { status: 200 }
      );
    }

    const url = await uploadProfilePhoto(image, session.user.id);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
