import assert from "node:assert";
import { describe, it } from "node:test";

import { _internal } from "./rates.ts";

describe("rates helpers", () => {
  it("merges series and computes moving average", () => {
    const aave = new Map<string, number>([
      ["2024-01-01", 5],
      ["2024-01-02", 7],
      ["2024-01-03", 9],
    ]);
    const crv = new Map<string, number>([
      ["2024-01-02", 4],
      ["2024-01-03", 6],
    ]);
    const merged = _internal.mergeSeries(aave, crv);
    assert.strictEqual(merged.length, 3);
    const withMa = _internal.computeMovingAverage(merged, 2);
    assert.strictEqual(withMa[1].aaveMa, 6);
    assert.strictEqual(withMa[2].crvusdMa, 5);
  });

  it("parses csv content", () => {
    const content = `date,aaveBorrow,crvusdAvg
2024-01-01,5.5,4.4
2024-01-02,6.5,5.4
`;
    const [aave, crv] = _internal.normaliseCsvContent(content);
    assert.strictEqual(aave.get("2024-01-01"), 5.5);
    assert.strictEqual(crv.get("2024-01-02"), 5.4);
  });

  it("detects staleness after 24h", () => {
    const recent = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const old = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(_internal.isStale(recent), false);
    assert.strictEqual(_internal.isStale(old), true);
  });
});
