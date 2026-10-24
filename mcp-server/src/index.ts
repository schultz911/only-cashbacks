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
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'node:url';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { installOAuthRoutes, AUTH_CHALLENGE } from './oauth.js';
import { z } from 'zod';
import crypto from 'crypto';

import { CARD_DATA, CARD_DICT } from './data/cards.js';
import { getCycleForCard, getRecommendations } from './lib/recommendation.js';
import { verifyIdToken, getUserData } from './firebase.js';
import type { MerchantInfo, UserData } from './types.js';
import { getLoginHtml } from './loginHtml.js';

function walletUnavailable() {
  return { isError: true, content: [{ type: 'text' as const, text: 'Saved wallet could not be loaded. Check the Firestore database and server credentials, then reconnect. No personalized recommendation was calculated.' }] };
}
function getWalletSelection(userData: UserData) {
  // The web app stores [] as its all-cards-selected sentinel, not an empty wallet.
  if (!Array.isArray(userData.walletCards)) return null;
  const allSelected = userData.walletCards.length === 0;
  return {
    mode: allSelected ? 'all_supported_cards' : 'explicit_cards',
    cardIds: CARD_DATA.filter(card => !card.isDummy && (allSelected || userData.walletCards!.includes(card.id))).map(card => card.id),
  };
}

function walletContext(uid: string, userData: UserData) {
  // User documents can also contain a BYOK secret. Only expose wallet settings.
  return {
    authenticated: true, uid, checkedAt: new Date().toISOString(),
    cardSelection: getWalletSelection(userData),
    wallet: {
      walletCards: userData.walletCards, exhaustedCards: userData.exhaustedCards,
      offerUsage: userData.offerUsage, cardBillDates: userData.cardBillDates,
      kiwiNeonEarnRate: userData.kiwiNeonEarnRate,
    },
  };
}

function signedInStatus(uid: string, userData: UserData, message: string) {
  const selection = getWalletSelection(userData);
  return {
    content: [{ type: 'text' as const, text: message + '\n\n' + (selection
      ? selection.mode === 'all_supported_cards'
        ? `Your saved setting selects all ${selection.cardIds.length} supported cards, matching the cards you own in the app. Billing dates, offer usage and reward settings are loaded.`
        : `Found ${selection.cardIds.length} explicitly selected cards in your wallet. Billing dates, offer usage and reward settings are loaded.`
      : 'Your account is connected, but no saved card selection is configured. Select your cards in the app before requesting recommendations.') }],
    structuredContent: walletContext(uid, userData),
  };
}

// ─── Pending authorization codes for Google Sign-In pairing ───────
interface PendingAuth {
  owner: string;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'completed';
  uid?: string;
  displayName?: string;
  email?: string;
  cardCount?: number;
}

const pendingAuthCodes = new Map<string, PendingAuth>();
const AUTH_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function cleanExpiredCodes() {
  const now = Date.now();
  for (const [code, item] of pendingAuthCodes.entries()) {
    if (now > item.expiresAt) {
      pendingAuthCodes.delete(code);
    }
  }
}

function getBaseUrl(): string {
  return 'https://only-cashbacks.up.railway.app';
}

// ─── MCP Server Factory (Per-Connection Isolation) ────────────────
export function createOnlyCashbacksServer(
  getSessionUid: () => string | null,
  setSessionUid: (uid: string) => void
): McpServer {
  const pairingOwner = crypto.randomUUID();
  const server = new McpServer({
    name: 'onlycashbacks',
    version: '1.0.0',
    description: 'Find the best credit/debit card for any purchase. Sign in with your OnlyCashbacks Google account for personalized recommendations.',
  });

  // ─── Tool: authenticate ────────────────────────────────────────────
  server.tool(
    'authenticate',
    'Sign in with your OnlyCashbacks account to personalize recommendations to your wallet. Calling with no arguments returns a one-click Google sign-in link. Once you sign in via Google in your browser, your wallet is automatically linked.',
    {
      code: z.string().optional().describe('Pairing code (e.g. "OC-1234") to verify or check sign-in status after signing in in your browser.'),
      idToken: z.string().optional().describe('Optional raw Firebase ID token if authenticating programmatically.'),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    async ({ code, idToken }) => {
      // 1. Direct ID token passed
      if (idToken) {
        try {
          const decoded = await verifyIdToken(idToken);
          const userData = await getUserData(decoded.uid);
          if (!userData) return walletUnavailable();
          setSessionUid(decoded.uid);

          const displayName = decoded.name || decoded.email || decoded.uid;
          return signedInStatus(decoded.uid, userData, `✅ Signed in as ${displayName}`);
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ Authentication failed: ${error.message || 'Invalid token'}`,
            }],
            isError: true,
          };
        }
      }

      // 2. Check code status
      if (code) {
        cleanExpiredCodes();
        const normCode = code.trim().toUpperCase();
        const pending = pendingAuthCodes.get(normCode);

        if (!pending || pending.owner !== pairingOwner) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ Code "${normCode}" is invalid or expired. Please call \`authenticate\` without arguments to generate a new sign-in link.`,
            }],
            isError: true,
          };
        }

        if (pending.status === 'completed' && pending.uid) {
          const userData = await getUserData(pending.uid);
          if (!userData) return walletUnavailable();
          setSessionUid(pending.uid);
          pendingAuthCodes.delete(normCode);
          return signedInStatus(pending.uid, userData, `✅ Successfully authenticated as ${pending.displayName || pending.email}!`);
        } else {
          const baseUrl = getBaseUrl();
          return {
            content: [{
              type: 'text' as const,
              text: `⏳ Sign-in pending for code **${normCode}**.\n\nPlease open this link to sign in with Google:\n👉 ${baseUrl}/login?code=${normCode}\n\nAfter signing in, call \`authenticate({ code: "${normCode}" })\` again!`,
            }],
          };
        }
      }

      // 3. Already signed in
      const currentUid = getSessionUid();
      if (currentUid) {
        const userData = await getUserData(currentUid);
        if (!userData) return walletUnavailable();
        return signedInStatus(currentUid, userData, '✅ Already signed in.');
      }

      // 4. Generate new pairing code and return Google sign-in link
      cleanExpiredCodes();
      const newCode = 'OC-' + crypto.randomBytes(16).toString('hex').toUpperCase();
      pendingAuthCodes.set(newCode, {
        owner: pairingOwner,
        createdAt: Date.now(),
        expiresAt: Date.now() + AUTH_CODE_TTL_MS,
        status: 'pending',
      });

      const baseUrl = getBaseUrl();
      const loginUrl = `${baseUrl}/login?code=${newCode}`;

      return {
        content: [{
          type: 'text' as const,
          text: `### 🔐 Sign in with Google to Connect OnlyCashbacks\n\n` +
            `To tailor card recommendations to your wallet, please sign in with your OnlyCashbacks Google account:\n\n` +
            `👉 **[Click Here to Sign in with Google](${loginUrl})**\n\n` +
            `1. Click the link above to open the sign-in page in your browser.\n` +
            `2. Click **"Sign in with Google"** (your pairing code is **\`${newCode}\`**).\n` +
            `3. Return here and run \`authenticate({ code: "${newCode}" })\` or ask me to check your login!`,
        }],
      };
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
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async ({ merchant, amount, category, platform, isOnline, isInternational, isScanAndPay }) => {
      // Build MerchantInfo from the input
      const merchantInfo: MerchantInfo = {
        name: merchant,
        category: category || 'Other',
        isOnline: isOnline,
        platform: platform,
        isP2P: false,
      };

      // Get user-specific state for THIS connection
      const currentUid = getSessionUid();
      const baseUrl = getBaseUrl();

      // Enforce activation requirement: block personalized comparisons until sign-in succeeds
      if (!currentUid) {
        return {
          content: [{
            type: 'text' as const,
            text: `## 🔒 Authentication Required\n\n` +
              `Personalized wallet comparisons are locked until your OnlyCashbacks account is connected.\n\n` +
              `Run the \`authenticate\` tool to generate a sign-in link for this connection.\n\n` +
              `_Once signed in, OnlyCashbacks will load your saved wallet cards, track monthly caps, and calculate exact cashback for "${merchant}" at ₹${amount}._\n\n` +
              `💡 Run the \`authenticate\` tool to pair via one-click Google Sign-In.`
          }],
        };
      }

      let walletCards: string[] | null = null;
      let exhaustedCards: Record<string, boolean> = {};
      let offerUsage: Record<string, number> = {};
      let cardBillDates: Record<string, number> = {};
      let kiwiNeonEarnRate = 2;

      const userData = await getUserData(currentUid);
      if (!userData) return walletUnavailable();
      const selection = getWalletSelection(userData);
      if (!selection) return { isError: true, content: [{ type: 'text' as const, text: 'No saved card selection is configured. Select your cards in the app before requesting recommendations.' }] };
      if (userData) {
        walletCards = selection.cardIds;
        offerUsage = userData.offerUsage || {};
        cardBillDates = userData.cardBillDates || {};
        kiwiNeonEarnRate = userData.kiwiNeonEarnRate || 2;
        // Match useWalletState: a marker from a previous billing cycle is not
        // an exhausted card in the current cycle. Preserve legacy true markers.
        for (const card of CARD_DATA) {
          const saved = userData.exhaustedCards?.[card.id];
          if (saved === true || saved === getCycleForCard(card.id, cardBillDates)) exhaustedCards[card.id] = true;
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

      // Some engine routes return a fixed card. Never expose a card the user
      // has excluded from their wallet, even when a route bypasses card scoring.
      const selectedCardIds = new Set(selection.cardIds);
      const isSelectedCard = (card: typeof CARD_DATA[0]) => card.isDummy || selectedCardIds.has(card.id);
      if (!isSelectedCard(recommendation.bestCard)) {
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `No eligible recommendation is available within your selected wallet for "${merchant}". No unowned card was recommended.` }],
          structuredContent: walletContext(currentUid, userData),
        };
      }
      recommendation.alternatives = recommendation.alternatives.filter(item => isSelectedCard(item.card));
      if (recommendation.tiedCards) recommendation.tiedCards = recommendation.tiedCards.filter(item => isSelectedCard(item.card));
      if (recommendation.availableOffers) recommendation.availableOffers = recommendation.availableOffers.filter(offer => !offer.cardId || selectedCardIds.has(offer.cardId));

      // Format the response
      const lines: string[] = [];
      if (selection.mode === 'all_supported_cards') {
        lines.push('Your saved setting selects all supported cards, matching your wallet in the app. Results use your own saved usage and reward settings.');
        lines.push('');
      }
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
        structuredContent: { ...walletContext(currentUid, userData), recommendation },
      };
    }
  );

  // ─── Tool: list_cards ──────────────────────────────────────────────
  server.tool(
    'list_cards',
    'List all credit and debit cards supported by OnlyCashbacks.',
    {},
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    async () => {
      const realCards = CARD_DATA.filter(c => !c.isDummy);

      const currentUid = getSessionUid();
      const baseUrl = getBaseUrl();

      // If not authenticated, inform that sign-in is required to view saved wallet cards
      if (!currentUid) {
        const lines: string[] = [
          '## 💳 OnlyCashbacks Card Catalog\n',
          '🔒 **Account not connected**: Connect your account to view your saved wallet cards.\n',
          `Run the \`authenticate\` tool to generate a sign-in link for this connection.\n`,
          '---\n',
          '### All Supported Cards (System Directory)',
        ];

        for (const card of realCards) {
          const rewardInfo = card.baseRewardRate > 0 ? ` · ${card.baseRewardRate}% base` : '';
          const forexInfo = card.isZeroForex ? ' · Zero Forex' : '';
          lines.push(`- **${card.bank} ${card.name}** [${card.id}] (${card.type} · ${card.network} ${card.tier || ''}${rewardInfo}${forexInfo})`);
        }

        lines.push('');
        lines.push(`Total: ${realCards.length} supported cards.`);
        return {
          content: [{
            type: 'text' as const,
            text: lines.join('\n'),
          }],
        };
      }

      // If authenticated for THIS session, return the user's saved wallet!
      const userData = await getUserData(currentUid);
      if (!userData) return walletUnavailable();
      const selection = getWalletSelection(userData);
      if (!selection) return signedInStatus(currentUid, userData, '✅ Account connected.');
      const userWallet = new Set(selection.cardIds);

      const lines: string[] = ['## 💳 Your Saved Wallet\n'];
      if (selection.mode === 'all_supported_cards') {
        lines.push('Your saved setting selects all supported cards, matching your wallet in the app.\n');
      }
      if (userWallet && userWallet.size > 0) {
        const inWallet = realCards.filter(c => userWallet.has(c.id));

        lines.push(`### Active Cards (${inWallet.length})`);
        for (const card of inWallet) {
          lines.push(`- ✅ **${card.bank} ${card.name}** [${card.id}] (${card.type} · ${card.network} ${card.tier || ''})`);
        }

      } else {
        lines.push('Your OnlyCashbacks wallet does not have any saved cards yet.');
        lines.push(`Add cards in the [OnlyCashbacks App](${baseUrl}) to start receiving personalized recommendations!`);
      }

      return {
        content: [{
          type: 'text' as const,
          text: lines.join('\n'),
        }],
        structuredContent: walletContext(currentUid, userData),
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
    { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
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

  return server;
}

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
export function createRemoteApp() {
    // SSE transport for remote hosting (Railway, etc.)
    const app = express();
    
    // Store active transports for cleanup
    const transports = new Map<string, SSEServerTransport>();
    
    // CORS headers for cross-origin MCP clients
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID');
      res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, WWW-Authenticate');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });

    // NOTE: express.json() MUST NOT be applied globally!
    // Global express.json() consumes the request stream and breaks SSEServerTransport.handlePostMessage (stream is not readable).
    const jsonParser = express.json();

    const PUBLIC_FIREBASE_CONFIG = {
      apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCHALzi5TDkpVQrUqobauyciLZurzjQsX4',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0447512961.firebaseapp.com',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0447512961',
      appId: process.env.VITE_FIREBASE_APP_ID || '1:343088435457:web:14d0c083a241a00a86cb00',
      recaptchaSiteKey: process.env.VITE_RECAPTCHA_SITE_KEY || '6LdvmgotAAAAAL2cVPtKL1HIwAds1d7eB5MgxVPu',
    };

    const verifyAccessToken = installOAuthRoutes(app, PUBLIC_FIREBASE_CONFIG, verifyIdToken);

    // Service Worker killer to purge any legacy PWA service workers on this domain
    const swKiller = (_req: express.Request, res: express.Response) => {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.send(`
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        clients.forEach((client) => {
          if (client.url && 'navigate' in client) {
            client.navigate(client.url);
          }
        });
      })
  );
});
      `.trim());
    };

    app.get(['/sw.js', '/service-worker.js'], swKiller);

    // Google Sign-In webpage (Manual Pairing Flow)
    app.get('/login', (req, res) => {
      cleanExpiredCodes();
      const code = typeof req.query.code === 'string' ? req.query.code.trim().toUpperCase() : '';
      if (!pendingAuthCodes.has(code)) {
        res.status(400).send('Generate a sign-in link with the authenticate tool in your assistant first.');
        return;
      }
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Clear-Site-Data', '"cache"');
      res.send(getLoginHtml(code, PUBLIC_FIREBASE_CONFIG));
    });

    // Browser POST completion after Google Sign-In (Manual Pairing)
    app.post('/api/auth/complete', jsonParser, async (req, res) => {
      const { code, idToken } = req.body || {};
      if (!code || !idToken) {
        res.status(400).json({ success: false, error: 'Missing code or idToken' });
        return;
      }

      cleanExpiredCodes();
      const normCode = String(code).trim().toUpperCase();
      const pending = pendingAuthCodes.get(normCode);
      if (!pending || pending.status !== 'pending') {
        res.status(400).json({ success: false, error: 'Invalid or expired pairing code' });
        return;
      }
      try {
        const decoded = await verifyIdToken(idToken);
        const userData = await getUserData(decoded.uid);

        const cardCount = userData?.walletCards?.length || 0;
        const displayName = decoded.name || decoded.email || 'OnlyCashbacks User';

        if (pendingAuthCodes.get(normCode) !== pending || pending.status !== 'pending' || pending.expiresAt <= Date.now()) {
          res.status(400).json({ success: false, error: 'Pairing code already used or expired' });
          return;
        }
        pendingAuthCodes.set(normCode, {
          ...pending,
          status: 'completed',
          uid: decoded.uid,
          displayName,
          email: decoded.email,
          cardCount,
        });

        res.json({
          success: true,
          displayName,
          email: decoded.email,
          cardCount,
        });
      } catch (err: any) {
        res.status(401).json({ success: false, error: err.message || 'Token verification failed' });
      }
    });

    // Status check for pairing code
    app.get('/api/auth/status', (req, res) => {
      cleanExpiredCodes();
      const code = (req.query.code as string)?.trim().toUpperCase();
      if (!code || !pendingAuthCodes.has(code)) {
        res.status(404).json({ status: 'not_found' });
        return;
      }
      res.setHeader('Cache-Control', 'no-store');
      res.json({ status: pendingAuthCodes.get(code)!.status });
    });

    const distCandidates = [
      path.resolve(process.cwd(), 'web'),
      path.resolve(process.cwd(), 'dist'),
      path.resolve(process.cwd(), '../dist'),
    ];
    const distPath = distCandidates.find(p => fs.existsSync(path.join(p, 'index.html')));

    if (distPath) {
      console.log(`[Static] Serving frontend web app from: ${distPath}`);
      app.use(express.static(distPath, {
        index: false,
        maxAge: '1y',
        immutable: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html') || filePath.endsWith('sw.js') || filePath.endsWith('.webmanifest') || filePath.includes('workbox-')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        }
      }));

      app.get('/', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      app.get('/', (_req, res) => {
        res.json({
          name: 'OnlyCashbacks MCP Server',
          status: 'running',
          endpoints: {
            mcp: '/mcp',
            sse: '/sse',
            health: '/health',
            messages: '/messages',
            login: '/login',
            oauth_discovery: '/.well-known/oauth-authorization-server',
            protected_resource: '/.well-known/oauth-protected-resource',
          },
        });
      });
    }

    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', server: 'onlycashbacks-mcp', version: '1.0.0' });
    });

    // ─── Streamable HTTP /mcp (Codex / OpenAI / Modern MCP Standard) ─
    interface StreamableSession {
      transport: StreamableHTTPServerTransport;
      server: McpServer;
      sessionUid: string | null;
      bearerUid: string | null;
    }
    const streamableSessions = new Map<string, StreamableSession>();

    app.all('/mcp', jsonParser, async (req, res) => {
      try {
      // 1. Check for Bearer token if provided by the client
      let verifiedUid: string | null = null;
      const authHeader = req.headers.authorization;

      if (authHeader) {
        if (!authHeader.startsWith('Bearer ')) {
          res.setHeader('WWW-Authenticate', AUTH_CHALLENGE + ', error="invalid_token"');
          res.status(401).json({ error: 'invalid_token', error_description: 'Malformed Authorization header' });
          return;
        }

        const token = authHeader.slice(7).trim();
        try {
          const decoded = await verifyAccessToken(token);
          verifiedUid = decoded.uid;
        } catch (err: any) {
          res.setHeader('WWW-Authenticate', AUTH_CHALLENGE + ', error="invalid_token"');
          res.status(401).json({ error: 'invalid_token', error_description: 'The access token is invalid or expired.' });
          return;
        }
      }

      // A session ID is a transport identifier, never an account credential.
      const reqSessionId = req.headers['mcp-session-id'] as string | undefined;
      let session = reqSessionId ? streamableSessions.get(reqSessionId) : undefined;
      if (reqSessionId && !session) {
        res.status(404).json({ error: 'Session not found. Initialize a new MCP connection.' });
        return;
      }
      if (session?.bearerUid && verifiedUid !== session.bearerUid) {
        res.setHeader('WWW-Authenticate', AUTH_CHALLENGE);
        res.status(401).json({ error: 'invalid_token' });
        return;
      }
      if (!session) {
        if (req.method !== 'POST' || !isInitializeRequest(req.body)) {
          res.status(400).json({ error: 'Initialize an MCP connection first.' });
          return;
        }
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
          onsessioninitialized: (id) => { streamableSessions.set(id, session!); },
        });
        const state: StreamableSession = { transport, server: null as any, sessionUid: verifiedUid, bearerUid: verifiedUid };
        state.server = createOnlyCashbacksServer(
          () => state.sessionUid,
          (uid: string) => { state.sessionUid = uid; }
        );
        session = state;
        await state.server.connect(transport);
        transport.onclose = () => {
          if (transport.sessionId) streamableSessions.delete(transport.sessionId);
        };
      } else if (verifiedUid) {
        if (session.sessionUid && session.sessionUid !== verifiedUid) {
          res.status(403).json({ error: 'Session belongs to a different account' });
          return;
        }
        session.bearerUid = verifiedUid;
        session.sessionUid = verifiedUid;
      }
      await session.transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error('[MCP] Request failed:', error);
        if (!res.headersSent) res.status(500).json({ error: 'MCP request failed' });
      }
    });

    // ─── Active Connections (Isolated McpServer per Session) ─────────
    interface ActiveSession {
      transport: SSEServerTransport;
      server: McpServer;
      sessionUid: string | null;
      bearerUid: string | null;
    }
    const activeSessions = new Map<string, ActiveSession>();

    // Helper to strictly verify Bearer token
    const verifyBearerToken = async (req: express.Request): Promise<{ uid: string } | null | 'invalid'> => {
      const authHeader = req.headers.authorization;
      if (!authHeader) return null;
      if (!authHeader.startsWith('Bearer ')) return 'invalid';
      const token = authHeader.slice(7).trim();
      if (!token) return 'invalid';
      try {
        const decoded = await verifyAccessToken(token);
        return { uid: decoded.uid };
      } catch {
        return 'invalid';
      }
    };

    app.get('/sse', async (req, res) => {
      const authResult = await verifyBearerToken(req);
      if (authResult === 'invalid') {
        res.setHeader('WWW-Authenticate', AUTH_CHALLENGE + ', error="invalid_token"');
        res.status(401).json({ error: 'invalid_token', error_description: 'The access token is invalid or expired.' });
        return;
      }

      const sseTransport = new SSEServerTransport('/messages', res);
      const sessionId = sseTransport.sessionId;

      // Isolated session state for THIS exact client connection
      const sessionState: ActiveSession = {
        transport: sseTransport,
        server: null as any,
        sessionUid: authResult ? authResult.uid : null,
        bearerUid: authResult ? authResult.uid : null,
      };

      // Dedicated McpServer instance scoped to this session
      const sessionServer = createOnlyCashbacksServer(
        () => sessionState.sessionUid,
        (uid: string) => { sessionState.sessionUid = uid; }
      );
      sessionState.server = sessionServer;

      activeSessions.set(sessionId, sessionState);

      res.on('close', () => {
        activeSessions.delete(sessionId);
        sessionServer.close().catch(() => {});
      });

      await sessionServer.connect(sseTransport);
    });

    // NOTE: This route receives the raw request stream directly, without body-parser
    app.post('/messages', async (req, res) => {
      const sessionId = req.query.sessionId as string;
      const session = activeSessions.get(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (req.headers.authorization) {
        const authResult = await verifyBearerToken(req);
        if (authResult === 'invalid') {
          res.setHeader('WWW-Authenticate', AUTH_CHALLENGE + ', error="invalid_token"');
          res.status(401).json({ error: 'invalid_token', error_description: 'The access token is invalid or expired.' });
          return;
        }
        if (authResult) {
          if (session.sessionUid && session.sessionUid !== authResult.uid) {
            res.status(403).json({ error: 'Session belongs to a different account' });
            return;
          }
          session.sessionUid = authResult.uid;
          session.bearerUid = authResult.uid;
        }
      }

      if (session.bearerUid && !req.headers.authorization) {
        res.setHeader('WWW-Authenticate', AUTH_CHALLENGE);
        res.status(401).json({ error: 'invalid_token' });
        return;
      }
      await session.transport.handlePostMessage(req, res);
    });

    if (distPath) {
      app.get('*', (req, res, next) => {
        if (
          req.path.startsWith('/mcp') ||
          req.path.startsWith('/sse') ||
          req.path.startsWith('/oauth') ||
          req.path.startsWith('/api') ||
          req.path.startsWith('/.well-known') ||
          req.path.startsWith('/health') ||
          req.path.startsWith('/messages') ||
          req.path.startsWith('/login')
        ) {
          return next();
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    return app;
}

async function main() {
  const transport = process.env.MCP_TRANSPORT || (process.env.PORT ? 'sse' : 'stdio');
  if (transport === 'sse' || transport === 'streamable-http') {
    const port = Number(process.env.PORT || 3001);
    createRemoteApp().listen(port, '0.0.0.0', () => {
      console.log(`OnlyCashbacks MCP server listening on port ${port} (/mcp and /sse)`);
    });
  } else {
    // stdio transport for local usage (single-tenant CLI)
    let stdioUid: string | null = null;
    const stdioServer = createOnlyCashbacksServer(
      () => stdioUid,
      (uid: string) => { stdioUid = uid; }
    );
    const stdioTransport = new StdioServerTransport();
    await stdioServer.connect(stdioTransport);
    console.error('OnlyCashbacks MCP Server running on stdio');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
