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
  - 請以使用者的語言回答問題，目前新聞只有中文結果，若使用者不是用中文進行提問，請翻譯成使用者的語言
  - 若目前沒有你需要的資訊，請嘗試使用搜尋新聞或檢視頁面功能
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
    experimental_transform: smoothStream({
      delayInMs: 80,
      chunking: 'word',
    }),
    tools: {
      searchNews: tool({
        description: 'Search news using semantic search',
        parameters: z.object({
          keyword: z.string().describe('the keyword to search for'),
        }),
        execute: async ({ keyword }) => {
          const { embedding } = await embed({
            model: embeddingModel,
            value: keyword,
          })
          // embed search keyword
          const { data, error } = await supabase
            .rpc('match_news', {
              query_embedding: embedding,
              match_threshold: 0.4,
            })
            .select('title, url, summary, time, source')
            .limit(7)

          if (error) {
            console.error(error)
            return 'An error occurred while searching for news articles'
          }
          return data
        },
      }),
      latestNews: tool({
        description: '取得有關科技立委葛如鈞的最新新聞，可能會有重複的新聞，可以自行濃縮摘要並整合來源',
        parameters: z.object({}),
        execute: async () => {
          const { data, error } = await supabase
            .from('news')
            .select('title, url, summary, time, source')
            .order('time', { ascending: false })
            .limit(7)
          return {
            data,
            error: error ? 'An error occurred while fetching the latest news articles' : undefined,
          }
        },
      }),
      viewPage: tool({
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
