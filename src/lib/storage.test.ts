import {
  aktualisiere,
  BACKUP_PREFIX,
  lade,
  leereDatenbank,
  loesche,
  neuerBericht,
  schliesseAb,
  speichere,
  SpeicherFehler,
  STORAGE_KEY,
  ValidierungsFehler,
  type KV,
} from "./storage";
import { gueltigeDaten } from "../test/testdaten";

const mapKV = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
};
const T = new Date("2026-10-26T08:00:00Z");

describe("storage", () => {
  it("leerer Speicher -> leere DB", () => {
    expect(lade(mapKV())).toEqual({ ok: true, db: leereDatenbank() });
  });
  it("Roundtrip und Nummernvergabe pro Jahr", () => {
    const kv = mapKV();
    let { db } = neuerBericht(leereDatenbank(), {}, T, "a");
    const r2 = neuerBericht(db, {}, T, "b");
    db = r2.db;
    expect(r2.bericht.nummer).toBe("DR-2026-0002");
    // Silvester 23:30 UTC ist in Berlin schon Neujahr
    const r3 = neuerBericht(db, {}, new Date("2026-12-31T23:30:00Z"), "c");
    expect(r3.bericht.nummer).toBe("DR-2027-0001");
    speichere(kv, r3.db);
    const l = lade(kv);
    expect(l.ok && l.db.berichte.length).toBe(3);
  });
  it("kaputtes JSON wird gesichert, nicht überschrieben", () => {
    const kv = mapKV();
    kv.setItem(STORAGE_KEY, "{kaputt");
    const r = lade(kv, T);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.art).toBe("json");
      expect(r.backupKey).toBe(BACKUP_PREFIX + T.toISOString());
      expect(kv.getItem(r.backupKey!)).toBe("{kaputt");
    }
  });
  it("Schemafehler wird erkannt und gesichert", () => {
    const kv = mapKV();
    kv.setItem(STORAGE_KEY, JSON.stringify({ version: 2 }));
    const r = lade(kv, T);
    expect(r.ok === false && r.art).toBe("schema");
    expect([...kv.m.keys()].some((k) => k.startsWith(BACKUP_PREFIX))).toBe(true);
  });
  it("Quota-Fehler wird zu SpeicherFehler", () => {
    const kv: KV = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(() => speichere(kv, leereDatenbank())).toThrow(SpeicherFehler);
  });
  it("Abschluss nur vollständig, danach schreibgeschützt; löschen", () => {
    let { db } = neuerBericht(leereDatenbank(), {}, T, "x");
    expect(() => schliesseAb(db, "x")).toThrow(ValidierungsFehler);
    db = aktualisiere(db, "x", gueltigeDaten(), T);
    db = schliesseAb(db, "x", T);
    expect(db.berichte[0]?.status).toBe("abgeschlossen");
    expect(() => aktualisiere(db, "x", gueltigeDaten())).toThrow(SpeicherFehler);
    expect(loesche(db, "x").berichte).toEqual([]);
  });
});
