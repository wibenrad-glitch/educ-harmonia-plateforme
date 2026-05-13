import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) return NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });

  if (user) {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    await Promise.all(
      admins.map((admin) =>
        notify(
          admin.id,
          "🔑 Réinitialisation demandée",
          `${user.name} (${user.email}) a demandé une réinitialisation de mot de passe.`
        )
      )
    );
  }

  return NextResponse.json({ ok: true });
}
