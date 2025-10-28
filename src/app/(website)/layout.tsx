import { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Satta Matka - Live Results & Predictions',
  description: 'Get live Satta Matka results, predictions, and tips. Fastest results for Kalyan, Milan, and other markets.',
  keywords: 'satta matka, kalyan matka, matka result, satta king, matka guessing',
}

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen">
      {children}
    </div>
  )
}