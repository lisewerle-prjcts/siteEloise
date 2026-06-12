import Link from 'next/link'
import Logo from '@/components/Logo'
import { signup } from './actions'

interface SignupPageProps {
  searchParams: Promise<{ error?: string; token?: string }>
}

const errorLabels: Record<string, string> = {
  'User already registered': 'Un compte existe déjà avec cet email.',
  'Password should be at least 6 characters': 'Le mot de passe doit faire au moins 6 caractères.',
  no_user: 'Une erreur est survenue. Réessaie.',
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams
  const errorMsg = params.error
  const inviteToken = params.token

  const displayError = errorMsg ? (errorLabels[errorMsg] ?? 'Une erreur est survenue.') : null
  const isInvite = !!inviteToken

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-border py-4 px-6">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            {isInvite ? (
              <>
                <div className="text-3xl mb-3">💌</div>
                <h1 className="font-fraunces text-3xl text-soft-black mb-2">
                  Ton·ta partenaire t&apos;invite !
                </h1>
                <p className="font-dm-sans text-soft-black/60">
                  Crée ton compte pour rejoindre votre espace couple.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-fraunces text-3xl text-soft-black mb-2">
                  Créez votre espace couple
                </h1>
                <p className="font-dm-sans text-soft-black/60">
                  Commence par créer ton compte — tu inviteras ton·ta partenaire ensuite.
                </p>
              </>
            )}
          </div>

          <div className="card">
            {displayError && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-dm-sans" role="alert">
                {displayError}
              </div>
            )}

            <form action={signup} className="flex flex-col gap-5">
              {inviteToken && (
                <input type="hidden" name="invite_token" value={inviteToken} />
              )}

              <div>
                <label htmlFor="name" className="block font-dm-sans text-sm font-medium text-soft-black mb-1.5">
                  Ton prénom
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="given-name"
                  required
                  placeholder="Camille"
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="email" className="block font-dm-sans text-sm font-medium text-soft-black mb-1.5">
                  Adresse email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="toi@exemple.fr"
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="password" className="block font-dm-sans text-sm font-medium text-soft-black mb-1.5">
                  Mot de passe
                  <span className="font-normal text-soft-black/40 ml-1">(min. 6 caractères)</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>

              <button type="submit" className="btn-primary w-full mt-1">
                {isInvite ? 'Rejoindre notre espace couple' : 'Créer mon compte'}
              </button>
            </form>

            <p className="font-dm-sans text-sm text-soft-black/60 text-center mt-6">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-magenta font-medium hover:underline">
                Me connecter
              </Link>
            </p>
          </div>

          {!isInvite && (
            <p className="font-dm-sans text-xs text-soft-black/40 text-center mt-4 leading-relaxed">
              En créant un compte, tu acceptes nos conditions d&apos;utilisation.<br />
              Le module 1 est gratuit — aucune carte bancaire requise.
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
