import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Job, Installer, JobStatus, PaymentStatus } from '../types';
import { INITIAL_INSTALLERS, INITIAL_JOBS } from '../constants';

interface AppContextType {
  jobs: Job[];
  installers: Installer[];
  addJob: (job: Job) => void;
  updateJob: (job: Job) => void;
  deleteJob: (id: string) => void;
  addInstaller: (installer: Installer) => void;
  getInstallerName: (id: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Simulate database with local state. In a real app, this would be an API call.
  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem('app_jobs');
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });

  const [installers, setInstallers] = useState<Installer[]>(() => {
    const saved = localStorage.getItem('app_installers');
    return saved ? JSON.parse(saved) : INITIAL_INSTALLERS;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('app_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('app_installers', JSON.stringify(installers));
  }, [installers]);

  const addJob = (job: Job) => {
    setJobs(prev => [job, ...prev]);
  };

  const updateJob = (updatedJob: Job) => {
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
  };

  const deleteJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const addInstaller = (installer: Installer) => {
    setInstallers(prev => [...prev, installer]);
  };

  const getInstallerName = (id: string) => {
    const inst = installers.find(i => i.id === id);
    return inst ? inst.name : 'Desconhecido';
  };

  return (
    <AppContext.Provider value={{
      jobs,
      installers,
      addJob,
      updateJob,
      deleteJob,
      addInstaller,
      getInstallerName
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};