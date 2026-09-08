import type { Strategy, TrackedItem, WeeklyReport } from "./types";

/**
 * Seed data for the prototype. Replace these exports with fetches from a real
 * backend later — the shapes are the contract the UI depends on.
 *
 * Note: some clips carry views, some carry `null`, some omit the field
 * entirely. All three must render correctly, and none of them affect progress.
 */

/** Viral — grouped by niche. */
export const seedViralItems: TrackedItem[] = [
  {
    id: "niche-combat",
    name: "Combat sports",
    status: "ongoing",
    postsTarget: 40,
    postsMade: 27,
    clips: [
      {
        id: "clip-combat-1",
        url: "https://x.com/clipur/status/1811223344",
        label: "Weigh-in staredown edit",
        views: 412000,
        viewsSource: "manual",
      },
      {
        id: "clip-combat-2",
        url: "https://www.youtube.com/shorts/9dK2mQpLxT0",
        label: "Round 3 comeback",
        views: 86400,
        viewsSource: "manual",
      },
      {
        id: "clip-combat-3",
        url: "https://x.com/clipur/status/1811990011",
        label: "Post-fight presser reaction",
        views: null,
      },
      {
        id: "clip-combat-4",
        url: "https://www.tiktok.com/@clipur/video/7391122334455",
      },
    ],
  },
  {
    id: "niche-streaming",
    name: "Streaming culture",
    status: "ongoing",
    postsTarget: 30,
    postsMade: 12,
    clips: [
      {
        id: "clip-stream-1",
        url: "https://x.com/clipur/status/1812004455",
        label: "Chat turns on the streamer",
        views: 158000,
        viewsSource: "manual",
      },
      {
        id: "clip-stream-2",
        url: "https://www.youtube.com/shorts/Lp4XnQ8vRb1",
        label: "Sub-a-thon hour 61",
        views: null,
      },
      {
        id: "clip-stream-3",
        url: "https://x.com/clipur/status/1812118899",
      },
    ],
  },
  {
    id: "niche-crypto",
    name: "Crypto / finance",
    status: "upcoming",
    postsTarget: 24,
    postsMade: 0,
    clips: [],
  },
  {
    id: "niche-gaming",
    name: "Gaming drama",
    status: "completed",
    postsTarget: 20,
    postsMade: 20,
    clips: [
      {
        id: "clip-gaming-1",
        url: "https://x.com/clipur/status/1809771122",
        label: "Tournament DQ explainer",
        views: 733000,
        viewsSource: "manual",
      },
      {
        id: "clip-gaming-2",
        url: "https://www.youtube.com/shorts/Tz9WqE2nHs4",
        label: "Speedrun world record cut",
        views: 240500,
        viewsSource: "manual",
      },
      {
        id: "clip-gaming-3",
        url: "https://www.tiktok.com/@clipur/video/7388001122334",
        label: "Devs respond to the backlash",
        views: 51200,
        viewsSource: "manual",
      },
    ],
  },
];

/** Campaign — grouped by client. */
export const seedCampaignItems: TrackedItem[] = [
  {
    id: "client-gosh",
    name: "Gosh.com",
    status: "ongoing",
    postsTarget: 50,
    postsMade: 34,
    clips: [
      {
        id: "clip-gosh-1",
        url: "https://x.com/gosh/status/1812554433",
        label: "Launch teaser cut A",
        views: 96000,
        viewsSource: "manual",
      },
      {
        id: "clip-gosh-2",
        url: "https://x.com/gosh/status/1812556677",
        label: "Launch teaser cut B",
        views: 41200,
        viewsSource: "manual",
      },
      {
        id: "clip-gosh-3",
        url: "https://www.youtube.com/shorts/Rm7YtVc0Kd9",
        label: "Founder soundbite",
        views: null,
      },
      {
        id: "clip-gosh-4",
        url: "https://www.tiktok.com/@gosh/video/7392556677889",
      },
      {
        id: "clip-gosh-5",
        url: "https://x.com/gosh/status/1812889900",
        label: "Community reply thread clip",
      },
    ],
  },
  {
    id: "client-handlpay",
    name: "HandlPay",
    status: "ongoing",
    postsTarget: 36,
    postsMade: 9,
    clips: [
      {
        id: "clip-handl-1",
        url: "https://x.com/handlpay/status/1812667788",
        label: "Checkout demo, 12s cut",
        views: 22800,
        viewsSource: "manual",
      },
      {
        id: "clip-handl-2",
        url: "https://x.com/handlpay/status/1812669900",
      },
    ],
  },
  {
    id: "client-duel",
    name: "Duel",
    status: "upcoming",
    postsTarget: 28,
    postsMade: 3,
    clips: [
      {
        id: "clip-duel-1",
        url: "https://www.youtube.com/shorts/Qb3ZmXf7Nu2",
        label: "Pre-launch tease",
        views: null,
      },
    ],
  },
  {
    id: "client-northbeam",
    name: "Northbeam Labs",
    status: "completed",
    postsTarget: 18,
    postsMade: 18,
    clips: [
      {
        id: "clip-north-1",
        url: "https://x.com/northbeam/status/1807334455",
        label: "Case study hook",
        views: 129000,
        viewsSource: "manual",
      },
      {
        id: "clip-north-2",
        url: "https://www.youtube.com/shorts/Vn8LpQ3xWe5",
        label: "Ops teardown, part 2",
        views: 64300,
        viewsSource: "manual",
      },
    ],
  },
];

export const seedStrategies: Strategy[] = [
  {
    id: "strategy-serial",
    title: "Serialised clip arcs",
    description:
      "Cut each fight week into a numbered 4-part arc instead of standalone posts. Part 1 seeds the conflict, part 4 pays it off — every post carries the next one, so posting cadence compounds rather than resetting daily.",
    status: "ongoing",
    selected: true,
  },
  {
    id: "strategy-reply",
    title: "Reply-guy distribution",
    description:
      "Post the clip natively, then place cut-downs as replies under the three largest accounts already discussing the moment within the first 20 minutes. Doubles surface area per clip made, with no extra edit time.",
    status: "ongoing",
    selected: false,
  },
  {
    id: "strategy-vertical",
    title: "Vertical-first client edits",
    description:
      "Move every client deliverable to a 9:16 master with a 16:9 export as the secondary. Editors cut once; the team ships to three platforms from the same file, raising posts made per editing hour.",
    status: "in_discussion",
    selected: false,
  },
  {
    id: "strategy-batching",
    title: "Monday batch, daily drip",
    description:
      "Batch the full week of edits on Monday, then release on a fixed daily schedule. Protects the weekly output target from mid-week client fire drills.",
    status: "concluded",
    selected: true,
    report: {
      reach: "1.4M across 6 weeks (reference only)",
      topClip: "Combat sports — Weigh-in staredown edit",
      verdict:
        "Keep it. Weekly posts made rose from 41 to 58 and, more importantly, stopped collapsing on weeks with client escalations. Recommend making Monday batching the default for all niches and rolling it into campaign work next quarter.",
    },
  },
];

export const seedWeeklyReports: WeeklyReport[] = [
  {
    id: "report-w36",
    week: "Week 36 · Sep 1 – Sep 7, 2026",
    summary:
      "58 posts made against a 60 target. Combat sports and Gosh.com both cleared their weekly quota; HandlPay is behind after a two-day asset delay on the client side. Northbeam Labs closed out at full target. Monday batching held through a mid-week escalation.",
    postedDate: "2026-09-08",
  },
  {
    id: "report-w35",
    week: "Week 35 · Aug 25 – Aug 31, 2026",
    summary:
      "52 posts made against a 60 target. Streaming culture under-delivered while two editors were onboarding; Gosh.com absorbed the spare capacity and ran four ahead. Crypto / finance stayed parked pending the niche brief.",
    postedDate: "2026-09-01",
  },
  {
    id: "report-w34",
    week: "Week 34 · Aug 18 – Aug 24, 2026",
    summary:
      "61 posts made against a 55 target — first week fully on the batching schedule. Gaming drama wrapped its run at 20/20. Duel kickoff pushed a week at the client request.",
    postedDate: "2026-08-25",
  },
];
