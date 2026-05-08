import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { otherUserId } = await req.json();
  if (!otherUserId) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

  const userId = session.user.id;

  // Chercher une room directe existante entre ces deux utilisateurs
  const existing = await prisma.room.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: otherUserId } } },
      ],
    },
  });

  if (existing) return NextResponse.json(existing);

  // Créer la room
  const room = await prisma.room.create({
    data: {
      type: "DIRECT",
      members: {
        create: [{ userId }, { userId: otherUserId }],
      },
    },
  });

  return NextResponse.json(room);
}
