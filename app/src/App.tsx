import { useState, useEffect, useRef } from 'react'
import './App.css'
import { 
  Keyboard, 
  Timer, 
  Target, 
  RotateCcw, 
  Play, 
  Trophy,
  BarChart3,
  Type,
  Settings,
  ChevronRight,
  Star,
  Zap,
  Award,
  BookOpen,
  Volume2,
  VolumeX,
  RotateCw,
  X,
  User,
  LogOut,
  Flame,
  StopCircle,
  Home,
  Lock,
  Crown,
  Sun,
  Moon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import Footer from '@/components/ui/footer'
import { RaceHub } from '@/components/RaceHub'
import { Leaderboard } from '@/components/Leaderboard'
import { DailyChallenge } from '@/components/DailyChallenge'
import { Tournaments } from '@/components/Tournaments'
import { SquadWars } from '@/components/SquadWars'
import { MaintenancePage } from '@/components/MaintenancePage'
import { AdminStatistics } from '@/components/ui/admin-statistics'
import { apiClient } from '@/lib/api'

// Generate lessons programmatically
const generateLessons = () => {
  // Custom beginner lessons with character progression: 5 → 7 → 9 → 11 and beyond (30 total)
  const beginnerLessonTexts = [
    "asdf", "asdf la", "sad sad ad", "cat dog sun fox", "the cat sat here",
    "a sad lad asked dad", "fat sad lab is here", "I see a cat on a mat", "the dog is sad and did ask", "I like to type and sit here",
    "dad has a dog and a cat too", "the sun is hot and the sky", "I see a sad cat and a dog", "he did sit on the old chair", "she has a red hat and shoes",
    "the dog sat and the cat slept", "I like cats and dogs and fish", "we see the sun and the trees", "he can see the dog and the cat", "she sits and reads a good book",
    "the dogs are happy and healthy", "I see the cat and dog is happy", "we see the sky and trees today", "the sun is bright and the sky", "I like to sit and read a book",
    "she has a red cat and dog at", "he likes to see the sun shine", "the cat sat under the big tree", "I see all the dogs and the cats", "the old dog sat and had a rest"
  ];

  const beginnerLessons = beginnerLessonTexts.map((text, i) => ({
    id: i + 1,
    title: `Lesson ${i + 1}`,
    text: text,
    description: `Beginner typing practice - Lesson ${i + 1}`
  }));

  const sampleTexts = {
    beginner: [
      'asdf',
      'asdf la',
      'sad sad ad',
      'cat dog sun fox',
      'the cat sat',
      'dad sad ask',
      'fad lad sad',
      'ok ad la ad',
      'a sad lad',
      'fat sad lab'
    ],
    intermediate: [
      'The quick brown fox jumps over',
      'pack my box with five dozen',
      'how vexingly quick daft zebras',
      'sphinx of black quartz judge',
      'hello world is the first program',
      'python java javascript are languages',
      'data structures organize information',
      'algorithms solve computational problems',
      'loops repeat operations very efficiently now',
      'conditionals make decisions based on conditions',
      'functions organize code into reusable blocks',
      'variables store data in memory locations now',
      'strings are sequences of text characters here',
      'integers are whole numbers without decimals',
      'floats are numbers with decimal points',
      'arrays store multiple values together',
      'objects contain properties and their methods',
      'classes define blueprints for creating objects',
      'inheritance allows code reuse across classes',
      'polymorphism provides flexibility in code',
      'recursion solves problems by breaking them down',
      'sorting arranges elements in order quickly',
      'searching finds elements very efficiently',
      'hashing provides very fast lookup times',
      'caching stores frequently used data nearby',
      'database stores and retrieves information',
      'query retrieves specific data from the database',
      'index speeds up searches significantly',
      'transaction maintains data integrity always',
      'encryption protects sensitive information well',
      'authentication verifies user identity correctly',
      'authorization controls access rights properly',
      'api allows programs to communicate together',
      'rest uses http methods get post put delete',
      'json is human readable data format',
      'xml is extensible markup language format',
      'html structures web page content layout',
      'css styles web page appearance and layout',
      'javascript adds interactivity to web pages',
      'react builds user interfaces very efficiently',
      'node runs javascript on the backend server',
      'express is web framework for building servers',
      'mongodb stores data in documents and collections',
      'sql queries relational databases effectively',
      'version control tracks code changes over time',
      'git is popular version control system used',
      'github hosts code repositories online always',
      'testing ensures code quality and reliability',
      'debugging finds and fixes errors quickly',
      'refactoring improves code structure always',
      'documentation explains how code works',
      'comments clarify code intent and logic',
      'clean code is readable and maintainable',
      'design patterns solve common problems',
      'agile methodology focuses on iterations',
      'scrum manages team collaboration effectively',
      'sprint is a short development cycle',
      'standup meeting aligns team daily goals',
      'code review catches mistakes early always',
      'continuous integration automates testing well',
      'deployment releases code to production servers',
    ],
    advanced: [
      'the evolution of technology has fundamentally reshaped how we work and interact daily',
      'artificial intelligence has become integral to solving complex real world problems',
      'throughout history humans have continuously adapted to technological advancement',
      'the industrial revolution marked a turning point in human civilization forever',
      'renewable energy sources are becoming increasingly vital to sustainable living',
      'climate change requires immediate coordinated global action and commitment',
      'education in the digital age demands new approaches to learning and innovation',
      'healthcare systems must balance cost efficiency with quality patient outcomes',
      'cybersecurity has emerged as one of the most critical concerns in society today',
      'machine learning algorithms analyze vast datasets to uncover meaningful patterns',
      'quantum computing promises to solve problems beyond current computational limits',
      'the human brain remains one of sciences most fascinating unsolved mysteries yet',
      'philosophy continues to grapple with fundamental questions about consciousness',
      'literature allows us to explore different perspectives and human experiences',
      'the great gatsby captures the excesses and disillusionment of the jazz age',
      'to kill a mockingbird addresses racial injustice through an unforgettable narrative',
      'shakespeares works remain relevant because they explore timeless human themes',
      'poetry can convey complex emotions through carefully chosen words and metaphors',
      'economic systems shape how resources are distributed throughout society broadly',
      'international trade has created complex interdependencies between global nations',
      'artificial neural networks attempt to mimic the functioning of biological brains',
      'data science combines statistics mathematics and domain expertise to extract insights',
      'genetics research continues to unlock the secrets encoded in our dna molecules',
      'evolution explains the diversity of life through natural selection mechanisms',
      'psychology helps us understand human behavior motivations and mental processes',
      'sociology examines how social structures influence individual behavior patterns',
      'anthropology studies diverse human cultures and their unique traditions worldwide',
      'archaeology pieces together human history through careful analysis of artifacts',
      'history teaches us valuable lessons from past civilizations and human struggles',
      'the renaissance marked a cultural flowering of art science and intellectual thought',
      'the age of enlightenment emphasized reason and scientific inquiry over superstition',
      'the french revolution challenged established hierarchies throughout european society',
      'industrial economies rely on complex supply chains and international cooperation',
      'environmental conservation requires balancing human needs with ecological stability',
      'renewable energy technology is advancing rapidly and becoming economically viable',
      'urban planning shapes how cities grow and how people interact with shared spaces',
      'architecture reflects the values aesthetics and technological capabilities of societies',
      'music transcends cultural boundaries and connects us through universal emotions deeply',
      'dance combines physical movement and artistic expression in remarkable ways',
      'visual arts challenge our perceptions and help us see the world differently always',
      'film has become the dominant storytelling medium of contemporary global culture',
      'television continues to evolve in the streaming era with new consumption patterns',
      'social media platforms have transformed how information and ideas spread globally',
      'digital marketing utilizes data analytics to reach and engage target audiences',
      'entrepreneurship drives innovation and creates new economic opportunities always',
      'startups often disrupt established industries with novel approaches and solutions',
      'business ethics require companies to balance profit with social responsibility',
      'corporate social responsibility demands environmental and social accountability',
      'supply chain transparency is essential for ethical and sustainable business practices',
      'artificial scarcity in digital products raises questions about ownership and rights',
      'open source software democratizes access to powerful tools and knowledge worldwide',
      'cryptocurrency challenges traditional financial systems and regulatory frameworks',
      'blockchain technology enables trustless transactions without central authorities',
      'distributed systems require careful coordination to maintain consistency always',
      'network security requires multiple layers of protection against diverse threats',
      'encryption protects sensitive information during transmission across networks',
      'biometric security uses unique physical characteristics for authentication purposes',
      'zero knowledge proofs allow verification without revealing underlying information',
      'quantum cryptography promises unhackable communication in the quantum era',
      'space exploration pushes the boundaries of human knowledge and technological capability',
      'the moon landing represents one of humanitys greatest technological achievements',
      'mars colonization presents both scientific and engineering challenges for future',
      'exoplanet discovery has transformed our understanding of the universe completely',
      'dark matter and dark energy remain mysterious components of our cosmos',
      'the big bang theory explains the origin and expansion of the universe',
      'black holes represent regions where gravitational forces become extreme and fierce',
      'time dilation near massive objects affects how we experience the passage of time',
      'relativistic physics governs the behavior of objects at extremely high velocities',
      'quantum mechanics describes reality at scales smaller than atoms themselves',
      'superposition allows particles to exist in multiple states simultaneously together',
      'entanglement creates mysterious correlations between distant particles linked',
      'wave particle duality suggests matter has both wave and particle characteristics',
      'uncertainty principle limits our precision in measuring certain paired properties',
      'thermodynamics governs energy transfer and the direction of physical processes',
      'entropy increases in isolated systems reflecting the disorder of the universe',
      'statistical mechanics connects microscopic properties to macroscopic phenomena',
      'organic chemistry explores the vast diversity of carbon containing compounds',
      'biochemistry reveals the chemical processes that enable life itself to exist',
      'molecular biology investigates how genetic information is expressed in organisms',
      'protein folding remains a grand challenge in computational biology research',
      'pharmaceutical development requires extensive testing before clinical approval',
      'epidemiology studies disease patterns and helps predict future health crises',
      'immunology explores how organisms defend against harmful pathogens and diseases',
      'neuroscience unravels the mysteries of how the brain processes information',
      'consciousness remains philosophically and scientifically fascinating and elusive',
      'artificial consciousness raises profound questions about the nature of awareness',
      'virtual reality creates immersive experiences that challenge our perception of reality',
      'augmented reality overlays digital information onto our physical world seamlessly',
      'brain computer interfaces enable direct communication between minds and machines',
      'neural implants could revolutionize treatment for neurological disorders eventually',
      'genetic engineering raises ethical questions about modifying human characteristics',
      'crispr technology enables precise editing of genetic material in living organisms',
      'synthetic biology creates new organisms with capabilities never seen before',
      'bioethics examines moral implications of advances in biological and medical research',
      'environmental justice requires addressing how pollution disproportionately affects',
      'deforestation threatens biodiversity and contributes to climate change dramatically',
      'ocean acidification disrupts marine ecosystems and threatens food security globally',
      'clean water access remains a fundamental challenge for billions of people worldwide',
      'sustainable agriculture must feed growing populations while preserving ecosystems',
    ]
  }

  const createLessons = (difficulty: 'beginner' | 'intermediate' | 'advanced', count: number) => {
    const texts = sampleTexts[difficulty]
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Lesson ${i + 1}`,
      text: texts[i % texts.length],
      description: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} typing practice - Lesson ${i + 1}`
    }))
  }

  return {
    beginner: beginnerLessons, // 4 focused lessons with character progression
    intermediate: createLessons('intermediate', 60),
    advanced: createLessons('advanced', 100)
  }
}

const lessons = generateLessons()

// Sample texts for practice mode
const practiceTexts = [
  'The quick brown fox jumps over the lazy dog.',
  'Pack my box with five dozen liquor jugs.',
  'How vexingly quick daft zebras jump.',
  'Sphinx of black quartz, judge my vow.',
  'Two driven jocks help fax my big quiz.',
  'The five boxing wizards jump quickly.',
  'Bright vixens jump; dozy fowl quack.',
  'Quick wafting zephyrs vex bold Jim.',
]

// Word generation system for arcade endless mode
const consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'y', 'z', 'qu', 'sh', 'ch', 'th', 'st', 'tr', 'br', 'gr', 'cr', 'pr', 'dr', 'fl', 'bl']
const vowels = ['a', 'e', 'i', 'o', 'u']

const generateRandomWord = (): string => {
  const length = Math.floor(Math.random() * 4) + 5 // 5-8 characters
  let word = ''
  
  for (let i = 0; i < length; i++) {
    if (i % 2 === 0) {
      // Consonant turn
      word += consonants[Math.floor(Math.random() * consonants.length)]
    } else {
      // Vowel turn
      word += vowels[Math.floor(Math.random() * vowels.length)]
    }
  }
  
  return word.slice(0, length)
}

// Motivational comments for arcade mode
const speedComments = [
  '⚡ High Speed (Fast WPM)',
  '⚡ Lightning fingers!',
  '🚀 Speed demon!',
  '🔥 Blazing fast typing!',
  '⌨️ Keyboard on fire!',
  '💨 Faster than the wind!',
  '🏎️ Typing at turbo speed!',
  '🚀 Warp speed activated!',
  '⚡ Rapid-fire typing!',
  '🔥 You\'re unstoppable!',
  '💥 Speed master!',
]

const accuracyComments = [
  '🎯 High Accuracy (95–100%)',
  '🎯 Perfect precision!',
  '💎 Flawless typing!',
  '🧠 Zero mistakes — impressive!',
  '👌 Clean and accurate!',
  '🔍 Sharp focus!',
  '🏹 Bullseye accuracy!',
  '💯 100% perfection!',
  '✨ Error-free excellence!',
  '🛡️ Solid control!',
  '🎖️ Precision champion!',
]

const streakComments = [
  '🔥 Combo streak!',
  '⚡ Unbroken streak!',
  '💪 Keep the momentum!',
  '🚀 Streak master!',
  '🔥 Typing flow unlocked!',
  '🎯 Consistency level: Pro!',
  '💥 No errors so far!',
  '🧠 Focus mode activated!',
  '⚡ Smooth rhythm!',
  '🔥 Flow state achieved!',
]

interface TypingStats {
  wpm: number
  accuracy: number
  correctChars: number
  incorrectChars: number
  totalChars: number
  timeElapsed: number
}

interface LessonProgress {
  lessonId: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  completed: boolean
  bestWpm: number
  bestAccuracy: number
  stars: number
}

interface UserProfile {
  id: string
  userId: string
  email: string
  name: string
  username: string
  bio: string
  picture: string | null
  createdAt: string
  role?: 'user' | 'admin' // Optional admin role
}

interface AuthState {
  isLoggedIn: boolean
  user: UserProfile | null
}

interface FallingWord {
  id: string
  text: string
  yPosition: number
  startTime: number
  animationType: 'normal' | 'fire' | 'thunder'
}

interface ArcadeStats {
  wordsTyped: number
  totalErrors: number
  currentStreak: number
  bestStreak: number
  totalCorrect: number
}

function App() {
  // Game state
  const [currentText, setCurrentText] = useState('')
  const [userInput, setUserInput] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('lessons')
  const [competitionSubTab, setCompetitionSubTab] = useState('multiplayer')
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  
  // Stats
  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    totalChars: 0,
    timeElapsed: 0
  })
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [hasTimedOut, setHasTimedOut] = useState(false)
  
  // Progress tracking
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([])
  const [overallStats, setOverallStats] = useState({
    totalLessonsCompleted: 0,
    averageWpm: 0,
    bestWpm: 0,
    totalTime: 0
  })
  
  // Settings
  const [showSettings, setShowSettings] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(true)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  
  // Play sound effect function
  const playSound = () => {
    if (!soundEnabled) return
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Quick beep: 800Hz, 50ms
      oscillator.frequency.value = 800
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.05)
    } catch (e) {
      // Fallback: silent if Web Audio is not available
    }
  }

  // Maintenance mode
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  useEffect(() => {
    // If mounted via a direct route (e.g. /practice), set the initial active tab
    try {
      const loc = window.location.pathname
      if (loc) {
        if (loc.startsWith('/practice')) setActiveTab('practice')
        else if (loc.startsWith('/competitions')) setActiveTab('competitions')
        else if (loc.startsWith('/leaderboard')) setActiveTab('competitions')
        else if (loc.startsWith('/lessons')) setActiveTab('lessons')
      }
    } catch (e) {
      // ignore
    }
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/admin/public-settings/maintenance', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (res.ok) {
          const data = await res.json()
          setMaintenanceMode(data.enabled || false)
        }
      } catch (err) {
        // Silently fail - maintenance check is optional
        console.error('Maintenance check error:', err)
      }
    }
    checkMaintenance()
    const interval = setInterval(checkMaintenance, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  // Authentication & Profile
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    user: null
  })
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showProfilePage, setShowProfilePage] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formName, setFormName] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formBio, setFormBio] = useState('')
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [competitorsCount, setCompetitorsCount] = useState(0)
  
  // Endless Mode
  const [isEndlessMode, setIsEndlessMode] = useState(false)
  const [endlessStats, setEndlessStats] = useState({
    roundsCompleted: 0,
    totalWpm: 0,
    totalAccuracy: 0,
    averageWpm: 0,
    averageAccuracy: 0
  })

  // Arcade Mode (Falling Words)
  const [isArcadeMode, setIsArcadeMode] = useState(false)
  const [fallingWord, setFallingWord] = useState<FallingWord | null>(null)
  const [arcadeInput, setArcadeInput] = useState('')
  const [arcadeErrors, setArcadeErrors] = useState(0)
  const [arcadeStats, setArcadeStats] = useState<ArcadeStats>({
    wordsTyped: 0,
    totalErrors: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalCorrect: 0
  })
  const [arcadeStartTime, setArcadeStartTime] = useState<number | null>(null)
  const [arcadeWpm, setArcadeWpm] = useState(0)
  const [baseSpeed, setBaseSpeed] = useState(10000) // 10 seconds initial fall time
  const [showArcadeComment, setShowArcadeComment] = useState<string | null>(null)
  const [isThundering, setIsThundering] = useState(false)
  const [isFireActive, setIsFireActive] = useState(false)
  const [arcadeGameOver, setArcadeGameOver] = useState(false)

  // Level Progression System
  const [unlockedLessons, setUnlockedLessons] = useState<Record<string, boolean>>({})
  const [pendingLesson, setPendingLesson] = useState<any>(null)
  const [showLessonModal, setShowLessonModal] = useState(false)
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const arcadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const arcadeCommentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Initialize with first lesson
  useEffect(() => {
    const savedProgress = localStorage.getItem('typingProgress')
    if (savedProgress) {
      setLessonProgress(JSON.parse(savedProgress))
    }
    const savedOverall = localStorage.getItem('typingOverallStats')
    if (savedOverall) {
      setOverallStats(JSON.parse(savedOverall))
    }
    
    // Load settings
    const savedSettings = localStorage.getItem('typingSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setSoundEnabled(settings.soundEnabled ?? true)
      setShowVirtualKeyboard(settings.showVirtualKeyboard ?? true)
      setTheme(settings.theme ?? 'dark')
    }

    // Load unlocked lessons
    const savedUnlocked = localStorage.getItem('unlockedLessons')
    if (savedUnlocked) {
      const unlocked = JSON.parse(savedUnlocked)
      // Always ensure lesson 1 of each difficulty is unlocked (starting point)
      setUnlockedLessons({
        ...unlocked,
        'beginner-1': true,
        'intermediate-1': true,
        'advanced-1': true
      })
    } else {
      // Initialize - only level 1 of each difficulty is unlocked
      setUnlockedLessons({
        'beginner-1': true,
        'intermediate-1': true,
        'advanced-1': true
      })
    }
    
    // Load auth & profile - check token from API
    const token = localStorage.getItem('token')
    if (token) {
      apiClient.setToken(token)
      verifyAuth()
    }

    // Fetch competitors count
    fetchCompetitorsCount()
  }, [])

  // Save progress
  useEffect(() => {
    localStorage.setItem('typingProgress', JSON.stringify(lessonProgress))
    localStorage.setItem('typingOverallStats', JSON.stringify(overallStats))
  }, [lessonProgress, overallStats])

  // Save settings
  useEffect(() => {
    localStorage.setItem('typingSettings', JSON.stringify({
      soundEnabled,
      showVirtualKeyboard,
      theme
    }))
  }, [soundEnabled, showVirtualKeyboard, theme])
  
  // Update theme in DOM and localStorage when theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}')
    localStorage.setItem('appSettings', JSON.stringify({
      ...settings,
      theme
    }))
  }, [theme])

  // Save unlocked lessons
  useEffect(() => {
    localStorage.setItem('unlockedLessons', JSON.stringify(unlockedLessons))
  }, [unlockedLessons])

  // Timer effect
  useEffect(() => {
    if (isActive && !isFinished) {
      timerRef.current = setInterval(() => {
        if (startTime) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000)
          setStats(prev => ({ ...prev, timeElapsed: elapsed }))
        }

        if (currentLesson && currentLesson.id) {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current)
              setHasTimedOut(true)
              setIsActive(false)
              setIsFinished(true)
              return 0
            }
            return prev - 1
          })
        }
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, isFinished, startTime, currentLesson])

  // Calculate WPM and accuracy
  useEffect(() => {
    if (isActive && startTime) {
      const timeInMinutes = (Date.now() - startTime) / 60000
      const wordsTyped = userInput.length / 5
      const wpm = timeInMinutes > 0 ? Math.round(wordsTyped / timeInMinutes) : 0
      
      let correct = 0
      let incorrect = 0
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === currentText[i]) {
          correct++
        } else {
          incorrect++
        }
      }
      
      const total = userInput.length
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100
      
      setStats({
        wpm,
        accuracy,
        correctChars: correct,
        incorrectChars: incorrect,
        totalChars: total,
        timeElapsed: stats.timeElapsed
      })
    }
  }, [userInput, isActive, startTime, currentText])

  // Check if finished
  useEffect(() => {
    if (userInput.length === currentText.length && currentText.length > 0) {
      finishLesson()
    }
  }, [userInput, currentText])

  // Arcade mode falling word animation
  useEffect(() => {
    if (!isArcadeMode || !fallingWord || arcadeGameOver) return

    arcadeTimerRef.current = setInterval(() => {
      setFallingWord(prev => {
        if (!prev) return null

        // Calculate current speed based on elapsed time
        if (arcadeStartTime) {
          const elapsedSeconds = (Date.now() - arcadeStartTime) / 1000
          const speedMultiplier = Math.max(0.3, 1 - (elapsedSeconds / 300)) // Decreases from 1 to 0.3 over 5 minutes
          const currentSpeed = baseSpeed * speedMultiplier

          // Calculate how many pixels per frame (assuming 50ms interval)
          const containerHeight = 400 // Arcade game area height
          const pixelsPerFrame = (containerHeight / currentSpeed) * 50

          const newY = prev.yPosition + pixelsPerFrame

          // Word reached bottom (failed to type it)
          if (newY > containerHeight) {
            const newErrors = arcadeErrors + 1
            setArcadeErrors(newErrors)
            setArcadeStats(prev => ({
              ...prev,
              totalErrors: prev.totalErrors + 1,
              currentStreak: 0
            }))

            // Game over at 5 errors
            if (newErrors >= 5) {
              endArcadeGame()
              setIsFireActive(true)
              return null
            }

            // Reset for next word
            setArcadeInput('')
            return generateNewFallingWord()
          }

          return { ...prev, yPosition: newY }
        }
        return prev
      })
    }, 50) // Update every 50ms for smooth animation

    return () => {
      if (arcadeTimerRef.current) clearInterval(arcadeTimerRef.current)
    }
  }, [isArcadeMode, arcadeGameOver, baseSpeed, arcadeStartTime, arcadeErrors, fallingWord])

  // Keep input focused during typing and capture all keyboard input
  useEffect(() => {
    if (currentText && !isFinished) {
      // Focus input when lesson is active
      setTimeout(() => inputRef.current?.focus(), 0)

      // Handle global keyboard events to refocus input if lost
      const handleKeyDown = (e: KeyboardEvent) => {
        playSound()
        // Don't prevent default for special keys that should be handled by browser
        if (e.key === 'Meta' || e.key === 'Alt' || e.ctrlKey) {
          return
        }
        // Refocus the input if it's not already focused
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus()
        }
      }

      const handleMouseDown = () => {
        // Refocus when clicking anywhere in the typing area
        setTimeout(() => inputRef.current?.focus(), 0)
      }

      document.addEventListener('keydown', handleKeyDown)
      if (containerRef.current) {
        containerRef.current.addEventListener('mousedown', handleMouseDown)
      }

      // Set focus when window becomes active
      window.addEventListener('focus', () => {
        if (currentText && !isFinished) {
          inputRef.current?.focus()
        }
      })

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        if (containerRef.current) {
          containerRef.current.removeEventListener('mousedown', handleMouseDown)
        }
        window.removeEventListener('focus', () => {
          inputRef.current?.focus()
        })
      }
    }
  }, [currentText, isFinished])

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  const startLesson = (lesson: any) => {
    setCurrentLesson(lesson)
    setCurrentText(lesson.text)
    setUserInput('')
    setIsActive(false)
    setIsFinished(false)
    setStartTime(null)
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: 0,
      timeElapsed: 0
    })
    const limit = getLessonTimeLimit(lesson.text, difficulty)
    setTimeRemaining(limit)
    setHasTimedOut(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const startPractice = () => {
    const randomText = practiceTexts[Math.floor(Math.random() * practiceTexts.length)]
    setCurrentLesson({ title: 'Practice Mode', description: 'Free practice session' })
    setCurrentText(randomText)
    setUserInput('')
    setIsActive(false)
    setIsFinished(false)
    setStartTime(null)
    setTimeRemaining(0)
    setHasTimedOut(false)
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: 0,
      timeElapsed: 0
    })
    setActiveTab('practice')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const getRandomText = () => {
    return practiceTexts[Math.floor(Math.random() * practiceTexts.length)]
  }

  const startEndlessMode = () => {
    setIsEndlessMode(true)
    setCurrentLesson({ title: 'Endless Mode', description: 'Type as much as you can. No limits!' })
    setCurrentText(getRandomText())
    setUserInput('')
    setIsActive(false)
    setIsFinished(false)
    setStartTime(null)
    setTimeRemaining(0)
    setHasTimedOut(false)
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: 0,
      timeElapsed: 0
    })
    setEndlessStats({
      roundsCompleted: 0,
      totalWpm: 0,
      totalAccuracy: 0,
      averageWpm: 0,
      averageAccuracy: 0
    })
    setActiveTab('endless')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const endlessNextRound = () => {
    // Update endless stats
    const newRoundsCompleted = endlessStats.roundsCompleted + 1
    const newTotalWpm = endlessStats.totalWpm + stats.wpm
    const newTotalAccuracy = endlessStats.totalAccuracy + stats.accuracy
    
    setEndlessStats({
      roundsCompleted: newRoundsCompleted,
      totalWpm: newTotalWpm,
      totalAccuracy: newTotalAccuracy,
      averageWpm: Math.round(newTotalWpm / newRoundsCompleted),
      averageAccuracy: Math.round(newTotalAccuracy / newRoundsCompleted)
    })

    // Reset for new round
    setCurrentText(getRandomText())
    setUserInput('')
    setIsActive(false)
    setIsFinished(false)
    setStartTime(null)
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: 0,
      timeElapsed: 0
    })
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // Arcade Mode Functions
  const generateNewFallingWord = (): FallingWord => {
    // Determine animation based on current WPM
    let animationType: 'normal' | 'fire' | 'thunder' = 'normal'
    if (arcadeWpm >= 60) {
      animationType = 'thunder'
    } else if (arcadeWpm >= 30) {
      animationType = 'fire'
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      text: generateRandomWord(),
      yPosition: 0,
      startTime: Date.now(),
      animationType
    }
  }

  const getRandomArcadeComment = (wpm: number, accuracy: number, streak: number): string | null => {
    // 30% chance to show comment when performing well
    if (Math.random() > 0.3) return null

    if (wpm >= 80 && Math.random() > 0.5) {
      return speedComments[Math.floor(Math.random() * speedComments.length)]
    }
    if (accuracy >= 95 && Math.random() > 0.5) {
      return accuracyComments[Math.floor(Math.random() * accuracyComments.length)]
    }
    if (streak >= 5) {
      return streakComments[Math.floor(Math.random() * streakComments.length)]
    }
    return null
  }

  const startArcadeMode = () => {
    setIsArcadeMode(true)
    setIsEndlessMode(false)
    setCurrentLesson({ title: 'Arcade Mode', description: 'Type falling words before they reach the bottom!' })
    setCurrentText('arcade') // Trigger typing interface display
    setArcadeInput('')
    setArcadeErrors(0)
    setArcadeStats({
      wordsTyped: 0,
      totalErrors: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalCorrect: 0
    })
    setArcadeGameOver(false)
    setArcadeStartTime(Date.now())
    setFallingWord(generateNewFallingWord())
    setBaseSpeed(10000) // Reset to 10 seconds
    setShowArcadeComment(null)
    setIsThundering(false)
    setIsFireActive(false)
    setActiveTab('arcade')
    setTimeout(() => {
      const arcadeInputElement = document.getElementById('arcade-input') as HTMLInputElement
      arcadeInputElement?.focus()
    }, 100)
  }

  const handleArcadeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().trim()
    setArcadeInput(value)

    if (!fallingWord) return

    if (value === fallingWord.text) {
      // Word matched!
      const newStats = {
        ...arcadeStats,
        wordsTyped: arcadeStats.wordsTyped + 1,
        totalCorrect: arcadeStats.totalCorrect + 1,
        currentStreak: arcadeStats.currentStreak + 1,
        bestStreak: Math.max(arcadeStats.bestStreak, arcadeStats.currentStreak + 1)
      }
      setArcadeStats(newStats)

      // Calculate current WPM
      if (arcadeStartTime) {
        const timeInMinutes = (Date.now() - arcadeStartTime) / 60000
        const wpm = timeInMinutes > 0 ? Math.round((newStats.wordsTyped * 5) / timeInMinutes) : 0
        setArcadeWpm(wpm)

        // Check for effects
        if (wpm >= 80) {
          setIsThundering(true)
          setTimeout(() => setIsThundering(false), 500)
        }
        
        // Random comment
        const comment = getRandomArcadeComment(wpm, 100, newStats.currentStreak)
        if (comment) {
          setShowArcadeComment(comment)
          if (arcadeCommentTimeoutRef.current) clearTimeout(arcadeCommentTimeoutRef.current)
          arcadeCommentTimeoutRef.current = setTimeout(() => setShowArcadeComment(null), 2000)
        }
      }

      // Generate next word
      setArcadeInput('')
      setFallingWord(generateNewFallingWord())
    }
  }

  const endArcadeGame = () => {
    setArcadeGameOver(true)
    if (arcadeTimerRef.current) clearInterval(arcadeTimerRef.current)
    if (arcadeCommentTimeoutRef.current) clearTimeout(arcadeCommentTimeoutRef.current)
  }

  const exitArcadeMode = () => {
    setIsArcadeMode(false)
    setArcadeGameOver(false)
    setCurrentText('')
    if (arcadeTimerRef.current) clearInterval(arcadeTimerRef.current)
    if (arcadeCommentTimeoutRef.current) clearTimeout(arcadeCommentTimeoutRef.current)
    setActiveTab('arcade')
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return

    const value = e.target.value
    
    if (!isActive && value.length > 0) {
      setIsActive(true)
      setStartTime(Date.now())
    }
    
    // Allow typing up to 150 characters beyond the lesson text to accommodate natural typing
    const maxLength = Math.max(currentText.length + 50, 200)
    if (value.length <= maxLength) {
      setUserInput(value)
    }
  }

  const calculateLessonStars = (difficulty: string, timeElapsed: number): number => {
    // Time-based star calculation (seconds to complete lesson)
    if (difficulty === 'beginner') {
      // Beginner: Quick levels (5-30 chars)
      if (timeElapsed <= 10) return 6 // Crown - 1-10 seconds
      if (timeElapsed <= 15) return 5 // 11-15 seconds
      if (timeElapsed <= 20) return 4 // 16-20 seconds
      if (timeElapsed <= 25) return 3 // 21-25 seconds
      if (timeElapsed <= 30) return 2 // 26-30 seconds
      return 1 // 30+ seconds
    } else if (difficulty === 'intermediate') {
      // Intermediate: Longer levels (Option A - ~15-50 chars)
      if (timeElapsed <= 20) return 6 // Crown - 15-20 seconds
      if (timeElapsed <= 30) return 5 // 21-30 seconds
      if (timeElapsed <= 40) return 4 // 31-40 seconds
      if (timeElapsed <= 50) return 3 // 41-50 seconds
      if (timeElapsed <= 60) return 2 // 51-60 seconds
      return 1 // 60+ seconds
    } else {
      // Advanced: Longest/most complex levels (Option A - ~50-120 chars)
      if (timeElapsed <= 30) return 6 // Crown - 25-30 seconds
      if (timeElapsed <= 45) return 5 // 31-45 seconds
      if (timeElapsed <= 60) return 4 // 46-60 seconds
      if (timeElapsed <= 80) return 3 // 61-80 seconds
      if (timeElapsed <= 100) return 2 // 81-100 seconds (unlock threshold)
      return 1 // 100+ seconds
    }
  }

  const getLessonTimeLimit = (text: string, difficulty: string): number => {
    const length = text.length
    if (difficulty === 'beginner') {
      return Math.max(15, Math.min(40, Math.round(length * 1.4 + 10)))
    }
    if (difficulty === 'intermediate') {
      return Math.max(25, Math.min(70, Math.round(length * 1.4 + 18)))
    }
    return Math.max(40, Math.min(110, Math.round(length * 1.6 + 28)))
  }

  const finishLesson = () => {
    setIsActive(false)
    setIsFinished(true)
    if (timerRef.current) clearInterval(timerRef.current)
    
    // Calculate stars based on performance
    const stars = calculateLessonStars(difficulty, stats.timeElapsed)
    
    // Update lesson progress
    if (currentLesson && currentLesson.id) {
      setLessonProgress(prev => {
        const existing = prev.find(p => p.lessonId === currentLesson.id && p.difficulty === difficulty)
        if (existing) {
          return prev.map(p => 
            p.lessonId === currentLesson.id && p.difficulty === difficulty
              ? { 
                  ...p, 
                  completed: true, 
                  bestWpm: Math.max(p.bestWpm, stats.wpm),
                  bestAccuracy: Math.max(p.bestAccuracy, stats.accuracy),
                  stars: Math.max(p.stars, stars)
                }
              : p
          )
        }
        return [...prev, { 
          lessonId: currentLesson.id,
          difficulty,
          completed: true, 
          bestWpm: stats.wpm, 
          bestAccuracy: stats.accuracy,
          stars 
        }]
      })
      
      // Update overall stats
      setOverallStats(prev => ({
        totalLessonsCompleted: prev.totalLessonsCompleted + 1,
        averageWpm: Math.round((prev.averageWpm * prev.totalLessonsCompleted + stats.wpm) / (prev.totalLessonsCompleted + 1)),
        bestWpm: Math.max(prev.bestWpm, stats.wpm),
        totalTime: prev.totalTime + stats.timeElapsed
      }))
      
      // Unlock next level directly using earned stars
      if (stars >= 2 && currentLesson) {
        const nextLevelId = currentLesson.id + 1
        const maxLevels = difficulty === 'beginner' ? 30 : difficulty === 'intermediate' ? 60 : 100
        if (nextLevelId <= maxLevels) {
          setUnlockedLessons(prev => ({
            ...prev,
            [getLessonKey(difficulty, nextLevelId)]: true
          }))
        }
      }
    }
  }

  const resetCurrent = () => {
    setUserInput('')
    setIsActive(false)
    setIsFinished(false)
    setStartTime(null)
    setTimeRemaining(0)
    setHasTimedOut(false)
    setStats({
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      totalChars: 0,
      timeElapsed: 0
    })
    inputRef.current?.focus()
  }

  const resetAllProgress = () => {
    setLessonProgress([])
    setOverallStats({
      totalLessonsCompleted: 0,
      averageWpm: 0,
      bestWpm: 0,
      totalTime: 0
    })
    setUnlockedLessons({
      'beginner-1': true,
      'intermediate-1': true,
      'advanced-1': true
    })
    localStorage.removeItem('typingProgress')
    localStorage.removeItem('typingOverallStats')
    localStorage.removeItem('unlockedLessons')
  }

  // Auth functions
  const verifyAuth = async () => {
    // Only verify if token exists - prevents 401 errors on first load
    const token = localStorage.getItem('token')
    if (!token) {
      return // No token, user is guest
    }

    try {
      const result = await apiClient.verifyToken()
      if (result.data && result.data.user) {
        setAuthState({
          isLoggedIn: true,
          user: result.data.user
        })
        if (result.data.user.picture) {
          setProfilePicture(result.data.user.picture)
        }
      } else if (result.error) {
        // Token invalid - clear it
        apiClient.clearToken()
        setAuthState({ isLoggedIn: false, user: null })
      }
    } catch (error) {
      // Silently fail - user continues as guest
    }
  }

  const fetchCompetitorsCount = async () => {
    try {
      const result = await apiClient.getCompetitorsCount()
      if (result.data && result.data.count) {
        setCompetitorsCount(result.data.count)
      } else if (result.error) {
        console.warn('Could not fetch competitors count, using fallback')
        setCompetitorsCount(100)
      }
    } catch (error) {
      console.warn('Backend server not available, using fallback competitors count')
      // Fallback to 100+ when backend is down
      setCompetitorsCount(100)
    }
  }

  const handleSignup = async () => {
    if (!formEmail.trim() || !formPassword.trim() || !formName.trim() || !formUsername.trim()) {
      alert('Please fill in all fields')
      return
    }

    try {
      const result = await apiClient.register(formEmail.trim(), formUsername.trim().toLowerCase().replace(/\s/g, ''), formName.trim(), formPassword, profilePicture || undefined)
      
      if (result.error) {
        alert('Signup failed: ' + result.error)
        return
      }

      if (result.data && result.data.token) {
        apiClient.setToken(result.data.token)
        setAuthState({
          isLoggedIn: true,
          user: result.data.user
        })
        if (result.data.user.picture) {
          setProfilePicture(result.data.user.picture)
        }
        setFormEmail('')
        setFormPassword('')
        setFormName('')
        setFormUsername('')
        setShowAuthDialog(false)
        // Refresh competitors count
        fetchCompetitorsCount()
      }
    } catch (error) {
      alert('Signup error: ' + (error as Error).message)
    }
  }

  const handleLogin = async () => {
    if (!formEmail.trim() || !formPassword.trim()) {
      alert('Please enter email and password')
      return
    }

    try {
      const result = await apiClient.login(formEmail.trim(), formPassword)
      
      if (result.error) {
        alert('Login failed: ' + result.error)
        return
      }

      if (result.data && result.data.token) {
        apiClient.setToken(result.data.token)
        setAuthState({
          isLoggedIn: true,
          user: result.data.user
        })
        if (result.data.user.picture) {
          setProfilePicture(result.data.user.picture)
        }
        setFormEmail('')
        setFormPassword('')
        setShowAuthDialog(false)
      }
    } catch (error) {
      alert('Login error: ' + (error as Error).message)
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      apiClient.clearToken()
      setAuthState({
        isLoggedIn: false,
        user: null
      })
      setShowProfilePage(false)
      setShowProfileMenu(false)
      setProfilePicture(null)
    }
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicture(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdateProfile = () => {
    if (authState.user) {
      const updatedUser: UserProfile = {
        ...authState.user,
        name: formName || authState.user.name,
        bio: formBio || authState.user.bio,
        picture: profilePicture || authState.user.picture
      }

      const allUsers = JSON.parse(localStorage.getItem('allUsers') || '[]')
      const updatedUsers = allUsers.map((u: UserProfile) =>
        u.id === authState.user?.id ? updatedUser : u
      )
      localStorage.setItem('allUsers', JSON.stringify(updatedUsers))

      setAuthState({
        isLoggedIn: true,
        user: updatedUser
      })
    }
  }

  const getCharClass = (index: number) => {
    if (index < userInput.length) {
      return userInput[index] === currentText[index] ? 'correct' : 'incorrect'
    }
    if (index === userInput.length) {
      return 'current'
    }
    return ''
  }

  const getLessonStars = (difficulty: string, lessonId: number) => {
    const progress = lessonProgress.find(p => p.lessonId === lessonId && p.difficulty === difficulty)
    return progress?.stars || 0
  }

  const isLessonCompleted = (difficulty: string, lessonId: number) => {
    return lessonProgress.some(p => p.lessonId === lessonId && p.difficulty === difficulty && p.completed)
  }

  const getLessonKey = (difficulty: string, lessonId: number) => {
    return `${difficulty}-${lessonId}`
  }

  const isLessonUnlocked = (difficulty: string, lessonId: number) => {
    // Lesson 1 is always unlocked for all difficulties (it's the starting point)
    if (lessonId === 1) return true
    // Completed lessons should remain unlocked across refreshes
    const completed = lessonProgress.some(p => p.lessonId === lessonId && p.difficulty === difficulty && p.completed)
    if (completed) return true
    return unlockedLessons[getLessonKey(difficulty, lessonId)] || false
  }

  const handleLessonClick = (lesson: any) => {
    // Check if lesson is locked
    if (!isLessonUnlocked(difficulty, lesson.id)) {
      return // Can't start locked lesson
    }
    
    // Open modal with lesson data
    // Both state updates happen together in the same render cycle
    setPendingLesson(lesson)
    setShowLessonModal(true)
  }

  const startLessonAfterConfirm = () => {
    if (pendingLesson) {
      const lessonToStart = pendingLesson
      // Close modal - do NOT use flushSync as it causes re-render issues with Radix Dialog
      setShowLessonModal(false)
      // Clear pending lesson AFTER modal close animation completes
      // Then start the actual lesson
      setTimeout(() => {
        setPendingLesson(null)
        startLesson(lessonToStart)
      }, 200) // Match the dialog close animation duration
    }
  }

  const getPerformanceComment = (stars: number): string => {
    // Return performance feedback based on star tier
    switch(stars) {
      case 6: // King star
        return "🏆 Outstanding! You earned the King Star!"
      case 5:
        return "⭐⭐⭐⭐⭐ Perfect! Amazing performance!"
      case 4:
        return "⭐⭐⭐⭐ Excellent! Great job!"
      case 3:
        return "⭐⭐⭐ Good! Keep practicing!"
      case 2:
        return "⭐⭐ Nice work! Getting better!"
      case 1:
      default:
        return "⭐ Completed! Practice more!"
    }
  }

  // Virtual keyboard layout
  const keyboardRows = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
    ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
    ['Space']
  ]

  const getPressedKey = () => {
    if (userInput.length === 0) return null
    const lastChar = userInput[userInput.length - 1]
    if (lastChar === ' ') return 'Space'
    return lastChar.toLowerCase()
  }

  const pressedKey = getPressedKey()

  return maintenanceMode ? <MaintenancePage /> : (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white' : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 ${theme === 'dark' ? 'border-slate-700/50 bg-slate-900/50 backdrop-blur-sm' : 'border-slate-200 bg-white/80 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Type className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  TypeMaster
                </h1>
                <p className="text-xs text-slate-400">Master Your Keyboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>{overallStats.totalLessonsCompleted} lessons completed</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!authState.isLoggedIn) {
                      setShowAuthDialog(true)
                      setAuthMode('login')
                    } else {
                      setActiveTab('competitions')
                    }
                  }}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500"
                >
                  <Trophy className="w-4 h-4 mr-1.5" />
                  Competition
                  <span className="ml-2 text-xs font-semibold text-purple-300">({competitorsCount}+)</span>
                </Button>
              </div>
              
              {/* Profile Button */}
              <div className="relative" ref={profileMenuRef}>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="text-slate-400 hover:text-white transition-colors relative"
                  title={authState.user ? authState.user.name : 'Login'}
                >
                  {authState.isLoggedIn && authState.user?.picture ? (
                    <img 
                      src={authState.user.picture} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-900 font-bold" />
                    </div>
                  )}
                </Button>
                
                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
                    {authState.isLoggedIn && authState.user ? (
                      <>
                        <div className="px-4 py-3 border-b border-slate-700 bg-slate-700/50">
                          <p className="text-sm font-semibold text-white">{authState.user.name}</p>
                          <p className="text-xs text-slate-400">@{authState.user.username}</p>
                          <p className="text-xs text-purple-400 mt-1.5 font-mono bg-slate-700 px-2 py-1 rounded">{authState.user.userId}</p>
                        </div>
                        <button
                          onClick={() => {
                            setShowProfilePage(true)
                            setShowProfileMenu(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          View Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 border-t border-slate-700"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setAuthMode('login')
                          setShowAuthDialog(true)
                          setShowProfileMenu(false)
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        Login / Signup
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-slate-400 hover:text-white transition-colors"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSettings(true)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Page */}
        {showProfilePage && authState.isLoggedIn && authState.user ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Back Button */}
            <Button 
              variant="outline" 
              onClick={() => setShowProfilePage(false)}
              className="border-slate-600"
            >
              ← Back to Lessons
            </Button>

            {/* Profile Header */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Profile Picture */}
                  <div className="relative">
                    {authState.user.picture ? (
                      <img 
                        src={authState.user.picture} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-cyan-400"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center border-4 border-cyan-400">
                        <User className="w-12 h-12 text-slate-900" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-cyan-500 p-2 rounded-full cursor-pointer hover:bg-cyan-600 transition-colors">
                      <input 
                        type="file" 
                        hidden 
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                      />
                      <span className="text-xs text-white">📷</span>
                    </label>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-white mb-2">{authState.user.name}</h1>
                    <p className="text-slate-400 mb-4">@{authState.user.username}</p>
                    <p className="text-slate-400 mb-4">{authState.user.email}</p>
                    <p className="text-sm text-slate-500">
                      Member since {new Date(authState.user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{overallStats.bestWpm}</p>
                  <p className="text-xs text-slate-400">Best WPM</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-cyan-400">{overallStats.averageWpm}</p>
                  <p className="text-xs text-slate-400">Average WPM</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-400">{overallStats.totalLessonsCompleted}</p>
                  <p className="text-xs text-slate-400">Lessons Done</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-orange-400">{Math.floor(overallStats.totalTime / 60)}m</p>
                  <p className="text-xs text-slate-400">Total Time</p>
                </CardContent>
              </Card>
            </div>

            {/* Bio Section */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle>Bio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 min-h-24 resize-none"
                />
                <Button 
                  onClick={() => {
                    handleUpdateProfile()
                    setFormBio('')
                  }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : !currentText ? (
          // Dashboard / Lesson Selection
          <div className="space-y-8">
            {/* Hero Stats - Hide on Competition page */}
            {activeTab !== 'competitions' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>

                      <p className="text-sm text-slate-400">Best WPM</p>
                      <p className="text-3xl font-bold text-emerald-400">{overallStats.bestWpm}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Average WPM</p>
                      <p className="text-3xl font-bold text-cyan-400">{overallStats.averageWpm}</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Lessons Done</p>
                      <p className="text-3xl font-bold text-purple-400">{overallStats.totalLessonsCompleted}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Practice Time</p>
                      <p className="text-3xl font-bold text-orange-400">{Math.floor(overallStats.totalTime / 60)}m</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <Timer className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            )}

            {/* Tabs - Hide on Competition page */}
            {activeTab !== 'competitions' && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-5 bg-slate-800/50 border border-slate-700/50">
                <TabsTrigger value="lessons" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Lessons
                </TabsTrigger>
                <TabsTrigger value="practice" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Target className="w-4 h-4 mr-2" />
                  Practice
                </TabsTrigger>
                <TabsTrigger value="endless" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
                  <Flame className="w-4 h-4 mr-2" />
                  Endless
                </TabsTrigger>
                <TabsTrigger value="arcade" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Zap className="w-4 h-4 mr-2" />
                  Arcade
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lessons" className="mt-6">
                {/* Difficulty Selector */}
                <div className="flex justify-center gap-2 mb-8">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={difficulty === level ? 'default' : 'outline'}
                      onClick={() => setDifficulty(level)}
                      className={`capitalize ${
                        difficulty === level 
                          ? level === 'beginner' ? 'bg-emerald-500 hover:bg-emerald-600' :
                            level === 'intermediate' ? 'bg-cyan-500 hover:bg-cyan-600' :
                            'bg-purple-500 hover:bg-purple-600'
                          : 'border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      {level}
                    </Button>
                  ))}
                </div>

                {/* Lesson Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {lessons[difficulty].map((lesson, index) => {
                    const completed = isLessonCompleted(difficulty, lesson.id)
                    const stars = getLessonStars(difficulty, lesson.id)
                    const unlocked = isLessonUnlocked(difficulty, lesson.id)
                    
                    return (
                      <Card 
                        key={lesson.id} 
                        className={`group transition-all duration-300 ${
                          unlocked 
                            ? 'cursor-pointer hover:scale-105'
                            : 'cursor-not-allowed'
                        } ${
                          completed && unlocked
                            ? 'bg-gradient-to-br from-emerald-900/50 to-slate-800/50 border-emerald-500/30' 
                            : unlocked
                            ? 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                            : 'bg-slate-800/30 border-slate-700/30 opacity-50'
                        }`}
                        onClick={() => unlocked && handleLessonClick(lesson)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant="secondary" 
                              className={`${
                                difficulty === 'beginner' ? 'bg-emerald-500/20 text-emerald-400' :
                                difficulty === 'intermediate' ? 'bg-cyan-500/20 text-cyan-400' :
                                'bg-purple-500/20 text-purple-400'
                              }`}
                            >
                              {index + 1}
                            </Badge>
                            {!unlocked && (
                              <Lock className="w-5 h-5 text-red-400" />
                            )}
                            {completed && unlocked && (
                              <div>
                                {stars === 6 ? (
                                  <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                ) : (
                                  <div className="flex gap-0.5">
                                    {[...Array(stars)].map((_, i) => (
                                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <CardTitle className="text-lg mt-2">{lesson.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-400 mb-4">{lesson.description}</p>
                          <div className="flex items-center text-sm text-slate-500">
                            <span className="flex-1">{lesson.text.length} chars</span>
                            {unlocked ? (
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            ) : (
                              <span className="text-xs text-red-400">Complete Level {index} to unlock</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="practice" className="mt-6">
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Practice Mode</h2>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Test your skills with random sentences. Practice makes perfect!
                  </p>
                  <Button 
                    size="lg" 
                    onClick={startPractice}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Practice
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="endless" className="mt-6">
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20 animate-pulse">
                    <Flame className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Endless Mode</h2>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Push your limits! Type continuously with no end. Stop whenever you want.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={startEndlessMode}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    <Flame className="w-5 h-5 mr-2" />
                    Start Endless Mode
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="arcade" className="mt-6">
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20 animate-pulse">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Arcade Mode</h2>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Catch falling words before they hit the bottom! Speed increases as you progress. 5 errors = Game Over!
                  </p>
                  <Button 
                    size="lg" 
                    onClick={startArcadeMode}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Start Arcade Mode
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="competitions" className="mt-6">
                {authState.isLoggedIn && authState.user ? (
                  <RaceHub 
                    userId={authState.user.id} 
                    username={authState.user.username}
                    profilePicture={profilePicture || undefined}
                    onRaceStart={(roomId) => {
                      console.log('Race started with room:', roomId)
                    }}
                  />
                ) : (
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-8 text-center">
                      <Trophy className="w-20 h-20 text-purple-400 mx-auto mb-4 opacity-50" />
                      <h3 className="text-2xl font-bold mb-2">Join Multiplayer Competitions</h3>
                      <p className="text-slate-400 mb-6">
                        Sign in to create or join typing competitions with other players!
                      </p>
                      <Button 
                        onClick={() => {
                          setShowAuthDialog(true)
                          setAuthMode('login')
                        }}
                        className="bg-purple-500 hover:bg-purple-600"
                      >
                        Sign In to Compete
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
            )}

            {/* Competition Page */}
            {activeTab === 'competitions' && (
              <div className="w-full space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Competitions</h2>
                  <Button 
                    onClick={() => setActiveTab('lessons')}
                    variant="outline"
                    className="border-slate-600 text-slate-400 hover:text-white hover:border-slate-500"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Button>
                </div>

                {/* Admin Statistics (logged-in only) */}
                {authState.isLoggedIn && authState.user?.role === 'admin' && (
                  <AdminStatistics userId={authState.user.id} />
                )}

                {/* Two-column layout: Sidebar + Content (visible to all users) */}
                <div className="flex gap-6">
                  {/* Sidebar Navigation */}
                  <div className="w-48 flex flex-col gap-2">
                    <button
                      onClick={() => setCompetitionSubTab('multiplayer')}
                      className={`px-4 py-3 rounded-lg text-left font-medium transition-all ${
                        competitionSubTab === 'multiplayer'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                          : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      🏁 Multiplayer
                    </button>
                    <button
                      onClick={() => setCompetitionSubTab('daily')}
                      className={`px-4 py-3 rounded-lg text-left font-medium transition-all ${
                        competitionSubTab === 'daily'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                          : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      ⚡ Daily Challenge
                    </button>
                    <button
                      onClick={() => setCompetitionSubTab('tournaments')}
                      className={`px-4 py-3 rounded-lg text-left font-medium transition-all ${
                        competitionSubTab === 'tournaments'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                          : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      🏆 Tournaments
                    </button>
                    <button
                      onClick={() => setCompetitionSubTab('squads')}
                      className={`px-4 py-3 rounded-lg text-left font-medium transition-all ${
                        competitionSubTab === 'squads'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                          : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      ⚔️ Squad Wars
                    </button>
                    <button
                      onClick={() => setCompetitionSubTab('leaderboard')}
                      className={`px-4 py-3 rounded-lg text-left font-medium transition-all ${
                        competitionSubTab === 'leaderboard'
                          ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50'
                          : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white hover:bg-slate-800/70'
                      }`}
                    >
                      📊 Ranked Leaderboard
                    </button>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 space-y-6">
                    {authState.isLoggedIn && authState.user ? (
                      <>
                        {/* Multiplayer Content */}
                        {competitionSubTab === 'multiplayer' && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Join a Race</h3>
                            <RaceHub 
                              userId={authState.user.id} 
                              username={authState.user.username}
                              profilePicture={profilePicture || undefined}
                              onRaceStart={(roomId) => {
                                console.log('Race started with room:', roomId)
                              }}
                              hideCreateTab={true}
                            />
                          </div>
                        )}

                        {/* Daily Challenge Content */}
                        {competitionSubTab === 'daily' && (
                          <DailyChallenge 
                            userId={authState.user?.id}
                            username={authState.user?.username}
                            onBack={() => setCompetitionSubTab('multiplayer')}
                          />
                        )}

                        {/* Tournaments Content */}
                        {competitionSubTab === 'tournaments' && (
                          <Tournaments 
                            userId={authState.user.id}
                            isAdmin={authState.user?.role === 'admin'}
                            onBack={() => setCompetitionSubTab('multiplayer')}
                          />
                        )}

                        {/* Squad Wars Content */}
                        {competitionSubTab === 'squads' && (
                          <SquadWars 
                            userId={authState.user.id}
                            onBack={() => setCompetitionSubTab('multiplayer')}
                          />
                        )}

                        {/* Ranked Leaderboard Content */}
                        {competitionSubTab === 'leaderboard' && (
                          <Leaderboard 
                            userId={authState.user.id}
                          />
                        )}
                      </>
                    ) : (
                      // Non-logged-in user content
                      <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardContent className="p-12 text-center">
                          <Trophy className="w-20 h-20 text-purple-400 mx-auto mb-4 opacity-50" />
                          <h3 className="text-2xl font-bold mb-2">Join Competitions</h3>
                          <p className="text-slate-400 mb-2">
                            {competitionSubTab === 'multiplayer' && 'Create or join races with other players'}
                            {competitionSubTab === 'daily' && 'Complete daily typing challenges'}
                            {competitionSubTab === 'tournaments' && 'Compete in tournaments and win prizes'}
                            {competitionSubTab === 'squads' && 'Team up and compete in squad wars'}
                            {competitionSubTab === 'leaderboard' && 'View player rankings and statistics'}
                          </p>
                          <p className="text-slate-500 text-sm mb-6">
                            Sign in to register and participate in competitions
                          </p>
                          <Button 
                            onClick={() => {
                              setShowAuthDialog(true)
                              setAuthMode('login')
                            }}
                            className="bg-purple-500 hover:bg-purple-600"
                          >
                            Sign In to Compete
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Typing Interface
          <div className="max-w-4xl mx-auto space-y-6" ref={containerRef}>
            {isArcadeMode ? (
              // Arcade Mode Interface
              <div className="space-y-6">
                {/* Arcade Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Arcade Mode</h2>
                    <p className="text-slate-400">Catch the falling words!</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={exitArcadeMode}
                    className="border-slate-600 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Exit
                  </Button>
                </div>

                {/* Arcade Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-400">{arcadeWpm}</p>
                      <p className="text-xs text-slate-400">WPM</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-cyan-400">{arcadeStats.currentStreak}</p>
                      <p className="text-xs text-slate-400">Streak</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-orange-400">{arcadeStats.wordsTyped}</p>
                      <p className="text-xs text-slate-400">Words</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="p-4 text-center">
                      <div className="flex justify-center gap-1">
                        {Array(5).fill(0).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-4 h-4 rounded-full ${i < arcadeErrors ? 'bg-red-500' : 'bg-slate-600'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Errors</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Arcade Game Container */}
                <Card 
                  className={`bg-slate-800/50 border-slate-700/50 overflow-hidden arcade-container ${isThundering ? 'thunder' : ''} ${isFireActive ? 'fire' : ''}`}
                  style={{ height: '400px', position: 'relative' }}
                >
                  <CardContent className="p-0 h-full relative bg-slate-900/30">
                    {/* Falling word display */}
                    {fallingWord && !arcadeGameOver && (
                      <div 
                        className={`falling-word ${fallingWord.animationType === 'fire' ? 'fire' : ''} ${fallingWord.animationType === 'thunder' ? 'thunder' : ''}`}
                        style={{
                          top: `${fallingWord.yPosition}px`,
                        }}
                      >
                        {fallingWord.text}
                      </div>
                    )}

                    {/* Game Over display */}
                    {arcadeGameOver && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm flex-col gap-4">
                        <div className="text-center">
                          <h3 className="text-3xl font-bold text-red-400 mb-4">Game Over!</h3>
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                              <p className="text-2xl font-bold text-cyan-400">{arcadeStats.wordsTyped}</p>
                              <p className="text-xs text-slate-400">Total Words</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-emerald-400">{arcadeWpm}</p>
                              <p className="text-xs text-slate-400">Peak WPM</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-orange-400">{arcadeStats.bestStreak}</p>
                              <p className="text-xs text-slate-400">Best Streak</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-red-400">{arcadeErrors}</p>
                              <p className="text-xs text-slate-400">Errors</p>
                            </div>
                          </div>
                          <div className="flex gap-4 justify-center">
                            <Button 
                              onClick={startArcadeMode}
                              className="bg-cyan-500 hover:bg-cyan-600"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Try Again
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={exitArcadeMode}
                              className="border-slate-600"
                            >
                              Exit
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bottom danger zone indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-red-500/20 to-transparent border-t border-red-500/30" />
                  </CardContent>
                </Card>

                {/* Arcade Input */}
                <input
                  id="arcade-input"
                  type="text"
                  value={arcadeInput}
                  onChange={handleArcadeInput}
                  placeholder="Type the falling word..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />

                {/* Motivational Comment */}
                {showArcadeComment && (
                  <div className="arcade-comment">
                    {showArcadeComment}
                  </div>
                )}
              </div>
            ) : (
              <>
              <div className="space-y-6">
            {/* Lesson Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{currentLesson.title}</h2>
                <p className="text-slate-400">{currentLesson.description}</p>
                {isEndlessMode && (
                  <p className="text-sm text-orange-400 mt-2">Round {endlessStats.roundsCompleted + 1}</p>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (isEndlessMode) {
                    setIsEndlessMode(false)
                  }
                  setCurrentText('')
                }}
                className="border-slate-600 text-slate-400 hover:text-white"
              >
                {isEndlessMode ? <StopCircle className="w-4 h-4 mr-2" /> : null}
                {isEndlessMode ? 'Stop' : 'Exit Lesson'}
              </Button>
            </div>

            {/* Stats Bar */}
            <div className={`grid gap-4 ${isEndlessMode ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4 text-center">

                  <p className="text-2xl font-bold text-emerald-400">{stats.wpm}</p>
                  <p className="text-xs text-slate-400">WPM</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-cyan-400">{stats.accuracy}%</p>
                  <p className="text-xs text-slate-400">Accuracy</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-400">{currentLesson && currentLesson.id ? `${timeRemaining}s` : `${stats.timeElapsed}s`}</p>
                  <p className="text-xs text-slate-400">{currentLesson && currentLesson.id ? 'Time Left' : 'Time'}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-orange-400">{stats.correctChars}/{currentText.length}</p>
                  <p className="text-xs text-slate-400">Progress</p>
                </CardContent>
              </Card>
              {isEndlessMode && (
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-orange-400">{endlessStats.roundsCompleted}</p>
                    <p className="text-xs text-slate-400">Rounds</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Progress Bar */}
            <Progress 
              value={(userInput.length / currentText.length) * 100} 
              className="h-2 bg-slate-700"
            />

            {/* Text Display */}
            <Card 
              className="bg-slate-800/50 border-slate-700/50 transition-all cursor-text hover:bg-slate-800/70"
              onClick={() => inputRef.current?.focus()}
            >
              <CardContent className="p-8 relative">
                <div 
                  className="text-2xl sm:text-3xl leading-relaxed font-mono text-center select-none"
                >
                  {currentText.split('').map((char, index) => (
                    <span
                      key={index}
                      className={`typing-char ${getCharClass(index)}`}
                    >
                      {char}
                    </span>
                  ))}
                </div>
                {userInput.length === 0 && !isActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-slate-500 text-lg animate-pulse">Click to start typing...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hidden Input */}
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInput}
              className="absolute opacity-0 pointer-events-none"
              autoFocus
              spellCheck="false"
              autoCapitalize="off"
              autoCorrect="off"
            />

            {/* Virtual Keyboard */}
            {showVirtualKeyboard && (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                      <Keyboard className="w-4 h-4" />
                      Virtual Keyboard
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowVirtualKeyboard(false)}
                      className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                      title="Hide keyboard"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-1.5">
                    {keyboardRows.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex justify-center gap-1">
                        {row.map((key, keyIndex) => {
                          const isPressed = pressedKey === key.toLowerCase() || 
                            (key === 'Space' && pressedKey === 'Space')
                          const isSpecial = key.length > 1
                          
                          return (
                            <div
                              key={`${rowIndex}-${keyIndex}`}
                              className={`keyboard-key ${isSpecial ? 'special' : ''} ${isPressed ? 'pressed' : ''}`}
                            >
                              {key === 'Space' ? '' : key}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={resetCurrent}
                className="border-slate-600 text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)}
                className="border-slate-600 text-slate-400 hover:text-white"
                title={showVirtualKeyboard ? 'Hide keyboard' : 'Show keyboard'}
              >
                <Keyboard className="w-4 h-4 mr-2" />
                {showVirtualKeyboard ? 'Hide' : 'Show'} Keyboard
              </Button>
            </div>

            {/* Results Modal */}
            {isFinished && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                <Card className={`bg-slate-800 border-slate-700 max-w-md w-full mx-4 ${isEndlessMode ? 'border-orange-500/50' : ''}`}>
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                      isEndlessMode 
                        ? 'bg-gradient-to-br from-orange-400 to-red-500' 
                        : 'bg-gradient-to-br from-yellow-400 to-orange-500'
                    }`}>
                      {isEndlessMode ? <Flame className="w-8 h-8 text-white" /> : <Trophy className="w-8 h-8 text-white" />}
                    </div>
                    <CardTitle className="text-2xl">
                      {isEndlessMode ? `Round ${endlessStats.roundsCompleted + 1} Complete!` : hasTimedOut ? "Time's Up!" : 'Lesson Complete!'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isEndlessMode && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="text-2xl font-bold text-orange-400">{stats.wpm}</p>
                          <p className="text-xs text-slate-400">WPM</p>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="text-2xl font-bold text-cyan-400">{stats.accuracy}%</p>
                          <p className="text-xs text-slate-400">Accuracy</p>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-400">{endlessStats.roundsCompleted + 1}</p>
                          <p className="text-xs text-slate-400">Round</p>
                        </div>
                      </div>
                    )}

                    {!isEndlessMode && (
                      <>
                        {hasTimedOut ? (
                          <div className="text-center space-y-3">
                            <p className="text-2xl font-semibold text-rose-400">You ran out of time.</p>
                            <p className="text-sm text-slate-400">Restart the lesson and try again before the countdown reaches zero.</p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                                <p className="text-3xl font-bold text-emerald-400">{stats.wpm}</p>
                                <p className="text-sm text-slate-400">WPM</p>
                              </div>
                              <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                                <p className="text-3xl font-bold text-cyan-400">{stats.accuracy}%</p>
                                <p className="text-sm text-slate-400">Accuracy</p>
                              </div>
                            </div>
                            
                            {/* Star Display */}
                            <div className="flex justify-center">
                              {currentLesson && (() => {
                                const progress = lessonProgress.find(p => p.lessonId === currentLesson.id && p.difficulty === difficulty)
                                const earnedStars = progress?.stars || 0
                                
                                return (
                                  <div className="flex flex-col items-center gap-3">
                                    {earnedStars === 6 ? (
                                      <div className="king-star-display animate-king-star">
                                        <Crown className="w-16 h-16 text-yellow-400 fill-yellow-400 drop-shadow-lg" style={{filter: 'drop-shadow(0 0 20px rgba(250, 204, 21, 0.5))'}} />
                                      </div>
                                    ) : (
                                      <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                          <Star 
                                            key={i} 
                                            className={`w-8 h-8 star-animate ${
                                              i < earnedStars
                                                ? 'fill-yellow-400 text-yellow-400' 
                                                : 'text-slate-600'
                                            }`}
                                            style={{animationDelay: `${i * 0.1}s`}}
                                          />
                                        ))}
                                      </div>
                                    )}
                                    
                                    {/* Performance Comment */}
                                    <p className="text-center italic text-slate-300 text-sm">
                                      {getPerformanceComment(earnedStars)}
                                    </p>
                                    
                                    {/* Unlock Status */}
                                    <div className={`text-sm font-medium p-2 rounded-lg text-center w-full ${
                                      earnedStars >= 2
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-orange-500/20 text-orange-400'
                                    }`}>
                                      {earnedStars >= 2 
                                        ? '✅ Next level unlocked!'
                                        : `❌ Earn ${2 - earnedStars} more star${2 - earnedStars === 1 ? '' : 's'} to unlock next level`
                                      }
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          </>
                        )}
                      </>
                    )}

                    <div className="flex gap-3">
                      {isEndlessMode ? (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEndlessMode(false)}
                            className="flex-1 border-slate-600"
                          >
                            Stop
                          </Button>
                          <Button 
                            onClick={endlessNextRound}
                            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                          >
                            Next Round
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => setCurrentText('')}
                            className="flex-1 border-slate-600"
                          >
                            Back to Lessons
                          </Button>
                          {currentLesson && (() => {
                            const progress = lessonProgress.find(p => p.lessonId === currentLesson.id && p.difficulty === difficulty)
                            const earnedStars = progress?.stars || 0
                            const nextLesson = lessons[difficulty]?.find(l => l.id === currentLesson.id + 1)
                            const maxLevels = difficulty === 'beginner' ? 30 : difficulty === 'intermediate' ? 60 : 100
                            
                            if (earnedStars >= 2 && nextLesson && currentLesson.id < maxLevels && activeTab === 'lessons') {
                              return (
                                <Button 
                                  onClick={() => startLesson(nextLesson)}
                                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                                >
                                  Next Level →
                                </Button>
                              )
                            }
                            return null
                          })()}
                          <Button 
                            onClick={() => {
                              resetCurrent()
                              if (activeTab === 'practice') {
                                startPractice()
                              }
                            }}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500"
                          >
                            {activeTab === 'practice' ? 'Next Practice' : 'Try Again'}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
              </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">Settings</DialogTitle>
            <DialogClose onClick={() => setShowSettings(false)}>
              <X className="w-5 h-5 text-slate-400 hover:text-white" />
            </DialogClose>
          </DialogHeader>
          <DialogDescription className="sr-only">Configure your typing application settings</DialogDescription>
          
          <Separator className="bg-slate-700" />
          
          <div className="space-y-6">
            {/* Sound Effects */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-base font-medium text-slate-300">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                  Sound Effects
                </Label>
                <Switch 
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>
              <p className="text-xs text-slate-500">Enable audio feedback for typing</p>
            </div>

            <Separator className="bg-slate-700" />

            {/* Theme Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-base font-medium text-slate-300">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-yellow-400" />}
                  {theme === 'dark' ? 'Dark' : 'Light'} Mode
                </Label>
                <Switch 
                  checked={theme === 'light'}
                  onCheckedChange={(checked) => setTheme(checked ? 'light' : 'dark')}
                />
              </div>
              <p className="text-xs text-slate-500">Switch between dark and light theme</p>
            </div>

            <Separator className="bg-slate-700" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-base font-medium text-slate-300">
                  <Keyboard className="w-4 h-4 text-emerald-400" />
                  Virtual Keyboard
                </Label>
                <Switch 
                  checked={showVirtualKeyboard}
                  onCheckedChange={setShowVirtualKeyboard}
                />
              </div>
              <p className="text-xs text-slate-500">Show keyboard visualization while typing</p>
            </div>

            <Separator className="bg-slate-700" />

            {/* Reset Progress */}
            <div className="space-y-2 pt-4">
              <Label className="text-base font-medium text-slate-300">Danger Zone</Label>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
                    resetAllProgress()
                    setShowSettings(false)
                  }
                }}
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Reset All Progress
              </Button>
              <p className="text-xs text-slate-500">Clear all completed lessons and stats</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md" showCloseButton={false}>
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </DialogTitle>
            <DialogClose onClick={() => setShowAuthDialog(false)}>
              <X className="w-5 h-5 text-slate-400 hover:text-white" />
            </DialogClose>
          </DialogHeader>
          <DialogDescription className="sr-only">
            {authMode === 'login' ? 'Log in to your account' : 'Create a new account'}
          </DialogDescription>
          
          <Separator className="bg-slate-700" />
          
          <div className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Email</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-400"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-400"
              />
            </div>

            {/* Signup Fields */}
            {authMode === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">Full Name</Label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">Username</Label>
                  <div className="flex items-center">
                    <span className="text-slate-500 mr-2">@</span>
                    <Input
                      type="text"
                      placeholder="johndoe"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-400 flex-1"
                    />
                  </div>
                </div>

                {/* Profile Picture Upload for Signup */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-300">Profile Picture (Optional)</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                  />
                  {profilePicture && (
                    <div className="flex justify-center">
                      <img 
                        src={profilePicture} 
                        alt="Preview" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <Separator className="bg-slate-700 my-4" />

          {/* Auth Buttons */}
          <div className="space-y-3">
            <Button
              onClick={authMode === 'login' ? handleLogin : handleSignup}
              className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600"
            >
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login')
                setFormEmail('')
                setFormPassword('')
                setFormName('')
                setFormUsername('')
                setProfilePicture(null)
              }}
              className="w-full border-slate-600"
            >
              {authMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Preview Modal */}
      <Dialog 
        open={showLessonModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowLessonModal(false)
          }
        }}
      >
        <DialogContent className="bg-white border-none rounded-2xl shadow-2xl max-w-2xl" showCloseButton={false}>
          <DialogHeader className="space-y-4 pt-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold uppercase tracking-wide mb-3">
                  {difficulty} Difficulty
                </div>
                <DialogTitle className="text-4xl font-black text-gray-900 leading-tight">
                  {pendingLesson?.title || 'Lesson'}
                </DialogTitle>
              </div>
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">{pendingLesson?.id || ''}</span>
              </div>
            </div>
          </DialogHeader>

          <DialogDescription className="sr-only">
            Lesson preview and start confirmation
          </DialogDescription>

          <div className="space-y-6 py-2">
            {/* Description Section */}
            <div>
              <p className="text-gray-600 text-lg leading-relaxed">
                {pendingLesson?.description || 'Start this lesson to improve your typing skills.'}
              </p>
            </div>

            {/* Stats Section - Horizontal Layout */}
            <div className="flex gap-4 py-4 px-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex-1 text-center">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                  Characters
                </div>
                <div className="text-2xl font-black text-orange-600">
                  {pendingLesson?.text?.length || 0}
                </div>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="flex-1 text-center">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                  Category
                </div>
                <div className="text-lg font-bold text-gray-900 capitalize">
                  Lesson
                </div>
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="flex-1 text-center">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                  Level
                </div>
                <div className="text-2xl font-black text-amber-600">
                  {pendingLesson?.id || ''}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLessonModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 text-lg"
              >
                Cancel
              </button>
              <button
                onClick={startLessonAfterConfirm}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
              >
                Start Lesson
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}

export default App
