import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "../db";

const { jobs, tracerClickEvents, tracerLinks } = schema;

type AnalyticsFilterArgs = {
  jobId?: string | null;
  from?: number | null;
  to?: number | null;
  includeBots?: boolean;
  limit?: number;
};

export type TracerLinkStatsRow = {
  tracerLinkId: string;
  token: string;
  sourcePath: string;
  sourceLabel: string;
  destinationUrl: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  clicks: number;
  uniqueOpens: number;
  botClicks: number;
  humanClicks: number;
  lastClickedAt: number | null;
};

function normalizeLimit(
  limit: number | null | undefined,
  fallback = 20,
): number {
  if (!Number.isFinite(limit)) return fallback;
  return Math.max(1, Math.min(500, Math.floor(limit as number)));
}

function normalizeNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  return Number(value ?? 0);
}

function buildEventFilters(args: AnalyticsFilterArgs) {
  const filters = [];

  if (typeof args.from === "number") {
    filters.push(gte(tracerClickEvents.clickedAt, args.from));
  }

  if (typeof args.to === "number") {
    filters.push(lte(tracerClickEvents.clickedAt, args.to));
  }

  if (typeof args.jobId === "string" && args.jobId.trim().length > 0) {
    filters.push(eq(tracerLinks.jobId, args.jobId.trim()));
  }

  if (!args.includeBots) {
    filters.push(eq(tracerClickEvents.isLikelyBot, false));
  }

  return filters;
}

export async function getOrCreateTracerLink(args: {
  jobId: string;
  sourcePath: string;
  sourceLabel: string;
  destinationUrl: string;
  destinationUrlHash: string;
}): Promise<typeof tracerLinks.$inferSelect> {
  const now = new Date().toISOString();

  const [existing] = await db
    .select()
    .from(tracerLinks)
    .where(
      and(
        eq(tracerLinks.jobId, args.jobId),
        eq(tracerLinks.sourcePath, args.sourcePath),
        eq(tracerLinks.destinationUrlHash, args.destinationUrlHash),
      ),
    )
    .limit(1);

  if (existing) return existing;

  for (let attempt = 0; attempt < 5; attempt++) {
    const token = createId();

    const insertResult = await db
      .insert(tracerLinks)
      .values({
        id: createId(),
        token,
        jobId: args.jobId,
        sourcePath: args.sourcePath,
        sourceLabel: args.sourceLabel,
        destinationUrl: args.destinationUrl,
        destinationUrlHash: args.destinationUrlHash,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({
        target: [
          tracerLinks.jobId,
          tracerLinks.sourcePath,
          tracerLinks.destinationUrlHash,
        ],
      })
      .run();

    if (insertResult.changes > 0) {
      const [created] = await db
        .select()
        .from(tracerLinks)
        .where(eq(tracerLinks.token, token))
        .limit(1);
      if (created) return created;
    }

    const [reused] = await db
      .select()
      .from(tracerLinks)
      .where(
        and(
          eq(tracerLinks.jobId, args.jobId),
          eq(tracerLinks.sourcePath, args.sourcePath),
          eq(tracerLinks.destinationUrlHash, args.destinationUrlHash),
        ),
      )
      .limit(1);
    if (reused) return reused;
  }

  throw new Error("Failed to create tracer link after retries");
}

export async function findActiveTracerLinkByToken(token: string): Promise<{
  id: string;
  token: string;
  jobId: string;
  destinationUrl: string;
  sourcePath: string;
  sourceLabel: string;
} | null> {
  const [row] = await db
    .select({
      id: tracerLinks.id,
      token: tracerLinks.token,
      jobId: tracerLinks.jobId,
      destinationUrl: tracerLinks.destinationUrl,
      sourcePath: tracerLinks.sourcePath,
      sourceLabel: tracerLinks.sourceLabel,
    })
    .from(tracerLinks)
    .where(and(eq(tracerLinks.token, token), eq(tracerLinks.isActive, true)))
    .limit(1);

  return row ?? null;
}

export async function insertTracerClickEvent(args: {
  tracerLinkId: string;
  clickedAt: number;
  requestId: string | null;
  isLikelyBot: boolean;
  deviceType: string;
  uaFamily: string;
  osFamily: string;
  referrerHost: string | null;
  ipHash: string | null;
  uniqueFingerprintHash: string | null;
}): Promise<void> {
  await db.insert(tracerClickEvents).values({
    id: createId(),
    tracerLinkId: args.tracerLinkId,
    clickedAt: args.clickedAt,
    requestId: args.requestId,
    isLikelyBot: args.isLikelyBot,
    deviceType: args.deviceType,
    uaFamily: args.uaFamily,
    osFamily: args.osFamily,
    referrerHost: args.referrerHost,
    ipHash: args.ipHash,
    uniqueFingerprintHash: args.uniqueFingerprintHash,
  });
}

export async function listTracerLinkStatsByJob(
  jobId: string,
  args: Omit<AnalyticsFilterArgs, "jobId"> = {},
): Promise<TracerLinkStatsRow[]> {
  const joinFilters = [];
  if (typeof args.from === "number") {
    joinFilters.push(gte(tracerClickEvents.clickedAt, args.from));
  }
  if (typeof args.to === "number") {
    joinFilters.push(lte(tracerClickEvents.clickedAt, args.to));
  }
  if (!args.includeBots) {
    joinFilters.push(eq(tracerClickEvents.isLikelyBot, false));
  }

  const rows = await db
    .select({
      tracerLinkId: tracerLinks.id,
      token: tracerLinks.token,
      sourcePath: tracerLinks.sourcePath,
      sourceLabel: tracerLinks.sourceLabel,
      destinationUrl: tracerLinks.destinationUrl,
      createdAt: tracerLinks.createdAt,
      updatedAt: tracerLinks.updatedAt,
      isActive: tracerLinks.isActive,
      clicks: sql<number>`count(${tracerClickEvents.id})`,
      uniqueOpens: sql<number>`count(distinct ${tracerClickEvents.uniqueFingerprintHash})`,
      botClicks: sql<number>`coalesce(sum(case when ${tracerClickEvents.isLikelyBot} = 1 then 1 else 0 end), 0)`,
      lastClickedAt: sql<number | null>`max(${tracerClickEvents.clickedAt})`,
    })
    .from(tracerLinks)
    .leftJoin(
      tracerClickEvents,
      and(eq(tracerLinks.id, tracerClickEvents.tracerLinkId), ...joinFilters),
    )
    .where(eq(tracerLinks.jobId, jobId))
    .groupBy(tracerLinks.id)
    .orderBy(
      desc(sql`count(${tracerClickEvents.id})`),
      desc(sql`max(${tracerClickEvents.clickedAt})`),
      desc(tracerLinks.updatedAt),
    );

  return rows.map((row) => {
    const clicks = normalizeNumber(row.clicks);
    const botClicks = normalizeNumber(row.botClicks);
    return {
      tracerLinkId: row.tracerLinkId,
      token: row.token,
      sourcePath: row.sourcePath,
      sourceLabel: row.sourceLabel,
      destinationUrl: row.destinationUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      isActive: Boolean(row.isActive),
      clicks,
      uniqueOpens: normalizeNumber(row.uniqueOpens),
      botClicks,
      humanClicks: Math.max(0, clicks - botClicks),
      lastClickedAt:
        row.lastClickedAt === null ? null : normalizeNumber(row.lastClickedAt),
    };
  });
}

export async function getTracerAnalyticsTotals(
  args: AnalyticsFilterArgs,
): Promise<{
  clicks: number;
  uniqueOpens: number;
  botClicks: number;
  humanClicks: number;
}> {
  const filters = buildEventFilters(args);
  const [row] = await db
    .select({
      clicks: sql<number>`count(${tracerClickEvents.id})`,
      uniqueOpens: sql<number>`count(distinct ${tracerClickEvents.uniqueFingerprintHash})`,
      botClicks: sql<number>`coalesce(sum(case when ${tracerClickEvents.isLikelyBot} = 1 then 1 else 0 end), 0)`,
    })
    .from(tracerClickEvents)
    .innerJoin(tracerLinks, eq(tracerClickEvents.tracerLinkId, tracerLinks.id))
    .where(filters.length > 0 ? and(...filters) : undefined);

  const clicks = normalizeNumber(row?.clicks);
  const botClicks = normalizeNumber(row?.botClicks);
  return {
    clicks,
    uniqueOpens: normalizeNumber(row?.uniqueOpens),
    botClicks,
    humanClicks: Math.max(0, clicks - botClicks),
  };
}

export async function getTracerAnalyticsTimeSeries(
  args: AnalyticsFilterArgs,
): Promise<
  Array<{
    day: string;
    clicks: number;
    uniqueOpens: number;
    botClicks: number;
    humanClicks: number;
  }>
> {
  const filters = buildEventFilters(args);

  const rows = await db
    .select({
      day: sql<string>`date(${tracerClickEvents.clickedAt}, 'unixepoch')`,
      clicks: sql<number>`count(${tracerClickEvents.id})`,
      uniqueOpens: sql<number>`count(distinct ${tracerClickEvents.uniqueFingerprintHash})`,
      botClicks: sql<number>`coalesce(sum(case when ${tracerClickEvents.isLikelyBot} = 1 then 1 else 0 end), 0)`,
    })
    .from(tracerClickEvents)
    .innerJoin(tracerLinks, eq(tracerClickEvents.tracerLinkId, tracerLinks.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .groupBy(sql`date(${tracerClickEvents.clickedAt}, 'unixepoch')`)
    .orderBy(sql`date(${tracerClickEvents.clickedAt}, 'unixepoch') asc`);

  return rows.map((row) => {
    const clicks = normalizeNumber(row.clicks);
    const botClicks = normalizeNumber(row.botClicks);
    return {
      day: row.day,
      clicks,
      uniqueOpens: normalizeNumber(row.uniqueOpens),
      botClicks,
      humanClicks: Math.max(0, clicks - botClicks),
    };
  });
}

export async function getTracerAnalyticsTopJobs(
  args: AnalyticsFilterArgs,
): Promise<
  Array<{
    jobId: string;
    title: string;
    employer: string;
    clicks: number;
    uniqueOpens: number;
    botClicks: number;
    humanClicks: number;
    lastClickedAt: number | null;
  }>
> {
  const filters = buildEventFilters(args);
  const limit = normalizeLimit(args.limit, 20);

  const rows = await db
    .select({
      jobId: jobs.id,
      title: jobs.title,
      employer: jobs.employer,
      clicks: sql<number>`count(${tracerClickEvents.id})`,
      uniqueOpens: sql<number>`count(distinct ${tracerClickEvents.uniqueFingerprintHash})`,
      botClicks: sql<number>`coalesce(sum(case when ${tracerClickEvents.isLikelyBot} = 1 then 1 else 0 end), 0)`,
      lastClickedAt: sql<number | null>`max(${tracerClickEvents.clickedAt})`,
    })
    .from(tracerClickEvents)
    .innerJoin(tracerLinks, eq(tracerClickEvents.tracerLinkId, tracerLinks.id))
    .innerJoin(jobs, eq(tracerLinks.jobId, jobs.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .groupBy(jobs.id)
    .orderBy(
      desc(sql`count(${tracerClickEvents.id})`),
      desc(sql`max(${tracerClickEvents.clickedAt})`),
    )
    .limit(limit);

  return rows.map((row) => {
    const clicks = normalizeNumber(row.clicks);
    const botClicks = normalizeNumber(row.botClicks);
    return {
      jobId: row.jobId,
      title: row.title,
      employer: row.employer,
      clicks,
      uniqueOpens: normalizeNumber(row.uniqueOpens),
      botClicks,
      humanClicks: Math.max(0, clicks - botClicks),
      lastClickedAt:
        row.lastClickedAt === null ? null : normalizeNumber(row.lastClickedAt),
    };
  });
}

export async function getTracerAnalyticsTopLinks(
  args: AnalyticsFilterArgs,
): Promise<
  Array<{
    tracerLinkId: string;
    token: string;
    jobId: string;
    title: string;
    employer: string;
    sourcePath: string;
    sourceLabel: string;
    destinationUrl: string;
    clicks: number;
    uniqueOpens: number;
    botClicks: number;
    humanClicks: number;
    lastClickedAt: number | null;
  }>
> {
  const filters = buildEventFilters(args);
  const limit = normalizeLimit(args.limit, 20);

  const rows = await db
    .select({
      tracerLinkId: tracerLinks.id,
      token: tracerLinks.token,
      jobId: jobs.id,
      title: jobs.title,
      employer: jobs.employer,
      sourcePath: tracerLinks.sourcePath,
      sourceLabel: tracerLinks.sourceLabel,
      destinationUrl: tracerLinks.destinationUrl,
      clicks: sql<number>`count(${tracerClickEvents.id})`,
      uniqueOpens: sql<number>`count(distinct ${tracerClickEvents.uniqueFingerprintHash})`,
      botClicks: sql<number>`coalesce(sum(case when ${tracerClickEvents.isLikelyBot} = 1 then 1 else 0 end), 0)`,
      lastClickedAt: sql<number | null>`max(${tracerClickEvents.clickedAt})`,
    })
    .from(tracerClickEvents)
    .innerJoin(tracerLinks, eq(tracerClickEvents.tracerLinkId, tracerLinks.id))
    .innerJoin(jobs, eq(tracerLinks.jobId, jobs.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .groupBy(tracerLinks.id)
    .orderBy(
      desc(sql`count(${tracerClickEvents.id})`),
      desc(sql`max(${tracerClickEvents.clickedAt})`),
    )
    .limit(limit);

  return rows.map((row) => {
    const clicks = normalizeNumber(row.clicks);
    const botClicks = normalizeNumber(row.botClicks);
    return {
      tracerLinkId: row.tracerLinkId,
      token: row.token,
      jobId: row.jobId,
      title: row.title,
      employer: row.employer,
      sourcePath: row.sourcePath,
      sourceLabel: row.sourceLabel,
      destinationUrl: row.destinationUrl,
      clicks,
      uniqueOpens: normalizeNumber(row.uniqueOpens),
      botClicks,
      humanClicks: Math.max(0, clicks - botClicks),
      lastClickedAt:
        row.lastClickedAt === null ? null : normalizeNumber(row.lastClickedAt),
    };
  });
}
