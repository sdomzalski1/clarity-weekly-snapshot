# Clarity Weekly Snapshot

Node.js automation for pulling daily Microsoft Clarity data into Google Sheets and rebuilding weekly aggregates.

## Required secrets

- `CLARITY_API_TOKEN`
- `CLARITY_PROJECT_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_SHEETS_SPREADSHEET_ID`

Optional:

- `RAW_SHEET_NAME` default `raw`
- `WEEKLY_SHEET_NAME` default `weekly`
- `RUN_LOG_SHEET_NAME` default `run_log`

## Local setup

```bash
npm install
npm run setup-sheets
npm run run
```

## GitHub Actions secrets

Add these repository secrets:

- `CLARITY_API_TOKEN`
- `CLARITY_PROJECT_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_SHEETS_SPREADSHEET_ID`

## Notes

- The runner targets the previous calendar day in `Europe/London` by default.
- Raw rows are replaced idempotently for the same `date + project_id`.
- Weekly rows are recomputed from the raw tab on every successful run.
