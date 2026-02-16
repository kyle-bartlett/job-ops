import * as api from "@client/api";
import { PageHeader, PageMain, SectionCard } from "@client/components/layout";
import type {
  JobTracerLinksResponse,
  TracerAnalyticsResponse,
} from "@shared/types.js";
import { BarChart3, Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatUnixTimestamp(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Date(value * 1000).toLocaleString();
}

function toUnixStartOfDay(value: string): number | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return Math.floor(date.getTime() / 1000);
}

function toUnixEndOfDay(value: string): number | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T23:59:59`);
  if (Number.isNaN(date.getTime())) return undefined;
  return Math.floor(date.getTime() / 1000);
}

export const TracerLinksPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<TracerAnalyticsResponse | null>(
    null,
  );
  const [jobDrilldown, setJobDrilldown] =
    useState<JobTracerLinksResponse | null>(null);
  const [jobId, setJobId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [includeBots, setIncludeBots] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrilldownLoading, setIsDrilldownLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(
    () => ({
      jobId: jobId.trim() || undefined,
      from: toUnixStartOfDay(fromDate),
      to: toUnixEndOfDay(toDate),
      includeBots,
      limit: 20,
    }),
    [jobId, fromDate, toDate, includeBots],
  );

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    api
      .getTracerAnalytics(query)
      .then((response) => {
        if (!isMounted) return;
        setAnalytics(response);
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load tracer analytics.";
        setError(message);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  const handleLoadJobDrilldown = async () => {
    const trimmedJobId = jobId.trim();
    if (!trimmedJobId) {
      setError("Enter a Job ID to load link drilldown.");
      setJobDrilldown(null);
      return;
    }

    try {
      setIsDrilldownLoading(true);
      setError(null);
      const response = await api.getJobTracerLinks(trimmedJobId, {
        from: query.from,
        to: query.to,
        includeBots,
      });
      setJobDrilldown(response);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load job tracer links.";
      setError(message);
      setJobDrilldown(null);
    } finally {
      setIsDrilldownLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        icon={BarChart3}
        title="Tracer Links"
        subtitle="Outbound resume link analytics"
      />

      <PageMain>
        <SectionCard>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="tracer-job-id">Job ID (optional)</Label>
              <Input
                id="tracer-job-id"
                value={jobId}
                onChange={(event) => setJobId(event.target.value)}
                placeholder="job-123"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tracer-from-date">From date</Label>
              <Input
                id="tracer-from-date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tracer-to-date">To date</Label>
              <Input
                id="tracer-to-date"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>

            <div className="flex items-end">
              <label
                htmlFor="tracer-include-bots"
                className="flex cursor-pointer items-center gap-2 pb-2"
              >
                <Checkbox
                  id="tracer-include-bots"
                  checked={includeBots}
                  onCheckedChange={(checked) =>
                    setIncludeBots(Boolean(checked))
                  }
                />
                <span className="text-sm">Include likely bots</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleLoadJobDrilldown()}
              disabled={isDrilldownLoading}
            >
              {isDrilldownLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Load Job Drilldown
            </Button>
          </div>
        </SectionCard>

        {error && (
          <SectionCard>
            <p className="text-sm text-destructive">{error}</p>
          </SectionCard>
        )}

        <SectionCard>
          <div className="mb-3 text-sm font-semibold">Global Totals</div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading analytics...
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-border/60 p-3">
                <div className="text-xs text-muted-foreground">Clicks</div>
                <div className="text-xl font-semibold">
                  {analytics?.totals.clicks ?? 0}
                </div>
              </div>
              <div className="rounded-md border border-border/60 p-3">
                <div className="text-xs text-muted-foreground">
                  Unique opens
                </div>
                <div className="text-xl font-semibold">
                  {analytics?.totals.uniqueOpens ?? 0}
                </div>
              </div>
              <div className="rounded-md border border-border/60 p-3">
                <div className="text-xs text-muted-foreground">
                  Human clicks
                </div>
                <div className="text-xl font-semibold">
                  {analytics?.totals.humanClicks ?? 0}
                </div>
              </div>
              <div className="rounded-md border border-border/60 p-3">
                <div className="text-xs text-muted-foreground">Bot clicks</div>
                <div className="text-xl font-semibold">
                  {analytics?.totals.botClicks ?? 0}
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard>
          <div className="mb-3 text-sm font-semibold">Top Links</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Unique</TableHead>
                <TableHead>Last click</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(analytics?.topLinks ?? []).map((row) => (
                <TableRow key={row.tracerLinkId}>
                  <TableCell className="align-top">
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.employer}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="font-mono text-xs">{row.sourcePath}</div>
                    <div className="max-w-[280px] truncate text-xs text-muted-foreground">
                      {row.destinationUrl}
                    </div>
                  </TableCell>
                  <TableCell>{row.clicks}</TableCell>
                  <TableCell>{row.uniqueOpens}</TableCell>
                  <TableCell>
                    {formatUnixTimestamp(row.lastClickedAt)}
                  </TableCell>
                </TableRow>
              ))}
              {(analytics?.topLinks?.length ?? 0) === 0 && !isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-sm text-muted-foreground"
                  >
                    No tracer-link clicks yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard>
          <div className="mb-3 text-sm font-semibold">Top Jobs</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Unique</TableHead>
                <TableHead>Human</TableHead>
                <TableHead>Bot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(analytics?.topJobs ?? []).map((row) => (
                <TableRow key={row.jobId}>
                  <TableCell>
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.employer}
                    </div>
                  </TableCell>
                  <TableCell>{row.clicks}</TableCell>
                  <TableCell>{row.uniqueOpens}</TableCell>
                  <TableCell>{row.humanClicks}</TableCell>
                  <TableCell>{row.botClicks}</TableCell>
                </TableRow>
              ))}
              {(analytics?.topJobs?.length ?? 0) === 0 && !isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-sm text-muted-foreground"
                  >
                    No jobs with tracer-link activity yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard>
          <div className="mb-3 text-sm font-semibold">Job Drilldown</div>
          {jobDrilldown ? (
            <>
              <div className="mb-3 text-sm text-muted-foreground">
                {jobDrilldown.job.title} ({jobDrilldown.job.employer}) - tracer
                links{" "}
                {jobDrilldown.job.tracerLinksEnabled ? "enabled" : "disabled"}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Unique</TableHead>
                    <TableHead>Last click</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobDrilldown.links.map((row) => (
                    <TableRow key={row.tracerLinkId}>
                      <TableCell>
                        <div className="font-mono text-xs">
                          {row.sourcePath}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          /t/{row.token}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[360px] truncate text-xs">
                          {row.destinationUrl}
                        </div>
                      </TableCell>
                      <TableCell>{row.clicks}</TableCell>
                      <TableCell>{row.uniqueOpens}</TableCell>
                      <TableCell>
                        {formatUnixTimestamp(row.lastClickedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {jobDrilldown.links.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-sm text-muted-foreground"
                      >
                        No tracer links recorded for this job yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enter a Job ID and click "Load Job Drilldown" to inspect
              link-level metrics.
            </p>
          )}
        </SectionCard>
      </PageMain>
    </>
  );
};
