import type { ReactElement, ReactNode } from "react";

/**
 * `/qb` serves two audiences: admins get the upload/manage screen and students
 * get the read-only library. The page itself picks the view after checking the
 * session, before any admin data is read.
 */
export default function QbLayout({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  return <>{children}</>;
}
