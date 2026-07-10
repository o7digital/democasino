import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { currentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return <Dashboard user={{ name: user.name, role: user.role }} />;
}
