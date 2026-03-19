'use client'

import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
        <p className="text-xs text-[var(--color-subtle)]">Ładowanie edytora...</p>
      </div>
    </div>
  ),
})

export type CodeLanguage = 'html' | 'markdown' | 'json' | 'css' | 'typescript'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: CodeLanguage
  height?: string
  readOnly?: boolean
}

export function CodeEditor({ value, onChange, language, height = '100%', readOnly = false }: CodeEditorProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return (
    <div className="w-full flex items-center justify-center bg-[var(--color-surface)]" style={{ height }}>
      <div className="w-8 h-8 border-2 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
    </div>
  )

  return (
    <MonacoEditor
      height={height}
      language={language}
      value={value}
      onChange={(val) => onChange(val ?? '')}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      options={{
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Cascadia Code, Fira Code, monospace',
        fontLigatures: true,
        minimap: { enabled: false },
        lineNumbers: 'on',
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        formatOnPaste: true,
        formatOnType: true,
        autoIndent: 'full',
        tabSize: 2,
        readOnly,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: 'gutter',
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true },
        suggest: { preview: true },
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
      }}
    />
  )
}
