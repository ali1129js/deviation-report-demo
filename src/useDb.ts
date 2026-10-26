import { useCallback, useState } from "react";
import { lade, leereDatenbank, speichere, type Datenbank } from "./lib/storage";

export function useDb() {
  const [start] = useState(() => lade(window.localStorage));
  const [db, setDb] = useState<Datenbank>(start.ok ? start.db : leereDatenbank());
  const [fehler, setFehler] = useState<string | null>(
    start.ok
      ? null
      : `${start.meldung} Rohdaten gesichert unter: ${start.backupKey ?? "(Sicherung fehlgeschlagen)"}`
  );
  const aendern = useCallback((f: (db: Datenbank) => Datenbank) => {
    setDb((alt) => {
      try {
        const neu = f(alt);
        speichere(window.localStorage, neu);
        setFehler(null);
        return neu;
      } catch (e) {
        setFehler(e instanceof Error ? e.message : String(e));
        return alt;
      }
    });
  }, []);
  return { db, aendern, fehler, setFehler };
}
