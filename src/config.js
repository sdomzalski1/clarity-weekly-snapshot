const REQUIRED_ENV_VARS = [
  "CLARITY_API_TOKEN",
  "CLARITY_PROJECT_ID",
  "GOOGLE_SERVICE_ACCOUNT_JSON",
  "GOOGLE_SHEETS_SPREADSHEET_ID"
];

export const METRICS = [
  "sessions",
  "pageViews",
  "rageClicks",
  "deadClicks",
  "scrollDepth",
  "engagementTime"
];

export const DIMENSIONS = ["date", "device", "browser"];

export const RAW_HEADERS = [
  "date",
  "iso_week",
  "project_id",
  "device",
  "browser",
  "sessions",
  "page_views",
  "rage_clicks",
  "dead_clicks",
  "scroll_depth",
  "engagement_time",
  "metric_status",
  "run_id",
  "inserted_at"
];

export const WEEKLY_HEADERS = [
  "iso_week",
  "project_id",
  "device",
  "browser",
  "sessions",
  "page_views",
  "rage_clicks",
  "dead_clicks",
  "scroll_depth_weighted",
  "engagement_time_weighted",
  "row_count",
  "partial_row_count",
  "rebuilt_at"
];

export const RUN_LOG_HEADERS = [
  "run_id",
  "target_date",
  "project_id",
  "status",
  "row_count",
  "complete_row_count",
  "partial_row_count",
  "error_message",
  "started_at",
  "finished_at"
];

export function getConfig() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    clarityApiToken: process.env.CLARITY_API_TOKEN,
    clarityProjectId: process.env.CLARITY_PROJECT_ID,
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    rawSheetName: process.env.RAW_SHEET_NAME || "raw",
    weeklySheetName: process.env.WEEKLY_SHEET_NAME || "weekly",
    runLogSheetName: process.env.RUN_LOG_SHEET_NAME || "run_log"
  };
}
