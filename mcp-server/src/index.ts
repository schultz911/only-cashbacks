/**
 * OnlyCashbacks MCP Server
 * 
 * Exposes the OnlyCashbacks card recommendation engine as MCP tools.
 * Supports both stdio (local) and SSE (remote/Railway) transports.
 * 
 * Users authenticate with their OnlyCashbacks Google account via
 * Firebase ID token to get personalized recommendations based on
 * their wallet configuration.
 * 
 * Tools:
 *   - find_best_card: Find the best card for a merchant/amount
 *   - list_cards: List all supported cards in the system
 *   - get_card_details: Get detailed info about a specific card
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express from 'express';
import { z } from 'zod';

import { CARD_DATA, CARD_DICT } from './data/cards.js';
import { getRecommendations } from './lib/recommendation.js';
import { verifyIdToken, getUserData } from './firebase.js';
import type { MerchantInfo, UserData } from './types.js';

// ─── In-memory session store for authenticated users ───────────────
// Maps Firebase UID → UserData (cached for the duration of the session)
const userSessionCache = new Map<string, { data: UserData; authenticatedAt: number }>();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCachedUserData(uid: string): UserData | null {
  const entry = userSessionCache.get(uid);
  if (!entry) return null;
  if (Date.now() - entry.authenticatedAt > SESSION_TTL_MS) {
    userSessionCache.delete(uid);
    return null;
  }
  return entry.data;
}

// ─── Currently authenticated user for this connection ──────────────
let currentUid: string | null = null;

// ─── Create MCP Server ─────────────────────────────────────────────
const server = new McpServer({
  name: 'onlycashbacks',
  version: '1.0.0',
  description: 'Find the best credit/debit card for any purchase. Sign in with your OnlyCashbacks Google account for personalized recommendations.',
});

// ─── Tool: authenticate ────────────────────────────────────────────
server.tool(
  'authenticate',
  'Sign in with your OnlyCashbacks account using a Firebase ID token. This personalizes recommendations to YOUR cards. Get your token from the OnlyCashbacks app (Settings → Developer → Copy ID Token).',
  {
    idToken: z.string().describe('Firebase ID token from your OnlyCashbacks Google sign-in. Get it from: OnlyCashbacks app → Settings → Developer → Copy ID Token'),
  },
  async ({ idToken }) => {
    try {
      const decoded = await verifyIdToken(idToken);
      currentUid = decoded.uid;

      // Fetch and cache user data from Firestore
      const userData = await getUserData(decoded.uid);
      if (userData) {
        userSessionCache.set(decoded.uid, { data: userData, authenticatedAt: Date.now() });
      }

      const cardCount = userData?.walletCards?.length || 0;
      const displayName = decoded.name || decoded.email || decoded.uid;

      return {
        content: [{
          type: 'text' as const,
          text: `✅ Signed in as ${displayName}\n\n` +
            (cardCount > 0
              ? `Found ${cardCount} cards in your wallet. Recommendations will be personalized to your cards.`
              : `No cards found in your wallet yet. Add cards in the OnlyCashbacks app, or recommendations will use all available cards.`),
        }],
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text' as const,
          text: `❌ Authentication failed: ${error.message || 'Invalid token'}\n\nMake sure you copy the ID token from the OnlyCashbacks app (Settings → Developer → Copy ID Token).`,
        }],
        isError: true,
      };
    }
  }
);

// ─── Tool: find_best_card ──────────────────────────────────────────
server.tool(
  'find_best_card',
  'Find the best credit/debit card for a purchase. Provide the merchant name and amount to get the optimal card recommendation with cashback calculations.',
  {
    merchant: z.string().describe('Merchant or store name (e.g., "Swiggy", "Amazon", "Blinkit", "PVR", "Starbucks")'),
    amount: z.number().positive().describe('Transaction amount in INR (e.g., 500, 1500, 3000)'),
    category: z.string().optional().describe('Merchant category if known (e.g., "Food Delivery", "E-commerce", "Grocery", "Movies", "Dining")'),
    platform: z.string().optional().describe('Platform if applicable (e.g., "Swiggy", "Amazon", "Tata Brands")'),
    isOnline: z.boolean().default(true).describe('Whether this is an online transaction (default: true)'),
    isInternational: z.boolean().default(false).describe('Whether this is an international transaction (default: false)'),
    isScanAndPay: z.boolean().default(false).describe('Whether this is a UPI Scan & Pay transaction (default: false)'),
  },
  async ({ merchant, amount, category, platform, isOnline, isInternational, isScanAndPay }) => {
    // Build MerchantInfo from the input
    const merchantInfo: MerchantInfo = {
      name: merchant,
      category: category || 'Other',
      isOnline: isOnline,
      platform: platform,
      isP2P: false,
    };

    // Get user-specific state if authenticated
    let walletCards: string[] | null = null;
    let exhaustedCards: Record<string, boolean> = {};
    let offerUsage: Record<string, number> = {};
    let cardBillDates: Record<string, number> = {};
    let kiwiNeonEarnRate = 2;

    if (currentUid) {
      const userData = getCachedUserData(currentUid);
      if (userData) {
        walletCards = userData.walletCards && userData.walletCards.length > 0 ? userData.walletCards : null;
        exhaustedCards = userData.exhaustedCards || {};
        offerUsage = userData.offerUsage || {};
        cardBillDates = userData.cardBillDates || {};
        kiwiNeonEarnRate = userData.kiwiNeonEarnRate || 2;
      }
    }

    const recommendation = getRecommendations(
      merchantInfo,
      amount,
      isOnline,
      isInternational,
      isScanAndPay,
      exhaustedCards,
      offerUsage,
      kiwiNeonEarnRate,
      walletCards,
      cardBillDates
    );

    if (!recommendation) {
      return {
        content: [{
          type: 'text' as const,
          text: `No recommendation found for "${merchant}" at ₹${amount}. This may be an excluded category (rent, fuel, wallet loads, etc.) for all your cards.`,
        }],
      };
    }

    // Format the response
    const lines: string[] = [];
    lines.push(`## 💳 Best Card: ${recommendation.bestCard.bank} ${recommendation.bestCard.name}`);
    lines.push('');
    lines.push(`**Benefit:** ${recommendation.expectedBenefit}`);
    lines.push(`**Net Value:** ₹${recommendation.netValue.toFixed(2)}`);
    lines.push(`**Cashback Earned:** ₹${recommendation.cashbackEarned.toFixed(2)}`);
    if (recommendation.feesPaid > 0) {
      lines.push(`**Fees Paid:** ₹${recommendation.feesPaid.toFixed(2)}`);
    }
    lines.push('');
    lines.push(`> ${recommendation.reason}`);

    // Tied cards
    if (recommendation.tiedCards && recommendation.tiedCards.length > 1) {
      lines.push('');
      lines.push('### 🤝 Tied Cards');
      for (const tied of recommendation.tiedCards) {
        lines.push(`- **${tied.card.bank} ${tied.card.name}**: ${tied.benefit}`);
      }
    }

    // Alternatives
    if (recommendation.alternatives.length > 0) {
      lines.push('');
      lines.push('### 📊 Alternatives');
      for (const alt of recommendation.alternatives) {
        lines.push(`- **${alt.card.bank} ${alt.card.name}**: ${alt.benefit} (₹${alt.netValue.toFixed(2)} net)`);
      }
    }

    // Available offers
    if (recommendation.availableOffers && recommendation.availableOffers.length > 0) {
      lines.push('');
      lines.push('### 🎁 Available Offers');
      for (const offer of recommendation.availableOffers) {
        lines.push(`- ${offer.icon} **${offer.title}**: ${offer.description} (${offer.category})`);
      }
    }

    // Auth status note
    if (!currentUid) {
      lines.push('');
      lines.push('---');
      lines.push('_💡 Sign in with the `authenticate` tool to get personalized recommendations based on your wallet._');
    }

    return {
      content: [{
        type: 'text' as const,
        text: lines.join('\n'),
      }],
    };
  }
);

// ─── Tool: list_cards ──────────────────────────────────────────────
server.tool(
  'list_cards',
  'List all credit and debit cards supported by OnlyCashbacks.',
  {},
  async () => {
    const realCards = CARD_DATA.filter(c => !c.isDummy);

    // If authenticated, mark which cards are in the user's wallet
    let userWallet: Set<string> | null = null;
    if (currentUid) {
      const userData = getCachedUserData(currentUid);
      if (userData?.walletCards && userData.walletCards.length > 0) {
        userWallet = new Set(userData.walletCards);
      }
    }

    const lines: string[] = ['## 💳 Supported Cards\n'];

    if (userWallet) {
      lines.push('### Your Wallet');
      const inWallet = realCards.filter(c => userWallet!.has(c.id));
      const notInWallet = realCards.filter(c => !userWallet!.has(c.id));

      for (const card of inWallet) {
        lines.push(`- ✅ **${card.bank} ${card.name}** (${card.type} · ${card.network} ${card.tier || ''})`);
      }

      if (notInWallet.length > 0) {
        lines.push('');
        lines.push('### Other Available Cards');
        for (const card of notInWallet) {
          lines.push(`- **${card.bank} ${card.name}** (${card.type} · ${card.network} ${card.tier || ''})`);
        }
      }
    } else {
      for (const card of realCards) {
        const rewardInfo = card.baseRewardRate > 0 ? ` · ${card.baseRewardRate}% base` : '';
        const forexInfo = card.isZeroForex ? ' · Zero Forex' : '';
        lines.push(`- **${card.bank} ${card.name}** (${card.type} · ${card.network} ${card.tier || ''}${rewardInfo}${forexInfo})`);
      }
    }

    lines.push('');
    lines.push(`Total: ${realCards.length} cards`);

    if (!currentUid) {
      lines.push('');
      lines.push('_💡 Sign in with the `authenticate` tool to see which cards are in your wallet._');
    }

    return {
      content: [{
        type: 'text' as const,
        text: lines.join('\n'),
      }],
    };
  }
);

// ─── Tool: get_card_details ────────────────────────────────────────
server.tool(
  'get_card_details',
  'Get detailed information about a specific credit or debit card, including all benefits, exclusions, and lounge access.',
  {
    cardId: z.string().describe('Card ID (e.g., "hdfc-swiggy", "sbi-cashback", "icici-amazon-pay"). Use list_cards to see available IDs.'),
  },
  async ({ cardId }) => {
    const card = CARD_DICT[cardId];
    if (!card) {
      // Try fuzzy match
      const searchLower = cardId.toLowerCase();
      const match = CARD_DATA.find(c =>
        c.id.includes(searchLower) ||
        c.name.toLowerCase().includes(searchLower) ||
        `${c.bank} ${c.name}`.toLowerCase().includes(searchLower)
      );

      if (!match) {
        return {
          content: [{
            type: 'text' as const,
            text: `Card "${cardId}" not found. Use the \`list_cards\` tool to see all available cards and their IDs.`,
          }],
          isError: true,
        };
      }

      return formatCardDetails(match);
    }

    return formatCardDetails(card);
  }
);

function formatCardDetails(card: typeof CARD_DATA[0]) {
  const lines: string[] = [];
  lines.push(`## ${card.bank} ${card.name}`);
  lines.push('');
  lines.push(`| Property | Value |`);
  lines.push(`|----------|-------|`);
  lines.push(`| Type | ${card.type} |`);
  lines.push(`| Network | ${card.network} ${card.tier || ''} |`);
  lines.push(`| Base Reward Rate | ${card.baseRewardRate}% |`);
  lines.push(`| Forex Markup | ${card.forexMarkup}% (+18% GST) |`);
  if (card.annualFee) lines.push(`| Annual Fee | ${card.annualFee} |`);
  if (card.isZeroForex) lines.push(`| Forex | ✅ Zero Forex |`);
  if (card.isForexPositive) lines.push(`| Forex | 💚 Forex Positive |`);
  lines.push(`| ID | \`${card.id}\` |`);

  // Benefits
  const cashbackBenefits = card.benefits.filter(b => b.type === 'cashback' || b.type === 'upi' || b.type === 'forex');
  const offerBenefits = card.benefits.filter(b => b.type === 'offer');
  const loungeBenefits = card.benefits.filter(b => b.type === 'lounge');
  const exclusions = card.benefits.filter(b => b.type === 'exclusion');

  if (cashbackBenefits.length > 0) {
    lines.push('');
    lines.push('### 💰 Cashback & Rewards');
    for (const b of cashbackBenefits) {
      let detail = `- **${b.category}**: ${b.value}`;
      if (b.maxSpend) detail += ` (up to ₹${b.maxSpend.toLocaleString()} spend)`;
      if (b.capPerTxn) detail += ` (capped at ₹${b.capPerTxn}/txn)`;
      if (b.minSpend) detail += ` (min ₹${b.minSpend})`;
      lines.push(detail);
      lines.push(`  _${b.description}_`);
    }
  }

  if (offerBenefits.length > 0) {
    lines.push('');
    lines.push('### 🎁 Offers');
    for (const b of offerBenefits) {
      lines.push(`- **${b.category}** (${b.value}): ${b.description}`);
    }
  }

  if (loungeBenefits.length > 0) {
    lines.push('');
    lines.push('### ✈️ Lounge Access');
    for (const b of loungeBenefits) {
      lines.push(`- **${b.category}**: ${b.value} — ${b.description}`);
    }
  }

  if (exclusions.length > 0) {
    lines.push('');
    lines.push('### ❌ Excluded Categories');
    lines.push(exclusions.map(e => e.description).join(', '));
  }

  return {
    content: [{
      type: 'text' as const,
      text: lines.join('\n'),
    }],
  };
}

// ─── Start the server ──────────────────────────────────────────────
async function main() {
  const transport = process.env.MCP_TRANSPORT || 'stdio';

  if (transport === 'sse') {
    // SSE transport for remote hosting (Railway, etc.)
    const app = express();
    const PORT = parseInt(process.env.PORT || '3001', 10);
    
    // Store active transports for cleanup
    const transports = new Map<string, SSEServerTransport>();
    
    // CORS headers for cross-origin MCP clients
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });

    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', server: 'onlycashbacks-mcp', version: '1.0.0' });
    });

    app.get('/sse', async (req, res) => {
      const sseTransport = new SSEServerTransport('/messages', res);
      transports.set(sseTransport.sessionId, sseTransport);
      
      res.on('close', () => {
        transports.delete(sseTransport.sessionId);
      });

      await server.connect(sseTransport);
    });

    app.post('/messages', async (req, res) => {
      const sessionId = req.query.sessionId as string;
      const sseTransport = transports.get(sessionId);
      if (!sseTransport) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      await sseTransport.handlePostMessage(req, res);
    });

    app.listen(PORT, () => {
      console.log(`🚀 OnlyCashbacks MCP Server running on port ${PORT}`);
      console.log(`   SSE endpoint: http://localhost:${PORT}/sse`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
    });
  } else {
    // stdio transport for local usage
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    console.error('OnlyCashbacks MCP Server running on stdio');
  }
}

main().catch(console.error);
