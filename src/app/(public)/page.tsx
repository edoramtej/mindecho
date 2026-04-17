import Link from "next/link";
import { Shield, Mic, BarChart3, ArrowRight, Lock, Eye, Heart, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[#6C63FF]/20 blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-[#FF6B9D]/15 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-[#6C63FF]/10 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-[#6C63FF]/30 text-sm text-[#6C63FF] font-medium mb-8 animate-fade-in">
            <Heart className="w-3.5 h-3.5" />
            Totalmente anónimo y gratuito
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Exprésate{" "}
            <span className="gradient-text">libremente.</span>
            <br />
            Ayuda al mundo.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Graba tu voz o escribe cómo te sientes. Nuestra IA analiza tu bienestar emocional de forma privada y contribuye a entender la salud mental colectiva.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link
              href="/record"
              className="group flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white font-semibold text-lg hover:opacity-90 transition-all duration-200 cursor-pointer shadow-[0_0_30px_rgba(108,99,255,0.4)]"
            >
              Comenzar ahora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center gap-2 px-8 py-4 rounded-full glass-card text-slate-300 font-medium text-lg hover:text-white hover:border-white/20 transition-all duration-200 cursor-pointer"
            >
              Iniciar sesión
            </Link>
          </div>
          <p className="text-xs text-slate-600 mt-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            Sin registro requerido · Datos anonimizados · Tu privacidad, primero
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Diseñado para tu <span className="gradient-text">bienestar</span>
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            Tres pilares que hacen de MindEcho un espacio seguro para expresarte
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Shield className="w-6 h-6" />,
                title: "100% Anónimo",
                desc: "Sin registro obligatorio. Sin nombre. Sin rastro. Tus datos se anoniminizan antes de cualquier análisis.",
                color: "from-[#6C63FF] to-purple-500",
              },
              {
                icon: <Mic className="w-6 h-6" />,
                title: "Voz a texto con IA",
                desc: "Habla libremente. Whisper AI transcribe tu audio con precisión. No tienes que escribir nada.",
                color: "from-[#FF6B9D] to-rose-500",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Análisis inteligente",
                desc: "Claude AI analiza tu bienestar emocional, detecta patrones y genera insights personalizados.",
                color: "from-emerald-500 to-teal-400",
              },
            ].map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 hover:border-white/20 transition-all duration-300 cursor-default group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Tres pasos, <span className="gradient-text">cinco minutos</span>
          </h2>
          <p className="text-slate-400 text-center mb-12">Así de simple es cuidar tu salud mental</p>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {[
              { step: "01", title: "Exprésate", desc: "Graba tu voz o escribe cómo te sientes. Sin filtros, sin juicios." },
              { step: "02", title: "La IA analiza", desc: "Whisper transcribe tu audio y Claude analiza tu estado emocional al instante." },
              { step: "03", title: "Recibe insights", desc: "Ve tu puntaje de bienestar, temas recurrentes y una reflexión personalizada." },
            ].map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center text-center md:items-start md:text-left">
                <div className="text-5xl font-bold gradient-text mb-3">{s.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                {i < 2 && <ChevronRight className="hidden md:block w-6 h-6 text-slate-700 mt-8 self-end" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Tu privacidad es nuestra prioridad</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xl mx-auto">
              Nunca almacenamos audio de forma permanente. Tus datos son anonimizados antes del análisis. Cumplimos con GDPR y nunca compartimos información personal.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Lock className="w-5 h-5" />, label: "Cifrado SSL", sub: "En tránsito y reposo" },
                { icon: <Eye className="w-5 h-5" />, label: "Sin tracking", sub: "Cero cookies de seguimiento" },
                { icon: <Shield className="w-5 h-5" />, label: "Anonimizado", sub: "Datos sin identificar" },
              ].map((b, i) => (
                <div key={i} className="rounded-2xl bg-white/5 p-4 flex flex-col items-center gap-2">
                  <div className="text-[#6C63FF]">{b.icon}</div>
                  <p className="text-white text-sm font-medium">{b.label}</p>
                  <p className="text-slate-500 text-xs">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Cómo te sientes <span className="gradient-text">hoy?</span>
          </h2>
          <p className="text-slate-400 mb-8">Tarda menos de 5 minutos. Es gratis. Es anónimo.</p>
          <Link
            href="/record"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white font-semibold text-lg hover:opacity-90 transition-opacity cursor-pointer shadow-[0_0_40px_rgba(108,99,255,0.3)]"
          >
            Comenzar ahora <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <p>© 2026 MindEcho · Salud mental para todos</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-slate-400 transition-colors cursor-pointer">Privacidad</Link>
            <Link href="#" className="hover:text-slate-400 transition-colors cursor-pointer">Términos</Link>
            <Link href="#" className="hover:text-slate-400 transition-colors cursor-pointer">Contacto</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
