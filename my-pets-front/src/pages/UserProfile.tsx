import React, { useState } from 'react';
import { Camera, HeartPulse, Shield, Save } from 'lucide-react';

const UserProfile = () => {
  // Estado para la información personal
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });

  // Estado para los contactos de emergencia
  const [emergencyContacts, setEmergencyContacts] = useState({
    vetName: '',
    vetPhone: '',
    emergencyPhone: ''
  });

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };

  const handleEmergencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmergencyContacts({ ...emergencyContacts, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    console.log('Guardando datos...', { personalInfo, emergencyContacts });
    // Aquí luego conectaremos con tu backend/base de datos
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gestiona tu información personal y contactos de emergencia.
        </p>
      </div>

      {/* Sección 1: Información Personal */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Información Personal</h2>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar (Foto de perfil) */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl font-bold">
                {personalInfo.firstName ? personalInfo.firstName[0].toUpperCase() : 'U'}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors shadow-sm">
                <Camera size={16} />
              </button>
            </div>
          </div>

          {/* Formulario Personal */}
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input
                type="text"
                name="firstName"
                value={personalInfo.firstName}
                onChange={handlePersonalInfoChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
              <input
                type="text"
                name="lastName"
                value={personalInfo.lastName}
                onChange={handlePersonalInfoChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Tu apellido"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={personalInfo.phone}
                onChange={handlePersonalInfoChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Ej. +54 11 1234-5678"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sección 2: Contactos de Emergencia */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-2 mb-2">
          <HeartPulse className="text-rose-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Contactos de Emergencia</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Información rápida para casos de urgencia con tus mascotas.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Veterinaria de Cabecera (Nombre)</label>
            <input
              type="text"
              name="vetName"
              value={emergencyContacts.vetName}
              onChange={handleEmergencyChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Ej. Clínica Veterinaria San Roque"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono Veterinaria</label>
            <input
              type="tel"
              name="vetPhone"
              value={emergencyContacts.vetPhone}
              onChange={handleEmergencyChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Teléfono de tu vete"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guardia 24hs</label>
            <input
              type="tel"
              name="emergencyPhone"
              value={emergencyContacts.emergencyPhone}
              onChange={handleEmergencyChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Teléfono de urgencias"
            />
          </div>
        </div>
      </div>

      {/* Sección 3: Gestión de Cuenta */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-emerald-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Gestión de Cuenta</h2>
        </div>
        
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-grow w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              disabled
              value="test@gmail.com"
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
          <button className="w-full md:w-auto px-6 py-2 rounded-xl border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 font-medium transition-colors">
            Cambiar Contraseña
          </button>
        </div>
      </div>

      {/* Botón Principal (Guardar) */}
      <div className="flex justify-end pt-2">
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Save size={20} />
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};

export default UserProfile;