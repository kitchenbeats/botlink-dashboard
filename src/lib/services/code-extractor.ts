import { createFiles, createProject } from '@/lib/db'
import type { InsertFile, ProjectType } from '@/lib/types'

export interface ExtractedCodeBlock {
  language: string
  code: string
  filename?: string
}

export interface ExtractedProject {
  name: string
  type: ProjectType
  files: Array<{
    path: string
    content: string
    language: string
  }>
}

/**
 * Extract code blocks from markdown text
 * Supports ```language syntax
 */
export function extractCodeBlocks(text: string): ExtractedCodeBlock[] {
  const codeBlockRegex =
    /```(\w+)(?:\s+(?:\/\/|#|<!--)\s*(.+?))?\n([\s\S]*?)```/g
  const blocks: ExtractedCodeBlock[] = []

  let match
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const [, language, filename, code] = match
    if (code) {
      blocks.push({
        language: language || 'text',
        code: code.trim(),
        filename: filename?.trim(),
      })
    }
  }

  return blocks
}

/**
 * Infer filename from code content or context
 */
export function inferFilename(
  codeBlock: ExtractedCodeBlock,
  index: number
): string {
  if (codeBlock.filename) {
    return codeBlock.filename
  }

  // Try to infer from language
  const extensions: Record<string, string> = {
    typescript: '.ts',
    tsx: '.tsx',
    javascript: '.js',
    jsx: '.jsx',
    html: '.html',
    css: '.css',
    python: '.py',
    rust: '.rs',
    go: '.go',
    java: '.java',
    cpp: '.cpp',
    c: '.c',
    json: '.json',
    yaml: '.yaml',
    yml: '.yml',
    sql: '.sql',
    sh: '.sh',
    bash: '.sh',
  }

  const ext = extensions[codeBlock.language.toLowerCase()] || '.txt'

  // Check for common patterns in code
  if (
    codeBlock.code.includes('function App(') ||
    codeBlock.code.includes('export default function')
  ) {
    return `App${ext}`
  }
  if (
    codeBlock.code.includes('function main(') ||
    codeBlock.code.includes('def main(')
  ) {
    return `main${ext}`
  }
  if (codeBlock.code.includes('<!DOCTYPE html>')) {
    return 'index.html'
  }

  return `file${index}${ext}`
}

// detectProjectType removed - was legacy code not compatible with current template system

/**
 * Generate project name from execution input
 */
export function generateProjectName(input: string): string {
  // Extract key words from input
  const words = input
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 3 &&
        !['that', 'this', 'with', 'from', 'have', 'will'].includes(w)
    )
    .slice(0, 3)

  return words.length > 0 ? words.join('-') : 'generated-project'
}

/**
 * Extract full project from agent output
 */
export function extractProject(
  text: string,
  executionInput: string
): ExtractedProject | null {
  const codeBlocks = extractCodeBlocks(text)

  if (codeBlocks.length === 0) {
    return null
  }

  const files = codeBlocks.map((block, index) => ({
    path: inferFilename(block, index),
    content: block.code,
    language: block.language,
  }))

  return {
    name: generateProjectName(executionInput),
    type: 'simple_site', // Default to simple_site template
    files,
  }
}

/**
 * Save extracted project to database
 */
export async function saveExtractedProject(
  teamId: string,
  executionId: string,
  taskOutput: string,
  executionInput: string
): Promise<string | null> {
  const extractedProject = extractProject(taskOutput, executionInput)

  if (!extractedProject) {
    return null
  }

  // Create project
  const project = await createProject({
    team_id: teamId,
    name: extractedProject.name,
    template:
      extractedProject.type as import('@/lib/types/database').ProjectTemplate,
    description: `Generated from execution ${executionId}`,
    settings: {},
  })

  // Create files
  const fileInserts: InsertFile[] = extractedProject.files.map((file) => ({
    project_id: project.id,
    path: file.path,
    content: file.content,
    language: file.language,
    created_by: 'ai' as const,
  }))

  await createFiles(fileInserts)

  return project.id
}
