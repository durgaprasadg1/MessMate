import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/auth/authOptions";
import HomeClient from "@/Component/Home/HomeClient";

// Admins and owners go straight to their dashboard on the server (no flash of the landing page).
export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user?.isAdmin) redirect("/admin");
  if (session?.user?.isOwner) redirect("/owner");
  return <HomeClient />;
}
