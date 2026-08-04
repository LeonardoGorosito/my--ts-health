import { ExternalLink, Palette, Ruler, Settings, Printer } from 'lucide-react';
import { api } from '../../lib/axios';
import { Loader } from '../../components/Loader';
import { useEffect, useState } from 'react';
import { PetTag } from '../../components/PetTag';

type Pet = {
  id: string;
  name: string;
};

export function PetQrPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Estados para personalizar la chapita
  const [tagColor, setTagColor] = useState('#10b981'); 
  const [tagBg, setTagBg] = useState('#ffffff');       
  const [textColor, setTextColor] = useState('#1f2937'); 
  const [tagSize, setTagSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [showSettings, setShowSettings] = useState(false);
  
  // Determina si imprimimos una sola o la grilla completa
  const [printMode, setPrintMode] = useState<'single' | 'all'>('single');

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await api.get('/pets');
        setPets(response.data);
        if (response.data.length > 0) {
          setSelectedPet(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching pets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPets();
  }, []);

  if (isLoading) {
    return (
      // CORRECCIÓN: Fondo transparente y menor padding top (pt-8)
      <div className="min-h-screen bg-transparent pt-8 pb-12 px-4 flex flex-col items-center justify-center">
        <Loader text="Cargando tus mascotas..." />
      </div>
    );
  }

  const publicUrl = selectedPet 
    ? `${window.location.origin}/public/pet/${selectedPet.id}` 
    : '';

  // Función para determinar cuántas columnas entran según el tamaño de la chapa
  const getGridCols = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm': return 'print:grid-cols-5 print:gap-4';
      case 'md': return 'print:grid-cols-4 print:gap-6';
      case 'lg': return 'print:grid-cols-3 print:gap-8';
      default: return 'print:grid-cols-4 print:gap-6';
    }
  };

  return (
    // CORRECCIÓN: Fondo transparente y menor padding top (pt-8)
    <div className="min-h-screen bg-transparent pt-8 pb-12 px-4 flex flex-col items-center transition-colors">
      {pets.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium text-lg">
            No tenés mascotas registradas.
          </p>
        </div>
      ) : (
        <div className="max-w-4xl w-full flex flex-col items-center gap-8">
          
          <div className="w-full print:hidden">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center transition-colors">Selecciona una mascota</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {pets.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPet(pet)}
                  className={`px-6 py-3 rounded-xl font-bold transition-all ${
                    selectedPet?.id === pet.id 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {pet.name}
                </button>
              ))}
            </div>
          </div>

          {selectedPet && (
            <div className="max-w-md w-full bg-white dark:bg-[#1c1c1c] rounded-3xl shadow-xl dark:shadow-none p-8 border border-gray-200 dark:border-neutral-800 flex flex-col items-center text-center transition-colors print:shadow-none print:border-none print:p-0 print:bg-transparent">
              
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2 transition-colors print:hidden">
                Código QR de <span className="text-emerald-600 dark:text-emerald-500">{selectedPet.name}</span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 transition-colors print:hidden">
                Escaneá este código para ver el perfil público de tu mascota.
              </p>

              {/* VISTA EN PANTALLA */}
              <div className="print:hidden">
                <PetTag 
                  petName={selectedPet.name} 
                  publicUrl={publicUrl} 
                  color={tagColor}
                  bgColor={tagBg}
                  textColor={textColor}
                  size={tagSize}
                />
              </div>

              {/* VISTA DE IMPRESIÓN */}
              <div className="hidden print:flex print:fixed print:inset-0 print:bg-white print:z-[9999] print:items-start print:justify-start print:p-8 print:overflow-visible">
                
                {printMode === 'single' ? (
                  <PetTag 
                    petName={selectedPet.name} 
                    publicUrl={publicUrl} 
                    color={tagColor}
                    bgColor={tagBg}
                    textColor={textColor}
                    size={tagSize}
                    showCutLines={true}
                  />
                ) : (
                  <div className={`w-full print:grid ${getGridCols(tagSize)} print:items-start print:justify-items-center`}>
                    {pets.map((pet) => (
                      <PetTag 
                        key={pet.id}
                        petName={pet.name} 
                        publicUrl={`${window.location.origin}/public/pet/${pet.id}`} 
                        color={tagColor}
                        bgColor={tagBg}
                        textColor={textColor}
                        size={tagSize}
                        showCutLines={true}
                      />
                    ))}
                  </div>
                )}

              </div>

              <div className="w-full bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-zinc-800 rounded-xl p-2.5 flex items-center gap-2 mb-6 mt-6 print:hidden">
                <div className="flex-1 truncate text-xs text-gray-500 dark:text-gray-400 font-mono px-2 text-left">
                  {publicUrl}
                </div>
                <a 
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                >
                  Abrir <ExternalLink size={12} />
                </a>
              </div>

              {/* PANEL DE CONFIGURACIÓN DESPLEGABLE */}
              {showSettings && (
                <div className="w-full mb-6 p-4 bg-gray-50 dark:bg-black/30 rounded-2xl border border-gray-100 dark:border-zinc-800 text-left animate-in slide-in-from-top-2 print:hidden">
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
              )}

              {/* BOTONES DE ACCIÓN */}
              <div className="mt-2 flex flex-col gap-3 w-full print:hidden">
                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex-1 flex justify-center items-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-white font-bold py-3 px-4 rounded-xl transition-colors"
                  >
                    <Settings size={18} />
                    {showSettings ? 'Ocultar' : 'Configurar'}
                  </button>
                  <button 
                    onClick={() => {
                      setPrintMode('single');
                      setTimeout(() => window.print(), 100);
                    }}
                    className="flex-[2] flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    <Printer size={18} />
                    Imprimir Actual
                  </button>
                </div>

                <button 
                  onClick={() => {
                    setPrintMode('all');
                    setTimeout(() => window.print(), 100);
                  }}
                  className="w-full flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
                >
                  <Printer size={18} />
                  Imprimir Plancha (Todas mis mascotas)
                </button>
              </div>

            </div>
          )}
          
        </div>
      )}
    </div>
  );
}