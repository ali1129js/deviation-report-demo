import { z } from "zod";
import { berichtSchema, leereDaten, type Bericht, type BerichtDaten } from "./schema";
import { jahr } from "./date";
import { pruefeAbschluss, type Problem } from "./validierung";

export const STORAGE_KEY = "deviation-report-demo:v1";
export const BACKUP_PREFIX = `${STORAGE_KEY}:backup:`;

export const datenbankSchema = z.object({
  version: z.literal(1),
  zaehler: z.record(z.string().regex(/^\d{4}$/), z.number().int().nonnegative()),
  berichte: z.array(berichtSchema),
});
export type Datenbank = z.infer<typeof datenbankSchema>;
export const leereDatenbank = (): Datenbank => ({
  version: 1,
  zaehler: {},
  berichte: [],
});

/** Minimaler Ausschnitt von Storage – im Test durch eine Map ersetzbar. */
export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export type LadeErgebnis =
  | { ok: true; db: Datenbank }
  | { ok: false; art: "json" | "schema"; meldung: string; backupKey: string | null };

export class SpeicherFehler extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpeicherFehler";
  }
}
export class ValidierungsFehler extends Error {
  constructor(readonly probleme: Problem[]) {
    super("Bericht unvollständig");
    this.name = "ValidierungsFehler";
  }
}

/** Unlesbare Rohdaten nie überschreiben, sondern vorher sichern. */
function sichere(kv: KV, roh: string, jetzt: Date): string | null {
  const key = BACKUP_PREFIX + jetzt.toISOString();
  try {
    kv.setItem(key, roh);
    return key;
  } catch {
    return null;
  }
}

export function lade(kv: KV, jetzt = new Date()): LadeErgebnis {
  const roh = kv.getItem(STORAGE_KEY);
  if (roh === null) return { ok: true, db: leereDatenbank() };
  let json: unknown;
  try {
    json = JSON.parse(roh);
  } catch {
    return {
      ok: false,
      art: "json",
      meldung: "Gespeicherte Daten sind kein gültiges JSON.",
      backupKey: sichere(kv, roh, jetzt),
    };
  }
  const r = datenbankSchema.safeParse(json);
  if (!r.success)
    return {
      ok: false,
      art: "schema",
      meldung: `Gespeicherte Daten passen nicht zum Schema (${r.error.issues[0]?.message ?? "?"}).`,
      backupKey: sichere(kv, roh, jetzt),
    };
  return { ok: true, db: r.data };
}

export function speichere(kv: KV, db: Datenbank): void {
  const geprueft = datenbankSchema.parse(db);
  try {
    kv.setItem(STORAGE_KEY, JSON.stringify(geprueft));
  } catch (e) {
    throw new SpeicherFehler(
      `Speichern fehlgeschlagen: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

export function naechsteNummer(
  db: Datenbank,
  jetzt = new Date()
): { db: Datenbank; nummer: string } {
  const j = jahr(jetzt);
  const n = (db.zaehler[j] ?? 0) + 1;
  return {
    db: { ...db, zaehler: { ...db.zaehler, [j]: n } },
    nummer: `DR-${j}-${String(n).padStart(4, "0")}`,
  };
}

export function neuerBericht(
  db: Datenbank,
  daten: Partial<BerichtDaten> = {},
  jetzt = new Date(),
  id: string = crypto.randomUUID()
): { db: Datenbank; bericht: Bericht } {
  const { db: db2, nummer } = naechsteNummer(db, jetzt);
  const ts = jetzt.toISOString();
  const bericht: Bericht = berichtSchema.parse({
    id,
    nummer,
    status: "entwurf",
    erstellt: ts,
    geaendert: ts,
    daten: { ...leereDaten(), ...daten },
  });
  return { db: { ...db2, berichte: [bericht, ...db2.berichte] }, bericht };
}

export function aktualisiere(
  db: Datenbank,
  id: string,
  daten: BerichtDaten,
  jetzt = new Date()
): Datenbank {
  return {
    ...db,
    berichte: db.berichte.map((b) => {
      if (b.id !== id) return b;
      if (b.status === "abgeschlossen")
        throw new SpeicherFehler("Abgeschlossene Berichte sind schreibgeschützt.");
      return { ...b, daten, geaendert: jetzt.toISOString() };
    }),
  };
}

export function schliesseAb(db: Datenbank, id: string, jetzt = new Date()): Datenbank {
  const b = db.berichte.find((x) => x.id === id);
  if (!b) throw new SpeicherFehler("Bericht nicht gefunden.");
  const p = pruefeAbschluss(b.daten);
  if (p.length) throw new ValidierungsFehler(p);
  return {
    ...db,
    berichte: db.berichte.map((x) =>
      x.id === id ? { ...x, status: "abgeschlossen", geaendert: jetzt.toISOString() } : x
    ),
  };
}

export function loesche(db: Datenbank, id: string): Datenbank {
  return { ...db, berichte: db.berichte.filter((b) => b.id !== id) };
}
