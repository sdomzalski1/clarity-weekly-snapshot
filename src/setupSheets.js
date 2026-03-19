import { getConfig, RAW_HEADERS, RUN_LOG_HEADERS, WEEKLY_HEADERS } from "./config.js";
import { createSheetsClient, ensureSheetsExist, writeSheet } from "./sheets.js";

async function main() {
  const config = getConfig();
  const sheets = createSheetsClient(config.serviceAccountJson);

  await ensureSheetsExist(sheets, config.spreadsheetId, [
    config.rawSheetName,
    config.weeklySheetName,
    config.runLogSheetName
  ]);

  await writeSheet(sheets, config.spreadsheetId, config.rawSheetName, [RAW_HEADERS]);
  await writeSheet(sheets, config.spreadsheetId, config.weeklySheetName, [WEEKLY_HEADERS]);
  await writeSheet(sheets, config.spreadsheetId, config.runLogSheetName, [RUN_LOG_HEADERS]);

  console.log("Sheets initialized");
}

await main();
