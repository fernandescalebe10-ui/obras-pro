import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Job, Installer, JobStatus, PaymentStatus, ServiceDefinition } from '../types';
import { INITIAL_INSTALLERS, INITIAL_JOBS, INITIAL_SERVICES } from '../constants';
import { supabase } from '../services/supabase';

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
    // Insert into Supabase and update local state
    (async () => {
      try {
        const { error } = await supabase.from('jobs').insert([job]);
        if (error) throw error;
        setJobs(prev => [job, ...prev]);
      } catch (err) {
        console.error('Failed to add job to Supabase:', err);
        // Fallback to local update
        setJobs(prev => [job, ...prev]);
      }
    })();
  };

  const updateJob = (updatedJob: Job) => {
    (async () => {
      try {
        const { error } = await supabase.from('jobs').update(updatedJob).eq('id', updatedJob.id);
        if (error) throw error;
        setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
      } catch (err) {
        console.error('Failed to update job in Supabase:', err);
        setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
      }
    })();
  };

  const deleteJob = (id: string) => {
    (async () => {
      try {
        const { error } = await supabase.from('jobs').delete().eq('id', id);
        if (error) throw error;
        setJobs(prev => prev.filter(j => j.id !== id));
      } catch (err) {
        console.error('Failed to delete job from Supabase:', err);
        setJobs(prev => prev.filter(j => j.id !== id));
      }
    })();
  };

  const addInstaller = (installer: Installer) => {
    (async () => {
      try {
        const { error } = await supabase.from('installers').insert([installer]);
        if (error) throw error;
        setInstallers(prev => [...prev, installer]);
      } catch (err) {
        console.error('Failed to add installer to Supabase:', err);
        setInstallers(prev => [...prev, installer]);
      }
    })();
  };

  const updateInstaller = (updatedInstaller: Installer) => {
    (async () => {
      try {
        const { error } = await supabase.from('installers').update(updatedInstaller).eq('id', updatedInstaller.id);
        if (error) throw error;
        setInstallers(prev => prev.map(i => i.id === updatedInstaller.id ? updatedInstaller : i));
      } catch (err) {
        console.error('Failed to update installer in Supabase:', err);
        setInstallers(prev => prev.map(i => i.id === updatedInstaller.id ? updatedInstaller : i));
      }
    })();
  };

  const deleteInstaller = (id: string) => {
    (async () => {
      try {
        const { error } = await supabase.from('installers').delete().eq('id', id);
        if (error) throw error;
        setInstallers(prev => prev.filter(i => i.id !== id));
      } catch (err) {
        console.error('Failed to delete installer from Supabase:', err);
        setInstallers(prev => prev.filter(i => i.id !== id));
      }
    })();
  };

  const getInstallerName = (id: string) => {
    const inst = installers.find(i => i.id === id);
    return inst ? inst.name : 'Desconhecido';
  };

  // Service Operations
  const addService = (service: ServiceDefinition) => {
    (async () => {
      try {
        const { error } = await supabase.from('services').insert([service]);
        if (error) throw error;
        setServices(prev => [...prev, service]);
      } catch (err) {
        console.error('Failed to add service to Supabase:', err);
        setServices(prev => [...prev, service]);
      }
    })();
  };

  const updateService = (updatedService: ServiceDefinition) => {
    (async () => {
      try {
        const { error } = await supabase.from('services').update(updatedService).eq('id', updatedService.id);
        if (error) throw error;
        setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
      } catch (err) {
        console.error('Failed to update service in Supabase:', err);
        setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
      }
    })();
  };

  const deleteService = (id: string) => {
    (async () => {
      try {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) throw error;
        setServices(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        console.error('Failed to delete service from Supabase:', err);
        setServices(prev => prev.filter(s => s.id !== id));
      }
    })();
  };

  // Load data from Supabase on mount (if configured)
  useEffect(() => {
    const load = async () => {
      try {
        // Jobs
        const { data: jobsData, error: jobsError } = await supabase.from('jobs').select('*').order('date', { ascending: false });
        if (jobsError) throw jobsError;
        if (jobsData) setJobs(jobsData as Job[]);

        // Installers
        const { data: installersData, error: installersError } = await supabase.from('installers').select('*');
        if (installersError) throw installersError;
        if (installersData) setInstallers(installersData as Installer[]);

        // Services
        const { data: servicesData, error: servicesError } = await supabase.from('services').select('*');
        if (servicesError) throw servicesError;
        if (servicesData) setServices(servicesData as ServiceDefinition[]);
      } catch (err) {
        console.warn('Could not load data from Supabase (falling back to local data):', err);
      }
    };
    load();
  }, []);

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