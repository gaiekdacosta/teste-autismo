import type { ReactNode } from 'react'
import { FiChevronDown } from 'react-icons/fi'

export type AccordeonItem = {
  id: string
  header: ReactNode
  content: ReactNode
}

type AccordeonProps = {
  items: AccordeonItem[]
  openItemId: string
  onOpenChange: (itemId: string) => void
  emptyMessage?: string
}

export function Accordeon({
  items,
  openItemId,
  onOpenChange,
  emptyMessage = 'Nenhum item encontrado.',
}: AccordeonProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--muted)]">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const isOpen = openItemId === item.id
        const contentId = `accordeon-content-${item.id}`

        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => onOpenChange(isOpen ? '' : item.id)}
              className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-[var(--surface)] sm:px-5"
            >
              <div className="min-w-0 flex-1">{item.header}</div>
              <FiChevronDown
                className={`h-5 w-5 shrink-0 text-[var(--muted)] transition ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div id={contentId} className="border-t border-[var(--border)] px-4 py-5 sm:px-5">
                {item.content}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
