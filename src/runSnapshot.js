import { fetchClarityData } from "./clarity.js";
import {
  RAW_HEADERS,
  RUN_LOG_HEADERS,
  WEEKLY_HEADERS,
  getConfig
} from "./config.js";
import {
  appendSheet,
  createSheetsClient,
  ensureSheetsExist,
  readSheet,
  writeSheet
} from "./sheets.js";
import { buildRawRows, buildWeeklyRows } from "./transform.js";
import { createRunId, getPreviousDateInLondon, nowIso } from "./utils.js";

function parseRawSheetRows(values) {
  if (values.length === 0) {
    return [];
  }

  if (values[0]?.[0] === RAW_HEADERS[0]) {
    return values.slice(1);
  }

  return values;
}

function filterExistingRawRows(rows, targetDate, projectId) {
  return rows.filter((row) => !(row[0] === targetDate && row[2] === projectId));
}

function buildRunLogRow({
  runId,
  targetDate,
  projectId,
  status,
  rowCount,
  completeRowCount,
  partialRowCount,
  errorMessage,
  startedAt,
  finishedAt
}) {
  return [[
    runId,
    targetDate,
    projectId,
    status,
    rowCount,
    completeRowCount,
    partialRowCount,
    errorMessage || "",
    startedAt,
    finishedAt
  ]];
}

async function main() {
  const startedAt = nowIso();
  const runId = createRunId();
  const targetDate = process.env.TARGET_DATE || getPreviousDateInLondon();
  const config = getConfig();
  const sheets = createSheetsClient(config.serviceAccountJson);

  await ensureSheetsExist(sheets, config.spreadsheetId, [
    config.rawSheetName,
    config.weeklySheetName,
    config.runLogSheetName
  ]);

  try {
    const payload = await fetchClarityData({
      token: config.clarityApiToken,
      projectId: config.clarityProjectId,
      targetDate
    });

    const rawRows = buildRawRows({
      payload,
      projectId: config.clarityProjectId,
      runId
    });

    if (rawRows.length === 0) {
      throw new Error(`No rows returned for target date ${targetDate}`);
    }

    const existingRawValues = await readSheet(sheets, config.spreadsheetId, config.rawSheetName);
    const existingRawRows = parseRawSheetRows(existingRawValues);
    const filteredRawRows = filterExistingRawRows(
      existingRawRows,
      targetDate,
      config.clarityProjectId
    );
    const mergedRawRows = [...filteredRawRows, ...rawRows];
    const weeklyRows = buildWeeklyRows(mergedRawRows);

    await writeSheet(sheets, config.spreadsheetId, config.rawSheetName, [
      RAW_HEADERS,
      ...mergedRawRows
    ]);

    await writeSheet(sheets, config.spreadsheetId, config.weeklySheetName, [
      WEEKLY_HEADERS,
      ...weeklyRows
    ]);

    const completeRowCount = rawRows.filter((row) => row[11] === "complete").length;
    const partialRowCount = rawRows.length - completeRowCount;

    await appendSheet(
      sheets,
      config.spreadsheetId,
      config.runLogSheetName,
      buildRunLogRow({
        runId,
        targetDate,
        projectId: config.clarityProjectId,
        status: "success",
        rowCount: rawRows.length,
        completeRowCount,
        partialRowCount,
        errorMessage: "",
        startedAt,
        finishedAt: nowIso()
      })
    );

    console.log(
      JSON.stringify({
        status: "success",
        targetDate,
        rowCount: rawRows.length,
        runId
      })
    );
  } catch (error) {
    await appendSheet(
      sheets,
      config.spreadsheetId,
      config.runLogSheetName,
      buildRunLogRow({
        runId,
        targetDate,
        projectId: config.clarityProjectId,
        status: "failure",
        rowCount: 0,
        completeRowCount: 0,
        partialRowCount: 0,
        errorMessage: error.message,
        startedAt,
        finishedAt: nowIso()
      })
    );

    throw error;
  }
}

await main();
