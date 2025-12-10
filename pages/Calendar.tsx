import React from 'react';
import { useApp } from '../context/AppContext';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { JobStatus } from '../types';

const Calendar: React.FC = () => {
  const { jobs } = useApp();
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.SCHEDULED: return 'bg-blue-100 text-blue-800 border-blue-200';
      case JobStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case JobStatus.FINISHED: return 'bg-green-100 text-green-800 border-green-200';
      case JobStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 capitalize">
          {format(today, 'MMMM yyyy', { locale: ptBR })}
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="py-2 text-center text-sm font-semibold text-gray-600 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px border-b border-gray-200">
          {calendarDays.map((day, dayIdx) => {
            const dayJobs = jobs.filter(job => isSameDay(new Date(job.date), day));
            return (
              <div 
                key={day.toString()} 
                className={`bg-white min-h-[120px] p-2 relative ${!isSameMonth(day, monthStart) ? 'bg-gray-50' : ''}`}
              >
                <time 
                  dateTime={format(day, 'yyyy-MM-dd')} 
                  className={`
                    text-xs font-semibold rounded-full w-7 h-7 flex items-center justify-center
                    ${isSameDay(day, today) ? 'bg-primary text-white' : 'text-gray-700'}
                  `}
                >
                  {format(day, 'd')}
                </time>
                
                <div className="mt-2 space-y-1">
                  {dayJobs.map(job => (
                    <div 
                      key={job.id} 
                      className={`
                        text-xs p-1 rounded border truncate cursor-pointer hover:opacity-80 transition-opacity
                        ${getStatusColor(job.status)}
                      `}
                      title={`${format(new Date(job.date), 'HH:mm')} - ${job.clientName}`}
                    >
                      <span className="font-bold mr-1">{format(new Date(job.date), 'HH:mm')}</span>
                      {job.clientName}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;