import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, inviteLink } = await request.json()

  if (!email || !inviteLink) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const supabase = await createClient()

  // Vérifier que l'utilisateur est connecté
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Récupérer le prénom de l'invitant
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const senderName = profile?.name || 'Ton·ta partenaire'

  // Utiliser Supabase pour envoyer un email personnalisé
  // En production, tu peux utiliser Resend, SendGrid, ou les emails Supabase Auth
  // Ici on utilise supabase.auth.admin.inviteUserByEmail si disponible
  // Sinon, on envoie via l'API Supabase Edge Functions ou un provider email

  // Tentative avec l'API Supabase Auth
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: inviteLink,
      data: {
        invite_type: 'couple',
        sender_name: senderName,
      },
    },
  })

  if (error) {
    console.error('Invite error:', error)
    // On ne bloque pas — le lien reste utilisable
    return NextResponse.json({ ok: true, warning: 'email_failed' })
  }

  return NextResponse.json({ ok: true })
}
