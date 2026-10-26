import { z } from "zod";

/** Fiktive Formate der Demo (Northwind Snacks). */
export const AUFTRAG_RE = /^A\d-\d{4}-\d{4}$/; // z. B. A3-2026-0412
export const CHARGE_RE = /^NW-\d{6}-L\d[A-Z]$/; // z. B. NW-261026-L3A
export const NUMMER_RE = /^DR-\d{4}-\d{4}$/; // Berichtsnummer

export const RISIKEN = ["gering", "mittel", "hoch"] as const;
export const KATEGORIEN = [
  "Mensch",
  "Maschine",
  "Material",
  "Methode",
  "Umfeld",
  "noch unklar",
] as const;
export const LINIEN = ["Linie 3"] as const;
export const BEREICHE = [
  "Bereich A – Schlauchbeutel",
  "Bereich B – Karton/Palette",
] as const;
export const MASCHINEN = [
  "Riegelzuführung",
  "Schlauchbeutelmaschine",
  "Kontrollwaage",
  "Metalldetektor",
  "Kartonierer",
  "Palettierer",
] as const;

const optText = z.string().trim().max(2000).default("");
const isoDatum = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum fehlt");
const uhrzeit = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Uhrzeit fehlt");

export const unterschriftSchema = z.object({
  name: z.string().trim().max(80).default(""),
  zeit: z.string().default(""), // ISO-Zeitstempel, leer = nicht unterschrieben
});
export type Unterschrift = z.infer<typeof unterschriftSchema>;

/** Entwurfsdaten: alles darf leer sein, Formate werden erst beim Abschluss geprüft. */
export const berichtDatenSchema = z.object({
  titel: optText,
  beschreibung: optText,
  entdecktDurch: optText,
  linie: optText,
  bereich: optText,
  maschine: optText,
  datum: z.string().default(""),
  uhrzeit: z.string().default(""),
  auftrag: optText,
  charge: optText,
  produkt: optText,
  menge: z.number().int().nonnegative().nullable().default(null),
  risiko: z.enum(RISIKEN).nullable().default(null),
  ware_gesperrt: z.boolean().default(false),
  auswirkung: optText,
  sofortmassnahme: optText,
  ursacheKategorie: z.enum(KATEGORIEN).nullable().default(null),
  ursache: optText,
  ersteller: unterschriftSchema.default({}),
  pruefer: unterschriftSchema.default({}),
});
export type BerichtDaten = z.infer<typeof berichtDatenSchema>;

/** Strenge Prüfung für den Abschluss. */
export const abschlussSchema = berichtDatenSchema.extend({
  titel: z.string().trim().min(3, "Kurztitel fehlt"),
  beschreibung: z.string().trim().min(10, "Beschreibung zu kurz (min. 10 Zeichen)"),
  linie: z.string().trim().min(1, "Linie fehlt"),
  maschine: z.string().trim().min(1, "Maschine fehlt"),
  datum: isoDatum,
  uhrzeit: uhrzeit,
  auftrag: z.string().regex(AUFTRAG_RE, "Auftrag im Format A3-2026-0412"),
  charge: z.string().regex(CHARGE_RE, "Charge im Format NW-261026-L3A"),
  risiko: z.enum(RISIKEN, { errorMap: () => ({ message: "Risiko wählen" }) }),
  sofortmassnahme: z.string().trim().min(5, "Sofortmaßnahme fehlt"),
  ursacheKategorie: z.enum(KATEGORIEN, {
    errorMap: () => ({ message: "Ursachen-Kategorie wählen" }),
  }),
});

export const STATUS = ["entwurf", "abgeschlossen"] as const;
export const berichtSchema = z.object({
  id: z.string().min(1),
  nummer: z.string().regex(NUMMER_RE),
  status: z.enum(STATUS),
  erstellt: z.string(),
  geaendert: z.string(),
  daten: berichtDatenSchema,
});
export type Bericht = z.infer<typeof berichtSchema>;

export const leereDaten = (): BerichtDaten => berichtDatenSchema.parse({});
