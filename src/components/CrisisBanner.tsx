"use client";
import { useState } from "react";
import { AlertTriangle, X, Phone } from "lucide-react";

interface CrisisResource {
  name: string;
  contact: string;
  channel: string;
}

interface CrisisBannerProps {
  resources?: CrisisResource[];
}

const defaultResources: CrisisResource[] = [
  { name: "Línea de la Vida", contact: "800 911 2000", channel: "Teléfono" },
  { name: "Chat de Crisis", contact: "crisischat.org", channel: "Chat" },
];

export default function CrisisBanner({ resources = defaultResources }: CrisisBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 animate-fade-in">
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-md p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-300 mb-1">
                Notamos que estás pasando por un momento muy difícil
              </p>
              <p className="text-xs text-red-400/80 mb-3">
                Si sientes que necesitas apoyo inmediato, hay personas disponibles para ayudarte ahora mismo.
              </p>
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
