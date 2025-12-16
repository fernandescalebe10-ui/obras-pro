import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { JobStatus, PaymentStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Wallet, AlertCircle, CheckCircle2, Sparkles, Calendar, Download } from 'lucide-react';
import { generateBusinessReport } from '../services/geminiService';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const Dashboard: React.FC = () => {
  const { jobs, installers } = useApp();
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Date Filters State
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Filter Logic
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
    const jobDate = new Date(job.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    return (!start || jobDate >= start) && (!end || jobDate <= end);
  });

  // KPIs based on filtered jobs
  const totalReceived = filteredJobs
    .filter(j => j.paymentStatus === PaymentStatus.PAID)
    .reduce((acc, j) => acc + j.value, 0);
  const totalPending = filteredJobs
    .filter(j => j.paymentStatus !== PaymentStatus.PAID)
    .reduce((acc, j) => acc + j.value, 0);

  // Chart Data based on filtered jobs
  const statusData = [
    { name: 'Agendadas', value: filteredJobs.filter(j => j.status === JobStatus.SCHEDULED).length, color: '#2563eb' },
    { name: 'Em Andamento', value: filteredJobs.filter(j => j.status === JobStatus.IN_PROGRESS).length, color: '#f59e0b' },
    { name: 'Finalizadas', value: filteredJobs.filter(j => j.status === JobStatus.FINISHED).length, color: '#10b981' },
    { name: 'Canceladas', value: filteredJobs.filter(j => j.status === JobStatus.CANCELLED).length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const paymentData = [
    { name: 'Pago', value: totalReceived },
    { name: 'Pendente', value: totalPending },
  ];

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const report = await generateBusinessReport(filteredJobs, installers);
    setAiReport(report);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-medium border-b pb-2">
           <Calendar size={20} className="text-primary"/>
           Filtros de Período
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pagamento Efetuado</dt>
                  <dd className="text-2xl font-semibold text-gray-900">R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pagamento Pendente</dt>
                  <dd className="text-2xl font-semibold text-gray-900">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                <CheckCircle2 className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Obras (Período)</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{filteredJobs.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="text-yellow-400" size={20} />
              Consultoria Inteligente (IA)
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Use a Inteligência Artificial para analisar seus dados filtrados e encontrar oportunidades de lucro.
            </p>
          </div>
          <button 
            onClick={handleAiAnalysis}
            disabled={loadingAi}
            className="px-4 py-2 bg-white text-slate-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {loadingAi ? 'Analisando...' : 'Gerar Relatório'}
          </button>
        </div>
        
        {aiReport && (
          <div className="mt-6 bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20 animate-fade-in">
             <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line">
               {aiReport}
             </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status das Obras (Período)</h3>
          {statusData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {statusData.map((d, i) => (
                  <div key={i} className="flex items-center text-sm">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: d.color }}></div>
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              Sem dados para o período selecionado.
            </div>
          )}
        </div>

        {/* Financial Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Fluxo Financeiro (Período)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent Jobs */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Obras Recentes</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {jobs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((job) => (
            <li key={job.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600 truncate">{job.clientName}</p>
                  <p className="text-sm text-gray-500">{job.description}</p>
                </div>
                <div className="flex flex-col items-end">
                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${job.status === JobStatus.FINISHED ? 'bg-green-100 text-green-800' : 
                        job.status === JobStatus.IN_PROGRESS ? 'bg-yellow-100 text-yellow-800' : 
                        job.status === JobStatus.CANCELLED ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {job.status}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">{new Date(job.date).toLocaleDateString()}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;