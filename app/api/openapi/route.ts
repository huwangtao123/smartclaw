import { NextResponse } from "next/server";

const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "f(x) Protocol Leaderboard API",
    version: "1.0.0",
    description:
      "Programmatic access to the f(x) Protocol leaderboard insights. Provides high-performing wallet data sourced from the latest dashboard snapshot.",
  },
  servers: [
    {
      url: "https://example.com",
      description: "Replace with deployed host",
    },
  ],
  paths: {
    "/api/top-pnl": {
      get: {
        summary: "Top PNL wallets",
        description:
          "Returns the highest PNL wallets from the latest f(x) Protocol leaderboard snapshot. Data is refreshed on each request.",
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
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/TopPnlEntry",
                      },
                    },
                    meta: {
                      type: "object",
                      properties: {
                        limit: {
                          type: "integer",
                          example: 10,
                        },
                        total: {
                          type: "integer",
                          description: "Total number of wallets in the source snapshot.",
                          example: 1327,
                        },
                        generatedAt: {
                          type: "string",
                          format: "date-time",
                          description: "Server timestamp when the response was generated.",
                        },
                      },
                      required: ["limit", "total", "generatedAt"],
                    },
                  },
                  required: ["data", "meta"],
                },
              },
            },
          },
          "500": {
            description: "Server error while preparing the dataset.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Failed to load top PNL data",
                    },
                  },
                  required: ["error"],
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      TopPnlEntry: {
        type: "object",
        properties: {
          rank: {
            type: "integer",
            description: "Leaderboard rank.",
            example: 1,
          },
          trader: {
            type: "string",
            description: "Wallet address.",
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
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApiDocument);
}
