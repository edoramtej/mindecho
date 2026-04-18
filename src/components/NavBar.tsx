"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const isAdmin = (user?.publicMetadata as { role?: string })?.role === "admin";

  const navLinks = isSignedIn
    ? [
        { href: "/record", label: "Nuevo registro" },
        { href: "/dashboard", label: "Mi evolución" },
        { href: "/profile", label: "Mi perfil" },
        ...(isAdmin ? [{ href: "/admin", label: "Administración" }] : []),
      ]
    : [
        { href: "/record", label: "Comenzar" },
      ];

  return (
    <nav className="fixed top-4 left-4 right-4 z-50">
      <div className="max-w-6xl mx-auto glass-card rounded-2xl px-5 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#FF6B9D] flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">MindEcho</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                pathname === link.href
                  ? "bg-[#6C63FF]/20 text-[#6C63FF]"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isSignedIn ? (
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="ml-2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link href="/sign-in" className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer">
                Iniciar sesión
              </Link>
              <Link href="/sign-up" className="px-5 py-2 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#FF6B9D] text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer">
                Registrarse
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden text-slate-400 hover:text-white cursor-pointer"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden mt-2 glass-card rounded-2xl p-4 flex flex-col gap-1 max-w-6xl mx-auto">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer">
              {link.label}
            </Link>
          ))}
          {isSignedIn ? (
            <button onClick={() => signOut({ redirectUrl: "/" })}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer text-left">
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          ) : (
            <>
              <Link href="/sign-in" onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer">Iniciar sesión</Link>
              <Link href="/sign-up" onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer">Registrarse</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
