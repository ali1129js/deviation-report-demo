/** Minimaler Ausschnitt der pdf.js-API (injizierbar, damit testbar). */
export interface PdfSeite {
  getTextContent(): Promise<{ items: unknown[] }>;
}
export interface PdfDokument {
  numPages: number;
  getPage(n: number): Promise<PdfSeite>;
}
export interface PdfJsLib {
  getDocument(src: { data: Uint8Array }): { promise: Promise<PdfDokument> };
}

interface El {
  str: string;
  dir: number;
  entlang: number;
  quer: number;
}

/** Baut Textzeilen aus pdf.js-Items (auch bei gedrehten Seiten). */
export function zeilenAusItems(items: unknown[]): string[] {
  const el: El[] = [];
  for (const it of items) {
    if (!it || typeof it !== "object" || !("str" in it) || !("transform" in it)) continue;
    const { str, transform } = it as { str: string; transform: number[] };
    if (!str.trim()) continue;
    const [a = 1, b = 0, , , e = 0, f = 0] = transform;
    const dir = Math.round(Math.atan2(b, a) / (Math.PI / 2)) & 3;
    const cos = [1, 0, -1, 0][dir] ?? 1;
    const sin = [0, 1, 0, -1][dir] ?? 0;
    el.push({ str, dir, entlang: e * cos + f * sin, quer: -e * sin + f * cos });
  }
  el.sort((x, y) => x.dir - y.dir || y.quer - x.quer || x.entlang - y.entlang);
  const zeilen: El[][] = [];
  for (const e of el) {
    const letzte = zeilen[zeilen.length - 1];
    const ref = letzte?.[0];
    if (letzte && ref && ref.dir === e.dir && Math.abs(ref.quer - e.quer) < 3)
      letzte.push(e);
    else zeilen.push([e]);
  }
  return zeilen.map((z) =>
    z
      .sort((x, y) => x.entlang - y.entlang)
      .map((e) => e.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

export async function textAusPdf(daten: ArrayBuffer, pdfjs: PdfJsLib): Promise<string> {
  let doc: PdfDokument;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(daten) }).promise;
  } catch (e) {
    throw new Error(
      `Die PDF-Datei konnte nicht gelesen werden (${e instanceof Error ? e.message : String(e)}).`
    );
  }
  const seiten: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    seiten.push(zeilenAusItems(tc.items).join("\n"));
  }
  return seiten.join("\n");
}

/** pdf.js wird erst bei Bedarf geladen (eigener Chunk). */
export async function ladePdfJs(): Promise<PdfJsLib> {
  const [pdfjs, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs as unknown as PdfJsLib;
}
