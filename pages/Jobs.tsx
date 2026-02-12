
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Job, JobStatus, PaymentStatus, JobItem } from '../types';
import { Plus, Search, Filter, Edit, Trash2, X, Upload, FileText, Calculator, Eye } from 'lucide-react';
import { format } from 'date-fns';

const Jobs: React.FC = () => {
  // Added user to destructuring to provide cityId for new/updated records
  const { jobs, installers, services, addJob, updateJob, deleteJob, getInstallerName, user } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentJob, setCurrentJob] = useState<Partial<Job>>({});
  const [isEditing, setIsEditing] = useState(false);
  
  const [jobItems, setJobItems] = useState<JobItem[]>([]);

  const initialFormState: Partial<Job> = {
    status: JobStatus.SCHEDULED,
    paymentStatus: PaymentStatus.PENDING,
    date: new Date().toISOString().slice(0, 16),
    value: 0,
    photoUrl: '',
    pdfUrl: ''
  };

  const initializeItems = () => {
    return services.map(service => ({
      name: service.name,
      quantity: 0,
      pricePerUnit: service.defaultPrice,
      total: 0
    }));
  };

  const openCreateModal = () => {
    setCurrentJob(initialFormState);
    setJobItems(initializeItems());
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setCurrentJob({
      ...job,
      date: new Date(job.date).toISOString().slice(0, 16)
    });
    
    // Montar lista de itens do job: priorizar job.items, senão converter qtd_servicos (mesma lógica do Calendário)
    let jobItemsList: JobItem[] = [];
    if (job.items && job.items.length > 0) {
      jobItemsList = job.items.map(i => ({
        name: i.name || '',
        quantity: i.quantity ?? 0,
        pricePerUnit: i.pricePerUnit ?? 0,
        total: i.total ?? 0
      }));
    } else {
      const qtdServicos = job.qtd_servicos;
      const qtdArray = Array.isArray(qtdServicos) ? qtdServicos : (qtdServicos && typeof qtdServicos === 'object' ? Object.values(qtdServicos) : []);
      if (qtdArray.length > 0) {
        jobItemsList = qtdArray.map((q: any) => {
          const name = String(q?.item ?? q?.name ?? '').trim();
          const quantity = Number(q?.qtd ?? q?.quantity ?? 0) || 0;
          const service = services.find(s => s.name === name);
          const pricePerUnit = q?.pricePerUnit != null ? Number(q.pricePerUnit) : (service?.defaultPrice ?? 0);
          const total = q?.total != null ? Number(q.total) : quantity * pricePerUnit;
          return { name, quantity, pricePerUnit, total };
        }).filter(i => i.name !== '');
      }
    }
    const byName = new Map<string, JobItem>(jobItemsList.map(i => [i.name, i]));
    const fromServices = services.map(s => {
      const existing = byName.get(s.name);
      if (existing) return existing;
      return { name: s.name, quantity: 0, pricePerUnit: s.defaultPrice, total: 0 };
    });
    const serviceNames = new Set(services.map(s => s.name));
    const customItems = jobItemsList.filter(i => !serviceNames.has(i.name));
    setJobItems([...fromServices, ...customItems]);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  useEffect(() => {
    const total = jobItems.reduce((acc, item) => acc + item.total, 0);
    const safeTotal = Number(total.toFixed(2));
    setCurrentJob(prev => {
      if (safeTotal > 0 || !isEditing) {
        return { ...prev, value: safeTotal };
      } else {
        return prev;
      }
    });
  }, [jobItems, isEditing]);

  const handleItemChange = (index: number, field: 'quantity' | 'pricePerUnit' | 'name', value: string | number) => {
    const newItems = [...jobItems];
    const item = newItems[index];
    if (field === 'name') {
        item.name = value as string;
    } else {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        const safeValue = isNaN(numValue) ? 0 : numValue;
        if (field === 'quantity') item.quantity = safeValue;
        if (field === 'pricePerUnit') item.pricePerUnit = safeValue;
        item.total = Number((item.quantity * item.pricePerUnit).toFixed(2));
    }
    setJobItems(newItems);
  };

  const addItem = () => {
    setJobItems([...jobItems, { name: '', quantity: 0, pricePerUnit: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    setJobItems(jobItems.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentJob(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentJob(prev => ({ 
          ...prev, 
          pdfUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    } else if (file) {
      alert("Por favor, selecione um arquivo PDF.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Added user validation to ensure cityId is available
    if (!currentJob.clientName || !currentJob.installerId || !user) return;

    const activeItems = jobItems.filter(item => item.name.trim() !== '' && (item.quantity > 0 || item.pricePerUnit > 0));

    const jobData: Job = {
        id: isEditing ? currentJob.id! : Date.now().toString(),
        cityId: user.cityId, // Injected cityId from current user context
        orderNumber: currentJob.orderNumber || `ORD-${Date.now().toString().slice(-4)}`,
        clientName: currentJob.clientName!,
        address: currentJob.address || '',
        date: new Date(currentJob.date!).toISOString(),
        description: currentJob.description || '',
        value: Number(currentJob.value?.toFixed(2)),
        status: currentJob.status as JobStatus,
        paymentStatus: currentJob.paymentStatus as PaymentStatus,
        installerId: currentJob.installerId!,
        notes: currentJob.notes || '',
        items: activeItems,
        photoUrl: currentJob.photoUrl,
        pdfUrl: currentJob.pdfUrl
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obra / Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instalador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
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
                      R$ {job.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl shadow-xl animate-fade-in flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Editar Obra' : 'Nova Obra'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row h-full overflow-hidden">
              <div className="p-6 md:w-1/3 border-r overflow-y-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome do Cliente</label>
                    <input 
                      type="text" 
                      required
                      className="mt-1 block w-full bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary"
                      value={currentJob.clientName || ''}
                      onChange={e => setCurrentJob({...currentJob, clientName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número do Pedido</label>
                    <input 
                      type="text" 
                      className="mt-1 block w-full bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm p-2"
                      value={currentJob.orderNumber || ''}
                      onChange={e => setCurrentJob({...currentJob, orderNumber: e.target.value})}
                      placeholder="Ex: PED-1234"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Instalador Responsável</label>
                    <select 
                      required
                      className="mt-1 block w-full bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm p-2"
                      value={currentJob.installerId || ''}
                      onChange={e => setCurrentJob({...currentJob, installerId: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {installers.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.name} - {inst.specialty}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data e Hora</label>
                    <input 
                      type="datetime-local" 
                      required
                      className="mt-1 block w-full bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm p-2"
                      value={currentJob.date || ''}
                      onChange={e => setCurrentJob({...currentJob, date: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select 
                      className="mt-1 block w-full bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm p-2"
                      value={currentJob.status}
                      onChange={e => setCurrentJob({...currentJob, status: e.target.value as JobStatus})}
                    >
                      {Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pagamento</label>
                    <select 
                      className="mt-1 block w-full bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm p-2"
                      value={currentJob.paymentStatus}
                      onChange={e => setCurrentJob({...currentJob, paymentStatus: e.target.value as PaymentStatus})}
                    >
                      {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ordem de Serviço (OS)</label>
                    
                    <textarea 
                      rows={2}
                      className="w-full bg-white text-gray-900 border border-gray-400 rounded-md p-2 text-sm mb-3"
                      placeholder="Detalhes da OS..."
                      value={currentJob.description || ''}
                      onChange={e => setCurrentJob({...currentJob, description: e.target.value})}
                    />

                    <div className="flex flex-col gap-2">
                       <label className="cursor-pointer bg-white border border-gray-400 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md shadow-sm text-sm flex items-center justify-center w-full">
                          <Upload size={16} className="mr-2" />
                          {currentJob.photoUrl ? 'Trocar Foto' : 'Adicionar Foto'}
                          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                       </label>
                       
                       <label className="cursor-pointer bg-white border border-gray-400 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md shadow-sm text-sm flex items-center justify-center w-full">
                          <FileText size={16} className="mr-2" />
                          {currentJob.pdfUrl ? 'Trocar PDF' : 'Adicionar PDF'}
                          <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
                       </label>
                    </div>

                    {currentJob.photoUrl && (
                      <div className="mt-3 relative h-32 w-full rounded-md overflow-hidden border border-gray-400">
                        <img src={currentJob.photoUrl} alt="OS Preview" className="h-full w-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setCurrentJob({...currentJob, photoUrl: ''})}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {currentJob.pdfUrl && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                         <div className="flex items-center gap-2 overflow-hidden">
                            <FileText size={20} className="text-blue-600 shrink-0" />
                            <span className="text-xs text-blue-800 font-medium truncate">documento.pdf</span>
                         </div>
                         <div className="flex items-center gap-1">
                            <a href={currentJob.pdfUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-600 hover:bg-blue-100 rounded" title="Visualizar">
                               <Eye size={16} />
                            </a>
                            <button 
                              type="button"
                              onClick={() => setCurrentJob({...currentJob, pdfUrl: ''})}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Remover"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                      </div>
                    )}
                  </div>
              </div>

              <div className="p-6 md:w-2/3 flex flex-col bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="text-primary" />
                      <h4 className="text-lg font-bold text-gray-800">Calculadora de Serviços</h4>
                    </div>
                    <button 
                      type="button"
                      onClick={addItem}
                      className="flex items-center text-sm bg-green-50 text-green-600 px-3 py-1 rounded hover:bg-green-100 border border-green-200"
                    >
                      <Plus size={16} className="mr-1" />
                      Adicionar Item
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto bg-white rounded-lg shadow border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Item</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase w-24">Qtd</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase w-32">R$ Unit.</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase w-32">Total</th>
                          <th className="px-2 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {jobItems.map((item, index) => {
                          return (
                          <tr key={index} className="hover:bg-blue-50/30">
                            <td className="px-4 py-2">
                                <input
                                  type="text"
                                  className="w-full bg-white text-gray-900 border border-gray-400 rounded-md text-sm p-2 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary font-medium placeholder-gray-500"
                                  value={item.name}
                                  placeholder="Nome do serviço"
                                  onChange={e => handleItemChange(index, 'name', e.target.value)}
                                />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="number" 
                                min="0"
                                step="0.01"
                                className="w-full bg-white text-gray-900 border border-gray-400 rounded-md text-center text-sm p-2 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary font-medium placeholder-gray-500"
                                value={item.quantity || ''}
                                onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                                placeholder="0"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="number" 
                                min="0"
                                step="0.01"
                                className="w-full bg-white text-gray-900 border border-gray-400 rounded-md text-center text-sm p-2 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary font-medium placeholder-gray-500"
                                value={item.pricePerUnit || ''}
                                onChange={e => handleItemChange(index, 'pricePerUnit', e.target.value)}
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-bold text-gray-900 bg-gray-50/50 flex items-center justify-end h-full mt-1.5">
                              R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-2 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="text-red-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-4 bg-white rounded-lg shadow border border-gray-200 flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-600">Valor Total da Obra:</span>
                    <span className="text-3xl font-bold text-primary">
                      R$ {Number(currentJob.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-white bg-gray-100 font-medium"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 shadow-md font-bold text-lg"
                    >
                      {isEditing ? 'Salvar Alterações' : 'Criar Obra'}
                    </button>
                  </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
