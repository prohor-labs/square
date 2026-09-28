import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSlidersManager } from "@/components/admin/admin-sliders-manager";
import { getHeroSliders } from "@/lib/actions/settings";
import { auth } from "@/lib/auth";


export default async function AdminSlidersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "admin") {
    return redirect("/dashboard");
  }

  const initialSliders = await getHeroSliders();

  return <AdminSlidersManager initialSliders={initialSliders} />;
}
