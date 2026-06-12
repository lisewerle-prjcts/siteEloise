import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'YES BOX — Le Pacte',
  description: 'Le programme d\'accompagnement pour les couples qui tiennent.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-cream antialiased">
        {children}
      </body>
    </html>
  )
}
