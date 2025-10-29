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
    path: "/api/top-pnl",
    method: "get",
    operation: {
      tags: ["Public"],
      summary: "Top PNL wallets",
      description:
        "Returns the highest cleaned-PNL wallets from the latest f(x) Protocol leaderboard snapshot. Data is refreshed on each request unless caching is explicitly disabled.",
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
    path: "/api/premium",
    method: "get",
    operation: {
      tags: ["Premium"],
      summary: "Premium leaderboard metrics",
      description:
        "Mirrors the premium dashboard insights for authenticated subscribers. Requests without a premium cookie receive a 402 payment required response from middleware.",
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
      tags: ["Premium"],
      summary: "Initiate x402 session token exchange",
      description:
        "Forwards the request body to the x402 payment infrastructure so clients can initiate a premium checkout flow. The request and response formats are defined by the `x402-next` package.",
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
      tags: ["Internal"],
      summary: "Current OpenAPI document",
      description:
        "Returns the OpenAPI 3.1 document describing every live API endpoint exposed by this deployment.",
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
      version: "1.1.0",
      description:
        "Programmatic access to the f(x) Protocol leaderboard insights, including both public and premium datasets.",
    },
    servers: buildServers(),
    tags: [
      {
        name: "Public",
        description: "Endpoints that can be called without premium access.",
      },
      {
        name: "Premium",
        description: "Endpoints gated behind the premium paywall.",
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
