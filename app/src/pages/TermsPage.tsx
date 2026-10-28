import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Footer from '@/components/ui/footer'
import { useThemeSync } from '@/lib/useTheme'

export default function TermsPage() {
  useThemeSync()
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
      <main className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="flex justify-end mb-6">
          <Link to="/">
            <Button>Home</Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-4">These terms govern your use of Typing Master. By using the service you agree to these terms.</p>
        <section className="space-y-3 text-slate-600 dark:text-slate-300">
          <p><strong>Usage:</strong> You may use the service for personal or educational purposes.</p>
          <p><strong>Accounts:</strong> Keep your credentials secure; we are not responsible for account misuse.</p>
          <p><strong>Content:</strong> Respect copyright and user-generated content rules.</p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
