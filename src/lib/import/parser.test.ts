import { parseProtokoll } from "./parser";
import { BEISPIEL_TEXT } from "./beispiel";
import { textAusPdf, zeilenAusItems, type PdfJsLib } from "./pdfText";

describe("Import-Parser", () => {
  it("liest das Beispielprotokoll", () => {
    const { felder, hinweise } = parseProtokoll(BEISPIEL_TEXT);
    expect(hinweise).toEqual([]);
    expect(felder).toMatchObject({
      linie: "Linie 3",
      bereich: "Bereich A – Schlauchbeutel",
      maschine: "Kontrollwaage",
      datum: "2026-10-26",
      uhrzeit: "09:42",
      auftrag: "A3-2026-0412",
      charge: "NW-261026-L3A",
      produkt: "Hafer-Knusper 6er",
      menge: 240,
      entdecktDurch: "Tilda Morgenstern",
    });
  });
  it("toleriert Gedankenstriche und einstellige Uhrzeit", () => {
    const f = parseProtokoll(
      "Datum: 6.1.2026 Uhrzeit: 7:05\nAuftrag: A3\u20132026\u20130413"
    ).felder;
    expect(f).toMatchObject({
      datum: "2026-01-06",
      uhrzeit: "07:05",
      auftrag: "A3-2026-0413",
    });
  });
  it("meldet Hinweise bei unbekanntem Text", () => {
    const r = parseProtokoll("Hallo Welt");
    expect(r.felder).toEqual({});
    expect(r.hinweise[0]).toBe("Keine bekannten Felder erkannt");
  });
  it("baut Zeilen aus pdf.js-Items", () => {
    const it = (str: string, x: number, y: number) => ({
      str,
      transform: [1, 0, 0, 1, x, y],
    });
    expect(
      zeilenAusItems([
        it("Charge:", 10, 700),
        it("Linie 3", 60, 720),
        it("Linie:", 10, 720.5),
        it("NW-261026-L3A", 60, 700),
      ])
    ).toEqual(["Linie: Linie 3", "Charge: NW-261026-L3A"]);
  });
  it("textAusPdf mit injiziertem pdf.js, Fehler lesbar", async () => {
    const lib: PdfJsLib = {
      getDocument: () => ({
        promise: Promise.resolve({
          numPages: 1,
          getPage: async () => ({
            getTextContent: async () => ({
              items: [{ str: "Linie: Linie 3", transform: [1, 0, 0, 1, 0, 0] }],
            }),
          }),
        }),
      }),
    };
    expect(await textAusPdf(new ArrayBuffer(1), lib)).toBe("Linie: Linie 3");
    const kaputt: PdfJsLib = {
      getDocument: () => ({ promise: Promise.reject(new Error("bad")) }),
    };
    await expect(textAusPdf(new ArrayBuffer(1), kaputt)).rejects.toThrow(/nicht gelesen/);
  });
});
