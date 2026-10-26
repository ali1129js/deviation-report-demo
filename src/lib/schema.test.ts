import {
  abschlussSchema,
  AUFTRAG_RE,
  berichtDatenSchema,
  CHARGE_RE,
  leereDaten,
} from "./schema";
import { gueltigeDaten } from "../test/testdaten";

describe("schema", () => {
  it("leerer Entwurf ist gültig, Abschluss nicht", () => {
    expect(berichtDatenSchema.safeParse(leereDaten()).success).toBe(true);
    expect(abschlussSchema.safeParse(leereDaten()).success).toBe(false);
  });
  it("vollständige Daten bestehen den Abschluss", () => {
    expect(abschlussSchema.safeParse(gueltigeDaten()).success).toBe(true);
  });
  it("fiktive Formate", () => {
    expect(AUFTRAG_RE.test("A3-2026-0412")).toBe(true);
    expect(AUFTRAG_RE.test("3-2026-412")).toBe(false);
    expect(CHARGE_RE.test("NW-261026-L3A")).toBe(true);
    expect(CHARGE_RE.test("NW-2610-L3A")).toBe(false);
  });
  it("lehnt falsche Uhrzeit und Risiko ab", () => {
    expect(
      abschlussSchema.safeParse({ ...gueltigeDaten(), uhrzeit: "25:00" }).success
    ).toBe(false);
    expect(berichtDatenSchema.safeParse({ risiko: "extrem" }).success).toBe(false);
  });
});
