import crypto from "node:crypto";

export function createRunId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export function getPreviousDateInLondon() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const londonToday = formatter.format(new Date());
  const midnightUtc = new Date(`${londonToday}T00:00:00Z`);
  midnightUtc.setUTCDate(midnightUtc.getUTCDate() - 1);

  return midnightUtc.toISOString().slice(0, 10);
}

export function getIsoWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);

  return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

export function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function normalizeDimension(value) {
  if (value === null || value === undefined || value === "") {
    return "unknown";
  }

  return String(value);
}

export async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
