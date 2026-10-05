"use client";

import type { ReactElement } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/lib/auth-client";

interface ProfileSidebarProps {
  /** Stable per-user id, read on the server. */
  readonly userId: string;
}

/**
 * The student card at the top of the profile page.
 *
 * Only real data — avatar, name, email and id. The old trophy / streak / member
 * badges were hardcoded decoration rather than anything the user had earned, so
 * they are gone.
 */
export function ProfileSidebar({ userId }: ProfileSidebarProps): ReactElement {
  const { data: session } = useSession();
  const user = session?.user;

  const displayName = user?.name || "ব্যবহারকারী";
  const email = user?.email ?? null;

  return (
    <section className="w-full border border-border/70 rounded-2xl bg-card p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <Avatar className="size-16 sm:size-20 border-2 border-card shadow-md">
          {user?.image ? (
            <AvatarImage src={user.image} alt={displayName} />
          ) : null}
          <AvatarFallback className="text-xl font-bold">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h1 className="font-extrabold text-xl sm:text-2xl tracking-tight break-words">
            {displayName}
          </h1>
          <dl className="mt-2 space-y-1">
            {email && (
              <div className="flex items-baseline gap-2">
                <dt className="text-[11px] font-semibold text-muted-foreground shrink-0">
                  ইমেইল
                </dt>
                <dd className="text-xs sm:text-sm break-all">{email}</dd>
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <dt className="text-[11px] font-semibold text-muted-foreground shrink-0">
                আইডি
              </dt>
              <dd className="text-xs sm:text-sm font-mono break-all">
                {userId}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
