import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Installer, JobStatus } from '../types';
import { User, Phone, Briefcase, ChevronRight, Plus, X, Edit, Trash2, Save, Upload, Banknote } from 'lucide-react';

const Installers: React.FC = () => {
  const { installers, jobs, addInstaller, updateInstaller, deleteInstaller } = useApp();
  const [selectedInstaller, setSelectedInstaller] = useState<Installer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Installer Form State
  const [formData, setFormData] = useState<Partial<Installer>>({ 
    name: '', phone: '', specialty: '', active: true, pixKey: '', photoUrl: '' 
  });

  const getInstallerStats = (id: string) => {
    const installerJobs = jobs.filter(j => j.installerId === id);
    const totalJobs = installerJobs.length;
    const completedJobs = installerJobs.filter(j => j.status === JobStatus.FINISHED).length;
    const totalRevenueGenerated = installerJobs.reduce((acc, j) => acc + j.value, 0);
    
    return { totalJobs, completedJobs, totalRevenueGenerated, installerJobs };
  };

  const openCreateModal = () => {
    setFormData({ name: '', phone: '', specialty: '', active: true, pixKey: '', photoUrl: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (installer: Installer) => {
    setFormData({ ...installer });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const installerData: Installer = {
      id: isEditing && formData.id ? formData.id : Date.now().toString(),
      name: formData.name!,
      phone: formData.phone || '',
      specialty: formData.specialty || '',
      active: formData.active !== undefined ? formData.active : true,
      pixKey: formData.pixKey || '',
      photoUrl: formData.photoUrl || ''
    };

    if (isEditing && formData.id) {
      updateInstaller(installerData);
      setSelectedInstaller(installerData);
    } else {
      addInstaller(installerData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (selectedInstaller && window.confirm(`Tem certeza que deseja excluir ${selectedInstaller.name}?`)) {
      deleteInstaller(selectedInstaller.id);
      setSelectedInstaller(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Equipe de Instaladores</h2>
        <button 
          onClick={openCreateModal}
          className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm"
        >
          <Plus size={20} className="mr-2" />
          Novo Instalador
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden h-fit">
          <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {installers.map((installer) => (
              <li 
                key={installer.id} 
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${selectedInstaller?.id === installer.id ? 'bg-blue-50 border-l-4 border-primary' : ''}`}
                onClick={() => setSelectedInstaller(installer)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {installer.photoUrl ? (
                      <img src={installer.photoUrl} alt={installer.name} className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                        <User size={20} />
                      </div>
                    )}
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
              <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                <div className="flex items-start gap-4">
                   <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                      {selectedInstaller.photoUrl ? (
                         <img src={selectedInstaller.photoUrl} alt={selectedInstaller.name} className="h-full w-full object-cover" />
                      ) : (
                         <User size={40} className="text-slate-400" />
                      )}
                   </div>
                   <div>
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {selectedInstaller.name}
                      </h3>
                      <div className="flex flex-col gap-1 mt-2 text-gray-600">
                          <span className="flex items-center text-sm"><Phone size={14} className="mr-2"/> {selectedInstaller.phone}</span>
                          <span className="flex items-center text-sm"><Briefcase size={14} className="mr-2"/> {selectedInstaller.specialty}</span>
                          <span className="flex items-center text-sm"><Banknote size={14} className="mr-2"/> PIX: {selectedInstaller.pixKey || 'Não informado'}</span>
                      </div>
                      <div className="mt-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${selectedInstaller.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {selectedInstaller.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                  <button 
                    onClick={() => openEditModal(selectedInstaller)}
                    className="flex items-center px-3 py-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors"
                  >
                    <Edit size={16} className="mr-2" />
                    Editar
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex items-center px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Excluir
                  </button>
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
                      R$ {getInstallerStats(selectedInstaller.id).totalRevenueGenerated.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
                    {getInstallerStats(selectedInstaller.id).installerJobs.length > 0 ? (
                      getInstallerStats(selectedInstaller.id).installerJobs
                        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 5)
                        .map(job => (
                        <tr key={job.id} className="border-b">
                          <td className="px-3 py-2">{job.clientName}</td>
                          <td className="px-3 py-2">{new Date(job.date).toLocaleDateString()}</td>
                          <td className="px-3 py-2">
                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${job.status === JobStatus.FINISHED ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {job.status}
                             </span>
                          </td>
                          <td className="px-3 py-2">R$ {job.value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-gray-400">Nenhuma obra registrada para este instalador.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-white rounded-lg shadow text-gray-400 p-10 text-center min-h-[300px]">
              <div className="flex flex-col items-center">
                <User size={48} className="mb-4 text-gray-300" />
                <p>Selecione um instalador na lista ao lado para ver detalhes, editar ou excluir.</p>
              </div>
            </div>
          )}
        </div>
      </div>

       {/* Add/Edit Installer Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{isEditing ? 'Editar Instalador' : 'Novo Instalador'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
               {/* Photo Upload */}
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-primary">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} className="h-full w-full object-cover" alt="Preview" />
                    ) : (
                      <Upload size={24} className="text-gray-400" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handlePhotoUpload}
                    />
                </div>
                <span className="text-xs text-gray-500 mt-2">Clique para adicionar foto</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input 
                  required 
                  type="text" 
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-primary focus:border-primary" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone</label>
                <input 
                  required 
                  type="text" 
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-primary focus:border-primary" 
                  value={formData.phone || ''} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Chave PIX</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-primary focus:border-primary" 
                  value={formData.pixKey || ''} 
                  onChange={e => setFormData({...formData, pixKey: e.target.value})} 
                  placeholder="CPF, Email, Telefone ou Aleatória"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Especialidade</label>
                <input 
                  required 
                  type="text" 
                  className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:ring-primary focus:border-primary" 
                  placeholder="Ex: Elétrica, Hidráulica"
                  value={formData.specialty || ''} 
                  onChange={e => setFormData({...formData, specialty: e.target.value})} 
                />
              </div>
              
              <div className="flex items-center mt-2">
                <input
                  id="active-checkbox"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  checked={formData.active}
                  onChange={e => setFormData({...formData, active: e.target.checked})}
                />
                <label htmlFor="active-checkbox" className="ml-2 block text-sm text-gray-900">
                  Instalador Ativo
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                 <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="w-full bg-primary text-white py-2 rounded-md hover:bg-blue-700 flex justify-center items-center"
                >
                  <Save size={18} className="mr-2" />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
       )}
    </div>
  );
};

export default Installers;