/**
 * Datum/Uhrzeit immer in Europe/Berlin berechnen – nicht über toISOString() (UTC),
 * sonst springt "heute" kurz nach Mitternacht auf den Vortag.
 */
export const ZEITZONE = "Europe/Berlin";

function teile(d: Date): Record<string, string> {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZEITZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) out[p.type] = p.value;
  return out;
}

export function heute(d: Date = new Date()): string {
  const t = teile(d);
  return `${t.year}-${t.month}-${t.day}`;
}
export function jetztUhrzeit(d: Date = new Date()): string {
  const t = teile(d);
  return `${t.hour}:${t.minute}`;
}
export function jahr(d: Date = new Date()): string {
  return teile(d).year ?? String(d.getFullYear());
}
/** "2026-10-26" -> "26.10.2026" */
export function isoZuDeutsch(iso: string): string {
  return iso ? iso.split("-").reverse().join(".") : "—";
}
/** "26.10.2026" -> "2026-10-26" (oder null) */
export function deutschZuIso(s: string): string | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s.trim());
  if (!m) return null;
  return `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
}
