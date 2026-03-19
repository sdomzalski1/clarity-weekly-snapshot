import { google } from "googleapis";

function getGoogleCredentials(serviceAccountJson) {
  const parsed = JSON.parse(serviceAccountJson);

  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  return parsed;
}

export function createSheetsClient(serviceAccountJson) {
  const auth = new google.auth.GoogleAuth({
    credentials: getGoogleCredentials(serviceAccountJson),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  return google.sheets({ version: "v4", auth });
}

export async function ensureSheetsExist(sheets, spreadsheetId, sheetNames) {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const existingNames = new Set(
    (spreadsheet.data.sheets || []).map((sheet) => sheet.properties?.title).filter(Boolean)
  );

  const requests = sheetNames
    .filter((sheetName) => !existingNames.has(sheetName))
    .map((sheetName) => ({
      addSheet: {
        properties: {
          title: sheetName
        }
      }
    }));

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests }
    });
  }
}

export async function writeSheet(sheets, spreadsheetId, sheetName, rows) {
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${sheetName}!A:Z`
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: rows
    }
  });
}

export async function appendSheet(sheets, spreadsheetId, sheetName, rows) {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows
    }
  });
}

export async function readSheet(sheets, spreadsheetId, sheetName) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:Z`
  });

  return response.data.values || [];
}
