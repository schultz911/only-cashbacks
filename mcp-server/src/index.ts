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
import { z } from 'zod';
import crypto from 'crypto';

import { CARD_DATA, CARD_DICT } from './data/cards.js';
import { getRecommendations } from './lib/recommendation.js';
import { verifyIdToken, getUserData } from './firebase.js';
import type { MerchantInfo, UserData } from './types.js';
import { getLoginHtml } from './loginHtml.js';

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

// ─── Pending authorization codes for Google Sign-In pairing ───────
interface PendingAuth {
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
function createOnlyCashbacksServer(
  getSessionUid: () => string | null,
  setSessionUid: (uid: string) => void
): McpServer {
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
    async ({ code, idToken }) => {
      // 1. Direct ID token passed
      if (idToken) {
        try {
          const decoded = await verifyIdToken(idToken);
          setSessionUid(decoded.uid);

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

        if (!pending) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ Code "${normCode}" is invalid or expired. Please call \`authenticate\` without arguments to generate a new sign-in link.`,
            }],
            isError: true,
          };
        }

        if (pending.status === 'completed' && pending.uid) {
          setSessionUid(pending.uid);
          const cardCount = pending.cardCount || 0;
          return {
            content: [{
              type: 'text' as const,
              text: `✅ Successfully authenticated as ${pending.displayName || pending.email}!\n\n` +
                `Found ${cardCount} cards in your wallet. Your recommendations are now personalized to your cards!`,
            }],
          };
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
        const userData = getCachedUserData(currentUid);
        const cardCount = userData?.walletCards?.length || 0;
        return {
          content: [{
            type: 'text' as const,
            text: `✅ Already signed in (${cardCount} cards in your wallet). Recommendations are tailored to your cards.`,
          }],
        };
      }

      // 4. Generate new pairing code and return Google sign-in link
      cleanExpiredCodes();
      const newCode = 'OC-' + Math.floor(1000 + Math.random() * 9000);
      pendingAuthCodes.set(newCode, {
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

      // If authenticated for THIS session, mark which cards are in the user's wallet
      const currentUid = getSessionUid();
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
async function main() {
  const transport = process.env.MCP_TRANSPORT || (process.env.PORT ? 'sse' : 'stdio');

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

    // NOTE: express.json() MUST NOT be applied globally!
    // Global express.json() consumes the request stream and breaks SSEServerTransport.handlePostMessage (stream is not readable).
    const jsonParser = express.json();
    const urlEncodedParser = express.urlencoded({ extended: true });

    const PUBLIC_FIREBASE_CONFIG = {
      apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCHALzi5TDkpVQrUqobauyciLZurzjQsX4',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0447512961.firebaseapp.com',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0447512961',
      appId: process.env.VITE_FIREBASE_APP_ID || '1:343088435457:web:14d0c083a241a00a86cb00',
    };

    // ─── OAuth 2.0 / 2.1 State Storage ─────────────────────────────
    interface OAuthRecord {
      uid: string;
      idToken: string;
      codeChallenge?: string;
      codeChallengeMethod?: string;
      expiresAt: number;
    }
    const oauthCodes = new Map<string, OAuthRecord>();

    // ─── MCP OAuth Discovery: RFC 9728 (Protected Resource) ────────
    app.get('/.well-known/oauth-protected-resource', (_req, res) => {
      const baseUrl = getBaseUrl();
      res.json({
        resource: baseUrl,
        authorization_servers: [baseUrl],
        scopes_supported: ['openid', 'profile', 'email', 'wallet'],
        bearer_methods_supported: ['header'],
      });
    });

    // ─── MCP OAuth Discovery: RFC 8414 & OpenID Connect ────────────
    const getOAuthServerMetadata = () => {
      const baseUrl = getBaseUrl();
      return {
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/oauth/authorize`,
        token_endpoint: `${baseUrl}/oauth/token`,
        registration_endpoint: `${baseUrl}/oauth/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256', 'plain'],
        token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
        scopes_supported: ['openid', 'profile', 'email', 'wallet'],
      };
    };

    app.get('/.well-known/oauth-authorization-server', (_req, res) => {
      res.json(getOAuthServerMetadata());
    });

    app.get('/.well-known/openid-configuration', (_req, res) => {
      res.json(getOAuthServerMetadata());
    });

    // Dynamic Client Registration (RFC 7591)
    app.post(['/oauth/register', '/register'], jsonParser, (req, res) => {
      res.status(201).json({
        client_id: 'onlycashbacks-mcp-client',
        client_secret: 'onlycashbacks-mcp-secret',
        redirect_uris: req.body?.redirect_uris || [],
        client_name: req.body?.client_name || 'MCP Client',
      });
    });

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

    // OAuth Authorization Endpoint: renders Google Sign-In page
    app.get(['/oauth/authorize', '/authorize'], (req, res) => {
      const code = 'OC-' + Math.floor(1000 + Math.random() * 9000);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Clear-Site-Data', '"cache"');
      res.send(getLoginHtml(code, PUBLIC_FIREBASE_CONFIG));
    });

    // Approves OAuth authorization code from browser popup
    app.post('/oauth/approve', jsonParser, async (req, res) => {
      const { idToken, codeChallenge, codeChallengeMethod } = req.body || {};
      if (!idToken) {
        res.status(400).json({ success: false, error: 'Missing idToken' });
        return;
      }
      try {
        const decoded = await verifyIdToken(idToken);
        const authCode = 'oc_auth_' + crypto.randomBytes(16).toString('hex');
        oauthCodes.set(authCode, {
          uid: decoded.uid,
          idToken,
          codeChallenge,
          codeChallengeMethod,
          expiresAt: Date.now() + 10 * 60 * 1000,
        });

        // Preload user data
        const userData = await getUserData(decoded.uid);
        if (userData) {
          userSessionCache.set(decoded.uid, { data: userData, authenticatedAt: Date.now() });
        }

        res.json({ success: true, code: authCode });
      } catch (err: any) {
        res.status(401).json({ success: false, error: err.message || 'Verification failed' });
      }
    });

    // OAuth Token Endpoint: exchanges code for Bearer access token
    app.post(['/oauth/token', '/token'], urlEncodedParser, jsonParser, async (req, res) => {
      const grantType = req.body?.grant_type || req.query?.grant_type;
      if (grantType === 'authorization_code') {
        const code = req.body?.code || req.query?.code;
        const verifier = req.body?.code_verifier || req.query?.code_verifier;

        const record = oauthCodes.get(String(code));
        if (!record || Date.now() > record.expiresAt) {
          res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code invalid or expired' });
          return;
        }

        // PKCE verification if challenge was set
        if (record.codeChallenge) {
          if (record.codeChallengeMethod === 'S256') {
            const hash = crypto.createHash('sha256').update(String(verifier || '')).digest('base64url');
            if (hash !== record.codeChallenge) {
              res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE challenge verification failed' });
              return;
            }
          } else if (record.codeChallengeMethod === 'plain' || !record.codeChallengeMethod) {
            if (verifier !== record.codeChallenge) {
              res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE challenge verification failed' });
              return;
            }
          }
        }

        oauthCodes.delete(String(code));

        res.json({
          access_token: record.idToken,
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'oc_refresh_' + record.uid,
          scope: 'openid profile email wallet',
          id_token: record.idToken,
        });
        return;
      }

      res.status(400).json({ error: 'unsupported_grant_type' });
    });

    // Google Sign-In webpage (Manual Pairing Flow)
    app.get('/login', (req, res) => {
      cleanExpiredCodes();
      const code = ((req.query.code as string) || ('OC-' + Math.floor(1000 + Math.random() * 9000))).trim().toUpperCase();
      if (!pendingAuthCodes.has(code)) {
        pendingAuthCodes.set(code, {
          createdAt: Date.now(),
          expiresAt: Date.now() + AUTH_CODE_TTL_MS,
          status: 'pending',
        });
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

      const normCode = String(code).trim().toUpperCase();
      try {
        const decoded = await verifyIdToken(idToken);
        const userData = await getUserData(decoded.uid);
        if (userData) {
          userSessionCache.set(decoded.uid, { data: userData, authenticatedAt: Date.now() });
        }

        const cardCount = userData?.walletCards?.length || 0;
        const displayName = decoded.name || decoded.email || 'OnlyCashbacks User';

        pendingAuthCodes.set(normCode, {
          createdAt: Date.now(),
          expiresAt: Date.now() + AUTH_CODE_TTL_MS,
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
      res.json(pendingAuthCodes.get(code)!);
    });

    const distCandidates = [
      path.resolve(process.cwd(), 'dist'),
      path.resolve(process.cwd(), '../dist'),
      path.resolve(__dirname, '../../dist'),
      path.resolve(__dirname, '../dist'),
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
      sessionUid: string;
    }
    const streamableSessions = new Map<string, StreamableSession>();

    app.all('/mcp', async (req, res) => {
      // 1. Check for Bearer token. If missing, challenge with WWW-Authenticate to trigger host auth UI
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.setHeader(
          'WWW-Authenticate',
          `Bearer realm="onlycashbacks", resource_metadata="${getBaseUrl()}/.well-known/oauth-protected-resource"`
        );
        res.status(401).json({
          error: 'unauthorized',
          error_description: 'Authentication required. Please sign in with your OnlyCashbacks account.',
        });
        return;
      }

      if (!authHeader.startsWith('Bearer ')) {
        res.setHeader('WWW-Authenticate', 'Bearer error="invalid_token", error_description="Malformed Authorization header"');
        res.status(401).json({ error: 'invalid_token', error_description: 'Malformed Authorization header' });
        return;
      }

      const token = authHeader.slice(7).trim();
      let verifiedUid: string;
      try {
        const decoded = await verifyIdToken(token);
        verifiedUid = decoded.uid;
        const userData = await getUserData(decoded.uid);
        if (userData) {
          userSessionCache.set(decoded.uid, { data: userData, authenticatedAt: Date.now() });
        }
      } catch (err: any) {
        res.setHeader('WWW-Authenticate', 'Bearer error="invalid_token", error_description="The access token is invalid or expired."');
        res.status(401).json({ error: 'invalid_token', error_description: 'The access token is invalid or expired.' });
        return;
      }

      // 2. Resolve or create Streamable HTTP session
      const reqSessionId = (req.headers['mcp-session-id'] as string) || (req.query.sessionId as string);
      let session = reqSessionId ? streamableSessions.get(reqSessionId) : undefined;

      if (!session) {
        const sessionId = reqSessionId || crypto.randomUUID();
        let sessionUid = verifiedUid;

        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId,
        });

        const server = createOnlyCashbacksServer(
          () => sessionUid,
          (uid: string) => { sessionUid = uid; }
        );

        session = {
          transport,
          server,
          sessionUid,
        };

        await server.connect(transport);
        streamableSessions.set(sessionId, session);

        transport.onclose = () => {
          streamableSessions.delete(sessionId);
          server.close().catch(() => {});
        };
      } else {
        session.sessionUid = verifiedUid;
      }

      await session.transport.handleRequest(req, res);
    });

    // ─── Active Connections (Isolated McpServer per Session) ─────────
    interface ActiveSession {
      transport: SSEServerTransport;
      server: McpServer;
      sessionUid: string | null;
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
        const decoded = await verifyIdToken(token);
        const userData = await getUserData(decoded.uid);
        if (userData) {
          userSessionCache.set(decoded.uid, { data: userData, authenticatedAt: Date.now() });
        }
        return { uid: decoded.uid };
      } catch {
        return 'invalid';
      }
    };

    app.get('/sse', async (req, res) => {
      const authResult = await verifyBearerToken(req);
      if (authResult === 'invalid') {
        res.setHeader('WWW-Authenticate', 'Bearer error="invalid_token", error_description="The access token is invalid or expired."');
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
          res.setHeader('WWW-Authenticate', 'Bearer error="invalid_token", error_description="The access token is invalid or expired."');
          res.status(401).json({ error: 'invalid_token', error_description: 'The access token is invalid or expired.' });
          return;
        }
        if (authResult) {
          session.sessionUid = authResult.uid;
        }
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

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 OnlyCashbacks MCP Server running on port ${PORT}`);
      console.log(`   SSE endpoint: http://0.0.0.0:${PORT}/sse`);
      console.log(`   Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`   OAuth Discovery: http://0.0.0.0:${PORT}/.well-known/oauth-authorization-server`);
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

main().catch(console.error);
