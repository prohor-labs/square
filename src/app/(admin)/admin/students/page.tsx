import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminStudents } from "@/lib/actions/admin-students";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const search = (params.q ?? "").trim();
  const page = Number.parseInt(params.page ?? "1", 10) || 1;

  const {
    rows,
    total,
    page: currentPage,
    pageCount,
  } = await getAdminStudents({
    search,
    page,
  });

  const buildHref = (target: number) => {
    const qs = new URLSearchParams();
    if (search) qs.set("q", search);
    if (target > 1) qs.set("page", String(target));
    const query = qs.toString();
    return query ? `/admin/students?${query}` : "/admin/students";
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto pb-12 pt-2 md:py-8 gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">সব স্টুডেন্ট</h1>
        <span className="text-sm font-semibold text-muted-foreground">
          মোট {total} জন
        </span>
      </div>

      <form action="/admin/students" className="flex gap-2">
        <Input
          name="q"
          defaultValue={search}
          placeholder="নাম, ইমেইল, আইডি, স্কুল বা কলেজ খুঁজুন..."
          className="rounded-xl h-10"
        />
        <Button type="submit" className="rounded-xl h-10 shrink-0 px-5 text-sm">
          খুঁজুন
        </Button>
      </form>

      <div className="border border-border/70 rounded-2xl bg-card overflow-hidden shadow-xs">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-bold">ছাত্র</th>
                <th className="px-4 py-3 font-bold">স্কুল / কলেজ</th>
                <th className="px-4 py-3 font-bold">কোর্স</th>
                <th className="px-4 py-3 font-bold whitespace-nowrap">যোগদান</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 shrink-0">
                        {row.image ? (
                          <AvatarImage src={row.image} alt={row.name} />
                        ) : null}
                        <AvatarFallback className="text-xs font-bold">
                          {row.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{row.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {row.email}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 font-mono truncate">
                          {row.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.school || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.college || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {row.courseCount === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {row.courses.map((course) => (
                          <Badge
                            key={course}
                            variant="secondary"
                            className="text-[10px] font-semibold"
                          >
                            {course}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {row.joinedAt.toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="md:hidden divide-y">
          {rows.map((row) => (
            <li key={row.id} className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 shrink-0">
                  {row.image ? (
                    <AvatarImage src={row.image} alt={row.name} />
                  ) : null}
                  <AvatarFallback className="text-xs font-bold">
                    {row.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{row.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {row.email}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                স্কুল: {row.school || "—"} · কলেজ: {row.college || "—"}
              </p>
              {row.courses.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {row.courses.map((course) => (
                    <Badge
                      key={course}
                      variant="secondary"
                      className="text-[10px] font-semibold"
                    >
                      {course}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground font-mono">
                {row.id}
              </p>
            </li>
          ))}
        </ul>

        {rows.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            কোনো স্টুডেন্ট পাওয়া যায়নি।
          </p>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            পাতা {currentPage} / {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              render={<a href={buildHref(currentPage - 1)} />}
              className="rounded-xl"
            >
              আগে
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pageCount}
              render={<a href={buildHref(currentPage + 1)} />}
              className="rounded-xl"
            >
              পরে
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
