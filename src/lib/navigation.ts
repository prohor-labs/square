import {
  Add,
  BookOpen,
  Calendar,
  CalendarTick,
  DocumentDownload,
  Home,
  StatusUp,
  TaskSquare,
  User,
} from "@/components/icons";
import type { Dictionary, NavItem, SidebarAnnouncement } from "@/types";

export const USER_NAV_ITEMS: readonly NavItem[] = [
  { name: "ড্যাশবোর্ড", path: "/dashboard", exact: true, icon: Home },
  { name: "কোর্স", path: "/my-courses", exact: false, icon: BookOpen },
  { name: "প্রশ্নব্যাংক", path: "/qb", exact: false, icon: TaskSquare },
  { name: "পরীক্ষা", path: "/exams", exact: false, icon: CalendarTick },
  { name: "পিডিএফ", path: "/pdf", exact: false, icon: DocumentDownload },
  { name: "ক্যালেন্ডার", path: "/calendar", exact: false, icon: Calendar },
  { name: "পোল", path: "/poll", exact: false, icon: StatusUp },
  { name: "প্রোফাইল", path: "/profile", exact: false, icon: User },
];

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  { name: "ওভারভিউ", path: "/admin", exact: true, icon: Home },
  {
    name: "স্টুডেন্ট",
    path: "/admin/students",
    exact: false,
    icon: User,
  },
  {
    name: "এনরোলমেন্ট",
    path: "/admin/enrollments",
    exact: false,
    icon: DocumentDownload,
  },
  {
    name: "প্রশ্ন আপলোড",
    path: "/admin/qb/add-question",
    exact: false,
    icon: Add,
  },
  { name: "প্রশ্নব্যাংক", path: "/admin/qb", exact: false, icon: TaskSquare },
  { name: "ম্যানেজ ব্যাচ", path: "/admin/batches", exact: false, icon: User },
  {
    name: "ম্যানেজ পরীক্ষা",
    path: "/admin/exams",
    exact: true,
    icon: TaskSquare,
  },
  { name: "পিডিএফ সাজেশন", path: "/admin/pdf", exact: false, icon: BookOpen },
  { name: "ক্যালেন্ডার", path: "/admin/calendar", exact: false, icon: Calendar },
  {
    name: "হিরো স্লাইডার",
    path: "/admin/sliders",
    exact: false,
    icon: StatusUp,
  },
];

export function getNavItems(
  dict?: Dictionary,
  isAdmin: boolean = false,
): readonly NavItem[] {
  if (isAdmin) {
    return ADMIN_NAV_ITEMS;
  }

  if (dict?.sidebar) {
    const d = dict.sidebar;
    return [
      { name: d.dashboard, path: "/dashboard", exact: true, icon: Home },
      { name: "কোর্স", path: "/my-courses", exact: false, icon: BookOpen },
      { name: d.qb, path: "/qb", exact: false, icon: TaskSquare },
      { name: "পরীক্ষা", path: "/exams", exact: false, icon: CalendarTick },
      { name: d.pdf, path: "/pdf", exact: false, icon: DocumentDownload },
      { name: d.calendar, path: "/calendar", exact: false, icon: Calendar },
      { name: d.poll, path: "/poll", exact: false, icon: StatusUp },
    ];
  }

  return USER_NAV_ITEMS;
}

export const sidebarAnnouncement: SidebarAnnouncement = {
  imageSrc: "/images/image.png",
  imageAlt: "রসায়নের ১৪০০+ MCQ",
  title: "১৪০০+ গুরুত্বপূর্ণ MCQ একসাথে!",
  subtitle:
    "বোর্ড পরীক্ষার চূড়ান্ত প্রস্তুতির জন্য প্রকাশ করা হলো রসায়নের ১৪০০+ বাছাইকৃত MCQ সম্বলিত PDF।",
  href: "/pdf",
};
