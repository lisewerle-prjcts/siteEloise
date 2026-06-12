import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Logo from '@/components/Logo'
import InviteForm from './InviteForm'

interface InvitePageProps {
  searchParams: Promise<{ welcome?: string }>
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const isWelcome = params.welcome === 'true'

  // Récupérer les infos du couple
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, couple_id, couples(id, partner_b_id, invite_token, invite_email)')
    .eq('id', user.id)
    .single()

  const couple = Array.isArray(profile?.couples) ? profile.couples[0] : profile?.couples
  const inviteToken = couple?.invite_token
  const partnerJoined = !!couple?.partner_b_id
  const inviteEmail = couple?.invite_email

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const inviteLink = `${siteUrl}/signup?token=${inviteToken}`

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-border py-4 px-6">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {isWelcome && (
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🎉</div>
              <h1 className="font-fraunces text-3xl text-soft-black mb-2">
                Bienvenue, {profile?.name || 'toi'} !
              </h1>
              <p className="font-dm-sans text-soft-black/60">
                Ton espace couple est créé. Il ne manque plus qu&apos;un·e invité·e.
              </p>
            </div>
          )}

          {!isWelcome && (
            <div className="text-center mb-8">
              <h1 className="font-fraunces text-3xl text-soft-black mb-2">
                Inviter ton·ta partenaire
              </h1>
              <p className="font-dm-sans text-soft-black/60">
                L&apos;aventure commence à deux.
              </p>
            </div>
          )}

          <div className="card">
            {partnerJoined ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-3">✅</div>
                <p className="font-fraunces text-xl text-soft-black mb-2">Votre duo est complet !</p>
                <p className="font-dm-sans text-soft-black/60 mb-6">
                  Ton·ta partenaire a rejoint l&apos;espace couple.
                </p>
                <a href="/dashboard" className="btn-primary inline-block">
                  Aller au tableau de bord
                </a>
              </div>
            ) : (
              <InviteForm
                inviteLink={inviteLink}
                coupleId={couple?.id}
                existingEmail={inviteEmail}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
