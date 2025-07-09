import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Video App',
  description: 'Created with next & typescript',
  creator: 'Md kamruzzaman',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
