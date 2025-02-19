// auto update news from supabase
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import pangu from 'pangu'

// Constants
const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_KEY,
}

const FILE_PATHS = {
  zhTW: './pages/docs/news.zh-TW.mdx',
  enUS: './pages/docs/news.en-US.mdx',
}

const TEMPLATE = {
  zhTW: `# 新聞報導 📰

和**葛如鈞**有關的新聞報導

{/* Top */}
`,
  enUS: `# News 📰

News about **Ju-Chun KO**

> The following news has been translated by AI. There may be some errors in names or other details; please excuse any inaccuracies.

{/* Top */}
`,
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key)

// Utility functions
const formatDate = (date) => date.split('T')[0].replace(/-/g, '/')

const formatDateEnglish = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatText = (text) => pangu.spacing(text).replace(/葛如鈞/g, '**葛如鈞**')

const getExistingNewsUrls = (content) => {
  const urls = new Set()
  const matches = content.match(/\]\((.*?)\)/g) || []
  matches.forEach((match) => urls.add(match.slice(2, -1)))
  return urls
}

// Core functions
async function fetchNewsFromSupabase() {
  const { data, error } = await supabase
    .from('news')
    .select('url, title, source, time, summary, title_en, summary_en')
    .order('time', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}

function groupNewsByDate(newsData, existingUrls) {
  const newsByDate = {}
  newsData.forEach((item) => {
    if (!existingUrls.has(item.url)) {
      const date = formatDate(item.time)
      if (!newsByDate[date]) newsByDate[date] = []
      newsByDate[date].push(item)
    }
  })
  return newsByDate
}

function createNewsContent(item, isEnglish = false) {
  const title = isEnglish && item.title_en ? item.title_en : formatText(item.title.trim())
  const summary = isEnglish && item.summary_en ? item.summary_en : formatText(item.summary.trim())
  return `#### [${title}](${item.url.trim()}) \`${item.source}\`\n\n${summary}\n\n`
}

function insertNewsIntoContent(content, date, items, isEnglish = false) {
  const dateHeader = isEnglish ? formatDateEnglish(date.replace(/\//g, '-')) : date
  const dateSection = content.includes(`## ${dateHeader}`)

  if (dateSection) {
    const dateSectionIndex = content.indexOf(`## ${dateHeader}`) + `## ${dateHeader}`.length
    const nextSectionIndex = content.indexOf('##', dateSectionIndex + 1)
    const insertPosition = nextSectionIndex === -1 ? content.length : nextSectionIndex

    const newItemsContent = '\n\n' + items.map((item) => createNewsContent(item, isEnglish)).join('')
    return content.slice(0, insertPosition) + newItemsContent + content.slice(insertPosition)
  } else {
    const existingDates = (content.match(/## [\d/]+|## [A-Za-z]+ \d+, \d{4}/g) || []).map((date) => date.slice(3))
    const allDates = [...existingDates, dateHeader].sort((a, b) => b.localeCompare(a))
    const dateIndex = allDates.indexOf(dateHeader)

    const insertPosition =
      dateIndex === allDates.length - 1 ? content.length : content.indexOf(`## ${allDates[dateIndex + 1]}`)

    const newDateContent = `\n\n## ${dateHeader}\n\n` + items.map((item) => createNewsContent(item, isEnglish)).join('')

    return content.slice(0, insertPosition) + newDateContent + content.slice(insertPosition)
  }
}

async function updateNews() {
  try {
    // Fetch news data
    const newsData = await fetchNewsFromSupabase()

    // Process Chinese version
    let zhContent = ''
    try {
      zhContent = fs.readFileSync(FILE_PATHS.zhTW, 'utf8')
    } catch {
      zhContent = TEMPLATE.zhTW
    }

    const existingUrls = getExistingNewsUrls(zhContent)
    const newsByDate = groupNewsByDate(newsData, existingUrls)

    if (Object.keys(newsByDate).length === 0) {
      console.log('No new news items to add')
      return
    }

    // Update Chinese content
    Object.entries(newsByDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([date, items]) => {
        zhContent = insertNewsIntoContent(zhContent, date, items)
      })

    zhContent = zhContent.replaceAll('\n\n\n\n', '\n\n')
    fs.writeFileSync(FILE_PATHS.zhTW, zhContent)
    console.log('Chinese news file updated successfully')

    // Process English version
    let enContent = ''
    try {
      enContent = fs.readFileSync(FILE_PATHS.enUS, 'utf8')
    } catch {
      enContent = TEMPLATE.enUS
    }

    // Update English content only for new items
    Object.entries(newsByDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([date, items]) => {
        const dateHeader = formatDateEnglish(date.replace(/\//g, '-'))
        const englishItems = items.filter(item => item.title_en && item.summary_en)
        if (englishItems.length > 0) {
          enContent = insertNewsIntoContent(enContent, date, englishItems, true)
        }
      })

    enContent = enContent.replaceAll('\n\n\n\n', '\n\n')
    fs.writeFileSync(FILE_PATHS.enUS, enContent)
    console.log('English news file updated successfully')
  } catch (error) {
    console.error('Error updating news:', error)
  }
}

// Run the update
updateNews()
