import React, { useState } from "react";
import { Link } from 'react-router-dom'
import { Twitter, Facebook, Instagram, Mail, Github, ExternalLink } from 'lucide-react'
// Try to read app version from package.json (fallback to empty)
let appVersion = ''
try {
  // Relative path to app/package.json
  // Note: TypeScript project should have resolveJsonModule enabled, otherwise this will be ignored at build time.
  // This is a best-effort; if it fails, we show no version.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // @ts-ignore
  const pkg = require('../../../package.json')
  appVersion = pkg?.version || ''
} catch (e) {
  appVersion = ''
}

export default function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submitNewsletter = (e: React.FormEvent) => {
    e.preventDefault()
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!isValid) {
      alert('Please enter a valid email address')
      return
    }
    // Placeholder: implement real submission later
    setSubmitted(true)
    console.log('Newsletter signup:', email)
  }

  return (
    <footer role="contentinfo" className="w-full border-t bg-gradient-to-t from-transparent to-white/5 dark:to-black/5 px-6 py-10 text-sm text-slate-700 dark:text-slate-300">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand & description */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M3 12h18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 3v18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold">Typing Master</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Practice, compete, master your keyboard.</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Learn to type faster with structured lessons, timed practice, and competitive races. Join the community and track your progress.
            </div>
            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">{appVersion ? `v${appVersion}` : ''} • © {year} Typing Master</div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-3 text-sm font-medium">Quick Links</h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li><Link className="hover:underline" to="/lessons">Lessons</Link></li>
              <li><Link className="hover:underline" to="/practice">Practice</Link></li>
              <li><Link className="hover:underline" to="/competitions">Competitions</Link></li>
              <li><Link className="hover:underline" to="/leaderboard">Leaderboard</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-3 text-sm font-medium">Resources</h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li><Link className="hover:underline" to="/about">About Us</Link></li>
              <li><Link className="hover:underline" to="/privacy">Privacy Policy</Link></li>
              <li><Link className="hover:underline" to="/terms">Terms of Service</Link></li>
              <li><Link className="hover:underline" to="/faq">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact / newsletter */}
          <div>
            <h3 className="mb-3 text-sm font-medium">Stay in touch</h3>
            <div className="text-slate-600 dark:text-slate-300 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:support@typingmaster.app" className="hover:underline">support@typingmaster.app</a>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <a href="/contact" className="hover:underline">Contact form</a>
              </div>
            </div>

            <form onSubmit={submitNewsletter} className="mt-4 flex items-center gap-2" aria-label="newsletter">
              <label htmlFor="footer-newsletter" className="sr-only">Email</label>
              <input
                id="footer-newsletter"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-md border px-3 py-2 text-sm bg-white dark:bg-slate-800"
              />
              <button type="submit" className="rounded-md bg-emerald-500 px-3 py-2 text-sm text-white">Join</button>
            </form>
            {submitted && <div className="mt-2 text-xs text-emerald-600">Thanks — check your inbox to confirm subscription.</div>}

            <div className="mt-4 flex items-center gap-3">
              <a href="https://twitter.com" aria-label="Twitter" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                <Twitter className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </a>
              <a href="https://facebook.com" aria-label="Facebook" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                <Facebook className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </a>
              <a href="https://instagram.com" aria-label="Instagram" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                <Instagram className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </a>
              <a href="https://github.com/" aria-label="GitHub" className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                <Github className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-xs text-slate-500 dark:text-slate-400 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>© {year} Typing Master. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="/cookie" className="hover:underline">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
