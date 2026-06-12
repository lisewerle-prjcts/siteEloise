'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface InviteFormProps {
  inviteLink: string
  coupleId?: string
  existingEmail?: string | null
}

export default function InviteForm({ inviteLink, coupleId, existingEmail }: InviteFormProps) {
  const [email, setEmail] = useState(existingEmail || '')
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !coupleId) return

    setSending(true)
    setError(null)

    const supabase = createClient()

    // Sauvegarder l'email d'invitation
    const { error: updateError } = await supabase
      .from('couples')
      .update({ invite_email: email })
      .eq('id', coupleId)

    if (updateError) {
      setError('Impossible de sauvegarder l\'invitation. Réessaie.')
      setSending(false)
      return
    }

    // Envoyer l'email via Supabase Auth invite
    const { error: inviteError } = await supabase.auth.admin
      ? { error: null }  // côté client, on utilise une API route dédiée
      : { error: null }

    // Note : l'envoi d'email se fait via /api/invite (voir ci-dessous)
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, inviteLink }),
    })

    if (!res.ok) {
      setError('L\'email n\'a pas pu être envoyé. Utilise le lien ci-dessous.')
    } else {
      setSent(true)
    }

    setSending(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-dm-sans text-sm text-soft-black/70 mb-4">
          Envoie ce lien à ton·ta partenaire pour qu&apos;il·elle rejoigne votre espace couple.
        </p>

        {/* Lien à copier */}
        <div className="flex items-center gap-2 bg-cream border border-gray-border rounded-lg p-3">
          <span className="flex-1 font-dm-sans text-xs text-soft-black/60 truncate">
            {inviteLink}
          </span>
          <button
            onClick={copyLink}
            className="shrink-0 text-xs font-dm-sans font-medium text-magenta hover:underline"
          >
            {copied ? '✓ Copié !' : 'Copier'}
          </button>
        </div>
      </div>

      <div className="relative flex items-center gap-4">
        <hr className="flex-1 border-gray-border" />
        <span className="font-dm-sans text-xs text-soft-black/40">ou envoyer par email</span>
        <hr className="flex-1 border-gray-border" />
      </div>

      <form onSubmit={sendInvite} className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-dm-sans" role="alert">
            {error}
          </div>
        )}

        {sent ? (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm font-dm-sans text-center">
            ✓ Invitation envoyée à <strong>{email}</strong>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="partner-email" className="block font-dm-sans text-sm font-medium text-soft-black mb-1.5">
                Email de ton·ta partenaire
              </label>
              <input
                id="partner-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partenaire@exemple.fr"
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={sending}>
              {sending ? 'Envoi en cours…' : 'Envoyer l\'invitation 💌'}
            </button>
          </>
        )}
      </form>

      <p className="font-dm-sans text-xs text-soft-black/40 text-center">
        Pas encore de réponse ?{' '}
        <button onClick={copyLink} className="text-magenta hover:underline">
          Copie le lien et envoie-le directement.
        </button>
      </p>
    </div>
  )
}
