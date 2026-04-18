"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, X, Phone, MessageCircle, Copy, Check } from "lucide-react";

interface CrisisResource {
  name: string;
  contact: string;
  channel: string;
}

interface PersonalContact {
  name: string;
  phone: string;
  pref: "CALL" | "WHATSAPP";
}

interface CrisisBannerProps {
  resources?: CrisisResource[];
  personalContact?: PersonalContact | null;
}

const defaultResources: CrisisResource[] = [
  { name: "Línea de la Vida", contact: "800 911 2000", channel: "Teléfono" },
  { name: "Chat de Crisis", contact: "crisischat.org", channel: "Chat" },
];

function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-().+]/g, "");
}

function formatPhoneDisplay(phone: string): string {
  return phone.trim();
}

export default function CrisisBanner({ resources = defaultResources, personalContact }: CrisisBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsMobile(
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      window.matchMedia("(pointer: coarse)").matches
    );
  }, []);

  if (dismissed) return null;

  const handleCopy = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silent fail
    }
  };

  const renderPersonalCTAs = (contact: PersonalContact) => {
    const raw = cleanPhone(contact.phone);
    const callHref = `tel:${contact.phone.trim()}`;
    const waHref = `https://wa.me/${raw}`;
    const isPrefCall = contact.pref === "CALL";

    const callBtn = isMobile ? (
      <a key="call" href={callHref}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
          isPrefCall
            ? "bg-red-500 text-white hover:bg-red-400"
            : "border border-red-500/40 text-red-300 hover:bg-red-500/20"
        }`}>
        <Phone className="w-4 h-4" />
        Llamar a {contact.name}
      </a>
    ) : (
      <button key="call"
        onClick={() => handleCopy(formatPhoneDisplay(contact.phone))}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
          isPrefCall
            ? "bg-red-500/20 border border-red-500/60 text-red-200 hover:bg-red-500/30"
            : "border border-red-500/20 text-red-400 hover:bg-red-500/10"
        }`}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "¡Copiado!" : `Copiar: ${formatPhoneDisplay(contact.phone)}`}
      </button>
    );

    const waBtn = (
      <a key="wa" href={waHref} target="_blank" rel="noopener noreferrer"
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
          !isPrefCall
            ? "bg-green-600 text-white hover:bg-green-500"
            : "border border-green-500/40 text-green-300 hover:bg-green-500/20"
        }`}>
        <MessageCircle className="w-4 h-4" />
        WhatsApp{!isMobile ? " Web" : ""} a {contact.name}
      </a>
    );

    return isPrefCall ? [callBtn, waBtn] : [waBtn, callBtn];
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 animate-fade-in">
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-md p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-300 mb-1">
                Notamos que estás pasando por un momento muy difícil
              </p>
              <p className="text-xs text-red-400/80 mb-3">
                Si sientes que necesitas apoyo inmediato, hay personas disponibles para ayudarte ahora mismo.
              </p>

              {personalContact && (
                <div className="mb-4">
                  <p className="text-xs text-red-300/70 mb-2 uppercase tracking-wide font-medium">Tu contacto de confianza</p>
                  <div className="flex flex-wrap gap-2">
                    {renderPersonalCTAs(personalContact)}
                  </div>
                  {!isMobile && personalContact.pref === "CALL" && (
                    <p className="text-xs text-red-400/60 mt-1.5">
                      Desde computador, copia el número y llama desde tu teléfono.
                    </p>
                  )}
                </div>
              )}

              <div>
                {personalContact && (
                  <p className="text-xs text-red-300/60 mb-2 uppercase tracking-wide font-medium">Líneas de ayuda</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {resources.map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-red-500/20 rounded-full px-3 py-1">
                      <Phone className="w-3 h-3 text-red-400" />
                      <span className="text-xs text-red-300 font-medium">{r.name}: <strong>{r.contact}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-red-400 hover:text-red-200 cursor-pointer flex-shrink-0 transition-colors duration-200"
            aria-label="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
