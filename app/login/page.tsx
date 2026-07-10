import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { currentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await currentUser();
  if (user) redirect("/");
  return <div className="login-page"><LoginForm /></div>;
}
