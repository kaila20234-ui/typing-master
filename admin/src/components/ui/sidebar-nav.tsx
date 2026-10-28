import { useState } from 'react'
import { Button } from './button'
import {
  BarChart3,
  Users,
  Trophy,
  Zap,
  Flame,
  TrendingUp,
  Shield,
  Swords,
  DollarSign,
  Settings,
  ChevronDown,
  Menu,
  X,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  icon: React.ReactNode
  id: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <BarChart3 className="w-5 h-5" />,
    id: 'dashboard',
  },
  {
    label: 'Analytics',
    icon: <TrendingUp className="w-5 h-5" />,
    id: 'analytics',
  },
  {
    label: 'Audit Log',
    icon: <Clock className="w-5 h-5" />,
    id: 'audit',
  },
  {
    label: 'Competitions',
    icon: <Trophy className="w-5 h-5" />,
    id: 'competitions',
    children: [
      { label: 'Tournaments', icon: <Trophy className="w-4 h-4" />, id: 'tournaments' },
      { label: 'Live Races', icon: <Zap className="w-4 h-4" />, id: 'races' },
      { label: 'Daily Challenges', icon: <Flame className="w-4 h-4" />, id: 'daily-challenges' },
      { label: 'Squad Wars', icon: <Swords className="w-4 h-4" />, id: 'squad-wars' },
      { label: 'Leaderboards', icon: <TrendingUp className="w-4 h-4" />, id: 'leaderboards' },
    ],
  },
  {
    label: 'Users',
    icon: <Users className="w-5 h-5" />,
    id: 'users',
    children: [
      { label: 'All Users', icon: <Users className="w-4 h-4" />, id: 'all-users' },
      { label: 'Moderation', icon: <Shield className="w-4 h-4" />, id: 'moderation' },
    ],
  },
  {
    label: 'Payments',
    icon: <DollarSign className="w-5 h-5" />,
    id: 'payments',
  },
  {
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    id: 'settings',
  },
]

interface SidebarNavProps {
  activeItem: string
  onNavigate: (id: string) => void
}

export function SidebarNav({ activeItem, onNavigate }: SidebarNavProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['competitions', 'users']))

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedItems)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedItems(newSet)
  }

  const handleNavClick = (id: string, hasChildren?: boolean) => {
    if (hasChildren) {
      toggleExpanded(id)
    } else {
      onNavigate(id)
    }
  }

  return (
    <>
      {/* Mobile toggle button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-background"
        >
          {isExpanded ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed md:relative left-0 top-0 h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300 z-40',
          isExpanded ? 'w-64' : 'w-20',
          'flex flex-col'
        )}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          {isExpanded && (
            <div className="flex flex-col">
              <h2 className="font-bold text-lg text-sidebar-primary">Admin</h2>
              <p className="text-xs text-sidebar-foreground">TypeMaster</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id, !!item.children)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-md transition-colors',
                    activeItem === item.id || activeItem.startsWith(item.id + '/')
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                  title={!isExpanded ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">{item.icon}</div>
                    {isExpanded && <span className="text-sm">{item.label}</span>}
                  </div>
                  {isExpanded && item.children && (
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform',
                        expandedItems.has(item.id) && 'rotate-180'
                      )}
                    />
                  )}
                </button>

                {/* Submenu */}
                {item.children && isExpanded && expandedItems.has(item.id) && (
                  <ul className="ml-4 mt-1 space-y-1">
                    {item.children.map((subitem) => (
                      <li key={subitem.id}>
                        <button
                          onClick={() => onNavigate(subitem.id)}
                          className={cn(
                            'w-full flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors',
                            activeItem === subitem.id
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                          )}
                        >
                          {subitem.icon}
                          <span>{subitem.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className={cn(
          'border-t border-sidebar-border p-4',
          isExpanded && 'space-y-2'
        )}>
          <Button
            variant="outline"
            className="w-full"
            size={isExpanded ? 'default' : 'icon'}
          >
            {isExpanded ? 'Logout' : '←'}
          </Button>
        </div>
      </div>

      {/* Mobile overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  )
}
