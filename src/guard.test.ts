import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GUARD = path.resolve(__dirname, "../scripts/leak-guard.mjs");
const h = (t: string) => crypto.createHash("sha256").update(t).digest("hex").slice(0, 16);

function lauf(dir: string, deny: string, stdin?: string, extra: string[] = []): number {
  try {
    execFileSync(
      "node",
      stdin === undefined
        ? [GUARD, dir, "--deny", deny, ...extra]
        : [GUARD, "--stdin", "--deny", deny],
      {
        input: stdin,
        stdio: ["pipe", "pipe", "pipe"],
      }
    );
    return 0;
  } catch (e) {
    return (e as { status: number }).status;
  }
}

describe("leak guard", () => {
  // Erfundener Testbegriff, nur gehasht in der Deny-Liste.
  const begriff = "zorbelwatt";
  let dir: string, deny: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "guard-"));
    deny = path.join(dir, "..", `deny-${path.basename(dir)}.txt`);
    fs.writeFileSync(
      deny,
      `h:${begriff.length}:${h(begriff)}\nhw:3:${h("qzx")}\nre:\\b\\d{8,}\\b\n`
    );
  });
  it("sauberes Verzeichnis besteht", () => {
    fs.writeFileSync(path.join(dir, "a.txt"), "Northwind Snacks Linie 3");
    expect(lauf(dir, deny)).toBe(0);
  });
  it("findet gehashten Begriff (Teilstring, beliebige Schreibweise)", () => {
    fs.writeFileSync(path.join(dir, "a.txt"), "xx ZorbelWatt-Anlage");
    expect(lauf(dir, deny)).toBe(1);
  });
  it("Wort-Hash nur als ganzes Wort", () => {
    fs.writeFileSync(path.join(dir, "a.txt"), "qzxy");
    expect(lauf(dir, deny)).toBe(0);
    fs.writeFileSync(path.join(dir, "a.txt"), "ein qzx hier");
    expect(lauf(dir, deny)).toBe(1);
  });
  it("Regex und verbotene Dateitypen", () => {
    fs.writeFileSync(path.join(dir, "a.txt"), "Nr " + "1234".repeat(3));
    expect(lauf(dir, deny)).toBe(1);
    fs.writeFileSync(path.join(dir, "a.txt"), "ok");
    fs.writeFileSync(path.join(dir, "bild.png"), "");
    expect(lauf(dir, deny)).toBe(1);
  });
  it("scannt Historie über stdin", () => {
    expect(lauf("", deny, "+ harmlos\n")).toBe(0);
    expect(lauf("", deny, "- zorbelwatt\n")).toBe(1);
  });
  it("echte Deny-Liste: Projekt ist sauber", () => {
    const root = path.resolve(__dirname, "..");
    expect(
      lauf(root, path.join(root, "scripts/deny-public.txt"), undefined, [
        "--exclude",
        "package-lock.json",
      ])
    ).toBe(0);
  });
});
