import {
  Add,
  BookOpen,
  Calendar,
  CalendarTick,
  Chart,
  Clipboard,
  Danger,
  DocumentDownload,
  Home,
  Notification,
  StatusUp,
  TaskSquare,
  User,
  Video,
} from "@/components/icons";
import type { NavGroup, NavItem, SidebarAnnouncement } from "@/types";

/**
 * Student navigation — the eleven destinations behind the menu button.
 *
 * The exam entries point at `/exams` with a tab rather than separate pages:
 * that screen already holds the live, upcoming and practice lists, so a second
 * page for each would only duplicate it.
 */
export const USER_NAV_GROUPS: readonly NavGroup[] = [
  {
    items: [
      {
        name: "ড্যাশবোর্ড",
        path: "/dashboard",
        exact: true,
        icon: Home,
        tone: "navy",
      },
      {
        name: "লাইভ ক্লাস",
        path: "/live-classes",
        exact: false,
        icon: Video,
        tone: "green",
        disabled: true,
      },
      {
        name: "পাস্ট ক্লাস",
        path: "/past-classes",
        exact: false,
        icon: Video,
        tone: "green",
      },
      {
        name: "লাইভ এক্সাম",
        path: "/exams?tab=live",
        matchPath: "/exams",
        exact: false,
        icon: Clipboard,
        tone: "yellow",
      },
      {
        name: "আপকামিং এক্সাম",
        path: "/exams?tab=upcoming",
        matchPath: "/exams",
        exact: false,
        icon: Clipboard,
        tone: "yellow",
      },
      {
        name: "প্র্যাকটিস এক্সাম",
        path: "/exams?tab=practice",
        matchPath: "/exams",
        exact: false,
        icon: Clipboard,
        tone: "yellow",
      },
      {
        name: "ভুল ব্যাংক",
        path: "/wrong-answers",
        exact: false,
        icon: Danger,
        tone: "yellow",
      },
      {
        name: "প্রশ্নব্যাংক",
        path: "/qb",
        exact: false,
        icon: TaskSquare,
        tone: "purple",
      },
      {
        name: "কোর্স রুটিন",
        path: "/routine",
        exact: false,
        icon: CalendarTick,
        tone: "blue",
      },
      {
        name: "পারফরমেন্স",
        path: "/performance",
        exact: false,
        icon: Chart,
        tone: "orange",
      },
      {
        name: "যোগাযোগ",
        path: "/qa",
        exact: false,
        icon: Notification,
        tone: "pink",
      },
    ],
  },
];

/** Flat view of the groups, for anything that just needs a list. */
export const USER_NAV_ITEMS: readonly NavItem[] = USER_NAV_GROUPS.flatMap(
  (group) => group.items,
);

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

export function getNavGroups(isAdmin: boolean = false): readonly NavGroup[] {
  if (isAdmin) {
    return [{ items: ADMIN_NAV_ITEMS }];
  }
  return USER_NAV_GROUPS;
}

export const sidebarAnnouncement: SidebarAnnouncement = {
  imageSrc: "/images/image.png",
  imageAlt: "রসায়নের ১৪০০+ MCQ",
  title: "১৪০০+ গুরুত্বপূর্ণ MCQ একসাথে!",
  subtitle:
    "বোর্ড পরীক্ষার চূড়ান্ত প্রস্তুতির জন্য প্রকাশ করা হলো রসায়নের ১৪০০+ বেছাই করা MCQ সম্বলিত PDF।",
  href: "/pdf",
};
