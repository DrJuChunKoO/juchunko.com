# 網站編輯教學

本文件說明如何管理網站內容，包括編輯現有文章、新增文章以及新增分類。

## 編輯和新增文章

網站的內容儲存在 `src/content` 目錄下，依照分類（Content Collections）和語言進行組織。

### 目錄結構

```text
src/content/
├── [分類名稱]/          # 例如：act (法案), manual (說明書), fragment (雜項)
│   ├── [語言代碼]/      # 例如：zh-TW, en
│   │   ├── [文章檔案]   # .md 或 .mdx 檔案
```

### 文章檔案格式

文章使用 Markdown (`.md`) 或 MDX (`.mdx`) 格式。每篇文章的開頭必須包含 Frontmatter，用於定義文章的元數據。

#### Frontmatter 範例

```yaml
---
title: "文章標題"
description: "文章簡短描述，用於 SEO 和列表顯示"
date: 2024-01-01
emoji: "📝"
image: "/images/cover.jpg" # 選填，封面圖片路徑
---
```

#### 欄位說明

- `title` (必填): 文章標題。
- `date` (必填): 發布日期，格式為 `YYYY-MM-DD`。
- `emoji` (選填): 代表文章的表情符號，預設為 🤓。
- `description` (選填): 文章摘要。
- `image` (選填): 文章封面圖片。

### 新增文章步驟

1.  確認你要新增的文章屬於哪個分類（例如 `act`）。
2.  進入對應的語言目錄（例如 `src/content/act/zh-TW/`）。
3.  建立一個新的 `.md` 或 `.mdx` 檔案。建議檔名包含日期以便排序，例如 `2024-01-01-my-new-post.md`。
4.  填寫 Frontmatter 和文章內容。

---

## 新增分類 (Content Collections)

若需新增一個全新的內容分類（例如 `news`），需要修改程式碼配置。

### 步驟 1：定義集合

編輯 `src/content.config.ts`，新增集合定義：

```typescript
// src/content.config.ts
import { defineCollection, z } from "astro:content";

// ... 現有的集合定義

const news = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		emoji: z.string().optional().default("📰"),
		description: z.string().optional(),
		image: z.string().optional(),
	}),
});

export const collections = { act, manual, fragment, news }; // 加入 news
```

### 步驟 2：建立目錄

在 `src/content/` 下建立對應的目錄結構：

```bash
mkdir -p src/content/news/zh-TW
mkdir -p src/content/news/en
```

### 步驟 3：新增翻譯字串

編輯 `src/i18n/ui.ts`，為新分類新增標題翻譯：

```typescript
// src/i18n/ui.ts
export const ui = {
	en: {
		// ...
		"cat.news": "Latest News",
	},
	"zh-TW": {
		// ...
		"cat.news": "最新消息",
	},
} as const;
```

### 步驟 4：建立文章頁面路由

複製現有的 Slug 頁面（例如 `src/pages/[lang]/act/[slug].astro`）到新分類目錄 `src/pages/[lang]/news/[slug].astro`，並修改 `getCollection` 的參數：

```astro
// src/pages/[lang]/news/[slug].astro
---
import { getCollection } from "astro:content";
// ... 其他 import

export async function getStaticPaths() {
	const pages = await getCollection("news"); // 修改這裡為 "news"
    // ...
}
// ...
---
<!-- 內容通常不需要修改，除非有特殊排版需求 -->
```

### 步驟 5：更新首頁列表

編輯 `src/pages/[lang]/index.astro`，加入新分類的資料獲取和顯示區塊：

```astro
// src/pages/[lang]/index.astro
---
// ...
const news = (await getCollection("news"))
	.filter((post) => post.id.startsWith(lang + "/"))
	.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---

<PageLayout ...>
    <!-- ... 其他區塊 ... -->

    <!-- 新增 News 區塊 -->
	<h1 class="text-foreground mt-12 mb-6 text-center text-2xl font-bold md:text-left">{t("cat.news")}</h1>
	<div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] md:gap-6">
		{news.map((post) => <CardLink post={post} lang={lang} category="news" />)}
	</div>
</PageLayout>
```
