import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const publicDir = path.join(import.meta.dirname, "..", "public");

describe("llms.txt", () => {
    const content = readFileSync(path.join(publicDir, "llms.txt"), "utf8");

    it("starts with a title", () => {
        assert.ok(content.startsWith("# "));
    });

    it("mentions all protocol-specific endpoints", () => {
        assert.ok(content.includes("/api/fx/fxusd-rate"));
        assert.ok(content.includes("/api/fx/top-pnl"));
        assert.ok(content.includes("/api/rates"));
    });

    it("mentions global aggregate endpoint", () => {
        assert.ok(content.includes("GET /api/top-pnl"));
    });

    it("mentions premium endpoint", () => {
        assert.ok(content.includes("/api/premium"));
    });

    it("references the OpenAPI spec", () => {
        assert.ok(content.includes("/api/openapi"));
    });

    it("mentions x402 payment", () => {
        assert.ok(content.toLowerCase().includes("x402"));
    });

    it("mentions fxUSD pricing at $0.01", () => {
        assert.ok(content.includes("fxUSD"), "llms.txt should mention fxUSD");
        assert.ok(content.includes("$0.01"), "llms.txt should mention $0.01 fxUSD price");
    });

    it("has policy section", () => {
        assert.ok(content.includes("## Policy"));
    });

    it("has allowed URLs section", () => {
        assert.ok(content.includes("## Allowed URLs"));
    });

    it("references RSS feed", () => {
        assert.ok(content.includes("/feed.xml"));
    });
});

describe("ai-plugin.json", () => {
    const raw = readFileSync(
        path.join(publicDir, ".well-known", "ai-plugin.json"),
        "utf8",
    );
    const plugin = JSON.parse(raw);

    it("has schema_version v1", () => {
        assert.strictEqual(plugin.schema_version, "v1");
    });

    it("has name_for_human and name_for_model", () => {
        assert.ok(plugin.name_for_human);
        assert.ok(plugin.name_for_model);
    });

    it("uses smartclaw branding", () => {
        assert.strictEqual(plugin.name_for_model, "smartclaw");
    });

    it("has descriptions for both human and model", () => {
        assert.ok(plugin.description_for_human.length > 10);
        assert.ok(plugin.description_for_model.length > 10);
    });

    it("model description mentions operationIds", () => {
        assert.ok(plugin.description_for_model.includes("getTopPnl"));
        assert.ok(plugin.description_for_model.includes("getFxTopPnl"));
        assert.ok(plugin.description_for_model.includes("getRates"));
    });

    it("has auth type", () => {
        assert.ok(plugin.auth);
        assert.strictEqual(plugin.auth.type, "none");
    });

    it("points API to openapi endpoint", () => {
        assert.strictEqual(plugin.api.type, "openapi");
        assert.strictEqual(plugin.api.url, "/api/openapi");
    });

    it("has logo_url", () => {
        assert.ok(plugin.logo_url);
    });
});

describe("agents.json", () => {
    const raw = readFileSync(path.join(publicDir, "agents.json"), "utf8");
    const agents = JSON.parse(raw);

    it("has a name and description", () => {
        assert.ok(agents.name);
        assert.ok(agents.description.length > 10);
    });

    it("uses smartclaw branding", () => {
        assert.strictEqual(agents.name, "smartclaw");
    });

    it("has version", () => {
        assert.ok(agents.version);
    });

    it("has capabilities array", () => {
        assert.ok(Array.isArray(agents.capabilities));
        assert.ok(agents.capabilities.length >= 6);
    });

    it("capabilities have required fields", () => {
        for (const cap of agents.capabilities) {
            assert.ok(cap.id, "capability missing id");
            assert.ok(cap.description, `${cap.id} missing description`);
            assert.ok(cap.method, `${cap.id} missing method`);
            assert.ok(cap.path, `${cap.id} missing path`);
            assert.ok(cap.auth !== undefined, `${cap.id} missing auth`);
        }
    });

    it("has expected capability ids", () => {
        const ids = agents.capabilities.map(
            (c: Record<string, string>) => c.id,
        );
        assert.ok(ids.includes("getTopPnl"));
        assert.ok(ids.includes("getFxTopPnl"));
        assert.ok(ids.includes("getFxStatus"));
        assert.ok(ids.includes("getFxFxusdRate"));
        assert.ok(ids.includes("getRates"));
        assert.ok(ids.includes("getPremiumMetrics"));
    });

    it("premium capability requires x402 auth", () => {
        const premium = agents.capabilities.find(
            (c: Record<string, string>) => c.id === "getPremiumMetrics",
        );
        assert.strictEqual(premium.auth, "x402_cookie");
    });

    it("public capabilities require no auth", () => {
        const publicCaps = agents.capabilities.filter(
            (c: Record<string, string>) => c.id !== "getPremiumMetrics",
        );
        for (const cap of publicCaps) {
            assert.strictEqual(cap.auth, "none", `${cap.id} should have auth=none`);
        }
    });

    it("has auth_schemes defined", () => {
        assert.ok(agents.auth_schemes);
        assert.ok(agents.auth_schemes.none);
        assert.ok(agents.auth_schemes.x402_cookie);
    });

    it("x402 auth mentions fxUSD pricing", () => {
        const desc = agents.auth_schemes.x402_cookie.description;
        assert.ok(desc.includes("fxUSD"), "x402 auth should mention fxUSD");
        assert.ok(desc.includes("$0.01"), "x402 auth should mention $0.01 fxUSD price");
    });
});
