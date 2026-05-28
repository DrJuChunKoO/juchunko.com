import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getActSummaryLabels, isActSummaryData, shouldShowActSummary } from "./act-summary";

describe("shouldShowActSummary", () => {
	it("only shows summaries for act entries with a slug", () => {
		assert.equal(shouldShowActSummary("act", "ai-basic-law"), true);
		assert.equal(shouldShowActSummary("manual", "ai-basic-law"), false);
		assert.equal(shouldShowActSummary("fragment", "ai-basic-law"), false);
		assert.equal(shouldShowActSummary("act", undefined), false);
	});
});

describe("getActSummaryLabels", () => {
	it("returns localized labels", () => {
		assert.deepEqual(getActSummaryLabels("zh-TW"), {
			heading: "議題摘要",
			problem: "問題",
			changes: "我們提出的做法",
			impact: "對我有什麼影響",
			discussWithAI: "與 AI 繼續討論",
		});

		assert.deepEqual(getActSummaryLabels("en"), {
			heading: "Issue Summary",
			problem: "Problem",
			changes: "What We Proposed",
			impact: "How This Affects Me",
			discussWithAI: "Continue with AI",
		});
	});
});

describe("isActSummaryData", () => {
	it("accepts only complete non-empty summaries", () => {
		assert.equal(isActSummaryData({ problem: "A", changes: "B", impact: "C" }), true);
		assert.equal(isActSummaryData({ problem: "", changes: "B", impact: "C" }), false);
		assert.equal(isActSummaryData({ problem: "A", changes: "B" }), false);
		assert.equal(isActSummaryData(null), false);
	});
});
