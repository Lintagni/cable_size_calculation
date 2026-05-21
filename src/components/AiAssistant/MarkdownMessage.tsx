interface Props {
  content: string
  streaming?: boolean
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>
    return part
  })
}

export default function MarkdownMessage({ content, streaming }: Props) {
  if (!content && streaming) {
    return (
      <div className="flex gap-1 py-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    )
  }

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: Array<{ text: string; ordered: boolean; num?: string }> = []
  let key = 0

  function flushList() {
    if (!listItems.length) return
    const ordered = listItems[0].ordered
    elements.push(
      <div key={key++} className="my-1 space-y-0.5">
        {listItems.map((item, j) => (
          <div key={j} className="flex gap-2">
            <span className="text-blue-400 dark:text-blue-500 flex-shrink-0 font-medium">
              {ordered ? `${item.num}.` : '•'}
            </span>
            <span>{renderInline(item.text)}</span>
          </div>
        ))}
      </div>
    )
    listItems = []
  }

  for (const line of lines) {
    if (line.startsWith('### ')) {
      flushList()
      elements.push(<p key={key++} className="font-semibold text-sm mt-2 mb-0.5">{renderInline(line.slice(4))}</p>)
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <p key={key++} className="font-semibold text-sm mt-3 mb-1 pb-0.5 border-b border-gray-200 dark:border-gray-600">
          {renderInline(line.slice(3))}
        </p>
      )
    } else if (line.startsWith('# ')) {
      flushList()
      elements.push(<p key={key++} className="font-bold mt-2 mb-1">{renderInline(line.slice(2))}</p>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push({ text: line.slice(2), ordered: false })
    } else if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1]
      listItems.push({ text: line.replace(/^\d+\. /, ''), ordered: true, num })
    } else if (line === '---' || line === '***') {
      flushList()
      elements.push(<hr key={key++} className="border-gray-200 dark:border-gray-600 my-2" />)
    } else if (line.trim() === '') {
      flushList()
      if (elements.length) elements.push(<div key={key++} className="h-1" />)
    } else {
      flushList()
      elements.push(<p key={key++} className="leading-relaxed">{renderInline(line)}</p>)
    }
  }
  flushList()

  return <div className="space-y-0.5 text-sm">{elements}</div>
}
