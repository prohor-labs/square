import type { ReactElement, ReactNode } from "react";
import Shell from "@/components/shell";
import { dictionary } from "@/lib/dictionary";

/**
 * Layout for the public practice tools.
 *
 * The custom exam has to work without an account, so this group skips the
 * session check the `(protected)` group performs and renders the normal shell
 * for anyone.
 */
export default function ExamLayout({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Shell dict={dictionary} lang="en">
      {children}
    </Shell>
  );
}
