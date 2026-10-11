import type { ReactElement, ReactNode } from "react";

export default async function AuthLayout({
  children,
}: {
  readonly children: ReactNode;
}): Promise<ReactElement> {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground transition-colors duration-300">
      <main className="flex-1 flex flex-col justify-center items-center p-4">
        {children}
      </main>
    </div>
  );
}
