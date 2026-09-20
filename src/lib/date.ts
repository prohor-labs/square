/**
 * Date and Time utilities for formatting and timezone handling (Asia/Dhaka)
 */

export const DHAKA_TIMEZONE = "Asia/Dhaka";

/**
 * Converts ISO string or Date to local YYYY-MM-DDTHH:mm string for datetime-local input in Asia/Dhaka timezone
 */
export function toDatetimeLocal(val?: string | Date | null): string {
  if (!val) return "";
  const d = typeof val === "string" ? new Date(val) : val;
  if (isNaN(d.getTime())) return "";

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: DHAKA_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(d);
    const getPart = (type: string) =>
      parts.find((p) => p.type === type)?.value || "";

    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");
    let hour = getPart("hour");
    if (hour === "24") hour = "00";
    const minute = getPart("minute");

    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}

/**
 * Converts datetime-local input string (representing Asia/Dhaka time) to standard UTC ISO string
 */
export function fromDatetimeLocalToDhakaIso(
  val?: string | null,
): string | null {
  if (!val || typeof val !== "string" || val.trim() === "") return null;
  const trimmed = val.trim();
  // Ensure seconds are present before timezone offset
  const baseTime = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  // If no timezone offset is specified, explicitly attach Dhaka offset (+06:00)
  const hasTimezone =
    baseTime.endsWith("Z") ||
    baseTime.includes("+") ||
    (baseTime.lastIndexOf("-") > baseTime.indexOf("T"));

  const dateStr = hasTimezone ? baseTime : `${baseTime}+06:00`;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Formats a Date/ISO string to human readable Bangla datetime in Asia/Dhaka timezone
 */
export function formatBanglaDateTime(
  val?: string | Date | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!val) return "যে কোনো সময়";
  const d = typeof val === "string" ? new Date(val) : val;
  if (isNaN(d.getTime())) return "যে কোনো সময়";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: DHAKA_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options,
  };

  try {
    return new Intl.DateTimeFormat("bn-BD", defaultOptions).format(d);
  } catch {
    return d.toLocaleString("bn-BD");
  }
}

/**
 * Formats a Date/ISO string to human readable Bangla date only in Asia/Dhaka timezone
 */
export function formatBanglaDate(
  val?: string | Date | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!val) return "যে কোনো সময়";
  return formatBanglaDateTime(val, {
    hour: undefined,
    minute: undefined,
    hour12: undefined,
    ...options,
  });
}
