import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([], { status: 401 });

  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) return NextResponse.json([], { status: 400 });

  const isMember = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: session.user.id } },
  });
  if (!isMember) return NextResponse.json([], { status: 403 });

  const messages = await prisma.message.findMany({
    where: { roomId },
    include: { sender: { select: { name: true } } },
    orderBy: { sentAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { roomId, content } = await req.json();
  if (!roomId || !content) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });

  const isMember = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: session.user.id } },
  });
  if (!isMember) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const message = await prisma.message.create({
    data: { roomId, senderId: session.user.id, content },
    include: { sender: { select: { name: true } } },
  });

  return NextResponse.json(message);
}
