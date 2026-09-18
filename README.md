# Clipur · Media Command

Internal output-tracking dashboard for the Clipur media team. Every admin edits
it directly; founders read it for a live pulse on output and strategy.

Next.js (App Router) · React 19 · Tailwind v4 · TypeScript · SQLite.

---

## Quick start

Requires **Node.js 24 or newer** ([nodejs.org](https://nodejs.org)). Check with
`node -v`. No database server, compiler or Python needed — see
[Portability](#portability).

```bash
git clone https://github.com/YOUR_USERNAME/clipur-dashboard.git
cd clipur-dashboard
npm install
cp .env.example .env.local     # optional — every value has a working default
npm run seed                   # creates the DB and prints the 7 admin passwords ONCE
npm run dev
```

Open <http://localhost:3000> and sign in with one of the usernames printed by
the seed step.

> **Copy the passwords from `npm run seed` immediately.** Only scrypt hashes are
> stored, so they cannot be printed again. `npm run seed -- --reset-passwords`
> issues a fresh set if they are lost.

On Windows use Git Bash, PowerShell or CMD — `cp` is `copy` in CMD.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build (run `build` first) |
| `npm run seed` | Create/seed the database; prints admin passwords once |
| `npm run seed -- --reset` | Wipe and reseed content (keeps admin accounts) |
| `npm run seed -- --reset-passwords` | Issue new passwords for all seven admins |
| `npm run typecheck` | `tsc --noEmit` |

---

## Portability

The project holds no machine-specific state:

- **No native modules.** Persistence uses Node's built-in `node:sqlite`, so
  `npm install` never compiles C++ and needs no Python, Visual Studio Build
  Tools or Xcode. This is why Node 24 is the floor — that is where `node:sqlite`
  is available unflagged. (The project previously used `better-sqlite3`, which
  failed to install on machines without a full native toolchain.)
- **No absolute paths.** The database path is resolved relative to the project
  root, or from `CLIPUR_DB_PATH`.
- **No hardcoded hosts or ports.** The client calls its own API with relative
  URLs (`/api/...`), so it works on any host, port or domain.
- **No secrets in the repo.** Passwords exist only as scrypt hashes inside the
  database file, which is gitignored.

Environment variables are listed in [`.env.example`](.env.example); all are
optional.

---

## The core rule

**The team is measured on output: posts made against posts target.**

Views are a downstream side effect, never a KPI. In this codebase:

- every progress metric is `postsMade / postsTarget`, or clips-that-day against
  that day's target — `ProgressBar`, `lib/rollup.ts` and `lib/daily.ts` take
  nothing else;
- view counts are optional (`Clip.views?: number | null`) and render as muted
  reference text only;
- one global toggle (`Show views`, **default off**) hides every view count, the
  `PerformanceReference` lists, and the `reach` field in a strategy report;
- nothing ranks, scores, or targets on views.

If you add a feature, keep views out of the progress path.

---

## Structure

Viral is split into three platform boards, each with its own strategy.

**X** — four niches with the 14 accounts split across them. Each account has its
own target, posted count and clips. Niche totals roll up from accounts; the X
platform total rolls up from the niches.

| Niche | Accounts |
| --- | --- |
| AI | MemeBank, Clipur Culture, VyralClips |
| Crypto | CamiClipz, VyralMoments, Vyral News, 1UPClip |
| Streamers | InternetKid69, VyralXYZ, Follow4Clips, LeMemes |
| Clavicular | Monkey Clips, Clipmaxxers, ClipurNewsDaily |

**Instagram and TikTok** share one strategy — mainly Hollywood and Streamer
content — so their work is grouped by content strategy rather than by niche.

**Campaign** is client work, one card per client. **Calendar** is daily history.
**Strategy** and **Reports** round out the five tabs.

---

## Clip logging

Paste the link. That is the whole interaction:

- the clip is appended and the owner's posted count goes up by exactly one;
- a link that normalizes to one already logged for that owner is refused and
  never counted twice;
- normalization (`lib/url.ts`) lowercases the host, drops `www.`, the query
  string and the fragment, and strips a trailing slash — so
  `HTTPS://WWW.X.com/a/status/1/?s=20` and `https://x.com/a/status/1` are the
  same clip;
- every clip is stamped with the day it counts toward (today by default), and
  that date is editable per clip, which is how a day gets backfilled;
- removing a clip gives back the one post it counted for;
- any admin can add or remove clips and change their dates.

### Bulk paste

"Paste multiple" swaps the single-link field for a textarea taking many links at
once, separated by newlines, commas or spaces. De-duplication runs across the
whole batch — against stored clips **and** other links in the same paste — and
the batch is one transaction, so the count bump can never disagree with the
clips that landed. A summary reports how many were added and how many were
skipped as duplicates or invalid.

---

## Daily targets and history

- Each X niche has its own clips/day target; Instagram and TikTok each have one
  at the platform level. All default to **40/day** and are editable in the app.
- A day's progress is the count of clips stamped with that date against that
  date's target.
- Counts derive from `clips.clip_date`, so a day's numbers can never drift from
  the clips themselves.
- Targets are snapshotted per date in `day_targets` the first time a day sees
  activity and are never overwritten, so changing the standing target later
  cannot rewrite history. Today is the exception — it is still in progress, so a
  standing-target change follows it.
- Today rolls into history on its own as the date changes; there is no job to run.

The **Calendar** tab marks each day by how many scopes met their target (solid
blue = all, light blue = half or more, red = under half, grey = nothing logged)
and shows the selected date's per-niche and per-platform progress, plus an
optional per-account breakdown for X.

---

## Auth

Seven individual admin accounts — `simon`, `preston`, `alec`, `shashwat`,
`max`, `himansh`, `meet` — all **full admins with identical rights**. Nothing is
dev-only: targets, posted counts, clips, dates, accounts, niches, IG/TikTok
items, campaigns, strategies and reports are all editable in the app.

- Passwords are generated by `npm run seed`, printed once, and stored only as
  scrypt hashes with a per-user salt.
- Sessions are opaque random tokens in the `sessions` table, carried in an
  HttpOnly, SameSite=Lax cookie (30 days).
- Each admin can rotate their own password from the account menu; that signs out
  their other sessions.
- Every mutation route goes through `withAdmin`, so an unauthenticated request
  cannot reach the store. `/` redirects to `/login`.

---

## Storage

SQLite on disk via `node:sqlite` — a real server-side store, shared by everyone
using that server, surviving restarts. No localStorage, nothing in memory.

- Database file: `data/clipur.db` (gitignored — it holds password hashes and
  live team data). Override with `CLIPUR_DB_PATH`.
- Schema lives in `lib/schema.mjs`, imported by both the app and the seed script
  so the two cannot drift. It is created and migrated on boot.
- `lib/daily.ts` owns daily targets and calendar queries; `lib/repo.ts` owns
  everything else. Clip counting and de-duplication are enforced there and by a
  `UNIQUE(owner_type, owner_id, normalized_url)` index, so the invariant holds
  even against a direct write.

### Moving to another machine or a server

The code is portable; **the data is not copied by git**. A fresh clone starts
with an empty database.

- To start clean: `npm run seed`.
- To carry the real data across: copy `data/clipur.db` (plus any `-wal` and
  `-shm` files) to the same path on the target machine. Do not email it — it
  contains password hashes and all team data.
- Each machine running its own copy has its own separate data. For the team to
  share one dataset, deploy once and have everyone use that URL.

### Deployment notes

- The app needs a **persistent writable disk** for the SQLite file. A VPS, or
  Fly.io / Railway / Render with a mounted volume, works. Vercel's serverless
  filesystem does **not** — that would mean swapping SQLite for Postgres, which
  is contained to `lib/repo.ts` and `lib/daily.ts`.
- Session cookies are marked `Secure` when `NODE_ENV=production`, so production
  must be served over **HTTPS** or nobody can stay signed in.
- Set `CLIPUR_DB_PATH` to the mounted volume, then run `npm run seed` once on
  the server.

---

## Layout

```
app/
  page.tsx              auth gate -> <AppShell />, seeded with server state
  login/page.tsx        redirects away if already signed in
  api/
    auth/               login, logout, me, password
    state/              GET the whole dashboard
    calendar/           GET a month of daily history (+ per-account breakdown)
    daily-targets/      GET / PATCH standing and per-date targets
    clips/bulk/         POST many pasted links in one transaction
    niches/  accounts/  items/  clips/  strategies/  reports/
components/
  AppShell.tsx          providers + tabs
  Header.tsx            logo, Content Folder link, views toggle, account menu
  auth/                 LoginForm, AccountMenu, ChangePasswordModal
  providers/            ViewsProvider (global toggle), ToastProvider, DataProvider
  shared/               ProgressBar, ClipList, TrackedCard, PerformanceReference,
                        EditableText, EditableNumber, StatusSelect, DeleteButton,
                        InlineAddForm, FilterBar, ClipDate, BulkClipForm
  viral/                PlatformSwitch, XBoard, PlatformBoard, SectionHeader
  calendar/             MonthGrid, DayDetail, DayScopeRow, StandingTargets
  tabs/                 ViralTab, CampaignTab, CalendarTab, StrategyTab, ReportsTab
lib/
  types.ts   domain types                     schema.mjs  shared DDL + migrations
  db.ts      connection, transactions          crypto.mjs  shared scrypt helpers
  auth.ts    sessions, login, password change  rollup.ts   account -> niche -> platform
  repo.ts    reads and writes                  daily.ts    daily targets + calendar
  url.ts     clip URL normalization            date.ts     ISO date / month helpers
  api.ts     route-handler plumbing            config.ts / format.ts / views.ts
scripts/seed.mjs        seeds content + admins, prints credentials once
```

`DataProvider` is the client's only route to the store: each mutation posts to an
API route and replaces local state with the authoritative state the server
returns, so two admins editing at once converge. State also refreshes when the
tab regains focus.

---

## Configuration

**Content folder link.** `lib/config.ts` exports `CONTENT_FOLDER_URL`, pointing
at the team's shared Drive folder. Override per-deployment with
`NEXT_PUBLIC_CONTENT_FOLDER_URL`.

**Views default.** `SHOW_VIEWS_DEFAULT` in `lib/config.ts` — leave it `false`.

**Daily target default.** `DEFAULT_DAILY_TARGET` in `lib/schema.mjs` (40) is only
the fallback for a scope that has never been configured.

---

## Wiring views to a real API

`lib/views.ts` holds the abstraction. The UI only ever reads `Clip.views`, so
swapping the source touches no components: implement
`ViewsProvider.fetchViews(clips)` against the X / YouTube API, export it as
`viewsProvider`, and merge results with `applyViews(clips, counts, "api")`.
Clips with `viewsSource: "api"` render with an `· auto` marker.
