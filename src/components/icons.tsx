"use client";

import Add from "reicon-react/icons/Add";
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
import Home from "reicon-react/icons/Home";
import Information from "reicon-react/icons/Information";
import Language from "reicon-react/icons/Language";
import Lightbulb from "reicon-react/icons/Lightbulb";
import Like from "reicon-react/icons/Like";
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
import User from "reicon-react/icons/User";
import Video from "reicon-react/icons/Video";
import Warning from "reicon-react/icons/Warning";

export {
  Add,
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
  Home,
  Information,
  Language,
  Lightbulb,
  Like,
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
  User,
  Video,
  Warning,
};

export function SquareLogo({
  className = "size-6",
}: {
  readonly className?: string;
}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={`fill-foreground transition-colors ${className}`}
    >
      <title>Square</title>
      <path d="M4.01 0A4.01 4.01 0 000 4.01v15.98c0 2.21 1.8 4 4.01 4.01h15.98C22.2 24 24 22.2 24 19.99V4A4.01 4.01 0 0019.99 0H4zm1.62 4.36h12.74c.7 0 1.26.57 1.26 1.27v12.74c0 .7-.56 1.27-1.26 1.27H5.63c-.7 0-1.26-.57-1.26-1.27V5.63a1.27 1.27 0 011.26-1.27zm3.83 4.35a.73.73 0 00-.73.73v5.09c0 .4.32.72.72.72h5.1a.73.73 0 00.73-.72V9.44a.73.73 0 00-.73-.73h-5.1Z" />
    </svg>
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
