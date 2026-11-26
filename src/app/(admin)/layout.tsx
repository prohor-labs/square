import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import Shell from "@/components/shell";
import { auth } from "@/lib/auth";
import { dictionary } from "@/lib/dictionary";

export default async function AdminLayout({
  children,
}: {
  readonly children: ReactNode;
}): Promise<ReactElement> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const dict = dictionary;
  const lang = "en";

  return (
    <Shell dict={dict} lang={lang}>
      {children}
    </Shell>
  );
}
