import { describe, expect, it } from "vitest";
import { bulbLevels } from "./slides-e";

describe("bulb game", () => {
  it("series: one broken bulb turns all off", () => {
    expect(bulbLevels("series", [false, true, false])).toEqual([0, 0, 0]);
  });
  it("series: 2 identical bulbs each glow at 1/4", () => {
    expect(bulbLevels("series", [false, false])).toEqual([0.25, 0.25]);
  });
  it("parallel: others keep full brightness", () => {
    expect(bulbLevels("parallel", [false, true, false])).toEqual([1, 0, 1]);
  });
});
