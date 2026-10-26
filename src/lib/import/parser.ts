import { deutschZuIso } from "../date";
import { AUFTRAG_RE, CHARGE_RE, type BerichtDaten } from "../schema";

export type ImportFelder = Partial<
  Pick<
    BerichtDaten,
    | "linie"
    | "bereich"
    | "maschine"
    | "datum"
    | "uhrzeit"
    | "auftrag"
    | "charge"
    | "produkt"
    | "menge"
    | "beschreibung"
    | "entdecktDurch"
  >
>;

export interface ImportVorschau {
  felder: ImportFelder;
  hinweise: string[];
}

/** Text normalisieren: verschiedene Bindestriche, Doppelpunkte, Leerraum. */
const norm = (t: string) =>
  t
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\uFF1A/g, ":")
    .replace(/[ \t]+/g, " ");

function wert(text: string, label: string): string | undefined {
  const re = new RegExp(`^\\s*${label}\\s*:\\s*(.+?)\\s*$`, "im");
  return re.exec(text)?.[1];
}

/** Liest ein fiktives Linienprotokoll in Formularfelder. Ergebnis ist nur eine Vorschau. */
export function parseProtokoll(roh: string): ImportVorschau {
  const t = norm(roh);
  const f: ImportFelder = {};
  const hinweise: string[] = [];

  const linie = wert(t, "Linie");
  if (linie) f.linie = linie;
  const bereich = wert(t, "Bereich");
  if (bereich) f.bereich = bereich.replace(" - ", " – ");
  const maschine = wert(t, "Maschine");
  if (maschine) f.maschine = maschine;
  const produkt = wert(t, "Produkt");
  if (produkt) f.produkt = produkt;
  const meldung = wert(t, "Meldung");
  if (meldung) f.beschreibung = meldung;
  const von = wert(t, "Gemeldet von");
  if (von) f.entdecktDurch = von;

  const dm = /Datum\s*:\s*(\d{1,2}\.\d{1,2}\.\d{4})/i.exec(t);
  const iso = dm?.[1] ? deutschZuIso(dm[1]) : null;
  if (iso) f.datum = iso;
  else hinweise.push("Kein Datum gefunden");
  const um = /Uhrzeit\s*:\s*(\d{1,2}):(\d{2})/i.exec(t);
  if (um) f.uhrzeit = `${um[1]!.padStart(2, "0")}:${um[2]}`;

  const auftrag = /\bA\d-\d{4}-\d{4}\b/.exec(t)?.[0];
  if (auftrag && AUFTRAG_RE.test(auftrag)) f.auftrag = auftrag;
  else hinweise.push("Kein Auftrag im Format A3-2026-0412 gefunden");
  const charge = /\bNW-\d{6}-L\d[A-Z]\b/.exec(t)?.[0];
  if (charge && CHARGE_RE.test(charge)) f.charge = charge;
  else hinweise.push("Keine Charge im Format NW-261026-L3A gefunden");

  const menge = wert(t, "Menge");
  if (menge) {
    const n = Number(menge.replace(/\./g, "").replace(/[^\d]/g, ""));
    if (Number.isFinite(n) && menge.match(/\d/)) f.menge = n;
  }
  if (Object.keys(f).length === 0) hinweise.unshift("Keine bekannten Felder erkannt");
  return { felder: f, hinweise };
}
