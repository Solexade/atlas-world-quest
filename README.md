# ATLAS World Quest

A standalone, free-to-play geography and RWA learning game. Five questions per expedition, username passports, regional stamps and weekly/all-time rankings.

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

## Ten-level campaign

- 10 progressively harder levels, each drawing five questions from its own ten-question bank (100 campaign questions total).
- Levels 1–5 cover geography and landmarks; 6 adds map reasoning; 7 covers infrastructure calculations; 8 introduces hypothetical asset evidence; 9–10 combine multiple reasoning steps.
- Pass accuracy is 90%. Five equally weighted questions only allow 0/20/40/60/80/100%, so **5/5 is required**. Points and accuracy are different metrics.
- Failed levels can be retried immediately with shuffled questions/options. Unfinished levels resume, even across UTC midnight. Locked levels are enforced server-side.
- 25 seconds per question, enforced by the server. Correct answers earn 100 plus a 10-point consecutive-answer bonus, capped at 150. Only the first successful clear awards 650 ranked points and stamps; all ten levels award 6,500 points maximum. Failed attempts award zero ranked points.
- Existing historical expedition points and stamps are preserved. Everyone begins the new campaign at level 1; old daily runs do not unlock levels.
- Answers and explanations are omitted from ranked and practice API payloads and feedback. The UI shows correct/incorrect and accuracy only. The public source repository still contains the educational question bank; this is not a secure examination.
- Weekly rankings use first-clear completion dates, with Monday 00:00 UTC as the boundary. Lifetime totals remain. Equal scores use Explorer ID order.
- Practice never awards ranked points or unlocks levels. Its five-question bank is separate.

## Username passports

Choose a public explorer name to start; no wallet, Google account or email is required. A signed HttpOnly, SameSite=Strict cookie remembers this browser for up to one year. Scores, stamps and completed rounds remain in PostgreSQL (SQLite for local development). Names are display labels and are not unique or passwords.

A private recovery code is displayed once when creating a passport. Save it privately to restore progress on another browser or after clearing cookies. Only a SHA-256-derived identity is stored; the raw recovery code is not stored. Without the cookie or recovery code, a name alone cannot recover progress. Switching explorers clears this browser session, not the saved profile.

Existing wallet records are retained in the database and leaderboard, labelled as legacy entries. They are not automatically transferred to a guest passport. Wallet authentication and onchain receipt routes are retired (HTTP 410); the historical contract and signature helpers remain for compatibility/reference and regression testing. No transactions are requested by the current game.

## Deploy separately on Vercel

Use the existing atlas-world-quest Vite project and free Neon PostgreSQL integration. Keep these server-only variables configured:

| Variable | Purpose |
| --- | --- |
| APP_ORIGIN | Exact canonical HTTPS origin, without a trailing slash |
| DATABASE_URL | Existing pooled PostgreSQL connection URL |
| SESSION_SECRET | Existing random secret of at least 32 characters; changing it signs everyone out |

Do not prefix secrets with VITE_ or commit them. No Google OAuth keys or wallet configuration are needed. The existing generic records table requires no destructive migration. Without database/session configuration, practice remains available and ranked play stays closed.

Vercel uses explicit nested routes in api/auth/[action].js and api/round/[action].js. The root dynamic function alone does not handle these paths. Run `node scripts/smoke-production.js https://atlas-world-quest.vercel.app` after deployment. This creates one disposable zero-score passport and unfinished round, checks recovery and session persistence, and does not add a leaderboard result. Use an isolated database for routine development tests.

## Security and scope

The server selects questions, checks deadlines, computes points and uses atomic updates to prevent duplicate awards. POST requests enforce APP_ORIGIN and JSON; account creation/recovery and gameplay have request limits. Guest passports are not verified identities: users can create multiple profiles, so these rankings are not Sybil-proof or suitable for valuable rewards without additional controls.

Public usernames, scores and legacy wallet addresses appear on the leaderboard. Saved data includes explorer identity, name, scores, cleared levels, regional progress, active rounds and hashed rate-limit identifiers. No email or private wallet keys are requested. ATLAS Points have no cash value or guaranteed token conversion. Official Vibe Vibers NFT perks and builder reward calculations are not integrated.

## Validation and visual assets

Run `npm test` and `npm run build`. Tests cover guest creation/recovery, duplicate names, cookie tampering, origin enforcement, daily replay/concurrency, deadlines, score persistence, plus retained legacy wallet/contract helpers.

The October visual refresh uses a midnight navy, cyan and warm gold palette, responsive cards, accessible answer buttons and an original illustrated discovery globe at public/world_discovery.png. Generated with OpenAI imagegen for this project; no third-party character or map assets were imported. The image is conceptual artwork, not an accurate geographic map. Art direction: detailed illustrated continents/oceans, tiny landmarks, baobab, towers, pagoda, coastal city and desert monument connected by a golden exploration trail; navy twilight with cyan, gold, coral and violet; no text, people, logos or interface elements.

## Level release verification

20 tests pass, including all ten clears, 80% rejection, locked-level requests, retries, concurrent final submissions, cross-midnight resume, legacy totals, recovery, and absence of answer/explanation fields. Build passes. Browser verification covers level selection, timed-out feedback, failed-level retry and mobile layout.

Question reference spot-checks: [UNESCO Victoria Falls](https://whc.unesco.org/en/list/509), [UNESCO Alhambra](https://whc.unesco.org/en/list/314), [UNESCO Borobudur](https://whc.unesco.org/en/list/592), [Parks Australia Uluru](https://uluru.gov.au/). Numerical scenarios are authored examples with explicit assumptions, not investment forecasts.
