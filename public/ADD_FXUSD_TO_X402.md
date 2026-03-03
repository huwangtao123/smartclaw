# How to Add fxUSD Support to an Existing x402 Agent Service

This guide explains how to convert or extend an existing x402-enabled Agent Service to support **fxUSD** out-of-the-box. f(x) Protocol's fxUSD uses 18 decimals on Base, which requires some custom configuration for both the server-side payment parsing and the client-side paywall UI.

## 1. Network & Token Configuration

A standard x402 service defaults to USDC (6 decimals). fxUSD changes this paradigm.

**Constants to add to your project:**
```typescript
const X402_NETWORK = "eip155:8453"; // Base
const FXUSD_ADDRESS = "0x55380fe7A1910dFf29A47B622057ab4139DA42C5";
const FXUSD_DECIMALS = 18;
```

---

## 2. Server-Side: Custom Money Parser

By default, `@x402/evm` expects tokens with standard mapping (like USDC). To support fxUSD, you need to register a custom money parser using `ExactEvmScheme`. This ensures that when your service defines a price (e.g., `$0.01`), it correctly calculates the 18-decimal atomic amount for fxUSD.

### Implementation Example (`proxy.ts` or API route):

```typescript
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { x402ResourceServer } from "@x402/next";
// For express/node, use @x402/core instead of @x402/next

const PRICE_IN_USD = 0.01; // Example price per API request

// 1. Initialize the EVM Scheme
const fxusdScheme = new ExactEvmScheme();

// 2. Register fxUSD Money Parser
fxusdScheme.registerMoneyParser(async (amount: number, _network) => {
  // If the requested amount matches your premium price
  if (Math.abs(amount - PRICE_IN_USD) < 0.0001) {
    // Convert float amount to 18-decimal BigInt atomic string
    const atomicAmount = BigInt(Math.round(amount * 10 ** FXUSD_DECIMALS)).toString();
    
    return {
      amount: atomicAmount,
      asset: FXUSD_ADDRESS,
      extra: { name: "FxUSD", version: "2" }, // Add metadata helpful for debugging
    };
  }
  return null; // Fallback to default parsers if amount doesn't match
});

// 3. Register to Resource Server
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(X402_NETWORK, fxusdScheme);
```

---

## 3. Server-Side: Paywall UI Injection

If your service renders an HTML paywall (using `@x402/paywall`), the default UI components strictly assume a 6-decimal USDC setup. You must inject logic to rewrite the token formatting for 18 decimals and replace USDC addresses.

### Implementation Example:

```typescript
import { createPaywall, evmPaywall } from "@x402/paywall";

const fixedEvmPaywall = {
  supports: evmPaywall.supports.bind(evmPaywall),
  generateHtml(requirement: any, paymentRequired: any, config: any) {
    const asset = requirement.asset;
    
    if (asset && asset.toLowerCase() === FXUSD_ADDRESS.toLowerCase()) {
      // Step A: Format 18-decimal atomics into 6 decimal values temporarily 
      // so the base paywall logic processes the numeric sizes accurately.
      const fixedReq = {
        ...requirement,
        amount: requirement.amount 
          ? String(Number(BigInt(requirement.amount) / BigInt(10 ** (FXUSD_DECIMALS - 6)))) 
          : requirement.amount,
      };

      // Generate base HTML
      let html = evmPaywall.generateHtml(fixedReq, paymentRequired, config);

      // Step B: Text replacement via String mutations
      const USDC_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base USDC
      
      return html
        .replaceAll(USDC_MAINNET, FXUSD_ADDRESS) // Replace contract queries
        .replaceAll('q=Nm(M,6)', `q=parseFloat(Nm(M,${FXUSD_DECIMALS})).toFixed(3)`) // Fix wallet balance mapping display
        .replaceAll('USDC', 'fxUSD'); // Visual replace
    }
    
    // Normal fallback
    return evmPaywall.generateHtml(requirement, paymentRequired, config);
  }
};

const paywall = createPaywall()
  .withNetwork(fixedEvmPaywall)
  .build();
```

---

## 4. Agent Configuration (Client-Side)

When agents consume your newly minted fxUSD-enabled x402 service, they need specific guidelines on execution paths for `EIP-3009 transferWithAuthorization`:

### Provide your Agents with a Runbook
Include this snippet in your `AGENTS.md`, `llms.txt`, or Agent System Prompts:

```markdown
**Premium Endpoints Require fxUSD:**
- Network: Base (`eip155:8453`)
- Token: fxUSD (`0x55380fe7A1910dFf29A47B622057ab4139DA42C5`)

**Important Signing Rules:**
x402 relies on EIP-3009 `transferWithAuthorization`. Do **not** attempt a direct `transfer` of fxUSD.
Use standard local EVM signers to process the 402 challenge. Avoid remote/abstracted signers (e.g., Bankr path) to prevent EIP-3009 incompatibilities.

**Supported Libraries:**
- JS/TS: Use `x402-fetch` (wraps native fetch to automatically sign and resubmit).
- Python: Use `x402` (`x402_requests.get()`).
```

### Proxy/Middleware Response Rewriting (If applicable)

Ensure any proxy rewriting middleware accurately normalizes the `payment-required` header so that `x402-fetch` natively retries against the correct absolute URL, maintaining the customized 18-decimals `requirement.asset` injection.
