
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, 
  addMonths, subMonths, isWeekend
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Job, JobStatus, PaymentStatus, JobItem, Installer } from '../types';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Save, Calculator, Trash2, Upload, FileText, Eye } from 'lucide-react';

const Calendar: React.FC = () => {
  // Added user to destructuring to inject cityId into new Job records
  const { jobs, installers, services, addJob, updateJob, deleteJob, user, reorderInstallers } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<Job> | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{date: Date, installerId: string} | null>(null);
  const [jobItems, setJobItems] = useState<JobItem[]>([]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const [orderedInstallers, setOrderedInstallers] = useState(() => installers.filter(i => i.active));
  useEffect(() => setOrderedInstallers(installers.filter(i => i.active)), [installers]);
  const [dragData, setDragData] = useState<any>(null);

  const handleInstallerDragStart = (e: React.DragEvent, installerId: string, index: number) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'installer', id: installerId, index }));
    setDragData({ type: 'installer', id: installerId, index });
  };

  const handleHeaderDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleHeaderDrop = (e: React.DragEvent, destIndex: number) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.type === 'installer') {
        const sourceIndex = orderedInstallers.findIndex(i => i.id === data.id);
        if (sourceIndex === -1) return;
        const newOrder = Array.from(orderedInstallers);
        const [moved] = newOrder.splice(sourceIndex, 1);
        newOrder.splice(destIndex, 0, moved);
        setOrderedInstallers(newOrder);
        reorderInstallers(newOrder.map((i: Installer) => i.id));
      }
    } catch (err) {
      // ignore
    } finally {
      setDragData(null);
    }
  };

  const handleJobDragStart = (e: React.DragEvent, job: Job, day: Date, installerId: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'job', id: job.id, fromDate: day.toISOString(), fromInstallerId: installerId }));
    setDragData({ type: 'job', id: job.id });
  };

  const handleCellDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleCellDrop = (e: React.DragEvent, day: Date, installerId: string) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.type === 'job') {
        const job = jobs.find(j => j.id === data.id);
        if (!job) return;
        const updated: Job = { ...job, date: day.toISOString(), installerId };
        updateJob(updated);
      }
    } catch (err) {
      // ignore
    } finally {
      setDragData(null);
    }
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getJobsForCell = (date: Date, installerId: string) => {
    return jobs.filter(job => 
      isSameDay(new Date(job.date), date) && job.installerId === installerId
    );
  };

  const getStatusStyle = (status: JobStatus) => {
    switch (status) {
      case JobStatus.SCHEDULED: return 'bg-white border-l-4 border-blue-500 text-gray-800';
      case JobStatus.IN_PROGRESS: return 'bg-orange-100 border-l-4 border-orange-500 text-orange-900'; 
      case JobStatus.FINISHED: return 'bg-green-100 border-l-4 border-green-500 text-green-900';
      case JobStatus.CANCELLED: return 'bg-red-500 text-white'; 
      default: return 'bg-gray-50 text-gray-800';
    }
  };

  // Cores dos cards no calendário por status do agendamento (status tem prioridade sobre pagamento)
  const getJobColorClass = (job: Job) => {
    const status = String(job.status ?? '').toUpperCase();
    const isFinished = job.status === JobStatus.FINISHED || status === 'FINALIZADA' || status === 'FINISHED';
    const isCancelled = job.status === JobStatus.CANCELLED || status === 'CANCELADA' || status === 'CANCELLED';
    const isScheduled = job.status === JobStatus.SCHEDULED || status === 'AGENDADA' || status === 'SCHEDULED';
    const isPendingPayment = job.paymentStatus === PaymentStatus.PENDING || String(job.paymentStatus ?? '').toUpperCase() === 'PENDING' || String(job.paymentStatus ?? '').toUpperCase() === 'PENDENTE';
    // Finalizadas: verde
    if (isFinished) return 'bg-green-100/80 border-green-400 text-green-900';
    // Canceladas: vermelho
    if (isCancelled) return 'bg-red-100/80 border-red-400 text-red-900';
    // Agendada: sempre azul (mesmo com pagamento pendente)
    if (isScheduled) return 'bg-blue-100/70 border-blue-300 text-blue-900';
    // Em andamento com pagamento pendente: amarelo
    if (isPendingPayment) return 'bg-yellow-100/80 border-yellow-400 text-yellow-900';
    // Em andamento pago / demais: azul
    return 'bg-blue-100/70 border-blue-300 text-blue-900';
  };

  const initializeItems = () => {
    return services.map(service => ({
      name: service.name,
      quantity: 0,
      pricePerUnit: service.defaultPrice,
      total: 0
    }));
  };

  const prepareItemsForJob = (job?: Job) => {
    if (job) {
      // Montar lista de itens do job: priorizar job.items, senão converter qtd_servicos
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
      // Serviços cadastrados: usar dados do job se existir, senão linha com 0
      const fromServices = services.map(s => {
        const existing = byName.get(s.name);
        if (existing) return existing;
        return { name: s.name, quantity: 0, pricePerUnit: s.defaultPrice, total: 0 };
      });
      // Itens do job que não estão na lista de serviços (customizados)
      const serviceNames = new Set(services.map(s => s.name));
      const customItems = jobItemsList.filter(i => !serviceNames.has(i.name));
      setJobItems([...fromServices, ...customItems]);
    } else {
      setJobItems(initializeItems());
    }
  };

  const handleCellClick = (date: Date, installerId: string) => {
    setSelectedSlot({ date, installerId });
    setEditingJob({
      status: JobStatus.SCHEDULED,
      paymentStatus: PaymentStatus.PENDING,
      value: 0,
      photoUrl: '',
      pdfUrl: ''
    });
    setJobItems(initializeItems());
    setIsModalOpen(true);
  };

  const handleJobClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation(); 
    setEditingJob({ ...job });
    prepareItemsForJob(job);
    setSelectedSlot(null); 
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingJob(prev => prev ? ({ ...prev, photoUrl: reader.result as string }) : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingJob(prev => prev ? ({ 
          ...prev, 
          pdfUrl: reader.result as string
        }) : null);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isModalOpen && editingJob) {
      const total = jobItems.reduce((acc, item) => acc + item.total, 0);
      const safeTotal = Number(total.toFixed(2));
      setEditingJob(prev => {
        if (safeTotal > 0 || !prev?.id) {
          return prev ? { ...prev, value: safeTotal } : null;
        } else {
          return prev;
        }
      });
    }
  }, [jobItems]);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Added user validation to ensure cityId is available
    if (!editingJob || !user) return;

    const activeItems = jobItems.filter(item => item.name.trim() !== '' && (item.quantity > 0 || item.pricePerUnit > 0));

    if (editingJob.id) {
      updateJob({
          ...editingJob as Job,
          cityId: user.cityId, // Ensuring cityId is preserved on update
          items: activeItems,
          value: Number(editingJob.value?.toFixed(2)),
          photoUrl: editingJob.photoUrl,
          pdfUrl: editingJob.pdfUrl
      });
    } else if (selectedSlot) {
      const newJob: Job = {
        id: Date.now().toString(),
        cityId: user.cityId, // Injecting cityId for new Job creation
        installerId: selectedSlot.installerId,
        date: selectedSlot.date.toISOString(),
        clientName: editingJob.clientName || 'Novo Cliente',
        orderNumber: editingJob.orderNumber || 'S/N',
        description: editingJob.description || '',
        value: Number(editingJob.value?.toFixed(2)) || 0,
        status: editingJob.status as JobStatus || JobStatus.SCHEDULED,
        paymentStatus: editingJob.paymentStatus as PaymentStatus || PaymentStatus.PENDING,
        address: '',
        notes: '',
        items: activeItems,
        photoUrl: editingJob.photoUrl,
        pdfUrl: editingJob.pdfUrl
      };
      addJob(newJob);
    }
    setIsModalOpen(false);
    setEditingJob(null);
    setSelectedSlot(null);
  };

  const handleDelete = () => {
    if (editingJob?.id && window.confirm('Excluir este agendamento?')) {
      deleteJob(editingJob.id);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 capitalize flex items-center gap-2">
            <CalendarIcon className="text-primary" />
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full border">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
            Hoje
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full border">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white shadow rounded-lg border border-black relative">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-r border-black min-w-[200px] sticky left-0 bg-gray-100 z-20">
                Data
              </th>
              {orderedInstallers.map((installer, idx) => (
                <th
                  key={installer.id}
                  draggable
                  onDragStart={(e) => handleInstallerDragStart(e, installer.id, idx)}
                  onDragOver={handleHeaderDragOver}
                  onDrop={(e) => handleHeaderDrop(e, idx)}
                  className="p-3 text-center text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-r border-black min-w-[180px]"
                >
                  {installer.name}
                  <div className="text-[10px] text-gray-600 font-normal">{installer.specialty}</div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {calendarDays.map((day) => {
              const isWeekendDay = isWeekend(day);
              const rowClass = isWeekendDay ? 'bg-slate-50' : 'bg-white';
              return (
                <tr key={day.toISOString()} className={rowClass}>
                  <td className={`p-3 text-sm border-r border-b border-black sticky left-0 z-10 ${rowClass} font-medium text-gray-900`}>
                    <div className="capitalize">{format(day, 'EEEE', { locale: ptBR })}</div>
                    <div className="text-xs text-gray-600">{format(day, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
                  </td>
                  {orderedInstallers.map(installer => {
                    const cellJobs = getJobsForCell(day, installer.id);
                    return (
                      <td 
                        key={`${day}-${installer.id}`} 
                        className="p-1 border-r border-b border-black align-top min-h-[80px] hover:bg-blue-50/50 transition-colors cursor-pointer relative group"
                        onClick={() => { if (!dragData) handleCellClick(day, installer.id) }}
                        onDragOver={handleCellDragOver}
                        onDrop={(e) => handleCellDrop(e, day, installer.id)}
                      >
                        <div className="min-h-[60px] flex flex-col gap-1">
                          {cellJobs.map((job) => (
                            <div 
                              key={job.id}
                              draggable
                              onDragStart={(e) => handleJobDragStart(e, job, day, installer.id)}
                              onClick={(e) => handleJobClick(e, job)}
                              className={`p-2 text-xs shadow-sm rounded cursor-pointer hover:opacity-90 transition-opacity ${getJobColorClass(job)} border`}
                            >
                              <div className="font-bold truncate">{job.clientName}</div>
                              <div className="truncate opacity-90">{job.orderNumber}</div>
                              {job.value > 0 && <div className="mt-1 font-mono opacity-75">R$ {job.value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>}
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingJob && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl animate-fade-in flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-5 border-b shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {editingJob.id ? 'Editar Agendamento' : 'Novo Agendamento'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col md:flex-row h-full overflow-hidden">
               <div className="p-6 md:w-1/3 border-r overflow-y-auto space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Cliente / Obra</label>
                    <input 
                      autoFocus required type="text" 
                      className="w-full bg-white text-gray-900 border border-gray-400 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                      value={editingJob.clientName || ''}
                      onChange={e => setEditingJob({...editingJob, clientName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nº Pedido</label>
                    <input 
                      type="text" 
                      className="w-full bg-white text-gray-900 border border-gray-400 rounded-lg p-2.5"
                      value={editingJob.orderNumber || ''}
                      onChange={e => setEditingJob({...editingJob, orderNumber: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(JobStatus).map(status => (
                        <button
                          key={status} type="button"
                          onClick={() => setEditingJob({...editingJob, status: status})}
                          className={`px-2 py-2 text-xs rounded-md border text-center transition-colors
                            ${editingJob.status === status 
                              ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium ring-1 ring-blue-500' 
                              : 'bg-white border-gray-400 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pagamento</label>
                    <select 
                      className="w-full bg-white text-gray-900 border border-gray-400 rounded-lg p-2.5"
                      value={editingJob.paymentStatus}
                      onChange={e => setEditingJob({...editingJob, paymentStatus: e.target.value as PaymentStatus})}
                    >
                      {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ordem de Serviço</label>
                    <textarea 
                      rows={2}
                      className="w-full bg-white text-gray-900 border border-gray-400 rounded-md p-2 text-sm mb-3"
                      value={editingJob.description || ''}
                      onChange={e => setEditingJob({...editingJob, description: e.target.value})}
                      placeholder="Detalhes da OS..."
                    />

                    <div className="flex flex-col gap-2">
                       <label className="cursor-pointer bg-white border border-gray-400 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md shadow-sm text-sm flex items-center justify-center w-full">
                          <Upload size={16} className="mr-2" />
                          {editingJob.photoUrl ? 'Trocar Foto' : 'Adicionar Foto'}
                          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                       </label>
                       
                       <label className="cursor-pointer bg-white border border-gray-400 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-md shadow-sm text-sm flex items-center justify-center w-full">
                          <FileText size={16} className="mr-2" />
                          {editingJob.pdfUrl ? 'Trocar PDF' : 'Adicionar PDF'}
                          <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
                       </label>
                    </div>

                    {editingJob.photoUrl && (
                      <div className="mt-3 relative h-32 w-full rounded-md overflow-hidden border border-gray-400">
                        <img src={editingJob.photoUrl} alt="OS Preview" className="h-full w-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setEditingJob({...editingJob, photoUrl: ''})}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {editingJob.pdfUrl && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                         <div className="flex items-center gap-2 overflow-hidden">
                            <FileText size={20} className="text-blue-600 shrink-0" />
                            <span className="text-xs text-blue-800 font-medium truncate">anexo.pdf</span>
                         </div>
                         <div className="flex items-center gap-1">
                            <a href={editingJob.pdfUrl} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                               <Eye size={16} />
                            </a>
                            <button 
                              type="button"
                              onClick={() => setEditingJob({...editingJob, pdfUrl: ''})}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
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
                      type="button" onClick={addItem}
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
                          <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 uppercase">Item</th>
                          <th className="px-2 py-2 text-center text-xs font-bold text-gray-500 uppercase w-20">Qtd</th>
                          <th className="px-2 py-2 text-center text-xs font-bold text-gray-500 uppercase w-24">R$ Unit.</th>
                          <th className="px-3 py-2 text-right text-xs font-bold text-gray-500 uppercase w-24">Total</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {jobItems.map((item, index) => (
                          <tr key={index} className="hover:bg-blue-50/30">
                            <td className="px-3 py-1">
                                <input
                                  type="text"
                                  className="w-full bg-white text-gray-900 border border-gray-400 rounded-md text-xs p-2"
                                  value={item.name}
                                  onChange={e => handleItemChange(index, 'name', e.target.value)}
                                />
                            </td>
                            <td className="px-2 py-1">
                              <input 
                                type="number" step="0.01"
                                className="w-full bg-white text-gray-900 border border-gray-400 rounded-md text-center text-xs p-2"
                                value={item.quantity || ''}
                                onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input 
                                type="number" step="0.01"
                                className="w-full bg-white text-gray-900 border border-gray-400 rounded-md text-center text-xs p-2"
                                value={item.pricePerUnit || ''}
                                onChange={e => handleItemChange(index, 'pricePerUnit', e.target.value)}
                              />
                            </td>
                            <td className="px-3 py-1 text-right text-sm font-bold text-gray-900">
                              R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                             <td className="px-1 py-1 text-center">
                                <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600 p-2">
                                  <Trash2 size={14} />
                                </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 pt-2 border-t flex items-center justify-between">
                     <span className="font-medium text-gray-600">Total:</span>
                     <span className="text-2xl font-bold text-primary">R$ {Number(editingJob.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex gap-3 mt-4">
                      {editingJob.id && (
                        <button type="button" onClick={handleDelete} className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium">Excluir</button>
                      )}
                      <div className="flex-1"></div>
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                      <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm flex items-center">
                        <Save size={18} className="mr-2" /> Salvar
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

export default Calendar;
