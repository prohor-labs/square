import Link from "next/link";
import type { ReactElement } from "react";
import { QbBackupPanel } from "@/components/admin/qb-backup-panel";

export const dynamic = "force-dynamic";

export default function AdminQbBackupPage(): ReactElement {
  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto pb-12 pt-2 md:py-8 gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground flex-wrap">
          <Link href="/admin" className="hover:text-primary transition-colors">
            অ্যাডমিন
          </Link>
          <span>/</span>
          <Link
            href="/admin/qb"
            className="hover:text-primary transition-colors"
          >
            প্রশ্নব্যাংক
          </Link>
          <span>/</span>
          <span className="text-foreground">ব্যাকআপ</span>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            প্রশ্নব্যাংক ব্যাকআপ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            পুরো প্রশ্নব্যাংক zip ফাইলে নিয়ে রাখুন, আবার ফিরিয়ে আনুন
          </p>
        </div>
      </div>

      <QbBackupPanel />
    </div>
  );
}
