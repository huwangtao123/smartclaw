type HttpMethod = "get" | "post";

type EndpointDefinition = {
  path: string;
  method: HttpMethod;
  operation: Record<string, unknown>;
};

type Components = {
  responses: Record<string, unknown>;
  schemas: Record<string, unknown>;
  securitySchemes: Record<string, unknown>;
};

function buildServers() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "https://example.com";

  return [
    {
      url: configured,
      description: configured.includes("example.com")
        ? "Replace with the deployed host address"
        : "Primary deployment",
    },
  ];
}

const traderSchema = {
  type: "object",
  description:
    "Smart wallet entry from a protocol leaderboard. Currently sourced from f(x) Protocol.",
  properties: {
    trader: {
      type: "string",
      description: "Wallet address for the trader.",
      example: "0x277C54A2907cCF7B9Af66104377694A624B3F6F3",
    },
    roi: {
      type: ["number", "null"],
      description: "Return on investment percentage.",
      example: 724.0,
    },
    pnl: {
      type: ["number", "null"],
      description: "Reported PNL value.",
      example: 4763.45,
    },
    pnlClean: {
      type: ["number", "null"],
      description: "Cleaned PNL used for ranking.",
      example: 4763.45,
    },
    vol: {
      type: ["number", "null"],
      description: "Total traded volume for the period.",
      example: 11529.6,
    },
    net: {
      type: ["number", "null"],
      description: "Net capital flow.",
      example: 10234.12,
    },
  },
  required: ["trader", "roi", "pnl", "pnlClean", "vol", "net"],
  additionalProperties: false,
};

const components: Components = {
  schemas: {
    Trader: traderSchema,
    TopPnlResponse: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            $ref: "#/components/schemas/Trader",
          },
        },
        meta: {
          type: "object",
          properties: {
            protocol: {
              type: "string",
              description:
                "Protocol identifier (e.g. 'fx'). Present on protocol-specific endpoints.",
              example: "fx",
            },
            protocols: {
              type: "array",
              description:
                "List of protocols included in the aggregate response.",
              items: { type: "string" },
              example: ["fx"],
            },
            limit: {
              type: "integer",
              description: "Requested result limit.",
              example: 10,
            },
            total: {
              type: "integer",
              description: "Total number of qualifying traders in the dataset.",
              example: 1327,
            },
            generatedAt: {
              type: "string",
              format: "date-time",
              description: "Server timestamp when the response was generated.",
            },
          },
          required: ["limit", "total", "generatedAt"],
          additionalProperties: false,
        },
      },
      required: ["data", "meta"],
      additionalProperties: false,
    },
    PremiumMetricsResponse: {
      type: "object",
      properties: {
        x402Version: {
          type: "integer",
          description:
            "Version of the x402 payment configuration that granted access.",
          example: 1,
        },
        protocol: {
          type: "string",
          description: "Protocol identifier for this response.",
          example: "fx",
        },
        topByPnl: {
          type: "array",
          description:
            "Top performing traders by cleaned PNL (positive results only).",
          items: {
            $ref: "#/components/schemas/Trader",
          },
        },
        topByRoi: {
          type: "array",
          description: "Top performing traders by ROI.",
          items: {
            $ref: "#/components/schemas/Trader",
          },
        },
        generatedAt: {
          type: "string",
          format: "date-time",
          description: "Timestamp when the metrics snapshot was produced.",
        },
      },
      required: [
        "x402Version",
        "protocol",
        "topByPnl",
        "topByRoi",
        "generatedAt",
      ],
      additionalProperties: false,
    },
    FxUsdRate: {
      type: "object",
      description: "A single fxUSD rate data point.",
      properties: {
        date: {
          type: "string",
          format: "date",
          description: "UTC date of the rate recording.",
          example: "2025-07-24",
        },
        rate: {
          type: ["number", "null"],
          description: "fxUSD borrow APR percentage.",
          example: 4.949,
        },
      },
      required: ["date", "rate"],
      additionalProperties: false,
    },
    FxUsdRateResponse: {
      type: "object",
      properties: {
        latest: {
          $ref: "#/components/schemas/FxUsdRate",
        },
        series: {
          type: "array",
          description:
            "Historical data points, sorted from latest to earliest.",
          items: {
            $ref: "#/components/schemas/FxUsdRate",
          },
        },
        meta: {
          type: "object",
          properties: {
            protocol: {
              type: "string",
              description: "Protocol identifier.",
              example: "fx",
            },
            maWindow: {
              type: "integer",
              description:
                "The window size used for computing moving averages.",
              example: 30,
            },
            lastUpdated: {
              type: "string",
              format: "date-time",
              description: "Timestamp of the last data update.",
            },
            source: {
              type: "string",
              description: "Source of the data (primary or fallback).",
              example: "fallback",
            },
          },
          required: ["maWindow", "lastUpdated", "source"],
          additionalProperties: false,
        },
      },
      required: ["latest", "series", "meta"],
      additionalProperties: false,
    },
    ErrorResponse: {
      type: "object",
      properties: {
        error: {
          type: "string",
          description: "Human-readable message describing the error.",
          example: "Premium access required",
        },
        code: {
          type: "string",
          description: "Machine-friendly error code when available.",
          example: "UNAUTHORIZED",
        },
        status: {
          type: "integer",
          description: "HTTP status attached to the error response.",
          example: 401,
        },
        upgradeUrl: {
          type: "string",
          format: "uri",
          description: "Link explaining how to unlock premium access.",
          example: "https://example.com/premium",
        },
      },
      required: ["error"],
      additionalProperties: true,
    },
  },
  responses: {
    Unauthorized: {
      description: "Request lacks valid premium credentials.",
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/ErrorResponse",
          },
          example: {
            error: "Premium access required",
            code: "UNAUTHORIZED",
            status: 401,
            upgradeUrl: "https://example.com/premium",
          },
        },
      },
    },
    PaymentRequired: {
      description:
        "Premium payment is required before the requested resource can be accessed.",
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/ErrorResponse",
          },
          example: {
            error: "Premium payment required",
            status: 402,
            upgradeUrl: "https://example.com/premium",
          },
        },
      },
    },
    ServerError: {
      description: "Server error while preparing the dataset.",
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/ErrorResponse",
          },
          example: {
            error: "Failed to load top PNL data",
            status: 500,
          },
        },
      },
    },
    X402Proxy: {
      description:
        "Response proxied directly from the upstream x402 payment infrastructure.",
    },
  },
  securitySchemes: {
    PremiumAccessCookie: {
      type: "apiKey",
      in: "cookie",
      name: "smartclaw-premium-access",
      description:
        "Session cookie granted after a successful x402 checkout. Required for premium endpoints.",
    },
  },
};

const endpointDefinitions: EndpointDefinition[] = [
  /* ── Solana Intelligence ── */
  {
    path: "/api/solana/overview",
    method: "get",
    operation: {
      operationId: "getSolanaOverview",
      "x-openai-isConsequential": false,
      tags: ["Solana Smart Money"],
      summary: "Network status & activity overview",
      description: "Get current Solana network monitoring scale, active wallets, token coverage, and latest rotation shifts.",
      responses: {
        "200": { description: "Network status overview." }
      }
    }
  },
  {
    path: "/api/solana/smart-money",
    method: "get",
    operation: {
      operationId: "getSolanaSmartMoney",
      "x-openai-isConsequential": false,
      tags: ["Solana Smart Money"],
      summary: "Ranked conviction wallets",
      description: "Get high-priority ranked smart money wallets, signal strength, and recent behavior summaries on Solana.",
      parameters: [{
        name: "limit", in: "query", description: "Max wallets to return", required: false, schema: { type: "integer", default: 10 }
      }],
      responses: {
        "200": { description: "Ranked wallets list." }
      }
    }
  },
  {
    path: "/api/solana/token-flow",
    method: "get",
    operation: {
      operationId: "getSolanaTokenFlow",
      "x-openai-isConsequential": false,
      tags: ["Solana Smart Money"],
      summary: "Token capital flow",
      description: "Get smart money capital flow, participating addresses, and trend changes for a specific Solana token.",
      parameters: [{
        name: "symbolOrMint", in: "query", description: "Token symbol or mint address", required: false, schema: { type: "string" }
      }],
      responses: {
        "200": { description: "Token capital flow data." }
      }
    }
  },
  {
    path: "/api/solana/watchlist",
    method: "get",
    operation: {
      operationId: "getSolanaWatchlist",
      "x-openai-isConsequential": false,
      tags: ["Solana Smart Money"],
      summary: "Agent-ready watchlist",
      description: "Get an agent-ready watchlist of Solana tokens/wallets with conviction explanations, risk tags, and freshness.",
      parameters: [{
        name: "limit", in: "query", description: "Max items to return", required: false, schema: { type: "integer", default: 5 }
      }],
      responses: {
        "200": { description: "Agent-ready watchlist." }
      }
    }
  },
  {
    path: "/api/solana/explain",
    method: "get",
    operation: {
      operationId: "getSolanaExplain",
      "x-openai-isConsequential": false,
      tags: ["Solana Smart Money"],
      summary: "Behavior explanation",
      description: "Get a structured explanation of conviction or behavior for a specific Solana wallet, token, or narrative.",
      parameters: [
        { name: "subject", in: "query", description: "Entity type (wallet, token, narrative)", required: false, schema: { type: "string" } },
        { name: "id", in: "query", description: "Entity identifier", required: false, schema: { type: "string" } }
      ],
      responses: {
        "200": { description: "Contextual explanation." }
      }
    }
  },

  /* ── Global Aggregate ── */
  {
    path: "/api/top-pnl",
    method: "get",
    operation: {
      operationId: "getTopPnl",
      "x-openai-isConsequential": false,
      tags: ["Global"],
      summary: "Top PNL wallets (all protocols)",
      description:
        "Returns the highest PNL wallets aggregated across all integrated protocols. Each entry includes a 'protocol' field indicating the source. Currently includes f(x) Protocol; Perp DEX and Meme Coin integrations coming soon.",
      parameters: [
        {
          name: "limit",
          in: "query",
          description: "Maximum number of wallets to return (1-100).",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10,
          },
        },
      ],
      responses: {
        "200": {
          description: "Aggregated list of top PNL wallets across protocols.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TopPnlResponse",
              },
            },
          },
        },
        "500": {
          $ref: "#/components/responses/ServerError",
        },
      },
    },
  },

  /* ── f(x) Protocol ── */
  {
    path: "/api/fx/top-pnl",
    method: "get",
    operation: {
      operationId: "getFxTopPnl",
      "x-openai-isConsequential": false,
      tags: ["f(x) Protocol"],
      summary: "Top PNL wallets (f(x) Protocol)",
      description:
        "Returns the highest cleaned-PNL wallets from the f(x) Protocol leaderboard snapshot. Use this to identify top-performing traders within the f(x) Protocol for copy-trading analysis.",
      parameters: [
        {
          name: "limit",
          in: "query",
          description: "Maximum number of wallets to return (1-100).",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10,
          },
        },
      ],
      responses: {
        "200": {
          description: "List of top PNL wallets from f(x) Protocol.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/TopPnlResponse",
              },
            },
          },
        },
        "500": {
          $ref: "#/components/responses/ServerError",
        },
      },
    },
  },
  {
    path: "/api/fx/fxusd-rate",
    method: "get",
    operation: {
      operationId: "getFxFxusdRate",
      "x-openai-isConsequential": false,
      tags: ["f(x) Protocol"],
      summary: "fxUSD borrow rates",
      description:
        "Returns the latest and historical fxUSD borrow APR from f(x) Protocol funding windows. Use this to check the current borrow cost before opening a leveraged position or to track rate trends over time.",
      parameters: [
        {
          name: "maWindow",
          in: "query",
          description: "Moving average window size in days.",
          required: false,
          schema: {
            type: "integer",
            default: 30,
          },
        },
        {
          name: "limit",
          in: "query",
          description:
            "Number of historical data points to return (defaults to all).",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
          },
        },
      ],
      responses: {
        "200": {
          description: "The fxUSD rate data.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FxUsdRateResponse",
              },
            },
          },
        },
        "503": {
          description: "No rate data available.",
        },
        "500": {
          $ref: "#/components/responses/ServerError",
        },
      },
    },
  },
  {
    path: "/api/fx/status",
    method: "get",
    operation: {
      operationId: "getFxStatus",
      "x-openai-isConsequential": false,
      tags: ["f(x) Protocol"],
      summary: "f(x) Protocol status overview",
      description:
        "Returns a snapshot of the f(x) Protocol leaderboard status: tracked wallets, winners, win rates, total volume, PNL, average ROI, and momentum indicators.",
      responses: {
        "200": {
          description: "f(x) Protocol status overview.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  protocol: { type: "string", example: "fx" },
                  trackedWallets: { type: "integer", example: 1727 },
                  winners: { type: "integer", example: 440 },
                  losers: { type: "integer", example: 1287 },
                  winRate: { type: "number", example: 25.48 },
                  weightedWinRate: { type: "number", example: 35.5 },
                  totalVolume: { type: "number", example: 1200000000 },
                  totalPnl: { type: "number", example: 5000000 },
                  avgRoi: { type: "number", example: 12.5 },
                  netMomentumShare: { type: "number", example: 4.2 },
                  hasMajorityMomentum: { type: "boolean", example: false },
                  generatedAt: {
                    type: "string",
                    format: "date-time",
                  },
                },
                required: [
                  "protocol",
                  "trackedWallets",
                  "winners",
                  "losers",
                  "winRate",
                  "weightedWinRate",
                  "totalVolume",
                  "totalPnl",
                  "avgRoi",
                  "netMomentumShare",
                  "hasMajorityMomentum",
                  "generatedAt",
                ],
              },
            },
          },
        },
        "500": {
          $ref: "#/components/responses/ServerError",
        },
      },
    },
  },
  {
    path: "/api/premium",
    method: "get",
    operation: {
      operationId: "getPremiumMetrics",
      "x-openai-isConsequential": false,
      tags: ["Premium", "f(x) Protocol"],
      summary: "Premium f(x) Protocol leaderboard metrics",
      description:
        "Returns premium leaderboard insights for f(x) Protocol including top traders by PNL and ROI. Requires x402 payment ($0.01 fxUSD on Base network). Requests without a premium cookie receive a 402 payment required response.",
      security: [
        {
          PremiumAccessCookie: [],
        },
      ],
      responses: {
        "200": {
          description:
            "Premium f(x) Protocol leaderboard metrics for authenticated users.",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PremiumMetricsResponse",
              },
            },
          },
        },
        "401": {
          $ref: "#/components/responses/Unauthorized",
        },
        "402": {
          $ref: "#/components/responses/PaymentRequired",
        },
      },
    },
  },

  /* ── Rates (cross-protocol) ── */
  {
    path: "/api/rates",
    method: "get",
    operation: {
      operationId: "getRates",
      "x-openai-isConsequential": false,
      tags: ["Rates"],
      summary: "Cross-protocol lending rates",
      description:
        "Returns full lending rate data across Aave, CrvUSD, and fxUSD with optional moving averages. Use this to compare DeFi borrow rates across protocols and find the cheapest borrowing option.",
      parameters: [
        {
          name: "maWindow",
          in: "query",
          description: "Moving average window size in days.",
          required: false,
          schema: {
            type: "integer",
            default: 30,
          },
        },
        {
          name: "fallback",
          in: "query",
          description:
            "Path to a fallback CSV file when the primary data source is unavailable.",
          required: false,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        "200": {
          description: "Lending rate data across protocols.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                description:
                  "Rate comparison data including Aave, CrvUSD, and fxUSD borrow rates with moving averages.",
              },
            },
          },
        },
        "503": {
          description: "No rate data available.",
        },
        "500": {
          $ref: "#/components/responses/ServerError",
        },
      },
    },
  },

  /* ── Discovery ── */
  {
    path: "/api/openapi",
    method: "get",
    operation: {
      operationId: "getOpenApiSpec",
      "x-openai-isConsequential": false,
      tags: ["Discovery"],
      summary: "Current OpenAPI document",
      description:
        "Returns the OpenAPI 3.1 document describing every live API endpoint exposed by this deployment. Agents should read this first to understand available operations.",
      responses: {
        "200": {
          description: "OpenAPI document in JSON format.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                description: "OpenAPI 3.1 compliant document.",
              },
            },
          },
        },
      },
    },
  },
];

function buildPaths() {
  return endpointDefinitions.reduce<Record<string, Record<string, unknown>>>(
    (accumulator, definition) => {
      const existing = accumulator[definition.path] ?? {};
      accumulator[definition.path] = {
        ...existing,
        [definition.method]: definition.operation,
      };
      return accumulator;
    },
    {},
  );
}

export function buildOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Smartclaw Solana",
      version: "2.0.0",
      description:
        "Agent Intelligence Layer for discovering, ranking, and explaining smart money activity on Solana. Connects agents to high-signal token flows, conviction rankings, and risk tags without acting as an execution endpoint.",
    },
    externalDocs: {
      description: "AI-friendly summary of available capabilities",
      url: "/llms.txt",
    },
    servers: buildServers(),
    tags: [
      {
        name: "Solana Smart Money",
        description: "Agent-ready intelligence layer: wallet ranks, conviction explanations, and token flows.",
      },
      {
        name: "Global",
        description:
          "Aggregated endpoints that merge data across all integrated protocols.",
      },
      {
        name: "f(x) Protocol",
        description:
          "Endpoints sourced specifically from f(x) Protocol leaderboard data.",
      },
      {
        name: "Rates",
        description:
          "Cross-protocol lending rate comparison (fxUSD, Aave, crvUSD).",
      },
      {
        name: "Premium",
        description:
          "Endpoints gated behind an x402 paywall ($0.01 fxUSD on Base network). Requires explicit user consent before payment.",
      },
      {
        name: "Discovery",
        description:
          "API introspection and machine-readable specification endpoints.",
      },
    ],
    paths: buildPaths(),
    components,
  };
}
