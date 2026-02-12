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
  description: "Leaderboard entry sourced from the f(x) Protocol snapshot.",
  properties: {
    rank: {
      type: "integer",
      description: "Leaderboard rank (1-indexed).",
      example: 1,
    },
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
  required: ["rank", "trader", "roi", "pnl", "pnlClean", "vol", "net"],
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
      required: ["x402Version", "topByPnl", "topByRoi", "generatedAt"],
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
      name: "aicharts-premium-access",
      description:
        "Session cookie granted after a successful x402 checkout. Required for premium endpoints.",
    },
  },
};

const endpointDefinitions: EndpointDefinition[] = [
  {
    path: "/api/fxusd-rate",
    method: "get",
    operation: {
      operationId: "getFxusdRate",
      "x-openai-isConsequential": false,
      tags: ["Public"],
      summary: "fxUSD borrow rates",
      description:
        "Returns the latest and historical fxUSD borrow APR. Data is sourced from f(x) Protocol funding windows. Use this to check the current borrow cost before opening a leveraged position or to track rate trends over time.",
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
    path: "/api/top-pnl",
    method: "get",
    operation: {
      operationId: "getTopPnl",
      "x-openai-isConsequential": false,
      tags: ["Public"],
      summary: "Top PNL wallets",
      description:
        "Returns the highest cleaned-PNL wallets from the latest f(x) Protocol leaderboard snapshot. Data is refreshed on each request. Use this to identify top-performing traders for copy-trading analysis or market intelligence.",
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
          description: "List of top PNL wallets.",
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
    path: "/api/rates",
    method: "get",
    operation: {
      operationId: "getRates",
      "x-openai-isConsequential": false,
      tags: ["Public"],
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
  {
    path: "/api/premium",
    method: "get",
    operation: {
      operationId: "getPremiumMetrics",
      "x-openai-isConsequential": false,
      tags: ["Premium"],
      summary: "Premium leaderboard metrics",
      description:
        "Returns premium leaderboard insights including top traders by PNL and ROI. Requires x402 USDC payment ($1 on Base network). Requests without a premium cookie receive a 402 payment required response.",
      security: [
        {
          PremiumAccessCookie: [],
        },
      ],
      responses: {
        "200": {
          description: "Premium leaderboard metrics for authenticated users.",
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
  {
    path: "/api/x402/session-token",
    method: "post",
    operation: {
      operationId: "createX402SessionToken",
      "x-openai-isConsequential": true,
      tags: ["Premium"],
      summary: "Initiate x402 session token exchange",
      description:
        "Forwards the request body to the x402 payment infrastructure so clients can initiate a premium checkout flow. This initiates a payment — call only when the user explicitly wants to unlock premium access.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              description:
                "Opaque payload forwarded to x402. Refer to x402 documentation for field definitions.",
            },
          },
        },
      },
      responses: {
        default: {
          $ref: "#/components/responses/X402Proxy",
        },
      },
    },
  },
  {
    path: "/api/openapi",
    method: "get",
    operation: {
      operationId: "getOpenApiSpec",
      "x-openai-isConsequential": false,
      tags: ["Internal"],
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
      title: "f(x) Protocol Leaderboard API",
      version: "1.2.0",
      description:
        "Programmatic access to the f(x) Protocol leaderboard insights, including both public and premium datasets. AI agents: start with /llms.txt for a quick overview, or read this full spec for detailed schemas.",
    },
    externalDocs: {
      description: "AI-friendly summary of available capabilities",
      url: "/llms.txt",
    },
    servers: buildServers(),
    tags: [
      {
        name: "Public",
        description:
          "Endpoints that can be called without authentication. Safe for agents to call automatically.",
      },
      {
        name: "Premium",
        description:
          "Endpoints gated behind an x402 USDC paywall ($1 on Base network). Requires explicit user consent before payment.",
      },
      {
        name: "Internal",
        description: "Supporting endpoints that assist API discovery.",
      },
    ],
    paths: buildPaths(),
    components,
  };
}
