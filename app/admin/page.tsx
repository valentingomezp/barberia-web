"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Calendar, Clock, User, Phone, CheckCircle, XCircle, Scissors, AlertTriangle, Loader2, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

// --- CONFIGURACIÓN DEL ADMINISTRADOR ---
// Reemplazá esto por tu correo real de administrador
const EMAIL_ADMIN = "valentingomezpucheta@gmail.com"; 

export default function AdminPage() {
  const router = useRouter();
  
  // Estados de validación y carga
  const [autorizado, setAutorizado] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [cargando, setCargando] = useState(true);

  // Estados de los datos
  const [turnos, setTurnos] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("pendiente");

  // Estados para el Modal de Confirmación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<string | null>(null);
  const [accionPendiente, setAccionPendiente] = useState<'completado' | 'cancelado' | null>(null);

  // Verificamos quién es el usuario al entrar a la página
  useEffect(() => {
    verificarAcceso();
  }, []);

  const verificarAcceso = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Si no hay usuario logueado, lo mandamos al login
    if (!user) {
      router.push("/login");
      return;
    }

    // 2. Si el usuario está logueado pero NO es el admin, lo mandamos al inicio
    if (user.email !== EMAIL_ADMIN) {
      router.push("/");
      return;
    }

    // 3. Si es el admin, le damos acceso y buscamos los turnos
    setAutorizado(true);
    setVerificando(false);
    fetchTurnos();
  };

  const fetchTurnos = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('vista_turnos')
      .select('*')
      .order('fecha_hora', { ascending: true });

    if (!error && data) {
      setTurnos(data);
    }
    setCargando(false);
  };

  const solicitarConfirmacion = (id: string, accion: 'completado' | 'cancelado') => {
    setTurnoSeleccionado(id);
    setAccionPendiente(accion);
    setModalAbierto(true);
  };

  const confirmarAccion = async () => {
    if (turnoSeleccionado && accionPendiente) {
      const { error } = await supabase
        .from('turnos')
        .update({ estado: accionPendiente })
        .eq('id', turnoSeleccionado);

      if (!error) {
        setTurnos(turnos.map(turno => 
          turno.id === turnoSeleccionado ? { ...turno, estado: accionPendiente } : turno
        ));
      } else {
        alert("Hubo un error al actualizar el turno: " + error.message);
      }
    }
    cerrarModal();
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setTurnoSeleccionado(null);
    setAccionPendiente(null);
  };

  const formatearFecha = (isoString: string) => {
    const fecha = new Date(isoString);
    return fecha.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }).replace(',', '');
  };

  const formatearHora = (isoString: string) => {
    const fecha = new Date(isoString);
    return fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  const turnosFiltrados = turnos.filter(turno => turno.estado === filtro);

  // --- PANTALLA DE BLOQUEO MIENTRAS VERIFICA ---
  if (verificando) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-[#C5A059]">
        <Lock className="w-8 h-8 mb-4 opacity-50 animate-pulse" />
        <p className="text-zinc-400 font-medium">Verificando credenciales...</p>
      </div>
    );
  }

  // Si no está autorizado (aunque Next.js ya lo esté redirigiendo) devolvemos null por seguridad
  if (!autorizado) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-[#F9F6F0] font-sans relative">
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#C5A059]">Panel de Valentín</h1>
              <p className="text-sm text-zinc-400">Gestión de turnos</p>
            </div>
          </div>
          <div className="bg-[#C5A059]/10 p-3 rounded-full">
            <Calendar className="w-6 h-6 text-[#C5A059]" />
          </div>
        </div>

        <div className="flex max-w-3xl mx-auto px-6 gap-6 text-sm font-medium border-t border-zinc-800 mt-2 overflow-x-auto scrollbar-hide">
          {['pendiente', 'completado', 'cancelado'].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`py-4 capitalize transition-all relative whitespace-nowrap ${
                filtro === f ? "text-[#C5A059]" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f}s
              {filtro === f && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C5A059] rounded-t-full"></span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-4">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#C5A059]">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-zinc-400">Cargando turnos...</p>
          </div>
        ) : turnosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Scissors className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No hay turnos en esta categoría.</p>
          </div>
        ) : (
          turnosFiltrados.map((turno) => (
            <div key={turno.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 capitalize">
                    <User className="w-5 h-5 text-zinc-400" />
                    {turno.cliente_nombre || "Cliente Sin Nombre"}
                  </h3>
                  {turno.cliente_telefono && (
                    <a href={`https://wa.me/549${turno.cliente_telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-sm text-[#C5A059] hover:underline flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4" />
                      {turno.cliente_telefono}
                    </a>
                  )}
                </div>
                <span className="font-semibold text-zinc-300">{turno.servicio_precio}</span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-zinc-400 mb-6 bg-[#121212] p-3 rounded-xl border border-zinc-800/50">
                <div className="flex items-center gap-2 capitalize">
                  <Calendar className="w-4 h-4 text-[#C5A059]" />
                  {formatearFecha(turno.fecha_hora)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C5A059]" />
                  {formatearHora(turno.fecha_hora)}
                </div>
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-[#C5A059]" />
                  {turno.servicio_nombre}
                </div>
              </div>

              {turno.estado === 'pendiente' && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => solicitarConfirmacion(turno.id, 'cancelado')}
                    className="flex-1 py-3 border border-red-900/50 text-red-400 bg-red-950/20 hover:bg-red-900/40 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Cancelar
                  </button>
                  <button 
                    onClick={() => solicitarConfirmacion(turno.id, 'completado')}
                    className="flex-1 py-3 bg-[#C5A059] hover:bg-[#b38e4b] text-[#121212] rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Completar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </main>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className={`p-3 rounded-full mb-4 ${accionPendiente === 'cancelado' ? 'bg-red-500/10 text-red-500' : 'bg-[#C5A059]/10 text-[#C5A059]'}`}>
                {accionPendiente === 'cancelado' ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
              </div>
              <h2 className="text-xl font-bold mb-2">¿Estás seguro?</h2>
              <p className="text-zinc-400 text-sm">
                Estás a punto de marcar este turno como <strong className={accionPendiente === 'cancelado' ? 'text-red-400' : 'text-[#C5A059]'}>{accionPendiente}</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={cerrarModal} className="flex-1 py-3 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl font-medium transition-colors">Volver</button>
              <button onClick={confirmarAccion} className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${accionPendiente === 'cancelado' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-[#C5A059] hover:bg-[#b38e4b] text-[#121212]'}`}>Sí, confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}