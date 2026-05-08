import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ResourceType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { courseId, name, url, type } = await req.json();
  if (!courseId || !name || !url || !type) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const resource = await prisma.resource.create({
    data: { courseId, name, url, type: type as ResourceType },
  });

  return NextResponse.json(resource);
}
