import test from "node:test";
import assert from "node:assert/strict";
import {
  formatArchiveMonthLabel,
  formatTopicMeta,
  getTopicPreviewItems,
  type TopicArchiveCard,
} from "./news-page-format";

const topic: TopicArchiveCard = {
  id: "ai-basic-act",
  emoji: "🤖",
  title: "AI 基本法",
  summary: null,
  latestNewsTime: "2026-03-18T09:00:00+08:00",
  totalNewsCount: 8,
  monthNewsCount: 3,
  latestItems: [
    {
      url: "https://example.com/3",
      title: "第三則",
      title_en: "Third",
      source: "中央社",
      time: "2026-03-18T09:00:00+08:00",
    },
    {
      url: "https://example.com/2",
      title: "第二則",
      title_en: "Second",
      source: "自由時報",
      time: "2026-03-17T09:00:00+08:00",
    },
    {
      url: "https://example.com/1",
      title: "第一則",
      title_en: "First",
      source: "聯合報",
      time: "2026-03-16T09:00:00+08:00",
    },
  ],
};

test("formatArchiveMonthLabel returns localized labels", () => {
  assert.equal(formatArchiveMonthLabel("2026-03", "zh-TW"), "2026年3月");
  assert.equal(formatArchiveMonthLabel("2026-03", "en"), "March 2026");
});

test("formatTopicMeta returns localized monthly and total counts", () => {
  assert.equal(formatTopicMeta(topic, "zh-TW"), "本月 3 篇・累計 8 篇");
  assert.equal(formatTopicMeta(topic, "en"), "3 this month - 8 total");
});

test("getTopicPreviewItems caps preview lists to five items", () => {
  assert.equal(getTopicPreviewItems(topic).length, 3);
  assert.equal(
    getTopicPreviewItems({
      ...topic,
      latestItems: Array.from({ length: 7 }, (_, index) => ({
        url: `https://example.com/${index}`,
        title: `新聞 ${index}`,
        title_en: `News ${index}`,
        source: "中央社",
        time: `2026-03-${String(20 - index).padStart(2, "0")}T09:00:00+08:00`,
      })),
    }).length,
    5
  );
});
