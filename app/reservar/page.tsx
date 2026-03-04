"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Scissors, Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// --- DATOS FIJOS ---
const SERVICIOS = [
  { id: 1, nombre: "Corte", duracion: "30 min", precio: "$6.000" },
  { id: 2, nombre: "Barba + Perfilado", duracion: "30 min", precio: "$4.000" },
  { id: 3, nombre: "Corte + Barba", duracion: "30 min", precio: "$9.000" },
];

const generarDias = () => {
  const dias = [];
  const hoy = new Date();
  for (let i = 0; i < 14; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    dias.push({
      fechaCompleta: fecha,
      diaSemana: fecha.toLocaleDateString("es-AR", { weekday: "short" }),
      numero: fecha.getDate(),
    });
  }
  return dias;
};

const HORARIOS = ["10:00", "10:30", "11:00", "11:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];

export default function ReservarPage() {
  const router = useRouter();
  
  // Estados de selección
  const [servicioSeleccionado, setServicioSeleccionado] = useState<number | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  
  // Estados para manejar los horarios ocupados
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  // Estados generales de la reserva y el usuario
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState(false);

  const dias = generarDias();

  // 1. Verificar si el usuario inició sesión al cargar la página
  useEffect(() => {
    const chequearSesion = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUsuarioId(session.user.id);
    };
    chequearSesion();
  }, []);

  // 2. Buscar horarios ocupados cada vez que se selecciona un día
  useEffect(() => {
    const obtenerHorariosOcupados = async () => {
      if (diaSeleccionado === null) return;
      
      setCargandoHorarios(true);
      setHoraSeleccionada(null); // Reseteamos la hora si cambia de día

      const fechaBase = dias[diaSeleccionado].fechaCompleta;
      
      // Creamos el rango del día seleccionado (00:00 a 23:59)
      const inicioDia = new Date(fechaBase);
      inicioDia.setHours(0, 0, 0, 0);
      const finDia = new Date(fechaBase);
      finDia.setHours(23, 59, 59, 999);

      // Buscamos turnos en ese día que NO estén cancelados
      const { data, error } = await supabase
        .from('turnos')
        .select('fecha_hora')
        .neq('estado', 'cancelado')
        .gte('fecha_hora', inicioDia.toISOString())
        .lte('fecha_hora', finDia.toISOString());

      if (data && !error) {
        // Extraemos hora y minuto exacto matemáticamente para evitar errores de formato del navegador
        const ocupados = data.map(turno => {
          const date = new Date(turno.fecha_hora);
          const horas = date.getHours().toString().padStart(2, '0');
          const minutos = date.getMinutes().toString().padStart(2, '0');
          return `${horas}:${minutos}`; 
        });
        
        setHorariosOcupados(ocupados);
      }
      
      setCargandoHorarios(false);
    };

    obtenerHorariosOcupados();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaSeleccionado]);

  // 3. Función para guardar la reserva final
  const confirmarReserva = async () => {
    if (!usuarioId) {
      alert("Debes iniciar sesión para reservar un turno.");
      router.push("/login");
      return;
    }

    setCargando(true);

    try {
      const fechaBase = dias[diaSeleccionado!].fechaCompleta;
      const [hora, minuto] = horaSeleccionada!.split(':');
      
      const fechaHoraExacta = new Date(fechaBase);
      fechaHoraExacta.setHours(parseInt(hora), parseInt(minuto), 0, 0);

      const { error } = await supabase
        .from('turnos')
        .insert({
          usuario_id: usuarioId,
          servicio_id: servicioSeleccionado,
          fecha_hora: fechaHoraExacta.toISOString(),
          estado: 'pendiente'
        });

      if (error) throw error;
      
      // Mostramos la pantalla de éxito
      setReservaExitosa(true);

    } catch (error: any) {
      alert("Hubo un error al guardar tu reserva: " + error.message);
    } finally {
      setCargando(false);
    }
  };

  // --- PANTALLA DE ÉXITO ---
  if (reservaExitosa) {
    return (
      <div className="min-h-screen bg-[#121212] text-[#F9F6F0] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-[#C5A059]/20 text-[#C5A059] rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-4">¡Turno Confirmado!</h1>
        <p className="text-zinc-400 mb-8 max-w-sm">
          Tu reserva ha sido guardada con éxito. Te esperamos en la barbería.
        </p>
        <Link href="/" className="w-full max-w-xs py-4 bg-[#C5A059] hover:bg-[#b38e4b] text-[#121212] font-semibold rounded-xl transition-all active:scale-95 block">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  // --- PANTALLA PRINCIPAL DE RESERVAS ---
  return (
    <div className="min-h-screen bg-[#121212] text-[#F9F6F0] pb-24 font-sans">
      <header className="flex items-center p-6 border-b border-zinc-900 sticky top-0 bg-[#121212]/90 backdrop-blur-md z-10">
        <Link href="/" className="p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-[#F9F6F0]" />
        </Link>
        <h1 className="text-xl font-semibold ml-2">Reservar Turno</h1>
      </header>

      <main className="p-6 max-w-md mx-auto space-y-8">
        
        {/* PASO 1: SERVICIOS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="w-5 h-5 text-[#C5A059]" />
            <h2 className="text-lg font-medium">1. Elegí un servicio</h2>
          </div>
          <div className="flex flex-col gap-3">
            {SERVICIOS.map((srv) => (
              <button
                key={srv.id}
                onClick={() => setServicioSeleccionado(srv.id)}
                className={`flex justify-between items-center p-4 rounded-xl border text-left transition-all active:scale-[0.98] ${
                  servicioSeleccionado === srv.id ? "border-[#C5A059] bg-[#C5A059]/10" : "border-zinc-800 bg-transparent hover:border-zinc-700"
                }`}
              >
                <div>
                  <h3 className="font-medium text-[16px]">{srv.nombre}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{srv.duracion}</p>
                </div>
                <span className="font-semibold text-[#C5A059]">{srv.precio}</span>
              </button>
            ))}
          </div>
        </section>

        {/* PASO 2: FECHA Y HORA */}
        {servicioSeleccionado && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-[#C5A059]" />
              <h2 className="text-lg font-medium">2. Elegí fecha y hora</h2>
            </div>
            
            {/* Carrusel de días */}
            <div className="flex gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide snap-x">
              {dias.map((dia, index) => (
                <button
                  key={index}
                  onClick={() => setDiaSeleccionado(index)}
                  className={`flex flex-col items-center justify-center min-w-[70px] h-[80px] rounded-xl border snap-center transition-all ${
                    diaSeleccionado === index ? "border-[#C5A059] bg-[#C5A059] text-[#121212]" : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-xs uppercase font-medium">{dia.diaSemana}</span>
                  <span className="text-2xl font-bold mt-1">{dia.numero}</span>
                </button>
              ))}
            </div>

            {/* Grilla de horarios */}
            {diaSeleccionado !== null && (
              <div className="mt-2 animate-in fade-in duration-300">
                {cargandoHorarios ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {HORARIOS.map((hora) => {
                      const estaOcupado = horariosOcupados.includes(hora);
                      return (
                        <button
                          key={hora}
                          disabled={estaOcupado}
                          onClick={() => setHoraSeleccionada(hora)}
                          className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                            estaOcupado 
                              ? "border-zinc-800/50 bg-zinc-900/30 text-zinc-600 cursor-not-allowed opacity-50" 
                              : horaSeleccionada === hora 
                                ? "border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059] active:scale-95" 
                                : "border-zinc-800 bg-transparent text-zinc-300 hover:border-zinc-600 active:scale-95"
                          }`}
                        >
                          {estaOcupado ? "Reservado" : hora}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {/* BOTÓN FLOTANTE CONFIRMAR */}
      {servicioSeleccionado && diaSeleccionado !== null && horaSeleccionada && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent animate-in slide-in-from-bottom-10 duration-300">
          <div className="max-w-md mx-auto">
            <button 
              onClick={confirmarReserva}
              disabled={cargando}
              className="w-full py-4 bg-[#C5A059] hover:bg-[#b38e4b] text-[#121212] font-semibold rounded-xl shadow-lg shadow-[#C5A059]/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
              {cargando ? "Guardando..." : "Confirmar Reserva"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}