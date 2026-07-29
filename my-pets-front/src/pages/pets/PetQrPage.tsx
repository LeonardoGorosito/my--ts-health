import QRCode from 'react-qr-code';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/axios';
import { Loader } from '../../components/Loader';

type Pet = {
  id: string;
  name: string;
};

export function PetQrPage() {
//  const { user } = useAuth();
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12 px-4 flex flex-col items-center justify-center">
        <Loader text="Cargando tus mascotas..." />
      </div>
    );
  }

  const publicUrl = selectedPet 
    ? `${window.location.origin}/public/pet/${selectedPet.id}` 
    : '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12 px-4 flex flex-col items-center transition-colors">
      {pets.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium text-lg">
            No tenés mascotas registradas.
          </p>
        </div>
      ) : (
        <div className="max-w-4xl w-full flex flex-col items-center gap-8">
          
          <div className="w-full">
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
            <div className="max-w-md w-full bg-white dark:bg-[#1c1c1c] rounded-3xl shadow-xl dark:shadow-none p-8 border border-gray-200 dark:border-neutral-800 flex flex-col items-center text-center transition-colors">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2 transition-colors">
                Código QR de <span className="text-emerald-600 dark:text-emerald-500">{selectedPet.name}</span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 transition-colors">
                Escaneá este código para ver el perfil público de tu mascota.
              </p>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <QRCode 
                  value={publicUrl}
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>

              <div className="w-full bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-zinc-800 rounded-xl p-2.5 flex items-center gap-2 mb-6">
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

              <div className="mt-2 flex gap-4 w-full">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Imprimir
                </button>
              </div>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}
