"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Mail, Lock, LogIn, User, Phone, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Importamos la conexión que acabamos de crear

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  
  // Estados de los inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: "", texto: "" });

    try {
      if (isLogin) {
        // --- INICIAR SESIÓN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        setMensaje({ tipo: "exito", texto: "¡Sesión iniciada correctamente! Redirigiendo..." });
        setTimeout(() => router.push("/"), 1500); // Lo mandamos al inicio

      } else {
        // --- REGISTRARSE ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre_completo: `${nombre} ${apellido}`,
              telefono: telefono,
            }
          }
        });

        if (error) throw error;

        setMensaje({ tipo: "exito", texto: "¡Cuenta creada! Revisa tu email para confirmarla (si está activado en Supabase) o inicia sesión." });
        setTimeout(() => setIsLogin(true), 2000); // Lo pasamos a la pestaña de login
      }
    } catch (error: any) {
      // Si algo falla, mostramos el error
      setMensaje({ tipo: "error", texto: error.message || "Ocurrió un error inesperado." });
    } finally {
      setCargando(false);
    }
  };

  const loginConGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) setMensaje({ tipo: "error", texto: error.message });
  };

  return (
    <div className="min-h-screen bg-[#121212] text-[#F9F6F0] font-sans flex flex-col">
      <header className="flex items-center p-6 border-b border-zinc-900">
        <Link href="/" className="p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-[#F9F6F0]" />
        </Link>
      </header>

      <main className="flex-1 flex flex-col justify-center p-6 max-w-md mx-auto w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? "Bienvenido de nuevo" : "Crear una cuenta"}
          </h1>
          <p className="text-zinc-400">
            {isLogin 
              ? "Ingresá tus datos para gestionar tus turnos." 
              : "Registrate para reservar tu próximo corte."}
          </p>
        </div>

        {/* Mensaje de Error o Éxito */}
        {mensaje.texto && (
          <div className={`p-4 rounded-xl mb-6 text-sm ${mensaje.tipo === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6 animate-in fade-in duration-300">
          {!isLogin && (
            <>
              <div className="flex gap-4">
                <div className="relative w-full">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required={!isLogin} className="w-full bg-transparent border border-zinc-800 focus:border-[#C5A059] rounded-xl py-4 pl-12 pr-4 outline-none transition-colors" />
                </div>
                <div className="relative w-full">
                  <input type="text" placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required={!isLogin} className="w-full bg-transparent border border-zinc-800 focus:border-[#C5A059] rounded-xl py-4 px-4 outline-none transition-colors" />
                </div>
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type="tel" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required={!isLogin} className="w-full bg-transparent border border-zinc-800 focus:border-[#C5A059] rounded-xl py-4 pl-12 pr-4 outline-none transition-colors" />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-transparent border border-zinc-800 focus:border-[#C5A059] rounded-xl py-4 pl-12 pr-4 outline-none transition-colors" />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-transparent border border-zinc-800 focus:border-[#C5A059] rounded-xl py-4 pl-12 pr-4 outline-none transition-colors" />
          </div>

          <button type="submit" disabled={cargando} className="w-full py-4 bg-[#C5A059] hover:bg-[#b38e4b] text-[#121212] font-semibold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            {cargando ? "Procesando..." : (isLogin ? "Iniciar Sesión" : "Registrarse")}
          </button>
        </form>

        <div className="relative flex items-center py-4 mb-4">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink-0 mx-4 text-zinc-500 text-sm">o</span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        <button onClick={loginConGoogle} type="button" className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[#F9F6F0] font-medium rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3 mb-8">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          Continuar con Google
        </button>

        <p className="text-center text-zinc-400">
          {isLogin ? "¿No tenés una cuenta? " : "¿Ya tenés una cuenta? "}
          <button onClick={() => { setIsLogin(!isLogin); setMensaje({ tipo: "", texto: "" }); }} className="text-[#C5A059] hover:underline font-medium">
            {isLogin ? "Registrate acá" : "Iniciá sesión"}
          </button>
        </p>
      </main>
    </div>
  );
}