// auto update news from supabase
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Template for the news file
const template = `# 新聞報導 📰

和**葛如鈞**有關的新聞報導

{/* Top */}
`

// Function to format date as YYYY/MM/DD
const formatDate = (date) => {
  return date.split('T')[0].replace(/-/g, '/')
}

// Function to get existing news URLs
const getExistingNewsUrls = (content) => {
  const urls = new Set()
  const matches = content.match(/\]\((.*?)\)/g) || []
  matches.forEach((match) => {
    const url = match.slice(2, -1)
    urls.add(url)
  })
  return urls
}

// Function to add bold formatting to 葛如鈞
const addBoldFormatting = (text) => {
  return text.replace(/葛如鈞/g, '**葛如鈞**')
}

async function updateNews() {
  try {
    // Fetch news from Supabase
    const { data, error } = await supabase
      .from('news')
      .select('url, title, source, time, summary')
      .order('time', { ascending: false })
      .limit(100)

    if (error) throw error

    // Read existing news file
    let content = ''
    try {
      content = fs.readFileSync('./pages/docs/news.zh-TW.mdx', 'utf8')
    } catch (e) {
      // If file doesn't exist, use template
      content = template
    }
    const existingUrls = getExistingNewsUrls(content)

    // Group news by date
    const newsByDate = {}
    data.forEach((item) => {
      if (!existingUrls.has(item.url)) {
        const date = formatDate(item.time)
        if (!newsByDate[date]) {
          newsByDate[date] = []
        }
        newsByDate[date].push(item)
      }
    })

    // If no new content, keep existing content
    if (Object.keys(newsByDate).length === 0) {
      console.log('No new news items to add')
      return
    }

    // For new file, use template
    if (content === '') {
      content = template
    }
    console.log(newsByDate)
    // Get all existing dates from content
    const existingDates = (content.match(/## \d{4}\/\d{2}\/\d{2}/g) || []).map((date) => date.slice(3))

    // Add new news items grouped by date
    Object.entries(newsByDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([date, items]) => {
        // Check if date section exists in existing content
        const dateSection = content.includes(`## ${date}`)
        if (dateSection) {
          // Find the position after the date header
          const dateSectionIndex = content.indexOf(`## ${date}`) + `## ${date}`.length
          const nextSectionIndex = content.indexOf('##', dateSectionIndex + 1)
          const insertPosition = nextSectionIndex === -1 ? content.length : nextSectionIndex

          // Prepare new items content
          let newItemsContent = '\n\n'
          items.forEach((item) => {
            newItemsContent += `#### [${addBoldFormatting(item.title.trim())}](${item.url.trim()}) \`${item.source}\`\n\n`
            newItemsContent += addBoldFormatting(item.summary.trim()) + '\n\n'
          })

          // Insert new items after the date header
          content = content.slice(0, insertPosition) + newItemsContent + content.slice(insertPosition)
        } else {
          // Find the correct position to insert the new date section
          const allDates = [...existingDates, date].sort((a, b) => b.localeCompare(a))
          const dateIndex = allDates.indexOf(date)
          let insertPosition

          if (dateIndex === allDates.length - 1) {
            // If it's the oldest date, append to the end
            insertPosition = content.length
          } else {
            // Find the position of the next newer date
            const nextDate = allDates[dateIndex + 1]
            const nextDatePosition = content.indexOf(`## ${nextDate}`)
            insertPosition = nextDatePosition === -1 ? content.length : nextDatePosition
          }

          // Prepare new date section content
          let newDateContent = `\n\n## ${date}\n\n`
          items.forEach((item) => {
            newDateContent += `#### [${addBoldFormatting(item.title.trim())}](${item.url.trim()}) \`${item.source}\`\n\n`
            newDateContent += addBoldFormatting(item.summary.trim()) + '\n\n'
          })

          // Insert the new date section at the correct position
          content = content.slice(0, insertPosition) + newDateContent + content.slice(insertPosition)
        }
      })
    content = content.replaceAll('\n\n\n\n', '\n\n')
    // Write the updated content
    fs.writeFileSync('./pages/docs/news.zh-TW.mdx', content)
    console.log('News file updated successfully')

    // Update English version
    fs.writeFileSync(
      './pages/docs/news.en-US.mdx',
      '# News 📰\n\nNews about **Ju-Chun KO**\n\n{/* Top */}\n' + content.split('{/* Top */}')[1],
    )
    console.log('English news file updated successfully')
  } catch (error) {
    console.error('Error updating news:', error)
  }
}

// Run the update
updateNews()
