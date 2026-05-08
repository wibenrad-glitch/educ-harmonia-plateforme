import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Niveaux
  const maternelle = await prisma.level.upsert({
    where: { name: "Maternelle" },
    update: {},
    create: { name: "Maternelle" },
  });

  const primaire = await prisma.level.upsert({
    where: { name: "Primaire" },
    update: {},
    create: { name: "Primaire" },
  });

  // Classes Maternelle
  const classesMaternelle = ["PS", "MS", "GS"];
  for (const name of classesMaternelle) {
    await prisma.class.upsert({
      where: { name_year: { name, year: "2025-2026" } } as never,
      update: {},
      create: { name, year: "2025-2026", levelId: maternelle.id },
    });
  }

  // Classes Primaire
  const classesPrimaire = ["CP", "CE1", "CE2", "CM1", "CM2"];
  for (const name of classesPrimaire) {
    await prisma.class.upsert({
      where: { name_year: { name, year: "2025-2026" } } as never,
      update: {},
      create: { name, year: "2025-2026", levelId: primaire.id },
    });
  }

  // Admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@eve-education.com" },
    update: {},
    create: {
      name: "Administrateur",
      email: "admin@eve-education.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Professeur test
  const teacherPassword = await bcrypt.hash("prof123", 12);
  await prisma.user.upsert({
    where: { email: "prof@eve-education.com" },
    update: {},
    create: {
      name: "Marie Dupont",
      email: "prof@eve-education.com",
      password: teacherPassword,
      role: "TEACHER",
    },
  });

  // Élève test
  const studentPassword = await bcrypt.hash("eleve123", 12);
  await prisma.user.upsert({
    where: { email: "eleve@eve-education.com" },
    update: {},
    create: {
      name: "Lucas Martin",
      email: "eleve@eve-education.com",
      password: studentPassword,
      role: "STUDENT",
    },
  });

  // Récupérer les utilisateurs et la classe CP
  const prof = await prisma.user.findUnique({ where: { email: "prof@eve-education.com" } });
  const eleve = await prisma.user.findUnique({ where: { email: "eleve@eve-education.com" } });
  const classeCP = await prisma.class.findFirst({ where: { name: "CP" } });

  if (prof && eleve && classeCP) {
    // Assigner le prof à la classe CP
    await prisma.teacherClass.upsert({
      where: { teacherId_classId: { teacherId: prof.id, classId: classeCP.id } },
      update: {},
      create: { teacherId: prof.id, classId: classeCP.id },
    });

    // Inscrire l'élève dans la classe CP
    await prisma.enrollment.upsert({
      where: { studentId_classId: { studentId: eleve.id, classId: classeCP.id } },
      update: {},
      create: { studentId: eleve.id, classId: classeCP.id },
    });

    // Créer un cours de Mathématiques
    const courseMath = await prisma.course.upsert({
      where: { id: "seed-math-cp" },
      update: {},
      create: {
        id: "seed-math-cp",
        title: "Mathématiques CP",
        description: "Nombres, calcul et géométrie pour le CP",
        teacherId: prof.id,
        classId: classeCP.id,
      },
    });

    // Créer un cours de Français
    const courseFr = await prisma.course.upsert({
      where: { id: "seed-fr-cp" },
      update: {},
      create: {
        id: "seed-fr-cp",
        title: "Français CP",
        description: "Lecture, écriture et grammaire pour le CP",
        teacherId: prof.id,
        classId: classeCP.id,
      },
    });

    // Créer une session Zoom à venir
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await prisma.zoomSession.upsert({
      where: { id: "seed-session-1" },
      update: {},
      create: {
        id: "seed-session-1",
        courseId: courseMath.id,
        title: "Séance 1 — Les additions",
        zoomLink: "https://zoom.us/j/123456789",
        scheduledAt: tomorrow,
        duration: 60,
        status: "SCHEDULED",
      },
    });

    // Créer un devoir
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await prisma.assignment.upsert({
      where: { id: "seed-assign-1" },
      update: {},
      create: {
        id: "seed-assign-1",
        courseId: courseMath.id,
        title: "Exercices additions",
        description: "Faire les exercices 1 à 5 page 12 du cahier",
        dueDate: nextWeek,
      },
    });

    console.log("✅ Cours, session Zoom et devoir créés pour la classe CP !");
  }

  console.log("✅ Seed terminé !");
  console.log("Admin   : admin@eve-education.com / admin123");
  console.log("Prof    : prof@eve-education.com / prof123");
  console.log("Élève   : eleve@eve-education.com / eleve123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
