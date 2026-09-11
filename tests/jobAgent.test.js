import {describe, expect, it} from "vitest";
import {decideJob, jobId, mergeJobs, scoreJob, telegramKeyboard} from "../scripts/job-agent/lib.mjs";
import config from "../scripts/job-agent/config.json";

const baseJob = {
  source: "greenhouse:test",
  externalId: "123",
  company: "Example",
  title: "Junior Full Stack Software Engineer",
  location: "Remote - Latin America",
  description: "Build React and TypeScript applications with Python automation and PostgreSQL.",
  url: "https://example.com/jobs/123"
};

describe("Telegram job scout", () => {
  it("selects a strong junior remote match", () => {
    const result = scoreJob(baseJob, config);
    expect(result.eligible).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(config.search.minimumScore);
  });

  it("rejects senior roles before notification", () => {
    const result = scoreJob({...baseJob, title: "Senior Software Engineer"}, config);
    expect(result.eligible).toBe(false);
    expect(result.score).toBe(0);
  });

  it("rejects roles outside Mexico, Latin America, Americas, or remote locations", () => {
    const result = scoreJob({...baseJob, location: "Dublin, Ireland"}, config);
    expect(result.eligible).toBe(false);
  });

  it("preserves decisions when jobs are discovered again", () => {
    const id = jobId(baseJob);
    const state = {jobs: {[id]: {...baseJob, id, status: "accepted"}}};
    const merged = mergeJobs(state.jobs, [{...baseJob, id, score: 90}]);
    expect(merged[id].status).toBe("accepted");
  });

  it("records Telegram decisions and creates bounded callback data", () => {
    const id = jobId(baseJob);
    const state = {jobs: {[id]: {...baseJob, id, status: "new"}}};
    expect(decideJob(state, id, "reject", "2026-09-10T12:00:00.000Z")).toBe(true);
    expect(state.jobs[id].status).toBe("rejected");
    expect(telegramKeyboard(id).inline_keyboard[0][0].callback_data.length).toBeLessThanOrEqual(64);
  });
});
