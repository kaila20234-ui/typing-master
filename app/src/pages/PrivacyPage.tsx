import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Footer from '@/components/ui/footer'
import { useThemeSync } from '@/lib/useTheme'

export default function PrivacyPage() {
  useThemeSync()
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
      <main className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="flex justify-end mb-6">
          <Link to="/">
            <Button>Home</Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-4">We take your privacy seriously. This page summarises how we collect and use data.</p>
        <section className="space-y-3 text-slate-600 dark:text-slate-300">
          <p><strong>Data we collect:</strong> account information, progress data, and analytics.</p>
          <p><strong>How we use it:</strong> to improve the product, personalize learning, and provide leaderboards and competitions.</p>
          <p><strong>Third parties:</strong> we use payment providers for transactions — we do not share personal information unnecessarily.</p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
