# ATLAS World Quest

A standalone, free-to-play geography and RWA learning game. Five questions per expedition, wallet passports, regional stamps, weekly/all-time rankings and an optional Robinhood Chain Testnet score registry.

## Run

Node 24 or newer:

```sh
npm ci
npm run dev
npm test
npm run build
npm run contract:build
```

Open http://127.0.0.1:5180. Local development uses SQLite under ignored `data/`. Production requires PostgreSQL; it never silently falls back to a temporary or fake leaderboard. No wallet or database is required for practice mode.

## Ranked rules

- One five-question ranked expedition per wallet per UTC day. Starting again resumes it. An unfinished previous-day run expires without points.
- 25 seconds per question, enforced by the server. A correct answer earns 100 + 10 times the current consecutive-answer streak, up to 150. Maximum round score: 650.
- Feedback reading time does not consume the next question timer. Submissions are versioned atomically so retries cannot award twice.
- Points and discovered regional stamps are saved only when the expedition is completed. Lifetime totals persist; detailed rounds are retained for approximately 90 days per active player.
- Weekly standings start Monday 00:00 UTC. Equal scores use wallet address order; no financial reward is determined by that tiebreak.
- Practice uses a separate question bank. It never awards ranked points.

## Deploy separately on Vercel

Import this repository as a new Vite project with its root at `.`. Connect a **free Neon Postgres database** through Vercel Storage/Marketplace. Avoid a paid plan or auto-upgrade. Vercel should inject `DATABASE_URL` (or set it to the provider's pooled PostgreSQL connection URL).

Add private server environment variables:

| Variable | Purpose |
| --- | --- |
| `APP_ORIGIN` | Exact canonical HTTPS origin, without a trailing slash |
| `DATABASE_URL` | PostgreSQL connection URL supplied by the integration |
| `SESSION_SECRET` | At least 32 random bytes; generate independently for each environment |
| `SCORE_SIGNER_PRIVATE_KEY` | Optional dedicated score-attestation key; never a funded personal wallet |
| `SCORE_CONTRACT_ADDRESS` | Optional deployed AtlasWorldQuest address on chain 46630 |

Never prefix secrets with `VITE_`, commit them or put them in chat. Database schema is created on first use. `npm run db:init` can initialize it explicitly. Use an isolated preview database/origin; production credentials should not be exposed to untrusted preview branches.

Without database/session configuration, the public app clearly keeps ranked play closed and leaves practice open. Without the score contract and signer, verified points work but onchain recording stays disabled.

## Onchain score registry

`contracts/AtlasWorldQuest.sol` stores authorized scores only. It holds no tokens, has no redemption mechanism and accepts no funds. The server signs an EIP-712 receipt binding player, round, day, points, chain, contract and expiration. Players approve their own zero-value testnet transaction and pay testnet gas. The contract rejects replayed rounds, duplicate player/day submissions, forged scores and out-of-range points.

Compile with `npm run contract:build`. Deploy the artifact on **Robinhood Chain Testnet, chain ID 46630**, passing the dedicated scorer's public address to the constructor. The deployer must confirm the deployment in their own wallet. Set the signer key and contract address in Vercel server environment variables, then redeploy. The scorer is immutable: rotation requires a new contract. Keep the signer offline from public logs and use a dedicated secret store.

- RPC: https://rpc.testnet.chain.robinhood.com
- Faucet: https://faucet.testnet.chain.robinhood.com/
- Explorer: https://explorer.testnet.chain.robinhood.com

The registry trusts the game server's scoring. An onchain receipt does not independently verify a player's answers, humanity, real-world asset ownership or eligibility for any platform reward. Existing offchain points do not gain extra points when recorded.

## Security and honest scope

Wallet authentication uses one-use, expiring, domain-bound messages and HttpOnly/SameSite cookies. POST requests enforce the canonical Origin. The server chooses questions, checks deadlines, scores answers and applies atomic updates. Scores supplied by the client are ignored. Basic database-backed request limits reduce casual flooding.

This MVP is **not Sybil-proof, bot-proof or suitable for valuable rewards without further controls**. One wallet is not one person. The initial public question bank can be studied; 30 ranked questions and five practice questions demonstrate the game. A production competition needs a much larger maintained bank, abuse review and rules before any token conversion. Login supports Rabby and other injected EVM wallets using EIP-6963 discovery and an explicit wallet selector. Login signs on the wallet current network; score recording switches to Robinhood Chain Testnet. WalletConnect QR pairing and smart-contract-account signatures are not implemented. In-app browsers without a wallet extension show connection instructions. Signing out clears this browser's session; issued sessions expire after 24 hours.

Ranked wallet addresses and scores are public. We store wallet address, scores, regional progress, active round state, short-lived login nonces and hashed request-limit identifiers. No private wallet keys are requested. ATLAS Points have no cash value or guaranteed token conversion. Official Vibe Vibers NFT perks and builder reward calculations are not integrated.

Tests cover wallet signatures and replay, session tampering/expiry, HTTP authentication and CSRF, daily replay/concurrency, deadlines, point persistence and real local-EVM contract execution.

## Production checks and owner activation

Vercel uses explicit nested routes in `api/auth/[action].js` and `api/round/[action].js`; a single root dynamic function does not cover these nested paths. Run `node scripts/smoke-production.js https://atlas-world-quest.vercel.app` after deploying to verify real hosted authentication and ranked routes. It uses an unfunded temporary test wallet and does not complete a round or create a leaderboard score.

The owner setup page is `/deploy.html`. It contains only the public score-signer address and compiled contract creation data. Open it in a browser with Rabby, connect, get faucet test ETH, and personally approve the zero-value testnet deployment. The page verifies the creation data and trusted signer before displaying the contract address. Set that address as `SCORE_CONTRACT_ADDRESS` alongside the corresponding private production signer key in Vercel, then redeploy. This page does not configure the server or grant anyone administrator privileges. Never upload `.env.score-setup`; it is ignored by Git and contains the dedicated signer secret.
