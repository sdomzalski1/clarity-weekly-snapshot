import { METRICS } from "./config.js";
import { getIsoWeek, normalizeDimension, nowIso, toNullableNumber } from "./utils.js";

function getMetricValue(record, metricName) {
  if (Object.hasOwn(record, metricName)) {
    return record[metricName];
  }

  const snakeCaseMetric = metricName.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
  if (Object.hasOwn(record, snakeCaseMetric)) {
    return record[snakeCaseMetric];
  }

  return undefined;
}

function normalizeMetricStatus(record) {
  return METRICS.every((metric) => getMetricValue(record, metric) !== undefined) ? "complete" : "partial";
}

function toRawRow({ record, projectId, runId, insertedAt }) {
  const date = String(record.date);

  return [
    date,
    getIsoWeek(date),
    projectId,
    normalizeDimension(record.device),
    normalizeDimension(record.browser),
    toNullableNumber(getMetricValue(record, "sessions")),
    toNullableNumber(getMetricValue(record, "pageViews")),
    toNullableNumber(getMetricValue(record, "rageClicks")),
    toNullableNumber(getMetricValue(record, "deadClicks")),
    toNullableNumber(getMetricValue(record, "scrollDepth")),
    toNullableNumber(getMetricValue(record, "engagementTime")),
    normalizeMetricStatus(record),
    runId,
    insertedAt
  ];
}

function extractRecords(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.records)) {
    return payload.records;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  throw new Error("Unsupported Clarity response shape: expected an array, records, data, or items");
}

export function buildRawRows({ payload, projectId, runId }) {
  const insertedAt = nowIso();
  const records = extractRecords(payload);

  return records.map((record) => toRawRow({ record, projectId, runId, insertedAt }));
}

export function buildWeeklyRows(rawRows) {
  const rebuiltAt = nowIso();
  const groups = new Map();

  for (const row of rawRows) {
    const [
      isoWeek,
      projectId,
      device,
      browser,
      sessions,
      pageViews,
      rageClicks,
      deadClicks,
      scrollDepth,
      engagementTime,
      metricStatus
    ] = [row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9], row[10], row[11]];

    const key = [isoWeek, projectId, device, browser].join("::");
    const group = groups.get(key) || {
      isoWeek,
      projectId,
      device,
      browser,
      sessions: 0,
      pageViews: 0,
      rageClicks: 0,
      deadClicks: 0,
      scrollDepthWeightedNumerator: 0,
      scrollDepthWeightedDenominator: 0,
      engagementWeightedNumerator: 0,
      engagementWeightedDenominator: 0,
      rowCount: 0,
      partialRowCount: 0
    };

    const safeSessions = Number(sessions) || 0;
    const safePageViews = Number(pageViews) || 0;
    const safeRageClicks = Number(rageClicks) || 0;
    const safeDeadClicks = Number(deadClicks) || 0;

    group.sessions += safeSessions;
    group.pageViews += safePageViews;
    group.rageClicks += safeRageClicks;
    group.deadClicks += safeDeadClicks;

    if (scrollDepth !== null && scrollDepth !== "") {
      group.scrollDepthWeightedNumerator += (Number(scrollDepth) || 0) * safeSessions;
      group.scrollDepthWeightedDenominator += safeSessions;
    }

    if (engagementTime !== null && engagementTime !== "") {
      group.engagementWeightedNumerator += (Number(engagementTime) || 0) * safeSessions;
      group.engagementWeightedDenominator += safeSessions;
    }

    group.rowCount += 1;
    if (metricStatus === "partial") {
      group.partialRowCount += 1;
    }

    groups.set(key, group);
  }

  return Array.from(groups.values())
    .sort((a, b) => a.isoWeek.localeCompare(b.isoWeek) || a.projectId.localeCompare(b.projectId) || a.device.localeCompare(b.device) || a.browser.localeCompare(b.browser))
    .map((group) => [
      group.isoWeek,
      group.projectId,
      group.device,
      group.browser,
      group.sessions,
      group.pageViews,
      group.rageClicks,
      group.deadClicks,
      group.scrollDepthWeightedDenominator > 0
        ? group.scrollDepthWeightedNumerator / group.scrollDepthWeightedDenominator
        : null,
      group.engagementWeightedDenominator > 0
        ? group.engagementWeightedNumerator / group.engagementWeightedDenominator
        : null,
      group.rowCount,
      group.partialRowCount,
      rebuiltAt
    ]);
}
