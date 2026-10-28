import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'

export interface TestState {
  wpm: number
  accuracy: number
  duration: number
  correctChars: number
  incorrectChars: number
}

interface TestAreaProps {
  text: string
  onComplete: (state: TestState) => void
  focusOnMount?: boolean
}

export function TestArea({ text, onComplete, focusOnMount = true }: TestAreaProps) {
  const [userInput, setUserInput] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [duration, setDuration] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focusOnMount && inputRef.current) {
      inputRef.current.focus()
    }
  }, [focusOnMount])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (isActive) {
      interval = setInterval(() => {
        if (startTime) {
          setDuration(Date.now() - startTime)
        }
      }, 100)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, startTime])

  const handleInputChange = (e: string) => {
    if (!isActive && e.length > 0) {
      setIsActive(true)
      setStartTime(Date.now())
    }
    setUserInput(e)

    // Check if user finished typing
    if (e.length >= text.length) {
      finishTest(e)
    }
  }

  const finishTest = (finalInput: string) => {
    setIsActive(false)

    // Calculate stats
    const chars = finalInput.split('')
    let correctChars = 0
    let incorrectChars = 0

    for (let i = 0; i < text.length; i++) {
      if (chars[i] === text[i]) {
        correctChars++
      } else if (i < chars.length) {
        incorrectChars++
      }
    }

    // Add any extra characters as incorrect
    if (chars.length > text.length) {
      incorrectChars += chars.length - text.length
    }

    const timeInSeconds = duration / 1000
    const wpm = Math.round((correctChars / 5) / (timeInSeconds / 60)) || 0
    const accuracy = Math.round((correctChars / text.length) * 100) || 0

    onComplete({
      wpm,
      accuracy,
      duration,
      correctChars,
      incorrectChars,
    })
  }

  const progress = (userInput.length / text.length) * 100

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div>
        <p className="text-sm text-slate-400 mb-2">
          Progress: {userInput.length} / {text.length} characters
        </p>
        <Progress value={Math.min(progress, 100)} className="bg-slate-700" />
      </div>

      {/* Time */}
      <div className="text-center">
        <p className="text-sm text-slate-400">
          Time: <span className="text-cyan-400 font-bold">{(duration / 1000).toFixed(1)}s</span>
        </p>
      </div>

      {/* Typing Input */}
      <div className="space-y-3">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Click here and start typing..."
          value={userInput}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={isActive && userInput.length >= text.length}
          className="bg-slate-900/50 border-slate-700 text-white text-lg font-mono p-4 h-auto"
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {/* Finish Button */}
      {userInput.length > 0 && userInput.length < text.length && (
        <Button
          onClick={() => finishTest(userInput)}
          variant="outline"
          className="w-full border-slate-600 text-slate-400 hover:text-white"
        >
          Finish Early
        </Button>
      )}
    </div>
  )
}
