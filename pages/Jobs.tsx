import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Job, JobStatus, PaymentStatus } from '../types';
import { Plus, Search, Filter, Edit, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

const Jobs: React.FC = () => {
  const { jobs, installers, addJob, updateJob, deleteJob, getInstallerName } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentJob, setCurrentJob] = useState<Partial<Job>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Form Initial State
  const initialFormState: Partial<Job> = {
    status: JobStatus.SCHEDULED,
    paymentStatus: PaymentStatus.PENDING,
    date: new Date().toISOString().slice(0, 16), // datetime-local format
    value: 0
  };

  const openCreateModal = () => {
    setCurrentJob(initialFormState);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setCurrentJob({
      ...job,
      date: new Date(job.date).toISOString().slice(0, 16)
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentJob.clientName || !currentJob.installerId) return;

    const jobData: Job = {
        id: isEditing ? currentJob.id! : Date.now().toString(),
        orderNumber: currentJob.orderNumber || `ORD-${Date.now().toString().slice(-4)}`,
        clientName: currentJob.clientName!,
        address: currentJob.address || '',
        date: new Date(currentJob.date!).toISOString(),
        description: currentJob.description || '',
        value: Number(currentJob.value),
        status: currentJob.status as JobStatus,
        paymentStatus: currentJob.paymentStatus as PaymentStatus,
        installerId: currentJob.installerId!,
        notes: currentJob.notes || ''
    };

    if (isEditing) {
        updateJob(jobData);
    } else {
        addJob(jobData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta obra?')) {
        deleteJob(id);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Obras</h2>
        <button 
          onClick={openCreateModal}
          className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Nova Obra
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou pedido..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">
          <Filter size={20} className="mr-2" />
          Filtros
        </button>
      </div>

      {/* Job List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obra / Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instalador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.length === 0 ? (
                 <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Nenhuma obra encontrada.</td></tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{job.clientName}</span>
                        <span className="text-xs text-gray-500">#{job.orderNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getInstallerName(job.installerId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(job.date), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {job.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${job.status === JobStatus.FINISHED ? 'bg-green-100 text-green-800' : 
                          job.status === JobStatus.IN_PROGRESS ? 'bg-yellow-100 text-yellow-800' : 
                          job.status === JobStatus.CANCELLED ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(job)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(job.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Editar Obra' : 'Nova Obra'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Nome do Cliente</label>
                <input 
                  type="text" 
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
                  value={currentJob.clientName || ''}
                  onChange={e => setCurrentJob({...currentJob, clientName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Data e Hora</label>
                <input 
                  type="datetime-local" 
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={currentJob.date || ''}
                  onChange={e => setCurrentJob({...currentJob, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Instalador Responsável</label>
                <select 
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={currentJob.installerId || ''}
                  onChange={e => setCurrentJob({...currentJob, installerId: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {installers.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name} - {inst.specialty}</option>
                  ))}
                </select>
              </div>

              {/* Replaced Address with Order Number */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Número do Pedido</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={currentJob.orderNumber || ''}
                  onChange={e => setCurrentJob({...currentJob, orderNumber: e.target.value})}
                  placeholder="Ex: PED-1234"
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Descrição do Serviço</label>
                <textarea 
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={currentJob.description || ''}
                  onChange={e => setCurrentJob({...currentJob, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={currentJob.value || 0}
                  onChange={e => setCurrentJob({...currentJob, value: parseFloat(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={currentJob.status}
                  onChange={e => setCurrentJob({...currentJob, status: e.target.value as JobStatus})}
                >
                  {Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Pagamento</label>
                <select 
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={currentJob.paymentStatus}
                  onChange={e => setCurrentJob({...currentJob, paymentStatus: e.target.value as PaymentStatus})}
                >
                  {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 shadow-sm"
                >
                  {isEditing ? 'Salvar Alterações' : 'Criar Obra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;