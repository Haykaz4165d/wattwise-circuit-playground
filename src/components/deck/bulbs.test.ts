import { describe, expect, it } from "vitest";
import { solveCircuit } from "./slides-e";

describe("circuit lab (12 V, 6 Ω bulbs)", () => {
  it("series of 2: R=12 Ω, I=1 A, each bulb 6 V", () => {
    const c = solveCircuit("series", [false, false]);
    expect(c.r).toBe(12); expect(c.i).toBe(1); expect(c.bulbs[0]!.u).toBe(6);
  });
  it("series: one removed bulb stops the current", () => {
    expect(solveCircuit("series", [false, true, false]).i).toBe(0);
  });
  it("parallel of 3: each bulb 2 A, total 6 A", () => {
    const c = solveCircuit("parallel", [false, false, false]);
    expect(c.i).toBe(6); expect(c.bulbs[2]!.i).toBe(2);
  });
  it("mixed 3: R=9 Ω, first bulb 8 V, others 4 V", () => {
    const c = solveCircuit("mixed", [false, false, false]);
    expect(c.r).toBe(9); expect(c.bulbs[0]!.u).toBeCloseTo(8); expect(c.bulbs[1]!.u).toBeCloseTo(4);
  });
  it("mixed: removing the series bulb turns everything off", () => {
    expect(solveCircuit("mixed", [true, false, false]).i).toBe(0);
  });
});
