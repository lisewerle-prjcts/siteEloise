import Link from 'next/link'
import Header from '@/components/Header'

const modules = [
  { emoji: '🪞', title: 'Moi, moi, moi', desc: 'Bilan personnel — qui es-tu vraiment ?', free: true },
  { emoji: '🫶', title: 'T\'es qui toi ?', desc: 'Ce que tu sais (ou crois savoir) de ton·ta partenaire' },
  { emoji: '💫', title: 'Nous', desc: 'Notre couple — ce qui nous unit et nous définit' },
  { emoji: '🗣️', title: 'Parle-moi', desc: 'Styles de communication et besoins d\'expression' },
  { emoji: '🌊', title: 'Les conflits', desc: 'Désamorcer, comprendre, grandir ensemble' },
  { emoji: '📜', title: 'Le Pacte', desc: 'Vœux, CDD de couple, renouvellement' },
  { emoji: '🌱', title: 'Toujours nous', desc: 'Les petits gestes au quotidien et le bilan annuel' },
]

const testimonials = [
  { quote: 'On pensait tout savoir l\'un de l\'autre. On avait tort — et c\'est magnifique.', author: 'Marie & Théo, 6 ans ensemble' },
  { quote: 'Enfin un outil qui nous a obligés à vraiment parler. Pas juste discuter — parler.', author: 'Camille & Jordan, 3 ans ensemble' },
  { quote: 'Le module Conflits a tout changé. On se comprend autrement maintenant.', author: 'Sarah & Alex, 10 ans ensemble' },
]

export default function LandingPage() {
  return (
    <>
      <Header />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative bg-magenta overflow-hidden">
          <div className="absolute inset-0 stripe-bg" aria-hidden="true" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
            <p className="font-dm-sans text-white/80 text-sm font-medium tracking-widest uppercase mb-4">
              Programme couple
            </p>
            <h1 className="font-fraunces text-4xl sm:text-6xl text-white font-light leading-tight mb-6">
              Pour les couples<br />
              <em>qui tiennent</em>
            </h1>
            <p className="font-dm-sans text-white/90 text-lg sm:text-xl max-w-xl mx-auto mb-10">
              Le Pacte pour se dire OUI pour la vie — un programme en 7 modules à vivre à deux, à votre rythme.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="bg-white text-magenta font-dm-sans font-semibold px-8 py-4 rounded-lg hover:bg-cream transition-colors">
                Commencer gratuitement
              </Link>
              <Link href="/pricing" className="border border-white text-white font-dm-sans font-medium px-8 py-4 rounded-lg hover:bg-white/10 transition-colors">
                Voir les tarifs
              </Link>
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="font-fraunces text-3xl sm:text-4xl text-soft-black mb-4">Comment ça fonctionne ?</h2>
            <p className="font-dm-sans text-soft-black/60 max-w-lg mx-auto">
              Chacun·e répond de son côté, puis vous découvrez vos réponses ensemble lors d\'une session de révélation.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Créez votre espace couple', desc: 'Inscrivez-vous et invitez ton·ta partenaire par email. Chacun·e a son propre compte.' },
              { num: '02', title: 'Répondez chacun·e de votre côté', desc: 'Les réponses restent cachées jusqu\'à ce que vous ayez tous·tes les deux terminé le module.' },
              { num: '03', title: 'Révélez et échangez', desc: 'Vos réponses apparaissent côte à côte. Découvrez ce que vous savez (ou ne saviez pas) de l\'autre.' },
            ].map((step) => (
              <div key={step.num} className="card text-center">
                <span className="font-fraunces text-4xl text-magenta/20 font-light">{step.num}</span>
                <h3 className="font-fraunces text-xl text-soft-black mt-2 mb-3">{step.title}</h3>
                <p className="font-dm-sans text-soft-black/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Les modules */}
        <section id="programme" className="bg-white py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="font-fraunces text-3xl sm:text-4xl text-soft-black mb-4">Les 7 modules</h2>
              <p className="font-dm-sans text-soft-black/60 max-w-lg mx-auto">
                Un parcours progressif — chaque module s\'ouvre une fois le précédent complété par vous deux.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {modules.map((mod, i) => (
                <div key={i} className="relative border border-gray-border rounded-2xl p-5 bg-cream hover:border-magenta/40 transition-colors">
                  {mod.free && (
                    <span className="absolute top-4 right-4 text-xs font-dm-sans font-medium text-magenta bg-magenta/10 px-2 py-0.5 rounded-full">
                      Gratuit
                    </span>
                  )}
                  <span className="text-2xl mb-3 block">{mod.emoji}</span>
                  <h3 className="font-fraunces text-lg text-soft-black mb-1">{mod.title}</h3>
                  <p className="font-dm-sans text-sm text-soft-black/60">{mod.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Témoignages */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="font-fraunces text-3xl sm:text-4xl text-soft-black mb-4">Ils l&apos;ont vécu</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <figure key={i} className="card">
                <blockquote className="font-fraunces text-lg text-soft-black italic leading-relaxed mb-4">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="font-dm-sans text-sm text-soft-black/50">{t.author}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="bg-magenta">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 stripe-bg" aria-hidden="true" />
            <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
              <h2 className="font-fraunces text-3xl sm:text-4xl text-white mb-4">
                Prêt·es à vous redécouvrir ?
              </h2>
              <p className="font-dm-sans text-white/80 mb-8">
                Le module 1 est entièrement gratuit. Aucune carte bancaire requise pour commencer.
              </p>
              <Link href="/signup" className="bg-white text-magenta font-dm-sans font-semibold px-8 py-4 rounded-lg hover:bg-cream transition-colors inline-block">
                Créer notre espace couple
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-border py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="font-dm-sans text-sm text-soft-black/40">
              © {new Date().getFullYear()} YES BOX — Le Pacte. Tous droits réservés.
            </p>
            <nav className="flex gap-6" aria-label="Footer">
              <Link href="/pricing" className="font-dm-sans text-sm text-soft-black/40 hover:text-magenta transition-colors">Tarifs</Link>
              <Link href="/login" className="font-dm-sans text-sm text-soft-black/40 hover:text-magenta transition-colors">Connexion</Link>
            </nav>
          </div>
        </footer>
      </main>
    </>
  )
}
