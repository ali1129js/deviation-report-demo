import type { BerichtDaten } from "./schema";

/** Namen vergleichbar machen: Groß/Klein, Umlaute-Varianten, Leerzeichen. */
export function normName(n: string): string {
  return n
    .normalize("NFKC")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type VierAugenProblem = "ersteller_fehlt" | "pruefer_fehlt" | "gleiche_person";

export const VIER_AUGEN_TEXT: Record<VierAugenProblem, string> = {
  ersteller_fehlt: "Unterschrift Ersteller/in fehlt",
  pruefer_fehlt: "Unterschrift Prüfer/in fehlt",
  gleiche_person: "4-Augen-Prinzip: Prüfer/in muss eine andere Person sein",
};

export function pruefeVierAugen(
  d: Pick<BerichtDaten, "ersteller" | "pruefer">
): VierAugenProblem[] {
  const out: VierAugenProblem[] = [];
  const a = normName(d.ersteller.name);
  const b = normName(d.pruefer.name);
  if (!a || !d.ersteller.zeit) out.push("ersteller_fehlt");
  if (!b || !d.pruefer.zeit) out.push("pruefer_fehlt");
  if (a && b && a === b) out.push("gleiche_person");
  return out;
}
