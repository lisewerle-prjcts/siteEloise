'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const inviteToken = formData.get('invite_token') as string | null

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    redirect('/signup?error=' + encodeURIComponent(error.message))
  }

  const userId = data.user?.id
  if (!userId) {
    redirect('/signup?error=no_user')
  }

  // Si un token d'invitation est présent, lier le couple
  if (inviteToken) {
    const { data: couple } = await supabase
      .from('couples')
      .select('id, partner_b_id')
      .eq('invite_token', inviteToken)
      .single()

    if (couple && !couple.partner_b_id) {
      // Lier comme partenaire B
      await supabase
        .from('couples')
        .update({ partner_b_id: userId })
        .eq('id', couple.id)

      // Mettre à jour le profil
      await supabase
        .from('profiles')
        .update({ couple_id: couple.id })
        .eq('id', userId)

      redirect('/dashboard?welcome=partner')
    }
  }

  // Sinon, créer un nouvel espace couple
  const { data: newCouple } = await supabase
    .from('couples')
    .insert({ partner_a_id: userId })
    .select('id')
    .single()

  if (newCouple) {
    await supabase
      .from('profiles')
      .update({ couple_id: newCouple.id })
      .eq('id', userId)
  }

  redirect('/invite?welcome=true')
}
