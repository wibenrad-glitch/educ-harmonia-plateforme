import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <ProfileClient
      name={session.user.name ?? ""}
      email={session.user.email ?? ""}
      role={session.user.role}
    />
  );
}
