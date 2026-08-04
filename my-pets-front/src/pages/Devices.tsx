import React from 'react';
import { MonitorSmartphone } from 'lucide-react';

export const Devices: React.FC = () => {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
      <MonitorSmartphone className="w-24 h-24 text-gray-400 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Dispositivos</h1>
      <span className="bg-indigo-100 text-indigo-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded dark:bg-indigo-900 dark:text-indigo-300">
        (Próximamente)
      </span>
    </div>
  );
};
