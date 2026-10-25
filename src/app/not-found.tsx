import Link from "next/link";
import { SquareLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-grow min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-6 text-center">
        <SquareLogo className="size-28" plate />

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-balance text-4xl font-normal tracking-tight font-serif text-foreground">
            404 - Page Not Found
          </h1>
          <p className="text-pretty text-muted-foreground text-sm font-sans max-w-md">
            Sorry, the page you are looking for has been moved or deleted.
          </p>
        </div>

        <Button render={<Link href="/" />} size="lg" className="mt-2">
          Return Home
        </Button>
      </div>
    </main>
  );
}
