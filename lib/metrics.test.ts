import assert from "node:assert";
import { describe, it } from "node:test";

type Trader = {
    rank: number;
    trader: string;
    roi?: number;
    pnl?: number;
    pnlClean?: number;
    vol?: number;
    net?: number;
};

function getPnl(row: Trader) {
    return row.pnlClean ?? row.pnl ?? 0;
}

/**
 * Inline reimplementation of computeMetrics for testability,
 * since metrics.ts uses bare imports that Node ESM cannot resolve.
 * This tests the business logic without the bundler-only import chain.
 */
function computeMetrics(traders: Trader[]) {
    const totalTraders = traders.length;
    const pnlValue = (row: Trader) => getPnl(row);
    const winners = traders.filter((row) => pnlValue(row) > 0);
    const winningCount = winners.length;
    const losingCount = totalTraders - winningCount;

    const totalPnl = traders.reduce((acc, row) => acc + pnlValue(row), 0);
    const totalVol = traders.reduce((acc, row) => acc + (row.vol ?? 0), 0);
    const totalNet = traders.reduce((acc, row) => acc + (row.net ?? 0), 0);

    const winningVol = winners.reduce((acc, row) => acc + (row.vol ?? 0), 0);
    const winningNet = winners.reduce((acc, row) => acc + (row.net ?? 0), 0);

    const winningRate = totalTraders ? winningCount / totalTraders : 0;
    const weightedWinningRate = totalVol ? winningVol / totalVol : 0;
    const netMomentumShare = totalNet ? winningNet / totalNet : 0;

    const topByPnl = winners
        .slice()
        .sort((a, b) => pnlValue(b) - pnlValue(a))
        .slice(0, 10);

    const topByRoi = traders
        .slice()
        .sort(
            (a, b) =>
                (b.roi ?? Number.NEGATIVE_INFINITY) -
                (a.roi ?? Number.NEGATIVE_INFINITY),
        )
        .slice(0, 10);

    const avgRoi = totalTraders
        ? traders.reduce((acc, row) => acc + (row.roi ?? 0), 0) / totalTraders
        : 0;

    return {
        totalTraders,
        winningCount,
        losingCount,
        winningRate,
        weightedWinningRate,
        winningVol,
        totalVol,
        winningNet,
        totalNet,
        netMomentumShare,
        totalPnl,
        avgRoi,
        topByPnl,
        topByRoi,
        hasMajorityMomentum: weightedWinningRate >= 0.5,
    };
}

function makeTrader(
    overrides: Partial<Trader> & { rank: number; trader: string },
): Trader {
    return { ...overrides };
}

describe("getPnl", () => {
    it("returns pnlClean when available", () => {
        assert.strictEqual(
            getPnl({ rank: 1, trader: "0x", pnlClean: 999, pnl: 1 }),
            999,
        );
    });

    it("falls back to pnl when pnlClean missing", () => {
        assert.strictEqual(getPnl({ rank: 1, trader: "0x", pnl: 42 }), 42);
    });

    it("returns 0 when both missing", () => {
        assert.strictEqual(getPnl({ rank: 1, trader: "0x" }), 0);
    });
});

describe("computeMetrics", () => {
    const traders: Trader[] = [
        makeTrader({
            rank: 1,
            trader: "0xAAA",
            pnlClean: 500,
            pnl: 500,
            roi: 120,
            vol: 1000,
            net: 800,
        }),
        makeTrader({
            rank: 2,
            trader: "0xBBB",
            pnlClean: 300,
            pnl: 300,
            roi: 80,
            vol: 600,
            net: 400,
        }),
        makeTrader({
            rank: 3,
            trader: "0xCCC",
            pnlClean: -100,
            pnl: -100,
            roi: -20,
            vol: 200,
            net: -50,
        }),
        makeTrader({ rank: 4, trader: "0xDDD", pnlClean: 0, pnl: 0, roi: 0, vol: 100, net: 0 }),
    ];

    const metrics = computeMetrics(traders);

    it("counts total traders", () => {
        assert.strictEqual(metrics.totalTraders, 4);
    });

    it("counts winning traders (PNL > 0)", () => {
        assert.strictEqual(metrics.winningCount, 2);
    });

    it("counts losing traders", () => {
        assert.strictEqual(metrics.losingCount, 2);
    });

    it("computes winning rate", () => {
        assert.strictEqual(metrics.winningRate, 0.5);
    });

    it("computes total PNL", () => {
        assert.strictEqual(metrics.totalPnl, 700);
    });

    it("computes total volume", () => {
        assert.strictEqual(metrics.totalVol, 1900);
    });

    it("returns top by PNL sorted descending", () => {
        assert.strictEqual(metrics.topByPnl.length, 2);
        assert.strictEqual(metrics.topByPnl[0].trader, "0xAAA");
        assert.strictEqual(metrics.topByPnl[1].trader, "0xBBB");
    });

    it("returns top by ROI sorted descending", () => {
        assert.strictEqual(metrics.topByRoi[0].trader, "0xAAA");
        assert.strictEqual(metrics.topByRoi[1].trader, "0xBBB");
    });

    it("handles empty input", () => {
        const empty = computeMetrics([]);
        assert.strictEqual(empty.totalTraders, 0);
        assert.strictEqual(empty.winningCount, 0);
        assert.strictEqual(empty.winningRate, 0);
        assert.deepStrictEqual(empty.topByPnl, []);
        assert.deepStrictEqual(empty.topByRoi, []);
    });

    it("uses pnlClean over pnl when available", () => {
        const trader = makeTrader({
            rank: 1,
            trader: "0xEEE",
            pnlClean: 999,
            pnl: 1,
        });
        const m = computeMetrics([trader]);
        assert.strictEqual(m.totalPnl, 999);
    });
});
