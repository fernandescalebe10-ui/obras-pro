import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentStatus } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Download, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';

const Financial: React.FC = () => {
  const { jobs, installers } = useApp();
  const [filterInstaller, setFilterInstaller] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Date Filters
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSelectedMonth(val);
    if (val) {
      const [year, month] = val.split('-').map(Number);
      // Create date without timezone issues for month start
      const date = new Date(year, month - 1, 1);
      setStartDate(format(startOfMonth(date), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(date), 'yyyy-MM-dd'));
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') setStartDate(value);
    else setEndDate(value);
    
    // Clear month selection if manual dates don't match a full month (simplified: just clear it to indicate custom range)
    setSelectedMonth('');
  };

  const filteredJobs = jobs.filter(job => {
    const matchInstaller = filterInstaller === 'all' || job.installerId === filterInstaller;
    const matchStatus = filterStatus === 'all' || 
                        (filterStatus === 'late' && job.paymentStatus === PaymentStatus.LATE) ||
                        (filterStatus === 'paid' && job.paymentStatus === PaymentStatus.PAID) ||
                        (filterStatus === 'pending' && job.paymentStatus === PaymentStatus.PENDING);
    
    // Date Filtering
    const jobDate = new Date(job.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    // Adjust time for inclusive comparison
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    const matchDate = (!start || jobDate >= start) && (!end || jobDate <= end);

    return matchInstaller && matchStatus && matchDate;
  });

  const totalPaid = filteredJobs.filter(j => j.paymentStatus === PaymentStatus.PAID).reduce((acc, j) => acc + j.value, 0);
  const totalPending = filteredJobs.filter(j => j.paymentStatus !== PaymentStatus.PAID).reduce((acc, j) => acc + j.value, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Controle Financeiro</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm text-gray-500 font-medium">Pagamento Efetuado</p>
               <h3 className="text-2xl font-bold text-gray-900">R$ {totalPaid.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
             </div>
             <div className="p-3 bg-green-100 rounded-full text-green-600">
               <TrendingUp size={24} />
             </div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm text-gray-500 font-medium">Pagamento Pendente</p>
               <h3 className="text-2xl font-bold text-gray-900">R$ {totalPending.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
             </div>
             <div className="p-3 bg-red-100 rounded-full text-red-600">
               <AlertTriangle size={24} />
             </div>
           </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-medium border-b pb-2">
           <Calendar size={20} className="text-primary"/>
           Filtros de Período e Categoria
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
          {/* Month Quick Select */}
          <div className="w-full">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Mês de Referência</label>
            <input 
              type="month"
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
              value={selectedMonth}
              onChange={handleMonthChange}
            />
          </div>

          {/* Start Date */}
          <div className="w-full">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Data Início</label>
            <input 
              type="date"
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
              value={startDate}
              onChange={(e) => handleDateChange('start', e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="w-full">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Data Fim</label>
            <input 
              type="date"
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
              value={endDate}
              onChange={(e) => handleDateChange('end', e.target.value)}
            />
          </div>

          {/* Installer */}
          <div className="w-full">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Instalador</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
              value={filterInstaller}
              onChange={(e) => setFilterInstaller(e.target.value)}
            >
              <option value="all">Todos</option>
              {installers.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="w-full">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Status Pagamento</label>
            <select 
               className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="paid">Pagos</option>
              <option value="pending">Pendentes</option>
              <option value="late">Atrasados</option>
            </select>
          </div>

          {/* Export Button */}
          <button className="flex items-center justify-center px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 transition-colors text-sm font-medium h-[38px]">
            <Download size={16} className="mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente / Pedido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instalador</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredJobs.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Nenhum registro encontrado para os filtros selecionados.</td></tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(job.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{job.clientName}</div>
                    <div className="text-sm text-gray-500">{job.orderNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {installers.find(i => i.id === job.installerId)?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    R$ {job.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${job.paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-800' : 
                          job.paymentStatus === PaymentStatus.LATE ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {job.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Financial;