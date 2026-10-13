export const DEFAULT_EVENT_TIME_ZONE = "Asia/Kolkata";
export const INVITATION_AVAILABILITY_DAYS = 30;

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const timePattern = /^(\d{2}):(\d{2})$/;

function parseEventDateTime(date: string, time: string): DateTimeParts | null {
  const dateMatch = datePattern.exec(date);
  const timeMatch = timePattern.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const parts = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };
  const candidate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));
  const isRealDate = candidate.getUTCFullYear() === parts.year
    && candidate.getUTCMonth() === parts.month - 1
    && candidate.getUTCDate() === parts.day
    && parts.hour <= 23
    && parts.minute <= 59;

  return isRealDate ? parts : null;
}

function getOffsetMilliseconds(timestamp: number, timeZone: string) {
  const zoneName = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(new Date(timestamp)).find((part) => part.type === "timeZoneName")?.value;
  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(zoneName ?? "");
  if (!match) throw new RangeError(`Unable to resolve offset for ${timeZone}.`);

  const sign = match[1] === "+" ? 1 : -1;
  return sign * ((Number(match[2]) * 60 + Number(match[3])) * 60 * 1000);
}

function zonedDateTimeToTimestamp(parts: DateTimeParts, timeZone: string) {
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  const initialTimestamp = asUtc - getOffsetMilliseconds(asUtc, timeZone);
  return asUtc - getOffsetMilliseconds(initialTimestamp, timeZone);
}

function addCalendarDays(parts: DateTimeParts, days: number): DateTimeParts {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, parts.hour, parts.minute));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

/** Returns the instant an invitation becomes unavailable, or null for invalid event data. */
export function invitationExpiryAt(
  weddingDate: string,
  weddingTime: string,
  timeZone = DEFAULT_EVENT_TIME_ZONE,
) {
  const event = parseEventDateTime(weddingDate, weddingTime);
  if (!event) return null;

  try {
    return zonedDateTimeToTimestamp(addCalendarDays(event, INVITATION_AVAILABILITY_DAYS), timeZone);
  } catch {
    return null;
  }
}

/** The exact expiry instant is unavailable: `now >= expiry`. */
export function isInvitationExpired(
  weddingDate: string,
  weddingTime: string,
  now = Date.now(),
  timeZone = DEFAULT_EVENT_TIME_ZONE,
) {
  const expiry = invitationExpiryAt(weddingDate, weddingTime, timeZone);
  return expiry === null || now >= expiry;
}
