# GitHub Secrets Checklist

Use this checklist before enabling the scheduled workflow.

## 1. Repository secrets

Add these secrets in GitHub:

`Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`

- `CLARITY_API_TOKEN`
- `CLARITY_PROJECT_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_SHEETS_SPREADSHEET_ID`

## 2. Secret values

### `CLARITY_API_TOKEN`

- Create or copy the Microsoft Clarity API token for the target project.
- Use the raw token value only.

### `CLARITY_PROJECT_ID`

- Use the Clarity project identifier for the project you want to report on.

### `GOOGLE_SERVICE_ACCOUNT_JSON`

- Create a Google Cloud service account with Sheets API access.
- Create a JSON key for that service account.
- Paste the full JSON file contents into the GitHub secret as a single value.
- Share the target Google Sheet with the service account email as `Editor`.

### `GOOGLE_SHEETS_SPREADSHEET_ID`

- Open the target Google Sheet.
- Copy the spreadsheet ID from the URL.
- Example:

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
```

## 3. GitHub Actions permissions

No extra workflow permissions are required for the current job.

## 4. First-run process

1. Add the four repository secrets.
2. Run `npm run setup-sheets` locally once, or run the script with the same env vars to create the `raw`, `weekly`, and `run_log` tabs.
3. In GitHub, open `Actions` -> `Clarity Weekly Snapshot`.
4. Run `workflow_dispatch` manually once.
5. Confirm:
   - `raw` contains daily rows
   - `weekly` contains rebuilt aggregates
   - `run_log` contains a `success` row

## 5. Validation checks

- The workflow should complete in under 5 minutes.
- `run_log` should show at least one row written per successful run.
- `metric_status` should be mostly `complete`.
- A rerun for the same date should replace that date's raw rows rather than duplicate them.

## 6. Rotation reminders

- Rotate `CLARITY_API_TOKEN` every 90 days.
- Rotate the Google service account key yearly.
- After rotating either secret, update the GitHub repository secret immediately.
