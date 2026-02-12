
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentStatus, Job } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Download, TrendingUp, AlertTriangle, Calendar, Printer, FileText, Share } from 'lucide-react';

const Financial: React.FC = () => {
  const { jobs, installers, getInstallerName } = useApp();
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
    setSelectedMonth('');
  };

  const filteredJobs = jobs.filter(job => {
    const matchInstaller = filterInstaller === 'all' || job.installerId === filterInstaller;
    const matchStatus = filterStatus === 'all' || 
                        (filterStatus === 'late' && job.paymentStatus === PaymentStatus.LATE) ||
                        (filterStatus === 'paid' && job.paymentStatus === PaymentStatus.PAID) ||
                        (filterStatus === 'pending' && job.paymentStatus === PaymentStatus.PENDING);
    
    const jobDateStr = format(new Date(job.date), 'yyyy-MM-dd');
    
    const matchDate = (!startDate || jobDateStr >= startDate) && (!endDate || jobDateStr <= endDate);

    return matchInstaller && matchStatus && matchDate;
  });

  const totalPaid = filteredJobs.filter(j => j.paymentStatus === PaymentStatus.PAID).reduce((acc, j) => acc + j.value, 0);
  const totalPending = filteredJobs.filter(j => j.paymentStatus !== PaymentStatus.PAID).reduce((acc, j) => acc + j.value, 0);

  const handlePrint = () => {
    window.print();
  };

  // Specific view for filtered installer report
  const isInstallerReport = filterInstaller !== 'all';

  return (
    <div className="space-y-6">
      {/* CSS for Printing */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background-color: white; }
          
          /* Ensures tables break correctly across pages */
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          
          /* Container adjustments */
          .overflow-hidden { overflow: visible !important; }
          .shadow { box-shadow: none !important; }
          .border { border: 1px solid #ddd !important; }
          
          /* Ensure backgrounds print */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold text-gray-800">Controle Financeiro</h2>
      </div>

      {/* Summary Cards (Hidden on print) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
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
      <div className="bg-white p-6 rounded-lg shadow-sm no-print">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-medium border-b pb-2">
           <Calendar size={20} className="text-primary"/>
           Filtros & Relatórios
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
          <div className="w-full">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Mês de Referência</label>
            <input 
              type="month"
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
              value={selectedMonth}
              onChange={handleMonthChange}
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Data Início</label>
            <input 
              type="date"
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
              value={startDate}
              onChange={(e) => handleDateChange('start', e.target.value)}
            />
          </div>

          <div className="w-full">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Data Fim</label>
            <input 
              type="date"
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
              value={endDate}
              onChange={(e) => handleDateChange('end', e.target.value)}
            />
          </div>

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
        </div>

        {/* Action Button Area within Filters */}
        {isInstallerReport && (
          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end items-center gap-4 bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mr-auto">
              <span className="font-semibold">{filteredJobs.length}</span> obras encontradas para <span className="font-semibold">{getInstallerName(filterInstaller)}</span>
            </div>
            <button 
              onClick={handlePrint}
              className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm font-semibold"
            >
              <FileText size={18} className="mr-2" />
              Exportar Relatório PDF
            </button>
          </div>
        )}
      </div>

      {/* Report Header (Print Only) */}
      {isInstallerReport && (
        <div className="hidden print-only mb-6">
          <div className="text-center border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold uppercase">Relatório de Produção</h1>
            <p className="text-gray-600">
              Instalador: <span className="font-bold">{getInstallerName(filterInstaller)}</span>
            </p>
            <p className="text-gray-600">
              Chave PIX: <span className="font-bold">{installers.find(i => i.id === filterInstaller)?.pixKey || 'Não informada'}</span>
            </p>
            <p className="text-sm text-gray-500">
              Período: {format(new Date(startDate), 'dd/MM/yyyy')} a {format(new Date(endDate), 'dd/MM/yyyy')}
            </p>
          </div>
          <div className="flex justify-between mb-4 bg-gray-50 p-4 rounded border">
             <div>
                <span className="block text-sm text-gray-500">Obras Realizadas</span>
                <span className="font-bold text-lg">{filteredJobs.length}</span>
             </div>
             <div>
                <span className="block text-sm text-gray-500">Valor Total</span>
                <span className="font-bold text-lg">R$ {(totalPaid + totalPending).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
             </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente / Pedido</th>
              {!isInstallerReport && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instalador</th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes Serviços</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              {!isInstallerReport && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider no-print">Status</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredJobs.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Nenhum registro encontrado.</td></tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 break-inside-avoid">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                    {format(new Date(job.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap align-top">
                    <div className="text-sm font-bold text-gray-900">{job.clientName}</div>
                    <div className="text-xs text-gray-500">Ped: {job.orderNumber}</div>
                    {job.description && (
                       <div className="text-xs text-gray-400 mt-1 italic max-w-[150px] truncate">{job.description}</div>
                    )}
                  </td>
                  {!isInstallerReport && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                      {getInstallerName(job.installerId)}
                    </td>
                  )}
                  {/* Service Details Column - usa items ou qtd_servicos para PDF/relatório */}
                  <td className="px-6 py-4 text-xs text-gray-600 align-top">
                     {(() => {
                       const displayItems = job.items && job.items.length > 0
                         ? job.items
                         : (Array.isArray(job.qtd_servicos) ? job.qtd_servicos : (job.qtd_servicos && typeof job.qtd_servicos === 'object' ? Object.values(job.qtd_servicos) : [])).map((q: any) => ({
                           name: q?.item ?? q?.name ?? '',
                           quantity: Number(q?.qtd ?? q?.quantity ?? 0) || 0,
                           pricePerUnit: Number(q?.pricePerUnit ?? 0) || 0,
                           total: Number(q?.total ?? 0) || 0
                         })).filter((i: { name: string; quantity: number }) => i.name && i.quantity > 0);
                       return displayItems.length > 0 ? (
                         <ul className="list-disc pl-4 space-y-1">
                           {displayItems.map((item: { name: string; quantity: number; pricePerUnit: number; total: number }, idx: number) => (
                             <li key={idx}>
                               {`${item.quantity} ${item.name} x R$ ${(item.pricePerUnit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = R$ ${(item.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                             </li>
                           ))}
                         </ul>
                       ) : (
                         <span className="italic text-gray-400">Sem itens detalhados</span>
                       );
                     })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold align-top">
                    R$ {job.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </td>
                  {!isInstallerReport && (
                    <td className="px-6 py-4 whitespace-nowrap align-top no-print">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${job.paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-800' : 
                            job.paymentStatus === PaymentStatus.LATE ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {job.paymentStatus}
                      </span>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {/* Footer for Report */}
          {isInstallerReport && filteredJobs.length > 0 && (
             <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                <tr>
                   <td colSpan={2} className="px-6 py-4 text-right text-gray-700">TOTAIS DO PERÍODO:</td>
                   <td className="px-6 py-4 text-left">
                      {filteredJobs.length} obras
                   </td>
                   <td className="px-6 py-4 text-left text-xl text-primary">
                      R$ {filteredJobs.reduce((acc, j) => acc + j.value, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                   </td>
                </tr>
             </tfoot>
          )}
        </table>
      </div>
      
      {/* Signature Section (Print Only) */}
      {isInstallerReport && (
        <div className="hidden print-only mt-12 pt-8 border-t border-gray-300">
           <div className="flex justify-between px-12">
              <div className="text-center">
                 <div className="w-64 border-t border-black mb-2"></div>
                 <p>{getInstallerName(filterInstaller)}</p>
                 <p className="text-xs text-gray-500">Assinatura do Instalador</p>
              </div>
              <div className="text-center">
                 <div className="w-64 border-t border-black mb-2"></div>
                 <p>Gestor Responsável</p>
                 <p className="text-xs text-gray-500">Assinatura da Empresa</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Financial;
