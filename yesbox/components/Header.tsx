'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from './Logo'

interface HeaderProps {
  user?: { email?: string; name?: string } | null
  showNav?: boolean
}

export default function Header({ user, showNav = true }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-gray-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo />

        {showNav && (
          <>
            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Navigation principale">
              {!user ? (
                <>
                  <Link href="/#programme" className="text-sm font-dm-sans text-soft-black/70 hover:text-magenta transition-colors">
                    Le programme
                  </Link>
                  <Link href="/pricing" className="text-sm font-dm-sans text-soft-black/70 hover:text-magenta transition-colors">
                    Tarifs
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="text-sm font-dm-sans text-soft-black/70 hover:text-magenta transition-colors">
                    Tableau de bord
                  </Link>
                  <Link href="/journal" className="text-sm font-dm-sans text-soft-black/70 hover:text-magenta transition-colors">
                    Journal
                  </Link>
                </>
              )}
            </nav>

            {/* Actions desktop */}
            <div className="hidden md:flex items-center gap-3">
              {!user ? (
                <>
                  <Link href="/login" className="btn-ghost py-2 px-4 text-sm">
                    Connexion
                  </Link>
                  <Link href="/signup" className="btn-primary py-2 px-4 text-sm">
                    Commencer
                  </Link>
                </>
              ) : (
                <Link href="/settings" className="flex items-center gap-2 text-sm font-dm-sans text-soft-black/70 hover:text-magenta transition-colors">
                  <span className="w-8 h-8 rounded-full bg-magenta/10 flex items-center justify-center text-magenta font-medium text-xs">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                  </span>
                  <span>{user.name || user.email}</span>
                </Link>
              )}
            </div>

            {/* Hamburger mobile */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-border transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                {menuOpen ? (
                  <>
                    <line x1="4" y1="4" x2="18" y2="18" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
                    <line x1="18" y1="4" x2="4" y2="18" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="19" y2="6" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="11" x2="19" y2="11" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="16" x2="19" y2="16" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Menu mobile */}
      {showNav && menuOpen && (
        <div className="md:hidden bg-cream border-t border-gray-border px-4 py-4 flex flex-col gap-3">
          {!user ? (
            <>
              <Link href="/#programme" className="text-soft-black/70 py-2" onClick={() => setMenuOpen(false)}>Le programme</Link>
              <Link href="/pricing" className="text-soft-black/70 py-2" onClick={() => setMenuOpen(false)}>Tarifs</Link>
              <hr className="border-gray-border" />
              <Link href="/login" className="btn-ghost py-2 text-center" onClick={() => setMenuOpen(false)}>Connexion</Link>
              <Link href="/signup" className="btn-primary py-2 text-center" onClick={() => setMenuOpen(false)}>Commencer</Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="text-soft-black/70 py-2" onClick={() => setMenuOpen(false)}>Tableau de bord</Link>
              <Link href="/journal" className="text-soft-black/70 py-2" onClick={() => setMenuOpen(false)}>Journal</Link>
              <Link href="/settings" className="text-soft-black/70 py-2" onClick={() => setMenuOpen(false)}>Paramètres</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
