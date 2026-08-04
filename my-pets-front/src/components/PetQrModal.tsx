import { useState } from 'react';
import { X, Printer, Palette, Ruler, Settings, ChevronLeft } from 'lucide-react';
import { PetTag } from './PetTag';

interface PetQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
}

export function PetQrModal({ isOpen, onClose, petId, petName }: PetQrModalProps) {
  // Estados para personalizar la chapita
  const [tagColor, setTagColor] = useState('#10b981'); 
  const [tagBg, setTagBg] = useState('#ffffff');       
  const [textColor, setTextColor] = useState('#1f2937'); 
  const [tagSize, setTagSize] = useState<'sm' | 'md' | 'lg'>('md');
  
  // Estado para alternar entre la vista limpia y la vista de configuración
  const [showSettings, setShowSettings] = useState(false);

  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/public/pet/${petId}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in print:bg-white print:p-0">
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 relative print:shadow-none print:border-none print:p-0 print:dark:bg-white print:max-w-none">
        
        {/* BOTONES SUPERIORES (Cerrar y Configuración) */}
        <div className="absolute top-4 right-4 flex items-center gap-3 print:hidden">
          {!showSettings && (
            <button 
              onClick={() => setShowSettings(true)} 
              className="text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title="Configurar diseño"
            >
              <Settings size={22} />
            </button>
          )}
          <button 
            onClick={() => {
              setShowSettings(false); // Reiniciamos la vista al cerrar
              onClose();
            }} 
            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* TÍTULO DEL MODAL (Dinámico) */}
        <div className="w-full flex items-center justify-center mb-6 print:hidden">
          {showSettings && (
            <button 
              onClick={() => setShowSettings(false)} 
              className="absolute left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <h2 className="text-xl font-black text-gray-900 dark:text-white text-center">
            {showSettings ? 'Configurar Placa' : 'Placa QR'}
          </h2>
        </div>

{/* Contenedor que centra la chapita SOLO al imprimir */}
<div className="print:fixed print:inset-0 print:flex print:items-center print:justify-center print:bg-white print:z-[9999]">
  <PetTag 
    petName={petName} 
    publicUrl={publicUrl} 
    color={tagColor}
    bgColor={tagBg}
    textColor={textColor}
    size={tagSize}
    showCutLines={true} // Ahora saldrá con una cajita punteada para recortar fácil
  />
</div>
        {/* CONTENIDO CONDICIONAL: CONFIGURACIÓN O BOTÓN IMPRIMIR */}
        {showSettings ? (
          // --- VISTA DE CONFIGURACIÓN ---
          <div className="w-full mt-6 animate-in slide-in-from-bottom-2 print:hidden">
            <div className="p-4 bg-gray-50 dark:bg-black/30 rounded-2xl border border-gray-100 dark:border-zinc-800">
              {/* TAMAÑOS */}
              <div className="mb-5">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                  <Ruler size={16} /> Tamaño
                </h3>
                <div className="flex gap-2">
                  {(['sm', 'md', 'lg'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setTagSize(s)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                        tagSize === s 
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-400'
                      }`}
                    >
                      {s === 'sm' ? 'Chico' : s === 'md' ? 'Medio' : 'Grande'}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-gray-200 dark:border-zinc-800 mb-4" />

              {/* COLORES */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                  <Palette size={16} /> Colores
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Borde</label>
                    <input type="color" value={tagColor} onChange={(e) => setTagColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Fondo</label>
                    <input type="color" value={tagBg} onChange={(e) => setTagBg(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Texto/QR</label>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent" />
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSettings(false)}
              className="mt-4 w-full flex justify-center items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold transition-colors"
            >
              Listo
            </button>
          </div>
        ) : (
          // --- VISTA PRINCIPAL (LIMPIA) ---
          <div className="w-full mt-8 animate-in zoom-in-95 print:hidden">
            <button 
              onClick={handlePrint}
              className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-600/20"
            >
              <Printer size={18} />
              Imprimir QR
            </button>
          </div>
        )}

      </div>
    </div>
  );
}