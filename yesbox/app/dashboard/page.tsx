import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import Link from 'next/link'

const MODULE_META = [
  { slug: 'moi', emoji: '🪞', title: 'Moi, moi, moi', subtitle: 'Bilan personnel', free: true },
  { slug: 'toi', emoji: '🫶', title: 'T\'es qui toi ?', subtitle: 'Ce que tu connais de l\'autre' },
  { slug: 'nous', emoji: '💫', title: 'Nous', subtitle: 'Notre couple' },
  { slug: 'communication', emoji: '🗣️', title: 'Parle-moi', subtitle: 'Communication & besoins' },
  { slug: 'conflits', emoji: '🌊', title: 'Les conflits', subtitle: 'Désamorcer & grandir' },
  { slug: 'engagement', emoji: '📜', title: 'Le Pacte', subtitle: 'Vœux & renouvellement' },
  { slug: 'renouvellement', emoji: '🌱', title: 'Toujours nous', subtitle: 'Les petits gestes' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, has_paid, couple_id, couples(partner_a_id, partner_b_id)')
    .eq('id', user.id)
    .single()

  const couple = Array.isArray(profile?.couples) ? profile.couples[0] : profile?.couples
  const partnerId = couple
    ? (couple.partner_a_id === user.id ? couple.partner_b_id : couple.partner_a_id)
    : null

  // Completions de l'utilisateur·ice courant·e
  const { data: myCompletions } = await supabase
    .from('module_completions')
    .select('module_id')
    .eq('user_id', user.id)

  // Completions du·de la partenaire
  const { data: partnerCompletions } = partnerId
    ? await supabase
        .from('module_completions')
        .select('module_id')
        .eq('user_id', partnerId)
    : { data: [] }

  // Modules depuis Supabase
  const { data: modules } = await supabase
    .from('modules')
    .select('id, slug, order')
    .order('order')

  const myDoneIds = new Set((myCompletions || []).map((c) => c.module_id))
  const partnerDoneIds = new Set((partnerCompletions || []).map((c) => c.module_id))

  function getModuleStatus(moduleId: string, order: number): 'locked' | 'available' | 'in-progress' | 'waiting' | 'done' {
    const iMine = myDoneIds.has(moduleId)
    const isPartnerDone = partnerDoneIds.has(moduleId)

    if (iMine && isPartnerDone) return 'done'
    if (iMine && !isPartnerDone) return 'waiting'

    // Premier module toujours disponible, sinon vérifie le précédent
    if (order === 1) return 'available'

    const prevModule = modules?.find((m) => m.order === order - 1)
    if (!prevModule) return 'locked'

    const bothDonePrev = myDoneIds.has(prevModule.id) && partnerDoneIds.has(prevModule.id)
    return bothDonePrev ? 'available' : 'locked'
  }

  const firstName = profile?.name || user.email?.split('@')[0] || 'toi'

  return (
    <>
      <Header user={{ email: user.email, name: profile?.name }} />
      <main className="pt-16 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

          {/* Accueil */}
          <div className="mb-10">
            <h1 className="font-fraunces text-3xl text-soft-black mb-1">
              Bonjour, {firstName} 👋
            </h1>
            <p className="font-dm-sans text-soft-black/60">
              {partnerId
                ? 'Votre aventure à deux a commencé.'
                : 'Invite ton·ta partenaire pour débloquer les révélations.'}
            </p>
          </div>

          {/* Alerte partenaire manquant */}
          {!partnerId && (
            <div className="mb-8 bg-magenta/5 border border-magenta/20 rounded-2xl p-5 flex items-center gap-4">
              <span className="text-2xl">💌</span>
              <div className="flex-1">
                <p className="font-dm-sans font-medium text-soft-black text-sm">
                  Ton·ta partenaire n&apos;a pas encore rejoint l&apos;espace couple.
                </p>
                <p className="font-dm-sans text-xs text-soft-black/60 mt-0.5">
                  Envoie l&apos;invitation pour commencer ensemble.
                </p>
              </div>
              <Link href="/invite" className="btn-primary py-2 px-4 text-sm shrink-0">
                Inviter
              </Link>
            </div>
          )}

          {/* Grille des modules */}
          <h2 className="font-fraunces text-xl text-soft-black mb-5">Votre programme</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules?.map((mod) => {
              const meta = MODULE_META.find((m) => m.slug === mod.slug)
              if (!meta) return null
              const status = getModuleStatus(mod.id, mod.order)
              const locked = status === 'locked'

              return (
                <div
                  key={mod.id}
                  className={`relative border rounded-2xl p-5 transition-all ${
                    locked
                      ? 'border-gray-border bg-white opacity-60 cursor-not-allowed'
                      : 'border-gray-border bg-white hover:border-magenta/40 hover:shadow-sm'
                  }`}
                >
                  {/* Badge statut */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{meta.emoji}</span>
                    <StatusBadge status={status} />
                  </div>

                  <h3 className="font-fraunces text-lg text-soft-black mb-0.5">{meta.title}</h3>
                  <p className="font-dm-sans text-sm text-soft-black/50 mb-4">{meta.subtitle}</p>

                  {/* Action */}
                  {locked ? (
                    <div className="flex items-center gap-1.5 text-xs font-dm-sans text-soft-black/40">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 5H3V10H9V5Z" stroke="currentColor" strokeWidth="1.2" /><path d="M4 5V3.5C4 2.12 4.9 1 6 1C7.1 1 8 2.12 8 3.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                      Module verrouillé
                    </div>
                  ) : (
                    <Link
                      href={status === 'done' ? `/reveal/${mod.slug}` : `/module/${mod.slug}`}
                      className="btn-primary py-2 px-4 text-sm inline-block"
                    >
                      {status === 'done' ? 'Revoir la révélation' :
                       status === 'waiting' ? 'Voir ma progression' :
                       'Commencer'}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs = {
    done: { label: 'Terminé ✓', classes: 'bg-green-50 text-green-700' },
    waiting: { label: 'En attente…', classes: 'bg-amber-50 text-amber-700' },
    available: { label: 'Disponible', classes: 'bg-magenta/10 text-magenta' },
    'in-progress': { label: 'En cours', classes: 'bg-blue-50 text-blue-700' },
    locked: { label: '', classes: '' },
  }
  const cfg = configs[status as keyof typeof configs]
  if (!cfg?.label) return null

  return (
    <span className={`text-xs font-dm-sans font-medium px-2 py-0.5 rounded-full ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}
