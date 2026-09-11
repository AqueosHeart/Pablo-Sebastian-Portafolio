import crypto from "node:crypto";

export const stripHtml = (value = "") => value
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&#39;/g, "'")
  .replace(/&quot;/gi, "\"")
  .replace(/\s+/g, " ")
  .trim();

export const normalize = (value = "") => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

export const jobId = (job) => crypto
  .createHash("sha256")
  .update(`${job.source}|${job.externalId}|${job.url}`)
  .digest("hex")
  .slice(0, 16);

const hasPhrase = (text, phrase) => text.includes(normalize(phrase));

export function scoreJob(job, config) {
  const title = normalize(job.title);
  const location = normalize(job.location);
  const description = normalize(job.description);
  const combined = `${title} ${location} ${description}`;
  const reasons = [];
  const concerns = [];
  let score = 0;

  const excluded = config.search.excludedTitles.find((term) => hasPhrase(title, term));
  if (excluded) {
    return {score: 0, eligible: false, reasons, concerns: [`Title contains excluded seniority: ${excluded}`]};
  }

  const excludedLocation = config.search.excludedLocations?.find((term) => hasPhrase(location, term));
  const explicitlyAllowed = ["mexico", "latin america", "latam", "americas", "worldwide", "global"]
    .some((term) => hasPhrase(location, term));
  if (excludedLocation && !explicitlyAllowed) {
    return {score: 0, eligible: false, reasons, concerns: [`Location is outside the target region: ${job.location}`]};
  }

  const titleMatch = config.search.preferredTitles.find((term) => hasPhrase(title, term));
  if (!titleMatch) {
    return {score: 0, eligible: false, reasons, concerns: ["Title is outside the target role families"]};
  }
  score += 34;
  reasons.push(`Target role: ${titleMatch}`);

  const juniorSignal = config.search.juniorSignals.find((term) => hasPhrase(title, term));
  if (juniorSignal) {
    score += 22;
    reasons.push(`Junior signal: ${juniorSignal}`);
  } else {
    concerns.push("No explicit junior or early-career signal");
  }

  const locationMatch = config.candidate.preferredLocations.find((term) => hasPhrase(location, term));
  if (locationMatch) {
    score += 18;
    reasons.push(`Location match: ${locationMatch}`);
  } else {
    return {score: 0, eligible: false, reasons, concerns: [`Location is outside the target region: ${job.location || "not provided"}`]};
  }

  const blockedLocation = config.search.blockedLocationSignals.find((term) => hasPhrase(combined, term));
  if (blockedLocation) {
    score -= 35;
    concerns.push(`Possible location restriction: ${blockedLocation}`);
  }

  const matchedSkills = config.candidate.skills.filter((skill) => hasPhrase(combined, skill));
  score += Math.min(26, matchedSkills.length * 4);
  if (matchedSkills.length) reasons.push(`Skills: ${matchedSkills.slice(0, 6).join(", ")}`);

  const years = [...combined.matchAll(/(\d+)\+?\s+years?/g)].map((match) => Number(match[1]));
  const minimumYears = years.length ? Math.min(...years) : null;
  if (minimumYears !== null && minimumYears >= 5) {
    score -= 30;
    concerns.push(`Description may require ${minimumYears}+ years`);
  } else if (minimumYears !== null && minimumYears >= 3) {
    score -= 14;
    concerns.push(`Description may require ${minimumYears}+ years`);
  }

  score = Math.max(0, Math.min(100, score));
  return {score, eligible: score >= config.search.minimumScore, reasons, concerns, matchedSkills};
}

export function normalizeGreenhouseJob(raw, source) {
  return {
    source: `greenhouse:${source.board}`,
    externalId: String(raw.id),
    company: source.company,
    title: raw.title || "Untitled role",
    location: raw.location?.name || "Not specified",
    description: stripHtml(raw.content || ""),
    url: raw.absolute_url,
    updatedAt: raw.updated_at || null
  };
}

export function formatTelegramMessage(job) {
  const why = job.reasons.length ? job.reasons.map((item) => `• ${item}`).join("\n") : "• General profile match";
  const concerns = job.concerns.length ? `\n\n⚠️ Review\n${job.concerns.map((item) => `• ${item}`).join("\n")}` : "";
  return [
    `💼 ${job.title}`,
    `${job.company} · ${job.location}`,
    `Match score: ${job.score}/100`,
    "",
    "Why it matched",
    why,
    concerns,
    "",
    job.url,
    "",
    "Accept = add to the preparation queue. Nothing is submitted automatically."
  ].join("\n").slice(0, 4096);
}

export function telegramKeyboard(id) {
  return {
    inline_keyboard: [[
      {text: "✅ Accept", callback_data: `job:accept:${id}`},
      {text: "❌ Reject", callback_data: `job:reject:${id}`}
    ]]
  };
}

export function mergeJobs(existing, incoming) {
  const jobs = {...existing};
  for (const job of incoming) {
    const previous = jobs[job.id] || {};
    jobs[job.id] = {
      ...job,
      status: previous.status || "new",
      notifiedAt: previous.notifiedAt || null,
      telegramMessageId: previous.telegramMessageId || null,
      decidedAt: previous.decidedAt || null
    };
  }
  return jobs;
}

export function decideJob(state, id, decision, decidedAt = new Date().toISOString()) {
  if (!state.jobs[id]) return false;
  state.jobs[id].status = decision === "accept" ? "accepted" : "rejected";
  state.jobs[id].decidedAt = decidedAt;
  return true;
}
