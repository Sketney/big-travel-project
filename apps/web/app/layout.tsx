export const metadata = {
  title: 'Travel MVP',
  description: 'Visa + Checklist + Budget (MVP)',
}

import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  )
}
