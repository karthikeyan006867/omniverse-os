import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OMNIVERSE OS - The Future of Computing',
  description: 'A Fully Distributed, Self-Evolving Web Operating System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
