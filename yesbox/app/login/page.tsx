import Link from 'next/link'
import Logo from '@/components/Logo'
import { login } from './actions'

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const errorMsg = params.error

  const errorLabels: Record<string, string> = {
    'Invalid login credentials': 'Email ou mot de passe incorrect.',
    auth: 'Une erreur est survenue lors de la connexion. Réessaie.',
  }
  const displayError = errorMsg ? (errorLabels[errorMsg] ?? 'Une erreur est survenue.') : null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header minimal */}
      <header className="border-b border-gray-border py-4 px-6">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Titre */}
          <div className="text-center mb-8">
            <h1 className="font-fraunces text-3xl text-soft-black mb-2">Bon retour !</h1>
            <p className="font-dm-sans text-soft-black/60">
              Continue ton parcours avec ton·ta partenaire.
            </p>
          </div>

          <div className="card">
            {displayError && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm font-dm-sans" role="alert">
                {displayError}
              </div>
            )}

            <form action={login} className="flex flex-col gap-5">
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
                  placeholder="vous@exemple.fr"
                  className="input-field"
                />
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-1.5">
                  <label htmlFor="password" className="block font-dm-sans text-sm font-medium text-soft-black">
                    Mot de passe
                  </label>
                  <Link href="/forgot-password" className="font-dm-sans text-xs text-magenta hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>

              <button type="submit" className="btn-primary w-full mt-1">
                Me connecter
              </button>
            </form>

            <p className="font-dm-sans text-sm text-soft-black/60 text-center mt-6">
              Pas encore de compte ?{' '}
              <Link href="/signup" className="text-magenta font-medium hover:underline">
                Créer notre espace couple
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
