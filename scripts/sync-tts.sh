#!/bin/bash

# Check if TTS_API_TOKEN is set
# This should be configured in GitHub Repository Secrets as TTS_API_TOKEN
if [ -z "$TTS_API_TOKEN" ]; then
  echo "Error: TTS_API_TOKEN is not set."
  exit 1
fi

FILES=$@

for file in $FILES; do

  if [ ! -f "$file" ]; then
    echo "File $file does not exist, skipping."
    continue
  fi

  echo "----------------------------------------"
  echo "Processing $file"

  # Expected format: src/content/collection/lang/slug.mdx
  # We want: lang/collection/slug
  
  # Remove src/content/ prefix
  rel_path=${file#src/content/}
  
  # Split by /
  # Format: collection/lang/filename
  collection=$(echo "$rel_path" | cut -d'/' -f1)
  lang=$(echo "$rel_path" | cut -d'/' -f2)
  filename=$(echo "$rel_path" | cut -d'/' -f3)
  
  # Remove .mdx extension
  slug="${filename%.mdx}"
  
  # Construct API path: lang/collection/slug
  api_path="$lang/$collection/$slug"
  
  echo "Syncing path: $api_path"
  
  retry_count=0
  max_retries=50

  while [ $retry_count -lt $max_retries ]; do
    response=$(curl -s -X POST "https://tts-api.juchunko.com/v1/sync" \
      -H "Authorization: Bearer $TTS_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"path\": \"$api_path\", \"domain\": \"juchunko.com\"}")
    
    echo "Response: $response"
    
    success=$(echo "$response" | jq -r '.success')
    if [ "$success" != "true" ]; then
      echo "Error: Sync failed for $api_path"
      break
    fi
    
    remaining=$(echo "$response" | jq -r '.remaining // 0')
    if [[ "$remaining" == "null" || "$remaining" -le 0 ]]; then
      echo "Sync completed for $api_path"
      break
    fi
    
    echo "Remaining segments: $remaining. Syncing again..."
    retry_count=$((retry_count + 1))
    sleep 1
  done

  if [ $retry_count -eq $max_retries ]; then
    echo "Warning: Reached max retries for $api_path"
  fi
done
