"use client";

import Image from "next/image";
import Add from "reicon-react/icons/Add";
import AngleLeft from "reicon-react/icons/AngleLeft";
import AngleRight from "reicon-react/icons/AngleRight";
import ArchiveBox from "reicon-react/icons/ArchiveBox";
import ArrowLeft2 from "reicon-react/icons/ArrowLeft2";
import ArrowRight2 from "reicon-react/icons/ArrowRight2";
import Award from "reicon-react/icons/Award";
import Bookmark from "reicon-react/icons/Bookmark";
import BookOpen from "reicon-react/icons/BookOpen";
import Building from "reicon-react/icons/Building";
import Calculator from "reicon-react/icons/Calculator";
import Calendar from "reicon-react/icons/Calendar";
import CalendarTick from "reicon-react/icons/CalendarTick";
import Camera from "reicon-react/icons/Camera";
import Category from "reicon-react/icons/Category";
import Chart from "reicon-react/icons/Chart";
import Clipboard from "reicon-react/icons/Clipboard";
import Clock from "reicon-react/icons/Clock";
import CloseCircle from "reicon-react/icons/CloseCircle";
import Copy from "reicon-react/icons/Copy";
import Courthouse from "reicon-react/icons/Courthouse";
import Crown from "reicon-react/icons/Crown";
import Danger from "reicon-react/icons/Danger";
import DocumentDownload from "reicon-react/icons/DocumentDownload";
import Download from "reicon-react/icons/Download";
import Edit from "reicon-react/icons/Edit";
import Export from "reicon-react/icons/Export";
import Eye from "reicon-react/icons/Eye";
import FileDown from "reicon-react/icons/FileDown";
import FileText from "reicon-react/icons/FileText";
import Filter from "reicon-react/icons/Filter";
import Flame from "reicon-react/icons/Flame";
import Flash from "reicon-react/icons/Flash";
import Gamepad from "reicon-react/icons/Gamepad";
import GradCap from "reicon-react/icons/GradCap";
import Grid from "reicon-react/icons/Grid";
import Home from "reicon-react/icons/Home";
import Information from "reicon-react/icons/Information";
import Language from "reicon-react/icons/Language";
import Lightbulb from "reicon-react/icons/Lightbulb";
import Like from "reicon-react/icons/Like";
import Link2 from "reicon-react/icons/Link2";
import Lock from "reicon-react/icons/Lock";
import Login from "reicon-react/icons/Login";
import Logout from "reicon-react/icons/Logout";
import Moon from "reicon-react/icons/Moon";
import Notification from "reicon-react/icons/Notification";
import Phone from "reicon-react/icons/Phone";
import Profile2user from "reicon-react/icons/Profile2user";
import Search from "reicon-react/icons/Search";
import SecurityCard from "reicon-react/icons/SecurityCard";
import Send from "reicon-react/icons/Send";
import ShieldCheck from "reicon-react/icons/ShieldCheck";
import Star from "reicon-react/icons/Star";
import StatusUp from "reicon-react/icons/StatusUp";
import Stethoscope from "reicon-react/icons/Stethoscope";
import Sun from "reicon-react/icons/Sun";
import TaskSquare from "reicon-react/icons/TaskSquare";
import Teacher from "reicon-react/icons/Teacher";
import TickCircle from "reicon-react/icons/TickCircle";
import Trash2 from "reicon-react/icons/Trash2";
import Trophy from "reicon-react/icons/Trophy";
import Upload from "reicon-react/icons/Upload";
import User from "reicon-react/icons/User";
import Video from "reicon-react/icons/Video";
import Warning from "reicon-react/icons/Warning";

export {
  Add,
  AngleLeft,
  AngleRight,
  ArchiveBox,
  ArrowLeft2,
  ArrowRight2,
  Award,
  Bookmark,
  BookOpen,
  Building,
  Calculator,
  Calendar,
  CalendarTick,
  Camera,
  Category,
  Chart,
  Clipboard,
  Clock,
  CloseCircle,
  Copy,
  Courthouse,
  Crown,
  Danger,
  DocumentDownload,
  Download,
  Edit,
  Export,
  Eye,
  FileDown,
  FileText,
  Filter,
  Flame,
  Flash,
  Gamepad,
  GradCap,
  Grid,
  Home,
  Information,
  Language,
  Lightbulb,
  Like,
  Link2,
  Lock,
  Login,
  Logout,
  Moon,
  Notification,
  Phone,
  Profile2user,
  Search,
  SecurityCard,
  Send,
  ShieldCheck,
  Star,
  StatusUp,
  Stethoscope,
  Sun,
  TaskSquare,
  Teacher,
  TickCircle,
  Trash2,
  Trophy,
  Upload,
  User,
  Video,
  Warning,
};

/**
 * The site mark: the SQUARE wordmark, cropped tight and kept local.
 *
 * The artwork is a dark navy wordmark on transparency, so it needs a light
 * plate to sit on — inside the app's dark shell it would disappear. `plate`
 * switches that plate on; the sidebar and headers already have a background.
 */
export function SquareLogo({
  className = "size-6",
  plate = false,
}: {
  readonly className?: string;
  /** Adds a rounded white tile behind the mark. */
  readonly plate?: boolean;
}) {
  const mark = (
    <Image
      src="/brand.png"
      alt="Square"
      width={309}
      height={309}
      className={className}
      unoptimized
      priority
    />
  );

  if (!plate) return mark;

  return (
    <span className="flex size-full items-center justify-center rounded-lg bg-white p-[6%]">
      {mark}
    </span>
  );
}

export function HambergerMenu({
  className = "size-6",
  size = 24,
}: {
  readonly className?: string;
  readonly size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <title>Menu</title>
      <path
        d="M3 7H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M3 12H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M3 17H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
