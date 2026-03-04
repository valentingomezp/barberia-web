"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Scissors, LogOut, CalendarDays } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const EMAIL_ADMIN = "valentingomezpucheta@gmail.com"; // <-- Poné tu correo acá también

export default function Home() {
  const [sesionIniciada, setSesionIniciada] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const chequearSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSesionIniciada(true);
        setEsAdmin(session.user.email === EMAIL_ADMIN);
      } else {
        setSesionIniciada(false);
        setEsAdmin(false);
      }
      setCargando(false);
    };
    
    chequearSesion();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setSesionIniciada(true);
        setEsAdmin(session.user.email === EMAIL_ADMIN);
      } else {
        setSesionIniciada(false);
        setEsAdmin(false);
      }
    });

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  // Mientras verifica quién es, mostramos un fondo oscuro para que no haya parpadeos raros
  if (cargando) return <div className="min-h-screen bg-[#121212]"></div>;

  return (
    <div className="min-h-screen bg-[#121212] text-[#F9F6F0] flex flex-col items-center justify-center px-6 transition-all duration-500">
      <main className="flex flex-col items-center text-center w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        
        <div className="mb-6 p-4 bg-[#C5A059]/10 rounded-full">
          <Scissors className="w-12 h-12 text-[#C5A059]" strokeWidth={1.5} />
        </div>

        {esAdmin ? (
          /* --- VISTA EXCLUSIVA DEL PELUQUERO --- */
          <>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              ¡Hola, Valentín!
            </h1>
            <p className="text-zinc-400 mb-12 text-lg font-light">
              Listo para una nueva jornada de cortes.
            </p>

            <div className="flex flex-col w-full gap-4">
              <Link 
                href="/admin" 
                className="w-full py-4 bg-[#C5A059] hover:bg-[#b38e4b] text-[#121212] font-semibold rounded-xl transition-all active:scale-95 text-lg flex items-center justify-center gap-2 shadow-lg shadow-[#C5A059]/10"
              >
                <CalendarDays className="w-6 h-6" />
                Ir al Panel de Turnos
              </Link>
            </div>
          </>
        ) : (
          /* --- VISTA PARA LOS CLIENTES --- */
          <>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              Barbería Valentin
            </h1>
            <p className="text-zinc-400 mb-12 text-lg font-light">
              Estilo clásico, precisión moderna.
            </p>

            <div className="flex flex-col w-full gap-4">
              <Link 
                href="/reservar" 
                className="w-full py-4 bg-[#C5A059] hover:bg-[#b38e4b] text-[#121212] font-semibold rounded-xl transition-all active:scale-95 text-lg"
              >
                Reservar Turno
              </Link>
              
              <Link 
                href={sesionIniciada ? "/mis-reservas" : "/login"} 
                className="w-full py-4 bg-transparent border border-zinc-800 hover:border-[#C5A059] text-[#F9F6F0] font-medium rounded-xl transition-all active:scale-95 text-lg"
              >
                {sesionIniciada ? "Mis Reservas" : "Iniciar Sesión"}
              </Link>
            </div>
          </>
        )}

        {/* --- BOTÓN DE CERRAR SESIÓN (Para todos los logueados) --- */}
        {sesionIniciada && (
          <button 
            onClick={handleCerrarSesion}
            className="mt-10 flex items-center gap-2 text-zinc-500 hover:text-red-400 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        )}

      </main>
    </div>
  );
}