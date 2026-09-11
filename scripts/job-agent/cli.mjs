import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {fileURLToPath} from "node:url";
import {
  decideJob,
  formatTelegramMessage,
  jobId,
  mergeJobs,
  normalizeGreenhouseJob,
  scoreJob,
  telegramKeyboard
} from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../..");
const dataDir = path.join(here, "data");
const statePath = path.join(dataDir, "state.json");

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return fallback; throw error; }
}

async function loadConfig() {
  const localPath = path.join(here, "config.local.json");
  return readJson(localPath, await readJson(path.join(here, "config.json"), {}));
}

async function loadEnvFile(file) {
  try {
    const text = await fs.readFile(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function loadTelegramEnv() {
  await loadEnvFile(path.join(projectRoot, ".env"));
  await loadEnvFile(path.resolve(projectRoot, "../remotion-auto-editor/.env"));
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in this project's .env (the sibling remotion project is also checked). See scripts/job-agent/README.md.");
  }
  return {token, chatId: String(chatId)};
}

async function telegram(method, payload) {
  const {token} = await loadTelegramEnv();
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(`Telegram ${method} failed: ${result.description || response.status}`);
  return result.result;
}

async function fetchJobs(config) {
  const all = [];
  for (const source of config.sources) {
    if (source.type !== "greenhouse") continue;
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.board)}/jobs?content=true`;
    try {
      const response = await fetch(url, {headers: {accept: "application/json"}});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      all.push(...payload.jobs.map((job) => normalizeGreenhouseJob(job, source)));
      console.log(`Fetched ${payload.jobs.length} roles from ${source.company}.`);
    } catch (error) {
      console.warn(`Skipped ${source.company}: ${error.message}`);
    }
  }
  return all;
}

function isFresh(job, freshnessDays) {
  if (!job.updatedAt) return true;
  const cutoff = Date.now() - freshnessDays * 86400000;
  return new Date(job.updatedAt).getTime() >= cutoff;
}

async function loadState() {
  return readJson(statePath, {version: 1, updateOffset: 0, jobs: {}});
}

async function saveState(state) {
  await fs.mkdir(dataDir, {recursive: true});
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function processTelegramUpdates(state, {timeout = 0} = {}) {
  const {token, chatId} = await loadTelegramEnv();
  const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${state.updateOffset || 0}&timeout=${timeout}`);
  const payload = await response.json();
  if (!payload.ok) throw new Error(`Telegram getUpdates failed: ${payload.description}`);

  for (const update of payload.result) {
    state.updateOffset = update.update_id + 1;
    const callback = update.callback_query;
    if (!callback) continue;
    const match = callback.data?.match(/^job:(accept|reject):([a-f0-9]{16})$/);
    if (!match || String(callback.message?.chat?.id) !== chatId) continue;
    const [, decision, id] = match;
    const changed = decideJob(state, id, decision);
    try {
      await telegram("answerCallbackQuery", {
        callback_query_id: callback.id,
        text: changed ? `Job ${decision === "accept" ? "accepted" : "rejected"}.` : "Job was not found in the local tracker."
      });
    } catch (error) {
      // Callback acknowledgements expire quickly. Scheduled cycles may process a
      // valid queued decision after that window, so the local decision remains authoritative.
      console.warn(`Could not acknowledge an older Telegram button press: ${error.message}`);
    }
    if (changed) {
      const job = state.jobs[id];
      try {
        await telegram("editMessageReplyMarkup", {
          chat_id: chatId,
          message_id: callback.message.message_id,
          reply_markup: {inline_keyboard: []}
        });
      } catch (error) {
        console.warn(`Decision was saved, but the Telegram buttons could not be cleared: ${error.message}`);
      }
      console.log(`${decision.toUpperCase()}: ${job.company} — ${job.title}`);
    }
  }
}

async function scan({dryRun = false} = {}) {
  const config = await loadConfig();
  const state = await loadState();
  const fetched = await fetchJobs(config);
  const scored = fetched
    .filter((job) => isFresh(job, config.search.freshnessDays))
    .map((job) => {
      const assessment = scoreJob(job, config);
      return {...job, ...assessment, id: jobId(job), discoveredAt: new Date().toISOString()};
    })
    .filter((job) => job.eligible)
    .sort((a, b) => b.score - a.score);

  state.jobs = mergeJobs(state.jobs, scored);
  const pending = scored
    .filter((job) => !state.jobs[job.id].notifiedAt && state.jobs[job.id].status === "new")
    .slice(0, config.search.maximumNotificationsPerRun);

  console.log(`Found ${scored.length} strong matches; ${pending.length} are new and selected for notification.`);
  for (const job of pending) {
    if (dryRun) {
      console.log(`\n[${job.score}] ${job.company} — ${job.title}\n${job.location}\n${job.url}`);
      continue;
    }
    const {chatId} = await loadTelegramEnv();
    const message = await telegram("sendMessage", {
      chat_id: chatId,
      text: formatTelegramMessage(job),
      disable_web_page_preview: true,
      reply_markup: telegramKeyboard(job.id)
    });
    state.jobs[job.id].notifiedAt = new Date().toISOString();
    state.jobs[job.id].telegramMessageId = message.message_id;
    await saveState(state);
  }
  await saveState(state);
}

async function listen() {
  const state = await loadState();
  console.log("Listening for Telegram decisions. Press Ctrl+C to stop.");
  while (true) {
    await processTelegramUpdates(state, {timeout: 25});
    await saveState(state);
  }
}

async function main() {
  const command = process.argv[2] || "help";
  if (command === "scan") return scan({dryRun: process.argv.includes("--dry-run")});
  if (command === "cycle") {
    const state = await loadState();
    await processTelegramUpdates(state);
    await saveState(state);
    return scan();
  }
  if (command === "listen") return listen();
  if (command === "telegram-test") {
    const {chatId} = await loadTelegramEnv();
    await telegram("sendMessage", {chat_id: chatId, text: "✅ Job Scout Telegram connection is working. No applications will be submitted without your approval."});
    console.log("Telegram test message sent.");
    return;
  }
  console.log("Commands: scan [--dry-run], cycle, listen, telegram-test");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
