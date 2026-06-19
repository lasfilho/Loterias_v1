import { addDays, format, startOfDay, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DRAW_WEEKDAYS, WEEKDAY_OFFSET_FROM_SATURDAY } from "./constants";

export function startOfCalendarDay(date: Date): Date {
  return startOfDay(date);
}

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return startOfCalendarDay(new Date(y, m - 1, d));
}

/** Sábado que abre o ciclo semanal da aposta (rotina começa no sábado). */
export function getBetWeekStart(date: Date = new Date()): Date {
  const d = startOfCalendarDay(date);
  const day = d.getDay();
  const daysSinceSaturday = (day + 1) % 7;
  d.setDate(d.getDate() - daysSinceSaturday);
  return d;
}

export function getBetWeekEnd(weekStart: Date): Date {
  return addDays(weekStart, 6);
}

export function getExpectedDateForWeekday(
  weekStart: Date,
  weekday: number
): Date {
  const offset = WEEKDAY_OFFSET_FROM_SATURDAY[weekday] ?? 0;
  return addDays(weekStart, offset);
}

export function getWeekDateRange(weekStart: Date) {
  const start = startOfCalendarDay(weekStart);
  const end = addDays(start, 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getDayBounds(date: Date) {
  const start = startOfCalendarDay(date);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = getBetWeekEnd(weekStart);
  return `${format(weekStart, "dd/MM", { locale: ptBR })} – ${format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}`;
}

export function formatDisplayDate(date: Date): string {
  return format(date, "dd/MM/yyyy (EEE)", { locale: ptBR });
}

export function listRecentWeekStarts(count = 8, from: Date = new Date()): Date[] {
  const current = getBetWeekStart(from);
  return Array.from({ length: count }, (_, i) => subWeeks(current, i));
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function drawDateMatchesWeekday(drawDate: Date, weekday: number): boolean {
  return drawDate.getDay() === weekday;
}

export function getExpectedWeekdaysForGame(slug: keyof typeof DRAW_WEEKDAYS) {
  return DRAW_WEEKDAYS[slug];
}
