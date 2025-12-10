import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, 
  addMonths, subMonths, isWeekend
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Job, JobStatus, PaymentStatus } from '../types';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Save } from 'lucide-react';

const Calendar: React.FC = () => {
  const { jobs, installers, addJob, updateJob, deleteJob } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<Job> | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{date: Date, installerId: string} | null>(null);

  // Calendar Generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Helpers
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
      case JobStatus.IN_PROGRESS: return 'bg-orange-100 border-l-4 border-orange-500 text-orange-900'; // Similar to image orange
      case JobStatus.FINISHED: return 'bg-green-100 border-l-4 border-green-500 text-green-900';
      case JobStatus.CANCELLED: return 'bg-red-500 text-white'; // Similar to image red
      default: return 'bg-gray-50 text-gray-800';
    }
  };

  // Interaction Handlers
  const handleCellClick = (date: Date, installerId: string) => {
    setSelectedSlot({ date, installerId });
    setEditingJob({
      status: JobStatus.SCHEDULED,
      paymentStatus: PaymentStatus.PENDING,
      value: 0
    });
    setIsModalOpen(true);
  };

  const handleJobClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation(); // Prevent triggering cell click
    setEditingJob({ ...job });
    setSelectedSlot(null); // We are editing, not creating from slot
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    if (editingJob.id) {
      // Update existing
      updateJob(editingJob as Job);
    } else if (selectedSlot) {
      // Create new
      const newJob: Job = {
        id: Date.now().toString(),
        installerId: selectedSlot.installerId,
        date: selectedSlot.date.toISOString(),
        clientName: editingJob.clientName || 'Novo Cliente',
        orderNumber: editingJob.orderNumber || 'S/N',
        description: editingJob.description || '',
        value: Number(editingJob.value) || 0,
        status: editingJob.status as JobStatus || JobStatus.SCHEDULED,
        paymentStatus: editingJob.paymentStatus as PaymentStatus || PaymentStatus.PENDING,
        address: '',
        notes: ''
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
      {/* Header */}
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

      {/* Spreadsheet / Matrix View */}
      <div className="flex-1 overflow-auto bg-white shadow rounded-lg border border-gray-200 relative">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-r border-gray-300 min-w-[200px] sticky left-0 bg-gray-100 z-20">
                Data
              </th>
              {installers.filter(i => i.active).map(installer => (
                <th key={installer.id} className="p-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-r border-gray-300 min-w-[180px]">
                  {installer.name}
                  <div className="text-[10px] text-gray-400 font-normal">{installer.specialty}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {calendarDays.map((day) => {
              const isWeekendDay = isWeekend(day);
              const rowClass = isWeekendDay ? 'bg-slate-50' : 'bg-white';
              
              return (
                <tr key={day.toISOString()} className={rowClass}>
                  {/* Date Column (Sticky) */}
                  <td className={`p-3 text-sm border-r border-gray-200 sticky left-0 z-10 ${rowClass} font-medium text-gray-700`}>
                    <div className="capitalize">{format(day, 'EEEE', { locale: ptBR })}</div>
                    <div className="text-xs text-gray-500">{format(day, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
                  </td>

                  {/* Installer Columns */}
                  {installers.filter(i => i.active).map(installer => {
                    const cellJobs = getJobsForCell(day, installer.id);
                    return (
                      <td 
                        key={`${day}-${installer.id}`} 
                        className="p-1 border-r border-gray-200 align-top min-h-[80px] hover:bg-blue-50/50 transition-colors cursor-pointer relative group"
                        onClick={() => handleCellClick(day, installer.id)}
                      >
                        <div className="min-h-[60px] flex flex-col gap-1">
                          {cellJobs.length > 0 ? (
                            cellJobs.map(job => (
                              <div 
                                key={job.id}
                                onClick={(e) => handleJobClick(e, job)}
                                className={`p-2 text-xs shadow-sm rounded cursor-pointer hover:opacity-90 transition-opacity border ${getStatusStyle(job.status)}`}
                              >
                                <div className="font-bold truncate">{job.clientName}</div>
                                <div className="truncate opacity-90">{job.orderNumber}</div>
                                {job.value > 0 && <div className="mt-1 font-mono opacity-75">R$ {job.value}</div>}
                              </div>
                            ))
                          ) : (
                            <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Plus size={16} className="text-blue-300" />
                            </div>
                          )}
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

      {/* Edit/Create Modal */}
      {isModalOpen && editingJob && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {editingJob.id ? 'Editar Agendamento' : 'Novo Agendamento'}
                </h3>
                <p className="text-sm text-gray-500">
                   {selectedSlot 
                      ? `${format(selectedSlot.date, "dd 'de' MMMM", { locale: ptBR })} - ${installers.find(i => i.id === selectedSlot.installerId)?.name}`
                      : `${format(new Date(editingJob.date!), "dd/MM/yyyy HH:mm")} - ${installers.find(i => i.id === editingJob.installerId)?.name}`
                   }
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cliente / Obra</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                  value={editingJob.clientName || ''}
                  onChange={e => setEditingJob({...editingJob, clientName: e.target.value})}
                  placeholder="Nome do cliente ou local"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nº Pedido</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                    value={editingJob.orderNumber || ''}
                    onChange={e => setEditingJob({...editingJob, orderNumber: e.target.value})}
                    placeholder="Ex: 19537"
                  />
                </div>
                <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-1">Valor (R$)</label>
                   <input 
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                    value={editingJob.value || 0}
                    onChange={e => setEditingJob({...editingJob, value: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(JobStatus).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setEditingJob({...editingJob, status: status})}
                      className={`px-3 py-2 text-sm rounded-md border text-left transition-colors
                        ${editingJob.status === status 
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium ring-1 ring-blue-500' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Observações</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                    rows={2}
                    value={editingJob.description || ''}
                    onChange={e => setEditingJob({...editingJob, description: e.target.value})}
                    placeholder="Detalhes adicionais..."
                  />
              </div>

              <div className="pt-4 flex gap-3 border-t mt-4">
                {editingJob.id && (
                  <button 
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors"
                  >
                    Excluir
                  </button>
                )}
                <div className="flex-1"></div>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm flex items-center"
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

export default Calendar;