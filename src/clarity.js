import { DIMENSIONS, METRICS } from "./config.js";
import { sleep } from "./utils.js";

const CLARITY_ENDPOINT = "https://www.clarity.ms/export-data/api/v1/project-live-insights";

function buildPayload(projectId, targetDate) {
  return {
    projectId,
    dimensions: DIMENSIONS,
    metrics: METRICS,
    filters: [
      {
        dimension: "date",
        operator: "eq",
        value: targetDate
      }
    ]
  };
}

async function fetchOnce({ token, projectId, targetDate, timeoutMs }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(CLARITY_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildPayload(projectId, targetDate)),
      signal: controller.signal
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchClarityData({ token, projectId, targetDate }) {
  let attempts = 0;

  while (attempts < 3) {
    attempts += 1;

    try {
      const response = await fetchOnce({
        token,
        projectId,
        targetDate,
        timeoutMs: 10000
      });

      if (response.status === 429 && attempts < 3) {
        await sleep(60000);
        continue;
      }

      if (response.status >= 500 && attempts < 3) {
        await sleep(1000 * attempts);
        continue;
      }

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Clarity API failed with ${response.status}: ${body}`);
      }

      return response.json();
    } catch (error) {
      const isAbort = error.name === "AbortError";
      const isNetwork = error instanceof TypeError || isAbort;

      if (isNetwork && attempts < 3) {
        await sleep(1000 * attempts);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Clarity API failed after retries");
}
