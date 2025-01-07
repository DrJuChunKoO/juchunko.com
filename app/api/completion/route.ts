import { createOpenAI } from '@ai-sdk/openai'
import { streamText, tool, smoothStream, embed } from 'ai'
import z from 'zod'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
// Create an OpenAI API client
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://gateway.ai.cloudflare.com/v1/3f1f83a939b2fc99ca45fd8987962514/juchunko-com/openai',
})
const embeddingModel = openai.embedding('text-embedding-3-small')

export async function POST(req: Request) {
  const systemPrompt = `你是國民黨立委葛如鈞（寶博士）網站的 AI 助手
  - 請根據頁面內容回答使用者的問題，若無法回答請告知使用者。
  - 盡可能簡短、友善回答
  - 請以使用者的語言回答問題，目前新聞只有中文結果，請翻譯成使用者的語言
  - 目前你只能看到目前頁面的內容以及搜尋新聞，若目前沒有你需要的資訊，請告知使用者請切換到相對應的頁面。
  - 葛如鈞=寶博士=Ju-Chun KO`

  const { messages, filename, prompt } = await req.json()
  // Ask OpenAI for a streaming completion given the prompt
  const result = streamText({
    model: openai('gpt-4o-mini'),
    temperature: 0.6,
    maxTokens: 4096,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
      {
        role: 'user',
        content: prompt,
      },
    ],
    maxSteps: 5,
    experimental_transform: smoothStream(),
    tools: {
      searchNews: tool({
        description: '透過語意化搜尋找到相關新聞，可能會找到一些不相關的新聞，請自行篩選',
        parameters: z.object({
          keyword: z.string().describe('語意化搜尋的關鍵字，可以提供一些相似的詞來提高搜尋成功率'),
        }),
        execute: async ({ keyword }) => {
          const { embedding } = await embed({
            model: embeddingModel,
            value: keyword,
          })
          const { data, error } = await supabase
            .rpc('match_news', {
              query_embedding: embedding,
              match_threshold: 0.4,
            })
            .select('title, url, summary, time')
            .limit(5)
          return {
            data,
            error: error ? 'An error occurred while searching for news articles' : undefined,
          }
        },
      }),
      latestNews: tool({
        description: '取得有關科技立委葛如鈞的最新新聞',
        parameters: z.object({}),
        execute: async () => {
          const { data, error } = await supabase
            .from('news')
            .select('title, url, summary, time')
            .order('time', { ascending: false })
            .limit(5)
          return {
            data,
            error: error ? 'An error occurred while fetching the latest news articles' : undefined,
          }
        },
      }),
      getCurrentPage: tool({
        description: 'Get the current page content',
        parameters: z.object({}),
        execute: async () => {
          const date = new Date().toLocaleDateString()
          const fileData = await fetch(
            `https://raw.githubusercontent.com/DrJuChunKoO/juchunko.com/main/pages${filename}.zh-TW.mdx?d=${encodeURIComponent(date)}`,
            {
              cache: 'force-cache',
            },
          ).then((res) => res.text())
          return `base: https://juchunko.com/\n目前頁面內容：\n${fileData}`
        },
      }),
    },
  })
  // Convert the response into a friendly text-stream
  return result.toDataStreamResponse()
}
