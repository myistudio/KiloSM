"use client"

import { useEffect } from 'react'

type Props = {
  slug: string
  chart: 'jodi' | 'panel'
}

function getWeekStartUTC(date: Date): Date {
  const day = date.getUTCDay()
  const offset = (day + 6) % 7
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() - offset)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function dayNameFromUTCDay(dayIdx: number): string {
  switch (dayIdx) {
    case 0: return 'SUNDAY'
    case 1: return 'MONDAY'
    case 2: return 'TUESDAY'
    case 3: return 'WEDNESDAY'
    case 4: return 'THURSDAY'
    case 5: return 'FRIDAY'
    case 6: return 'SATURDAY'
    default: return 'MONDAY'
  }
}

function applyHighlight(el: HTMLElement) {
  el.classList.add('live-update-flash')
  setTimeout(() => {
    el.classList.remove('live-update-flash')
  }, 1200)
}

function setText(el: HTMLElement | null, text: string) {
  if (!el) return
  const prev = el.textContent || ''
  if (prev !== text) {
    el.textContent = text
    applyHighlight(el.closest('td') || el)
  }
}

export default function LiveChartSSE({ slug, chart }: Props) {
  useEffect(() => {
    const es = new EventSource(`/api/markets/${encodeURIComponent(slug)}/latest/stream`)

    function onMessage(ev: MessageEvent) {
      try {
        const data = JSON.parse(ev.data)
        const today = data?.today
        if (!today) return
        const d = new Date(today.date)
        const wk = getWeekStartUTC(d).toISOString()
        const day = dayNameFromUTCDay(d.getUTCDay())
        const td = document.querySelector<HTMLTableCellElement>(`td[data-cell-id="${wk}:${day}"]`)
        if (!td) return

        // Update jodi value for both charts
        const jodiText = today.jodi ? String(today.jodi).replace(/\D/g, '').padStart(2, '0').slice(-2) : '-'
        const jodiEl = td.querySelector<HTMLElement>('span[data-cell-role="jodi-value"]')
        setText(jodiEl, jodiText)

        if (chart === 'panel') {
          const open = today.openPatti ? String(today.openPatti) : null
          const close = today.closePatti ? String(today.closePatti) : null
          const openEls = td.querySelectorAll<HTMLElement>('span[data-cell-role="open-patti"]')
          const closeEls = td.querySelectorAll<HTMLElement>('span[data-cell-role="close-patti"]')
          if (open && openEls.length) {
            const digits = open.split('')
            openEls.forEach((el, idx) => setText(el, digits[idx] ?? ''))
          }
          if (close && closeEls.length) {
            const digits = close.split('')
            closeEls.forEach((el, idx) => setText(el, digits[idx] ?? ''))
          }
        }
      } catch (e) {
        // ignore
      }
    }

    es.addEventListener('message', onMessage)
    es.addEventListener('error', () => {
      // browser will auto-reconnect; no-op
    })

    return () => {
      es.removeEventListener('message', onMessage)
      es.close()
    }
  }, [slug, chart])

  return (
    <style jsx global>{`
      @keyframes liveFlash {
        0% { background-color: rgba(34, 197, 94, 0.0); }
        25% { background-color: rgba(34, 197, 94, 0.25); }
        50% { background-color: rgba(34, 197, 94, 0.35); }
        100% { background-color: rgba(34, 197, 94, 0.0); }
      }
      .live-update-flash {
        animation: liveFlash 1.2s ease-in-out;
        border-radius: 4px;
      }
    `}</style>
  )
}