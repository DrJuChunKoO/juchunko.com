import { createOpenAI } from '@ai-sdk/openai'
import { streamText, tool, smoothStream, embed } from 'ai'
import z from 'zod'
import { createClient } from '@supabase/supabase-js'
import pangu from 'pangu'

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
  - 盡可能簡短、友善回答
  - 盡可能使用工具來提供使用者盡可能準確與完整的資訊
  - 請以使用者的語言回答問題，目前新聞只有中文結果，若使用者不是用中文進行提問，請翻譯成使用者的語言
  - 新聞來源有多個，會出現重複新聞，請自行總結後再和使用者說，並附上所有網址和來源名稱，像這樣 [自由時報](https://xxx) [中央社](https://xxx)
  - 葛如鈞=寶博士=Ju-Chun KO

  <semanticSiteSearch>
  semanticSiteSearch 會提供 path 'pages/docs/manual/hobby.zh-TW.mdx' 你可以轉換成對應的官網連結提供給使用者 'https://juchunko.com/docs/manual/hobby'
  </semanticSiteSearch>
  `

  const { messages, filename, prompt } = await req.json()
  // Ask OpenAI for a streaming completion given the prompt
  const result = streamText({
    model: openai('gpt-4.1-nano'),
    temperature: 0.6,
    maxTokens: 8_192,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
      {
        role: 'user',
        content: prompt,
      },
    ],
    maxSteps: 8,
    experimental_transform: smoothStream({
      delayInMs: 10,
      chunking: /[\u4E00-\u9FFF]|\S+\s+/,
    }),
    tools: {
      searchNews: tool({
        description: 'Search news using semantic search',
        parameters: z.object({
          keyword: z.string().describe('the keyword to search for'),
          inEnglish: z.boolean().describe('return the result in English'),
        }),
        execute: async ({ keyword, inEnglish }) => {
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
            .select(inEnglish ? 'title_en, summary_en, url, time, source' : 'title, summary, url, time, source')
            .limit(10)
            .order('time', { ascending: false })

          if (error) {
            console.error(error)
            return 'An error occurred while searching for news articles'
          }
          return inEnglish
            ? data
            : data.map((item: any) => ({
                ...item,
                title: pangu.spacing(item.title!),
                summary: pangu.spacing(item.summary),
              }))
        },
      }),
      semanticSiteSearch: tool({
        description: 'Search this website using semantic search',
        parameters: z.object({
          keyword: z.string().describe('the keyword to search for'),
          language: z.enum(['zh', 'en']).describe('the language to search for'),
        }),
        execute: async ({ keyword, language }) => {
          const { embedding } = await embed({
            model: embeddingModel,
            value: keyword,
          })
          // embed search keyword
          const { data, error } = await supabase
            .rpc('match_official_website', {
              query_embedding: embedding,
              match_threshold: 0.4,
            })
            .select('path')
            .limit(20)
          if (!data?.length) return []
          // list all items in same path
          const result: any[] = []
          for (let path of [...new Set(data.map((item) => item.path))]) {
            const { data: samePathData, error: samePathError } = await supabase
              .from('official_website')
              .select('title, paragraph, language, path')
              .eq('path', path)
              .eq('language', language)
              .limit(20)
            if (samePathData?.length) result.push(...samePathData)
          }
          if (error) {
            console.error(error)
            return 'An error occurred while searching for news articles'
          }
          return result
        },
      }),
      latestNews: tool({
        description: '取得有關科技立委葛如鈞的最新新聞，可能會有重複的新聞，請自行濃縮摘要並整合來源',
        parameters: z.object({
          inEnglish: z.boolean().describe('return the result in English'),
        }),
        execute: async ({ inEnglish }) => {
          const { data, error } = await supabase
            .from('news')
            .select(inEnglish ? 'title_en, summary_en, url, time, source' : 'title, summary, url, time, source')
            .order('time', { ascending: false })
            .limit(10)
          return {
            data: inEnglish
              ? data
              : data?.map((item: any) => ({
                  ...item,
                  title: pangu.spacing(item.title),
                  summary: pangu.spacing(item.summary),
                })),
            error: error ? 'An error occurred while fetching the latest news articles' : undefined,
          }
        },
      }),
      getNewsByUrl: tool({
        description: 'Get the news content by URL',
        parameters: z.object({
          url: z.string().describe('the URL of the news article'),
        }),
        execute: async ({ url }) => {
          const { data, error } = await supabase
            .from('news')
            .select('title, url, time, source, body')
            .eq('url', url)
            .single()
          return {
            data: data && {
              ...data,
              title: pangu.spacing(data.title),
              body: pangu.spacing(data.body),
            },
            error: error ? 'An error occurred while fetching the news article' : undefined,
          }
        },
      }),
      viewPage: tool({
        description: 'Get the current page content',
        parameters: z.object({}),
        execute: async () => {
          if (filename === '/docs/news') return `新聞頁面包含大量新聞，請使用搜尋新聞功能或是 latestNews 來尋找新聞`
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
