import { redirect } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import Shell from "@/components/shell";
import { getCachedSession } from "@/lib/auth-session";
import { dictionary } from "@/lib/dictionary";

export default async function ProtectedLayout({
  children,
}: {
  readonly children: ReactNode;
}): Promise<ReactElement> {
  const session = await getCachedSession();

  if (!session?.user) {
    redirect("/login");
  }

  const dict = dictionary;
  const lang = "en";

  return (
    <Shell dict={dict} lang={lang}>
      {children}
    </Shell>
  );
}
