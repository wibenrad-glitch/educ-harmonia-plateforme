import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  const { role } = session.user;

  if (role === "ADMIN") redirect("/dashboard/admin");
  if (role === "TEACHER") redirect("/dashboard/teacher");
  if (role === "STUDENT") redirect("/dashboard/student");

  redirect("/login");
}
