"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Calendar, Clock, User, Scissors, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MisReservasPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [reservas, setReservas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    
    // 1. Obtenemos el usuario actual
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login"); // Si no está logueado, lo pateamos al login
      return;
    }

    setUsuario({
      email: user.email,
      nombre: user.user_metadata?.nombre_completo || "Usuario",
      telefono: user.user_metadata?.telefono || "Sin teléfono",
    });

    // 2. Buscamos SUS reservas en Supabase uniendo la tabla servicios
    const { data: turnos } = await supabase
      .from('turnos')
      .select(`
        id,
        fecha_hora,
        estado,
        servicios ( nombre, precio )
      `)
      .eq('usuario_id', user.id)
      .order('fecha_hora', { ascending: false }); // Las más recientes arriba

    if (turnos) {
      setReservas(turnos);
    }
    setCargando(false);
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const formatearFecha = (isoString: string) => {
    const fecha = new Date(isoString);
    return fecha.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }).replace(',', '');
  };

  const formatearHora = (isoString: string) => {
    const fecha = new Date(isoString);
    return fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-[#C5A059]">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-[#F9F6F0] font-sans pb-12">
      <header className="flex items-center justify-between p-6 border-b border-zinc-900 sticky top-0 bg-[#121212]/90 backdrop-blur-md z-10">
        <div className="flex items-center">
          <Link href="/" className="p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-[#F9F6F0]" />
          </Link>
          <h1 className="text-xl font-semibold ml-2">Mi Cuenta</h1>
        </div>
        <button onClick={cerrarSesion} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-8">
        {/* --- TARJETA DE PERFIL --- */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-[#C5A059]/10 rounded-full flex items-center justify-center text-[#C5A059]">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold capitalize">{usuario?.nombre}</h2>
            <p className="text-sm text-zinc-400">{usuario?.email}</p>
            <p className="text-sm text-zinc-500 mt-1">{usuario?.telefono}</p>
          </div>
        </section>

        {/* --- HISTORIAL DE RESERVAS --- */}
        <section>
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#C5A059]" />
            Mis Reservas
          </h3>

          <div className="space-y-4">
            {reservas.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 border border-zinc-800 border-dashed rounded-2xl">
                <p>Todavía no tenés reservas.</p>
                <Link href="/reservar" className="text-[#C5A059] hover:underline mt-2 inline-block">¡Reserva tu primer turno!</Link>
              </div>
            ) : (
              reservas.map((turno) => (
                <div key={turno.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-[15px] flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-[#C5A059]" />
                      {/* En Supabase la info unida llega como objeto */}
                      {turno.servicios?.nombre || "Servicio"} 
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-md font-medium capitalize ${
                      turno.estado === 'completado' ? 'bg-green-500/10 text-green-400' : 
                      turno.estado === 'cancelado' ? 'bg-red-500/10 text-red-400' : 
                      'bg-[#C5A059]/10 text-[#C5A059]'
                    }`}>
                      {turno.estado}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-1.5 capitalize">
                      <Calendar className="w-4 h-4" />
                      {formatearFecha(turno.fecha_hora)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {formatearHora(turno.fecha_hora)}
                    </div>
                    <div className="font-medium text-zinc-300 ml-auto">
                      {turno.servicios?.precio}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}