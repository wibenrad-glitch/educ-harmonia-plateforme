import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.user.id },
    include: {
      class: {
        include: {
          level: true,
          courses: {
            include: {
              teacher: true,
              assignments: {
                include: {
                  submissions: {
                    where: { studentId: session.user.id },
                    include: { grade: true },
                  },
                },
                orderBy: { dueDate: "asc" },
              },
            },
          },
        },
      },
    },
  });

  const courses = enrollments.flatMap((e) =>
    e.class.courses.map((c) => ({
      ...c,
      className: e.class.name,
      levelName: e.class.level.name,
    }))
  );

  const courseStats = courses.map((course) => {
    const graded = course.assignments
      .filter((a) => a.submissions[0]?.grade)
      .map((a) => ({
        title: a.title,
        score: a.submissions[0].grade!.score,
        feedback: a.submissions[0].grade!.feedback ?? "",
        gradedAt: new Date(a.submissions[0].grade!.gradedAt).toLocaleDateString("fr-FR"),
      }));
    const average =
      graded.length > 0
        ? (graded.reduce((s, a) => s + a.score, 0) / graded.length).toFixed(2)
        : null;
    return { title: course.title, teacherName: course.teacher.name, graded, average };
  });

  const allScores = courseStats.flatMap((c) => c.graded.map((g) => g.score));
  const globalAverage =
    allScores.length > 0
      ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)
      : null;

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const scoreColor = (score: number) => {
    if (score >= 16) return "#16a34a";
    if (score >= 12) return "#2563eb";
    if (score >= 8) return "#ea580c";
    return "#dc2626";
  };

  const rows = courseStats.map((course) => {
    const assignmentRows = course.graded.length === 0
      ? `<tr><td colspan="4" style="padding:10px 12px;color:#9ca3af;font-style:italic;font-size:13px">Aucun devoir corrigé</td></tr>`
      : course.graded.map((g) => `
        <tr style="border-bottom:1px solid #f3f4f6">
          <td style="padding:10px 12px;font-size:13px;color:#374151">${g.title}</td>
          <td style="padding:10px 12px;font-size:13px;color:#6b7280;font-style:italic">${g.feedback || "—"}</td>
          <td style="padding:10px 12px;font-size:12px;color:#6b7280">${g.gradedAt}</td>
          <td style="padding:10px 12px;text-align:center">
            <span style="font-weight:700;font-size:15px;color:${scoreColor(g.score)}">${g.score}/20</span>
          </td>
        </tr>`).join("");

    return `
      <div style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;page-break-inside:avoid">
        <div style="background:#f8fafc;padding:14px 18px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700;font-size:15px;color:#111827">${course.title}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px">Prof : ${course.teacherName}</div>
          </div>
          ${course.average ? `<div style="text-align:center;background:white;border:2px solid ${scoreColor(parseFloat(course.average))};border-radius:10px;padding:8px 16px">
            <div style="font-size:20px;font-weight:700;color:${scoreColor(parseFloat(course.average))}">${course.average}</div>
            <div style="font-size:11px;color:#6b7280">/20</div>
          </div>` : `<span style="font-size:13px;color:#9ca3af">Non noté</span>`}
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Devoir</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Commentaire</th>
              <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Date</th>
              <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Note</th>
            </tr>
          </thead>
          <tbody>${assignmentRows}</tbody>
        </table>
      </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Bulletin — ${session.user.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body style="max-width:800px;margin:0 auto;padding:32px 24px">

  <!-- Bouton impression -->
  <div class="no-print" style="text-align:right;margin-bottom:20px">
    <button onclick="window.print()" style="background:#4f46e5;color:white;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">
      🖨️ Imprimer / Télécharger en PDF
    </button>
  </div>

  <!-- En-tête -->
  <div style="border:2px solid #4f46e5;border-radius:16px;padding:24px;margin-bottom:28px;background:linear-gradient(135deg,#eef2ff,#faf5ff)">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:22px;font-weight:800;color:#4f46e5">Éduc'Harmonia</div>
        <div style="font-size:13px;color:#6b7280;margin-top:2px">Bulletin de notes scolaires</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:13px;color:#6b7280">Édité le</div>
        <div style="font-size:13px;font-weight:600;color:#374151;text-transform:capitalize">${today}</div>
      </div>
    </div>
    <hr style="margin:16px 0;border:none;border-top:1px solid #c7d2fe">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Élève</div>
        <div style="font-size:18px;font-weight:700;color:#111827;margin-top:2px">${session.user.name}</div>
      </div>
      ${globalAverage ? `
      <div style="text-align:center;background:white;border:2px solid #4f46e5;border-radius:14px;padding:12px 24px">
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Moyenne générale</div>
        <div style="font-size:32px;font-weight:800;color:#4f46e5;line-height:1.1;margin-top:4px">${globalAverage}</div>
        <div style="font-size:12px;color:#6b7280">/ 20</div>
      </div>` : ""}
    </div>
  </div>

  <!-- Notes par matière -->
  <div style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px">
    Notes par matière (${courseStats.filter(c => c.graded.length > 0).length} matière${courseStats.filter(c => c.graded.length > 0).length > 1 ? "s" : ""} notée${courseStats.filter(c => c.graded.length > 0).length > 1 ? "s" : ""})
  </div>
  ${rows}

  <!-- Pied de page -->
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af">
    Document généré par Éduc'Harmonia — ${today}
  </div>

</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
