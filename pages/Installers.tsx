import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Installer, JobStatus } from '../types';
import { User, Phone, Briefcase, ChevronRight, Plus, X } from 'lucide-react';

const Installers: React.FC = () => {
  const { installers, jobs, addInstaller } = useApp();
  const [selectedInstaller, setSelectedInstaller] = useState<Installer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Installer Form State
  const [newInstaller, setNewInstaller] = useState({ name: '', phone: '', specialty: '' });

  const getInstallerStats = (id: string) => {
    const installerJobs = jobs.filter(j => j.installerId === id);
    const totalJobs = installerJobs.length;
    const completedJobs = installerJobs.filter(j => j.status === JobStatus.FINISHED).length;
    const totalRevenueGenerated = installerJobs.reduce((acc, j) => acc + j.value, 0);
    
    return { totalJobs, completedJobs, totalRevenueGenerated, installerJobs };
  };

  const handleAddInstaller = (e: React.FormEvent) => {
    e.preventDefault();
    if(newInstaller.name) {
      addInstaller({
        id: Date.now().toString(),
        name: newInstaller.name,
        phone: newInstaller.phone,
        specialty: newInstaller.specialty,
        active: true
      });
      setIsModalOpen(false);
      setNewInstaller({ name: '', phone: '', specialty: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Equipe de Instaladores</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm"
        >
          <Plus size={20} className="mr-2" />
          Novo Instalador
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {installers.map((installer) => (
              <li 
                key={installer.id} 
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedInstaller?.id === installer.id ? 'bg-blue-50 border-l-4 border-primary' : ''}`}
                onClick={() => setSelectedInstaller(installer)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                      <User size={20} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{installer.name}</p>
                    <p className="text-sm text-gray-500 truncate">{installer.specialty}</p>
                  </div>
                  <div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {selectedInstaller ? (
            <div className="bg-white rounded-lg shadow p-6 animate-fade-in">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="text-2xl font-bold text-gray-900">{selectedInstaller.name}</h3>
                   <div className="flex items-center text-gray-500 mt-2 space-x-4">
                      <span className="flex items-center"><Phone size={16} className="mr-1"/> {selectedInstaller.phone}</span>
                      <span className="flex items-center"><Briefcase size={16} className="mr-1"/> {selectedInstaller.specialty}</span>
                      <span className={`px-2 text-xs rounded-full ${selectedInstaller.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedInstaller.active ? 'Ativo' : 'Inativo'}
                      </span>
                   </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                 <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <span className="block text-2xl font-bold text-gray-800">{getInstallerStats(selectedInstaller.id).totalJobs}</span>
                    <span className="text-sm text-gray-500">Obras Atribuídas</span>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <span className="block text-2xl font-bold text-green-600">{getInstallerStats(selectedInstaller.id).completedJobs}</span>
                    <span className="text-sm text-gray-500">Obras Concluídas</span>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <span className="block text-2xl font-bold text-blue-600">
                      R$ {getInstallerStats(selectedInstaller.id).totalRevenueGenerated.toLocaleString('pt-BR', {compactDisplay: 'short'})}
                    </span>
                    <span className="text-sm text-gray-500">Valor Gerado</span>
                 </div>
              </div>

              {/* Recent History Table */}
              <h4 className="text-lg font-medium text-gray-800 mb-4">Histórico de Obras</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Cliente</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Data</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getInstallerStats(selectedInstaller.id).installerJobs.slice(0, 5).map(job => (
                      <tr key={job.id} className="border-b">
                        <td className="px-3 py-2">{job.clientName}</td>
                        <td className="px-3 py-2">{new Date(job.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2">{job.status}</td>
                        <td className="px-3 py-2">R$ {job.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-white rounded-lg shadow text-gray-400 p-10 text-center">
              <p>Selecione um instalador para ver os detalhes e métricas de desempenho.</p>
            </div>
          )}
        </div>
      </div>

       {/* Add Installer Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl p-6">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold">Novo Instalador</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400"/></button>
            </div>
            <form onSubmit={handleAddInstaller} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input required type="text" className="w-full border rounded p-2 mt-1" 
                  value={newInstaller.name} onChange={e => setNewInstaller({...newInstaller, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <input required type="text" className="w-full border rounded p-2 mt-1" 
                  value={newInstaller.phone} onChange={e => setNewInstaller({...newInstaller, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Especialidade</label>
                <input required type="text" className="w-full border rounded p-2 mt-1" placeholder="Ex: Elétrica, Hidráulica"
                  value={newInstaller.specialty} onChange={e => setNewInstaller({...newInstaller, specialty: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-primary text-white py-2 rounded hover:bg-blue-600">Cadastrar</button>
            </form>
          </div>
        </div>
       )}
    </div>
  );
};

export default Installers;