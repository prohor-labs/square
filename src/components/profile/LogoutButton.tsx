"use client";

import type { ReactElement } from "react";
import { Logout } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-auth";

/** The only account action kept on the profile page. */
export function LogoutButton(): ReactElement {
  const logoutMutation = useLogout();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
      className="w-full rounded-xl h-11 gap-2 font-semibold border-border/70 hover:border-destructive/50 hover:text-destructive"
    >
      <Logout className="size-4" />
      লগ আউট
    </Button>
  );
}
