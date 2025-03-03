#!/bin/bash

# sync-all-mdx-files.sh
# 上傳 pages 目錄下所有 mdx 檔案到 Supabase 向量資料庫

# 檢查是否有 Node.js 環境
if ! command -v node &> /dev/null; then
    echo "Node.js 不存在，請先安裝 Node.js"
    exit 1
fi

# 檢查目錄存在
if [ ! -d "pages" ]; then
    echo "pages 目錄不存在"
    exit 1
fi

# 檢查 sync 腳本是否存在
if [ ! -f "utils/sync-docs-supabase-vector.mjs" ]; then
    echo "utils/sync-docs-supabase-vector.mjs 檔案不存在"
    exit 1
fi

echo "開始上傳 pages 目錄下所有 mdx 檔案..."

# 計數器
total_files=0
processed_files=0
failed_files=0

# 找出所有 mdx 檔案
mdx_files=$(find pages -name "*.mdx" -type f)
total_files=$(echo "$mdx_files" | wc -l)

# 處理每個檔案
for file in $mdx_files; do
    echo "正在處理: $file"

    # 執行 Node.js 腳本處理當前檔案
    if node utils/sync-docs-supabase-vector.mjs "$file"; then
        echo "成功處理: $file"
        ((processed_files++))
    else
        echo "處理失敗: $file"
        ((failed_files++))
    fi

    # 短暫暫停，避免 API 請求過於頻繁
    sleep 1
done

echo "==== 處理完成 ===="
echo "總檔案數: $total_files"
echo "成功處理: $processed_files"
echo "處理失敗: $failed_files"

if [ $failed_files -eq 0 ]; then
    echo "所有檔案已成功處理！"
    exit 0
else
    echo "有 $failed_files 個檔案處理失敗，請檢查日誌"
    exit 1
fi
