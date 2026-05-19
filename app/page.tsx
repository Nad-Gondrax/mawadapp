"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Shield, Heart, Users, Star, ArrowRight, Sparkles, CheckCircle } from "lucide-react"
import { AuthModal } from "@/components/auth/auth-modal"

const fadeInUp = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const staggerContainer = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const scaleIn = {
  hidden: { opacity: 1, scale: 1 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
}

const FEATURES = [
  {
    icon: Users,
    title: "Pas de swipe compulsif",
    description: "Ici, on ne collectionne pas les conversations. On ne joue pas avec les cœurs. Taym s’adresse aux musulmans et musulmanes qui savent ce qu’ils veulent : faire connaissance avec respect, avec pudeur, et avec une vraie intention de mariage.",
    color: "primary"
  },
  {
    icon: Heart,
    title: "Un cadre éthique et rassurant",
    description: "Taym vous permet d’échanger dans un environnement sain, pensé pour préserver la pudeur et le respect de chacun. Ici, tout est conçu pour avancer sans malaise ni ambiguïté.",
    color: "coral"
  },
  {
    icon: Shield,
    title: "Le Mahram intégré au parcours",
    description: "Pour une appli halal, il faut un cadre sérieux. Taym permet d’intégrer le Mahram naturellement, pour avancer avec confiance, transparence et respect.",
    color: "success"
  },
]

const TESTIMONIALS = [
  {
    name: "Fatima & Ahmed",
    text: "Grâce à Taym, j'ai rencontré mon mari dans le respect de nos valeurs. Le système de supervision nous a permis de construire une relation saine.",
    city: "Paris",
  },
  {
    name: "Yasmine & Karim",
    text: "L'approche sérieuse de Taym nous a rassurés. Nous nous sommes mariés après 2 mois d’échanges supervisés.",
    city: "Lyon",
  },
  {
    name: "Sarah & Omar",
    text: "Une plateforme qui respecte vraiment nos valeurs. Mon père a pu suivre nos échanges et nous avons pu nous connaître sereinement.",
    city: "Marseille",
  },
]

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("register")

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <motion.header 
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-2.5">
              <Image 
                src="/logo-taym.png" 
                alt="Taym" 
                width={40} 
                height={40} 
                className="w-9 h-9 md:w-10 md:h-10"
              />
              <span className="font-serif font-bold text-xl md:text-2xl text-foreground">Taym</span>
            </Link>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => openAuth("login")}
                className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors hidden sm:block"
              >
                Connexion
              </button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openAuth("register")}
                className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-full hover:bg-[#006B61] transition-all shadow-lg shadow-primary/20"
              >
                Commencer
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-28 md:pt-36 pb-20 md:pb-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 gradient-mawada-soft" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#FF6B6B]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left content */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center lg:text-left"
            >
              <motion.div 
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-primary/20 mb-6 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Plateforme de confiance</span>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
              >
                Le 1er site de rencontre pour célibataires musulmans{" "}
                <span className="text-primary">exigeants</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0"
              >
                Taym c’est la garantie d’une rencontre sérieuse, dans un cadre respectueux de nos valeurs,
                sans perdre votre temps, sans ambiguïté, et avec le Mahram ou tuteur.
              </motion.p>
              
              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openAuth("register")}
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 gradient-mawada text-white text-lg font-semibold rounded-full shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all"
                >
                  M&apos;inscrire
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openAuth("login")}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-foreground text-lg font-semibold rounded-full border border-border hover:border-primary/30 hover:bg-[#E7F7F4] transition-all shadow-sm"
                >
                  J&apos;ai déjà un compte
                </motion.button>
              </motion.div>
              
              <motion.div 
                variants={fadeInUp}
                className="flex items-center justify-center lg:justify-start gap-6 mt-10"
              >
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/50 border-2 border-white flex items-center justify-center shadow-sm"
                    >
                      <span className="text-xs font-bold text-primary">{i}</span>
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-[#FFB800] text-[#FFB800]" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">+2000 mariages réussis</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right mockup */}
            <motion.div 
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative mx-auto w-[340px]">
                {/* Phone mockup */}
                <div className="relative bg-[#102A2A] rounded-[3rem] p-3 shadow-2xl">
                  <div className="bg-background rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                    <div className="p-4 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20" />
                          <span className="font-medium text-sm">Découvrir</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#E7F7F4] flex items-center justify-center">
                          <Heart className="w-4 h-4 text-[#FF6B6B]" />
                        </div>
                      </div>
                      <div className="flex-1 bg-gradient-to-b from-primary/10 to-primary/5 rounded-3xl p-4 flex flex-col">
                        <div className="flex-1 bg-white/60 rounded-2xl mb-3" />
                        <div className="space-y-2">
                          <div className="h-4 bg-foreground/10 rounded-full w-3/4" />
                          <div className="h-3 bg-foreground/5 rounded-full w-1/2" />
                          <div className="flex gap-2 mt-3">
                            <div className="flex-1 h-12 bg-[#E7F7F4] rounded-2xl" />
                            <div className="w-12 h-12 gradient-coral rounded-2xl flex items-center justify-center">
                              <Heart className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <motion.div 
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-16 top-24 glass-card rounded-2xl p-4 shadow-premium"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#2ECC71]/15 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-[#2ECC71]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Match!</p>
                      <p className="text-xs text-muted-foreground">Nouveau match trouvé</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-12 bottom-36 glass-card rounded-2xl p-4 shadow-premium"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full gradient-mawada flex items-center justify-center shadow-lg shadow-primary/30">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">100% Sécurisé</p>
                      <p className="text-xs text-muted-foreground">Profils vérifiés</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
            >
              Pourquoi choisir Taym ?
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Une approche respectueuse et sérieuse de la rencontre, 
              avec des valeurs qui comptent.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -4 }}
                className="group relative bg-[#F8FFFC] rounded-3xl p-8 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-premium-lg"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
                  feature.color === "coral" ? "bg-[#FF6B6B]/10" : 
                  feature.color === "success" ? "bg-[#2ECC71]/10" : "bg-primary/10"
                }`}>
                  <feature.icon className={`w-7 h-7 ${
                    feature.color === "coral" ? "text-[#FF6B6B]" : 
                    feature.color === "success" ? "text-[#2ECC71]" : "text-primary"
                  }`} />
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28 gradient-mawada-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
            >
              Comment ça fonctionne ?
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Un parcours simple et respectueux vers la rencontre
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-4 gap-8"
          >
            {[
              { step: "01", title: "Inscription", desc: "Créez votre profil en quelques minutes" },
              { step: "02", title: "Validation Mahram", desc: "Votre tuteur valide votre inscription" },
              { step: "03", title: "Découvrez", desc: "Parcourez les profils compatibles" },
              { step: "04", title: "Échangez", desc: "Discutez sous supervision" }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="relative text-center"
              >
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="relative z-10 w-16 h-16 mx-auto mb-6 rounded-2xl gradient-mawada flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30"
                >
                  {item.step}
                </motion.div>
                <h3 className="font-serif text-xl font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 
              variants={fadeInUp}
              className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4"
            >
              Ils ont trouvé l&apos;amour
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Des témoignages de couples formés sur Taym
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6 lg:gap-8"
          >
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -4 }}
                className="bg-[#F8FFFC] rounded-3xl p-8 border border-border hover:shadow-premium transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-[#FFB800] text-[#FFB800]" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed mb-6">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-mawada flex items-center justify-center shadow-lg shadow-primary/20">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="relative gradient-mawada rounded-[2rem] md:rounded-[3rem] p-10 md:p-16 text-center overflow-hidden"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl" />
            </div>
            <div className="relative z-10">
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Prêt à trouver votre moitié ?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Rejoignez des milliers de personnes qui ont trouvé l&apos;amour 
                dans le respect de leurs valeurs.
              </p>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openAuth("register")}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-primary text-lg font-semibold rounded-full hover:bg-white/95 transition-all shadow-xl"
              >
                Créer mon profil gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#102A2A] text-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Image 
                src="/logo-taym.png" 
                alt="Taym" 
                width={32} 
                height={32}
                className="brightness-0 invert"
              />
              <span className="font-serif font-bold text-xl text-white">Taym</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="#" className="hover:text-white transition-colors">À propos</Link>
              <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
              <Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link href="/cgu" className="hover:text-white transition-colors">CGU</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <p className="text-sm">© 2024 Taym. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        open={authOpen} 
        onClose={() => setAuthOpen(false)}
        defaultMode={authMode}
      />
    </div>
  )
}
