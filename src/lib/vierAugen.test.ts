import { normName, pruefeVierAugen } from "./vierAugen";
import { pruefeAbschluss } from "./validierung";
import { gueltigeDaten } from "../test/testdaten";

const u = (name: string) => ({ name, zeit: name ? "2026-10-26T09:00:00.000Z" : "" });

describe("4-Augen-Prinzip", () => {
  it("zwei verschiedene Personen sind ok", () => {
    expect(
      pruefeVierAugen({ ersteller: u("Tilda Morgenstern"), pruefer: u("Lasse Brückner") })
    ).toEqual([]);
  });
  it("gleiche Person (auch anders geschrieben) wird abgelehnt", () => {
    expect(
      pruefeVierAugen({
        ersteller: u("Lasse Brückner"),
        pruefer: u("  lasse  BRUECKNER "),
      })
    ).toEqual(["gleiche_person"]);
  });
  it("fehlende Unterschriften", () => {
    expect(pruefeVierAugen({ ersteller: u(""), pruefer: u("") })).toEqual([
      "ersteller_fehlt",
      "pruefer_fehlt",
    ]);
    expect(
      pruefeVierAugen({ ersteller: { name: "A", zeit: "" }, pruefer: u("B") })
    ).toEqual(["ersteller_fehlt"]);
  });
  it("normName", () => {
    expect(normName("Ökan  Feldberg")).toBe("oekan feldberg");
  });
  it("Abschlussprüfung: hohes Risiko verlangt Sperre", () => {
    expect(pruefeAbschluss(gueltigeDaten())).toEqual([]);
    const p = pruefeAbschluss({
      ...gueltigeDaten(),
      risiko: "hoch",
      ware_gesperrt: false,
    });
    expect(p.map((x) => x.feld)).toEqual(["ware_gesperrt"]);
  });
});
