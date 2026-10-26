import { deutschZuIso, heute, isoZuDeutsch, jetztUhrzeit } from "./date";

describe("date (Berlin statt UTC)", () => {
  it("nimmt kurz nach Mitternacht den Berliner Tag", () => {
    // 23:30 UTC am 25.10. = 00:30 Berlin (UTC+1) am 26.10.
    const d = new Date("2026-10-25T23:30:00Z");
    expect(heute(d)).toBe("2026-10-26");
    expect(jetztUhrzeit(d)).toBe("00:30");
  });
  it("konvertiert Formate", () => {
    expect(isoZuDeutsch("2026-10-26")).toBe("26.10.2026");
    expect(deutschZuIso("6.1.2026")).toBe("2026-01-06");
    expect(deutschZuIso("x")).toBeNull();
  });
});
