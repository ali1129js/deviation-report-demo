#!/usr/bin/env node
// Erzeugt public/beispiel-protokoll.pdf (fiktiv) aus src/lib/import/beispiel.ts. Nur ASCII-Text.
import fs from "node:fs";
const src = fs.readFileSync(
  new URL("../src/lib/import/beispiel.ts", import.meta.url),
  "utf8"
);
const lines = [...src.matchAll(/^\s*"(.*)",$/gm)].map((m) => m[1]);
const esc = (s) => s.replace(/[\\()]/g, (c) => "\\" + c);
const body = [
  "BT",
  "/F1 11 Tf",
  "14 TL",
  "56 780 Td",
  ...lines.map((l) => `(${esc(l)}) Tj T*`),
  "ET",
].join("\n");
const objs = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
  `<< /Length ${body.length} >>\nstream\n${body}\nendstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
];
let out = "%PDF-1.4\n";
const offs = [];
objs.forEach((o, i) => {
  offs.push(out.length);
  out += `${i + 1} 0 obj\n${o}\nendobj\n`;
});
const x = out.length;
out +=
  `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` +
  offs.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
fs.writeFileSync(
  new URL("../public/beispiel-protokoll.pdf", import.meta.url),
  out,
  "latin1"
);
console.log("public/beispiel-protokoll.pdf geschrieben");
