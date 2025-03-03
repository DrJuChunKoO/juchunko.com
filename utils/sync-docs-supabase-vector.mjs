// auto update docs to supabase with paragraph vectorization
import 'dotenv/config'
import { createOpenAI } from '@ai-sdk/openai'
import { embed } from 'ai'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Get changed file from args
const args = process.argv.slice(2)
const filePath = args[0]

if (!filePath) {
  console.error('Please provide a file path as an argument')
  process.exit(1)
}

// Check if file should be excluded
function shouldExcludeFile(filePath) {
  const excludedFiles = ['news.zh-TW.mdx', 'news.en-US.mdx']
  const fileName = filePath.split('/').pop()
  return excludedFiles.includes(fileName)
}

// Initialize clients
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://gateway.ai.cloudflare.com/v1/3f1f83a939b2fc99ca45fd8987962514/juchunko-com/openai',
})
const embeddingModel = openai.embedding('text-embedding-3-small')

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Split text into sections based on Markdown headings
function splitIntoParagraphs(text) {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm

  // Find all heading positions
  const headings = []
  let match
  while ((match = headingRegex.exec(text)) !== null) {
    headings.push({
      level: match[1].length,
      title: match[2].trim(),
      position: match.index,
    })
  }

  // If no headings, treat the whole document as one section
  if (headings.length === 0) {
    return [text.trim()].filter((p) => p.length > 0)
  }

  // Split content into sections based on headings
  const sections = []

  // Add content before the first heading if it exists
  if (headings[0].position > 0) {
    const frontMatter = text.substring(0, headings[0].position).trim()
    if (frontMatter.length > 0) {
      sections.push(frontMatter)
    }
  }

  // Add each heading with its content
  for (let i = 0; i < headings.length; i++) {
    const startPos = headings[i].position
    const endPos = i < headings.length - 1 ? headings[i + 1].position : text.length

    // Get the section including the heading
    let section = text.substring(startPos, endPos).trim()

    // Only add non-empty sections
    if (section.length > 0) {
      sections.push(section)
    }
  }

  return sections.filter((p) => p.length > 0)
}

// Detect language from file extension
function detectLanguage(filePath) {
  const match = filePath.match(/\.([a-z]{2}-[A-Z]{2})\.mdx$/)
  if (match && match[1]) {
    return match[1].split('-')[0]
  }
  return 'en'
}

// Generate embeddings for a paragraph
async function generateEmbedding(text) {
  try {
    const { embedding } = await embed({
      model: embeddingModel,
      value: text,
    })
    return embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

// Extract title from paragraph
function extractTitle(paragraph, baseTitle, index) {
  const headingMatch = paragraph.match(/^(#{1,6})\s+(.+)$/m)

  if (headingMatch) {
    return headingMatch[2].trim()
  } else {
    return index === 0 ? baseTitle : `${baseTitle} - Part ${index + 1}`
  }
}

// Insert paragraph data into Supabase
async function insertParagraphData(paragraphData) {
  const { error } = await supabase.from('official_website').insert(paragraphData)

  if (error) {
    console.error(`Error inserting paragraph ${paragraphData.chunk_id}:`, error)
    throw error
  }
}

// Delete existing entries for a path
async function deleteExistingEntries(path) {
  const { error } = await supabase.from('official_website').delete().eq('path', path)

  if (error) {
    console.error('Error deleting existing records:', error)
    throw error
  }
}

// Process file and update database
async function processFile(filePath) {
  const fileContent = fs.readFileSync(path.join('.', filePath), 'utf8')
  const language = detectLanguage(filePath)
  const baseTitle = filePath.split('/').pop().split('.')[0]
  const paragraphs = splitIntoParagraphs(fileContent)

  await deleteExistingEntries(filePath)

  console.log(`Processing ${paragraphs.length} paragraphs from ${filePath}`)

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i]
    const title = extractTitle(paragraph, baseTitle, i)
    const embedding = await generateEmbedding(paragraph)

    await insertParagraphData({
      title,
      paragraph,
      embedding,
      path: filePath,
      language,
      chunk_id: i,
    })
  }

  console.log(`Successfully processed and updated ${paragraphs.length} paragraphs for ${filePath}`)
}

// Main execution
async function main() {
  try {
    if (shouldExcludeFile(filePath)) {
      console.log(`Skipping excluded file: ${filePath}`)
      return
    }
    await processFile(filePath)
  } catch (error) {
    console.error('Error in main process:', error)
    process.exit(1)
  }
}

main()
