# Clipur · Media Command

Internal dashboard for the Clipur media team. The team keeps it current; founders
read it for a live pulse on output and strategy.

```bash
npm install
npm run dev
```

## The core rule

**The team is measured on output: posts made against posts target.**

Views are a downstream side effect, never a KPI. Concretely, in this codebase:

- every progress metric is `postsMade / postsTarget` — `ProgressBar` takes
  `made` and `target` and nothing else;
- view counts are optional (`Clip.views?: number | null`) and render as muted
  reference text only;
- one global toggle (`Show views`, **default off**) hides every view count,
  the manual views input, the per-item `PerformanceReference` lists, and the
  `reach` figure inside a strategy report;
- nothing ranks, scores, or targets on views. The one views-ordered list is
  `PerformanceReference`, which is collapsed, visually secondary, and labelled
  "not a target".

If you add a feature here, keep views out of the progress path.

## Layout

```
app/
  layout.tsx            root shell
  page.tsx              seed data -> <Dashboard />; swap for backend fetches here
  globals.css           theme tokens (white/blue light) + progress gradient
components/
  Header.tsx            logo placeholder, Content Folder link, views toggle
  Tabs.tsx              Viral · Campaign · Strategy · Reports
  Dashboard.tsx         state root: all mutation handlers live here
  ViewsToggle.tsx       the one global views switch
  providers/
    ViewsProvider.tsx   global show/hide views context (default off)
    ToastProvider.tsx   "Noted for founders" toasts
  shared/               used by BOTH Viral and Campaign
    TrackedBoard.tsx    status filter + roll-up progress + card grid
    TrackedItemCard.tsx one niche or one client
    ProgressBar.tsx     postsMade / postsTarget, gradient fill
    ClipList.tsx        paste url (+ optional label) to append a clip
    PerformanceReference.tsx  views-ranked list, gated + secondary
    FilterBar.tsx       generic segmented filter
    StatusBadge.tsx
  tabs/
    StrategyTab.tsx, StrategyCard.tsx, StrategyReportModal.tsx
    ReportsTab.tsx
lib/
  types.ts              Clip, TrackedItem, Strategy, WeeklyReport
  data.ts               seed mock data
  config.ts             CONTENT_FOLDER_URL, app name, views default
  views.ts              ViewsProvider abstraction (manual today, API later)
  format.ts             view/date/percent/url helpers
```

Viral and Campaign are the same components. They differ only in the grouping
label passed to `TrackedBoard` — `Niche` vs `Client`.

## Configuration

**Content folder link.** `lib/config.ts` exports `CONTENT_FOLDER_URL`, currently
the placeholder `REPLACE_WITH_DRIVE_URL`. Replace it, or set
`NEXT_PUBLIC_CONTENT_FOLDER_URL`. The header link shows a "not set" hint until
it is a real URL.

**Views default.** `SHOW_VIEWS_DEFAULT` in `lib/config.ts` — leave it `false`.

## Wiring views to a real API

`lib/views.ts` holds the abstraction. The UI only ever reads `Clip.views`, so
swapping the source touches no components:

1. implement `ViewsProvider.fetchViews(clips)` against the X / YouTube API,
2. export it as `viewsProvider`,
3. call it where clips are loaded and merge with `applyViews(clips, counts, "api")`.

Clips carrying `viewsSource: "api"` render with an `· auto` marker. A clip whose
views come back `null` renders exactly like a clip that never had views — that
case is normal and must stay normal.

## Adding a backend

State is React-only for the prototype (no localStorage, by design). All mutation
is centralised in `components/Dashboard.tsx`: `addClip`, `adjustPosts`, and
`selectStrategy`. Point those three at an API and replace the seed imports in
`app/page.tsx`; the component tree is unchanged.
