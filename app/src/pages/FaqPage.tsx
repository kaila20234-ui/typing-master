import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Footer from '@/components/ui/footer'
import { useThemeSync } from '@/lib/useTheme'

const faqs = [
  { q: 'How do I start?', a: 'Create an account and choose a lesson to start practicing.' },
  { q: 'Can I compete with friends?', a: 'Yes — use the Competitions section to create or join races.' },
  { q: 'Is there a mobile app?', a: 'The web app is responsive; a native app is planned.' },
]

export default function FaqPage() {
  useThemeSync()
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
      <main className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="flex justify-end mb-6">
          <Link to="/">
            <Button>Home</Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-4">Frequently Asked Questions</h1>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="border-b pb-3">
              <h3 className="font-semibold">{f.q}</h3>
              <p className="text-slate-600 dark:text-slate-300">{f.a}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
