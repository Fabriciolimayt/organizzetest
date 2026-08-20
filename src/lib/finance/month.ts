export interface MonthRange {
  start: string;
  endExclusive: string;
  key: string;
  year: number;
  month: number;
}

type CalendarParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const calendarParts = (date: Date, timeZone: string): CalendarParts => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return parts as CalendarParts;
};

const zonedDateTimeToUtc = (
  year: number,
  month: number,
  day: number,
  timeZone: string,
  hour = 0,
): Date => {
  const desired = Date.UTC(year, month - 1, day, hour, 0, 0);
  let instant = desired;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = calendarParts(new Date(instant), timeZone);
    const represented = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    instant += desired - represented;
  }

  return new Date(instant);
};

export function monthRange(anchor: Date, timeZone: string): MonthRange {
  const local = calendarParts(anchor, timeZone);
  const nextMonth = local.month === 12 ? 1 : local.month + 1;
  const nextYear = local.month === 12 ? local.year + 1 : local.year;

  return {
    start: zonedDateTimeToUtc(local.year, local.month, 1, timeZone).toISOString(),
    endExclusive: zonedDateTimeToUtc(nextYear, nextMonth, 1, timeZone).toISOString(),
    key: `${local.year}-${String(local.month).padStart(2, "0")}`,
    year: local.year,
    month: local.month,
  };
}

export function shiftMonth(anchor: Date, offset: number, timeZone: string): Date {
  const local = calendarParts(anchor, timeZone);
  const shifted = new Date(Date.UTC(local.year, local.month - 1 + offset, 15, 12));
  return zonedDateTimeToUtc(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    15,
    timeZone,
    12,
  );
}

export function calendarDateInTimeZone(date: Date, timeZone: string): string {
  const local = calendarParts(date, timeZone);
  return `${local.year}-${String(local.month).padStart(2, "0")}-${String(local.day).padStart(2, "0")}`;
}

export function calendarDateToUtc(value: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("Indica uma data válida.");
  const [, year, month, day] = match;
  const result = zonedDateTimeToUtc(Number(year), Number(month), Number(day), timeZone, 12);
  if (calendarDateInTimeZone(result, timeZone) !== value) throw new Error("Indica uma data válida.");
  return result;
}

export function calendarDateBoundaryToUtc(value: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("Indica uma data válida.");
  const [, year, month, day] = match;
  const result = zonedDateTimeToUtc(Number(year), Number(month), Number(day), timeZone);
  if (calendarDateInTimeZone(result, timeZone) !== value) throw new Error("Indica uma data válida.");
  return result;
}

export function calendarDateToUtcPreservingInstant(value: string, timeZone: string, existing?: string | null): Date {
  if (existing) {
    const instant = new Date(existing);
    if (!Number.isNaN(instant.getTime()) && calendarDateInTimeZone(instant, timeZone) === value) return instant;
  }
  return calendarDateToUtc(value, timeZone);
}
