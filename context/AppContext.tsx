import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Job, Installer, JobStatus, PaymentStatus, ServiceDefinition } from '../types';
import { INITIAL_INSTALLERS, INITIAL_JOBS, INITIAL_SERVICES } from '../constants';

interface AppContextType {
  jobs: Job[];
  installers: Installer[];
  services: ServiceDefinition[];
  addJob: (job: Job) => void;
  updateJob: (job: Job) => void;
  deleteJob: (id: string) => void;
  addInstaller: (installer: Installer) => void;
  updateInstaller: (installer: Installer) => void;
  deleteInstaller: (id: string) => void;
  getInstallerName: (id: string) => string;
  addService: (service: ServiceDefinition) => void;
  updateService: (service: ServiceDefinition) => void;
  deleteService: (id: string) => void;
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

  const [services, setServices] = useState<ServiceDefinition[]>(() => {
    const saved = localStorage.getItem('app_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('app_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('app_installers', JSON.stringify(installers));
  }, [installers]);

  useEffect(() => {
    localStorage.setItem('app_services', JSON.stringify(services));
  }, [services]);

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

  const updateInstaller = (updatedInstaller: Installer) => {
    setInstallers(prev => prev.map(i => i.id === updatedInstaller.id ? updatedInstaller : i));
  };

  const deleteInstaller = (id: string) => {
    setInstallers(prev => prev.filter(i => i.id !== id));
  };

  const getInstallerName = (id: string) => {
    const inst = installers.find(i => i.id === id);
    return inst ? inst.name : 'Desconhecido';
  };

  // Service Operations
  const addService = (service: ServiceDefinition) => {
    setServices(prev => [...prev, service]);
  };

  const updateService = (updatedService: ServiceDefinition) => {
    setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  return (
    <AppContext.Provider value={{
      jobs,
      installers,
      services,
      addJob,
      updateJob,
      deleteJob,
      addInstaller,
      updateInstaller,
      deleteInstaller,
      getInstallerName,
      addService,
      updateService,
      deleteService
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