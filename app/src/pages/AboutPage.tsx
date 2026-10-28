import Footer from '@/components/ui/footer'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useThemeSync } from '@/lib/useTheme'

export default function AboutPage() {
  useThemeSync()
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-white">
      <main className="mx-auto w-full max-w-4xl px-6 py-16">
        <div className="flex justify-end mb-6">
          <Link to="/">
            <Button>Home</Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-4">About Typing Master</h1>
        <p className="text-base text-slate-600 dark:text-slate-300 mb-4">
          Typing Master helps learners of all levels improve their typing speed and accuracy with structured lessons, practice modes, and live competitions.
        </p>
        <section className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">Our mission is to make typing practice engaging and effective. We provide guided lessons, timed drills, and real-time leaderboards so you can track progress and compete with friends.</p>
          <p className="text-slate-600 dark:text-slate-300">Built with accessibility and performance in mind, Typing Master supports responsive layouts, keyboard-first interactions, and multiple game modes to suit different learning styles.</p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
