import { abschlussSchema, type BerichtDaten } from "./schema";
import { pruefeVierAugen, VIER_AUGEN_TEXT } from "./vierAugen";

export interface Problem {
  feld: string;
  text: string;
}

export function pruefeAbschluss(d: BerichtDaten): Problem[] {
  const out: Problem[] = [];
  const r = abschlussSchema.safeParse(d);
  if (!r.success)
    for (const i of r.error.issues)
      out.push({ feld: String(i.path[0] ?? ""), text: i.message });
  if (d.risiko === "hoch" && !d.ware_gesperrt)
    out.push({
      feld: "ware_gesperrt",
      text: "Bei hohem Risiko muss die Ware gesperrt sein",
    });
  for (const p of pruefeVierAugen(d))
    out.push({
      feld: p === "ersteller_fehlt" ? "ersteller" : "pruefer",
      text: VIER_AUGEN_TEXT[p],
    });
  return out;
}
