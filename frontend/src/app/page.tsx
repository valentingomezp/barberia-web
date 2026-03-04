import Link from 'next/link';
import { Scissors } from 'lucide-react';

export default function Home() {
  return (
    // Contenedor principal: Ocupa toda la pantalla, fondo negro mate, centrado
    <div className="min-h-screen bg-[#121212] text-[#F9F6F0] flex flex-col items-center justify-center px-6">
      
      {/* Caja central: max-w-md asegura que se vea como una app móvil incluso en PC */}
      <main className="flex flex-col items-center text-center w-full max-w-md">
        
        {/* Ícono / Logo minimalista */}
        <div className="mb-6 p-4 bg-[#C5A059]/10 rounded-full">
          <Scissors className="w-12 h-12 text-[#C5A059]" strokeWidth={1.5} />
        </div>

        {/* Título de la barbería */}
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Barbería Valentin
        </h1>
        <p className="text-zinc-400 mb-12 text-lg font-light">
          Estilo clásico, precisión moderna.
        </p>

        {/* Contenedor de Botones */}
        <div className="flex flex-col w-full gap-4">
          
          {/* Botón Principal: Reservar (Destacado en Dorado) */}
          <Link 
            href="/reservar" 
            className="w-full py-4 bg-[#C5A059] hover:bg-[#b38e4b] text-[#121212] font-semibold rounded-xl transition-all active:scale-95 text-lg"
          >
            Reservar Turno
          </Link>
          
          {/* Botón Secundario: Iniciar Sesión (Borde minimalista) */}
          <Link 
            href="/login" 
            className="w-full py-4 bg-transparent border border-zinc-800 hover:border-[#C5A059] text-[#F9F6F0] font-medium rounded-xl transition-all active:scale-95 text-lg"
          >
            Iniciar Sesión
          </Link>
          
        </div>
      </main>

    </div>
  );
}