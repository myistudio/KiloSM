"use client"

import { useEffect, useState } from 'react'

export default function SmallLiveStatus({ size = 'md', inline = false }: { size?: 'sm' | 'md', inline?: boolean }) {
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dtf = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const { timeOnly, ampm } = mounted
    ? (() => {
        const parts = dtf.formatToParts(time)
        const dayPeriod = (parts.find((p) => p.type === 'dayPeriod')?.value || '').toUpperCase()
        const timeOnly = parts
          .filter((p) => p.type !== 'dayPeriod')
          .map((p) => p.value)
          .join('')
          .trim()
        return { timeOnly, ampm: dayPeriod }
      })()
    : { timeOnly: '—:—:—', ampm: '' }

  const sizeClasses = size === 'sm'
    ? {
        dot: 'h-1.5 w-1.5',
        pill: 'px-2 py-0.5 text-[10px] gap-1.5',
      }
    : {
        dot: 'h-2 w-2',
        pill: 'px-3 py-1 text-xs gap-2',
      }

  return (
    <div className={inline ? '' : 'mt-2 flex items-center justify-center'}>
      <div className={`inline-flex items-center ${sizeClasses.pill} rounded-full bg-red-600 text-white font-semibold uppercase shadow-sm`}>
         <span className="relative flex">
           <span className={`animate-ping absolute inline-flex rounded-full ${sizeClasses.dot} bg-white opacity-75`}></span>
           <span className={`relative inline-flex rounded-full ${sizeClasses.dot} bg-white`}></span>
         </span>
         <span className="animate-pulse">LIVE</span>
         <span className="font-mono" suppressHydrationWarning>{timeOnly}</span>
         {ampm && <span className="ml-1 text-xs font-semibold" suppressHydrationWarning>{ampm}</span>}
       </div>
     </div>
   )
}