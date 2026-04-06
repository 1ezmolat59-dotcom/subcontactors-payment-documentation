import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    const name = formData.get("name") as string;
    const expiresAt = formData.get("expiresAt") as string | null;

    if (!file || !type || !name) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const blob = await put(`documents/${session.user.id}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });

    const doc = await prisma.document.create({
      data: {
        userId: session.user.id,
        type: type as "W9" | "INSURANCE_CERTIFICATE" | "LICENSE" | "CONTRACT" | "OTHER",
        name,
        fileUrl: blob.url,
        fileSize: file.size,
        mimeType: file.type,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });

    return Response.json(doc, { status: 201 });
  } catch {
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
