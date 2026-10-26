import { useState } from "react";
import { useDb } from "./useDb";
import { Liste } from "./components/Liste";
import { Editor } from "./components/Editor";
import { Druck } from "./components/Druck";
import { Import } from "./components/Import";
import { neuerBericht } from "./lib/storage";
import type { ImportFelder } from "./lib/import/parser";

export type Ansicht =
  | { art: "liste" }
  | { art: "import" }
  | { art: "editor"; id: string }
  | { art: "druck"; id: string };

export function App() {
  const { db, aendern, fehler, setFehler } = useDb();
  const [ansicht, setAnsicht] = useState<Ansicht>({ art: "liste" });

  const anlegen = (felder: ImportFelder = {}) => {
    const id = crypto.randomUUID();
    aendern((d) => neuerBericht(d, felder, new Date(), id).db);
    setAnsicht({ art: "editor", id });
  };
  const bericht =
    "id" in ansicht ? db.berichte.find((b) => b.id === ansicht.id) : undefined;

  return (
    <>
      <header className="kopf no-print">
        <button className="marke" onClick={() => setAnsicht({ art: "liste" })}>
          Deviation Report Demo
        </button>
        <nav>
          <button onClick={() => setAnsicht({ art: "liste" })}>Berichte</button>
          <button onClick={() => anlegen()}>+ Neuer Bericht</button>
          <button onClick={() => setAnsicht({ art: "import" })}>PDF-Import</button>
        </nav>
        <span className="demo-badge">Demo – fiktive Daten</span>
      </header>
      <main className="inhalt">
        {fehler && (
          <div className="card fehler no-print" role="alert">
            {fehler} <button onClick={() => setFehler(null)}>×</button>
          </div>
        )}
        {ansicht.art === "liste" && (
          <Liste db={db} aendern={aendern} oeffne={setAnsicht} />
        )}
        {ansicht.art === "import" && (
          <Import uebernehmen={anlegen} abbrechen={() => setAnsicht({ art: "liste" })} />
        )}
        {ansicht.art === "editor" &&
          (bericht ? (
            <Editor
              bericht={bericht}
              aendern={aendern}
              oeffne={setAnsicht}
              setFehler={setFehler}
            />
          ) : (
            <p>Bericht nicht gefunden.</p>
          ))}
        {ansicht.art === "druck" &&
          (bericht ? (
            <Druck
              bericht={bericht}
              zurueck={() => setAnsicht({ art: "editor", id: bericht.id })}
            />
          ) : (
            <p>Bericht nicht gefunden.</p>
          ))}
      </main>
    </>
  );
}
