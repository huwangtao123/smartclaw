import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { buildOpenApiDocument } from "./openapi.ts";

describe("OpenAPI spec", () => {
    const doc = buildOpenApiDocument() as Record<string, unknown>;

    it("uses OpenAPI 3.1", () => {
        assert.strictEqual(doc.openapi, "3.1.0");
    });

    it("has correct version", () => {
        const info = doc.info as Record<string, string>;
        assert.strictEqual(info.version, "2.0.0");
    });

    it("has externalDocs pointing to llms.txt", () => {
        const ext = doc.externalDocs as Record<string, string>;
        assert.strictEqual(ext.url, "/llms.txt");
    });

    it("includes all expected paths", () => {
        const paths = doc.paths as Record<string, unknown>;
        const expected = [
            "/api/top-pnl",
            "/api/fx/top-pnl",
            "/api/fx/fxusd-rate",
            "/api/fx/status",
            "/api/premium",
            "/api/rates",
            "/api/openapi",
        ];
        for (const p of expected) {
            assert.ok(paths[p], `missing path: ${p}`);
        }
    });

    it("every endpoint has an operationId", () => {
        const paths = doc.paths as Record<
            string,
            Record<string, Record<string, unknown>>
        >;
        for (const [pathKey, methods] of Object.entries(paths)) {
            for (const [method, operation] of Object.entries(methods)) {
                assert.ok(
                    operation.operationId,
                    `${method.toUpperCase()} ${pathKey} missing operationId`,
                );
            }
        }
    });

    it("has expected operationIds", () => {
        const paths = doc.paths as Record<
            string,
            Record<string, Record<string, string>>
        >;
        const ids = Object.values(paths).flatMap((methods) =>
            Object.values(methods).map((op) => op.operationId),
        );
        const expected = [
            "getTopPnl",
            "getFxTopPnl",
            "getFxStatus",
            "getFxFxusdRate",
            "getRates",
            "getPremiumMetrics",
            "getOpenApiSpec",
        ];
        for (const id of expected) {
            assert.ok(ids.includes(id), `missing operationId: ${id}`);
        }
    });

    it("marks GET endpoints as non-consequential", () => {
        const paths = doc.paths as Record<
            string,
            Record<string, Record<string, unknown>>
        >;
        for (const [pathKey, methods] of Object.entries(paths)) {
            if (methods.get) {
                assert.strictEqual(
                    methods.get["x-openai-isConsequential"],
                    false,
                    `GET ${pathKey} should be non-consequential`,
                );
            }
        }
    });

    it("premium description mentions fxUSD and USDC pricing", () => {
        const paths = doc.paths as Record<
            string,
            Record<string, Record<string, unknown>>
        >;
        const premium = paths["/api/premium"].get;
        const description = premium.description as string;
        assert.ok(description.includes("fxUSD"), "premium description should mention fxUSD");
        assert.ok(description.includes("USDC"), "premium description should mention USDC");
    });

    it("has expected tags", () => {
        const tags = doc.tags as Array<Record<string, string>>;
        const names = tags.map((t) => t.name);
        assert.ok(names.includes("Global"));
        assert.ok(names.includes("f(x) Protocol"));
        assert.ok(names.includes("Rates"));
        assert.ok(names.includes("Premium"));
        assert.ok(names.includes("Discovery"));
    });

    it("defines required component schemas", () => {
        const components = doc.components as Record<
            string,
            Record<string, unknown>
        >;
        const schemas = components.schemas as Record<string, unknown>;
        const expected = [
            "Trader",
            "TopPnlResponse",
            "PremiumMetricsResponse",
            "FxUsdRate",
            "FxUsdRateResponse",
            "ErrorResponse",
        ];
        for (const s of expected) {
            assert.ok(schemas[s], `missing schema: ${s}`);
        }
    });

    it("premium endpoint requires PremiumAccessCookie security", () => {
        const paths = doc.paths as Record<
            string,
            Record<string, Record<string, unknown>>
        >;
        const premium = paths["/api/premium"].get;
        const security = premium.security as Array<Record<string, unknown>>;
        assert.ok(security.length > 0);
        assert.ok("PremiumAccessCookie" in security[0]);
    });
});
