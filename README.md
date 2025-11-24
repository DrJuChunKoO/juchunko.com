# 科技立委葛如鈞．寶博士 (Dr. Ju-Chun KO) 官方網站

這是中華民國第十一屆全國不分區立法委員葛如鈞（寶博士）的個人網站原始碼。

## 🚀 專案簡介

本網站使用 [Astro](https://astro.build) 框架建置，結合 React 與 Tailwind CSS，打造高效能且具備現代化設計的靜態網站。內容涵蓋法案行動、寶博士使用說明書以及各類雜項文章。

## 🛠️ 技術堆疊

- **核心框架**: [Astro](https://astro.build)
- **UI 框架**: [React](https://react.dev)
- **樣式**: [Tailwind CSS](https://tailwindcss.com)
- **圖示**: [Lucide React](https://lucide.dev)
- **內容管理**: Astro Content Collections (Markdown / MDX)
- **多語言支援**: 內建 i18n 路由 (en / zh-TW)

## 📝 內容編輯與管理

關於如何新增文章、編輯現有內容以及新增分類，請參閱詳細教學文件：

👉 **[網站編輯教學 (EDITING.md)](./EDITING.md)**

## 💻 開發與執行

所有指令請在專案根目錄下執行：

| 指令           | 說明                                  |
| :------------- | :------------------------------------ |
| `pnpm install` | 安裝專案依賴                          |
| `pnpm dev`     | 啟動本地開發伺服器 (`localhost:4321`) |
| `pnpm build`   | 建置生產環境版本至 `./dist/`          |
| `pnpm preview` | 預覽建置後的網站                      |

## 📂 專案結構

```text
/
├── public/          # 靜態資源
├── src/
│   ├── components/  # React 與 Astro 元件
│   ├── content/     # 網站內容 (文章)
│   ├── layouts/     # 頁面佈局
│   ├── pages/       # 路由頁面
│   ├── styles/      # 全域樣式
│   └── i18n/        # 多語言設定
└── astro.config.mjs # Astro 設定檔
```
