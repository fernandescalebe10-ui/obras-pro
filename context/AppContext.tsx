
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Job, Installer, JobStatus, PaymentStatus, ServiceDefinition, User, City } from '../types';
import { DB_CITIES, DB_USERS, INITIAL_INSTALLERS, INITIAL_JOBS, INITIAL_SERVICES } from '../constants';
import supabase from '../services/supabase';

interface AppContextType {
  // Dados filtrados pela cidade do usuário
  jobs: Job[];
  installers: Installer[];
  services: ServiceDefinition[];
  
  // Estado Global
  user: User | null;
  cities: City[];
  isAuthenticated: boolean;
  
  // Ações
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  // CRUDs (Sempre injetando o cityId do usuário logado)
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
  reorderInstallers: (order: string[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // "Tabelas" Globais no LocalStorage
  const [allJobs, setAllJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem('db_jobs');
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });

  const [allInstallers, setAllInstallers] = useState<Installer[]>(() => {
    const saved = localStorage.getItem('db_installers');
    return saved ? JSON.parse(saved) : INITIAL_INSTALLERS;
  });

  const [allServices, setAllServices] = useState<ServiceDefinition[]>(() => {
    const saved = localStorage.getItem('db_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  // Carrega dados do Supabase ao montar (se disponível) e mapeia para os tipos locais
  useEffect(() => {
    const loadFromSupabase = async () => {
      try {
        // Installers
        const { data: installersData, error: installersError } = await supabase.from('installers').select('*');
        if (installersError) console.warn('Supabase installers error', installersError);
        if (installersData) {
          const mapped = installersData.map((r: any) => ({
            id: r.id,
            cityId: r.cityId ? Number(r.cityId) : 1,
            name: r.name || '',
            phone: r.phone || '',
            specialty: r.specialty || '',
            active: r.active === undefined ? true : !!r.active,
            photoUrl: r.photoUrl,
            pixKey: r.pixKey
          } as Installer));
          setAllInstallers(mapped);
        }

        // Services
        const { data: servicesData, error: servicesError } = await supabase.from('services').select('*');
        if (servicesError) console.warn('Supabase services error', servicesError);
        if (servicesData) {
          const mapped = servicesData.map((r: any) => ({
            id: r.id,
            cityId: r.cityId ? Number(r.cityId) : 1,
            name: r.name || '',
            defaultPrice: r.defaultPrice !== undefined ? Number(r.defaultPrice) : 0
          } as ServiceDefinition));
          setAllServices(mapped);
        }

        // Jobs
        const { data: jobsData, error: jobsError } = await supabase.from('jobs').select('*');
        if (jobsError) console.warn('Supabase jobs error', jobsError);
        if (jobsData) {
          // Create services map for reconstruction
          const servicesMap = new Map<string, ServiceDefinition>();
          if (servicesData) {
            servicesData.forEach((r: any) => {
              const service: ServiceDefinition = {
                id: r.id,
                cityId: r.cityId ? Number(r.cityId) : 1,
                name: r.name || '',
                defaultPrice: r.defaultPrice !== undefined ? Number(r.defaultPrice) : 0
              };
              servicesMap.set(service.name, service);
            });
          }

          const mapped = jobsData.map((r: any) => {
            let items: JobItem[] | undefined = undefined;
            if (r.qtd_serviços) {
              items = [];
              r.qtd_serviços.forEach((q: any) => {
                const service = servicesMap.get(q.item);
                if (service && q.qtd > 0) {
                  items.push({
                    name: service.name,
                    quantity: q.qtd,
                    pricePerUnit: service.defaultPrice,
                    total: q.qtd * service.defaultPrice
                  });
                }
              });
            }

            return {
              id: r.id,
              cityId: r.cityId ? Number(r.cityId) : 1,
              orderNumber: r.orderNumber || '',
              clientName: r.clientName || '',
              address: r.address || '',
              date: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
              description: r.description || '',
              value: r.value !== undefined ? Number(r.value) : 0,
              status: (r.status as JobStatus) || JobStatus.SCHEDULED,
              paymentStatus: (r.paymentStatus as PaymentStatus) || PaymentStatus.PENDING,
              installerId: r.installerId || '',
              items: items,
              qtd_serviços: r.qtd_serviços || undefined,
              photoUrl: r.photoUrl || undefined,
              pdfUrl: r.pdfUrl || undefined,
              pdfName: r.pdfName || undefined,
              notes: r.notes || undefined
            } as Job;
          });
          setAllJobs(mapped);
        }
      } catch (err) {
        console.warn('Error loading from Supabase', err);
      }
    };

    loadFromSupabase();
  }, []);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('session_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Persistência das "Tabelas"
  useEffect(() => localStorage.setItem('db_jobs', JSON.stringify(allJobs)), [allJobs]);
  useEffect(() => localStorage.setItem('db_installers', JSON.stringify(allInstallers)), [allInstallers]);
  useEffect(() => localStorage.setItem('db_services', JSON.stringify(allServices)), [allServices]);
  useEffect(() => {
    if (user) localStorage.setItem('session_user', JSON.stringify(user));
    else localStorage.removeItem('session_user');
  }, [user]);

  // Filtros Relacionais baseados no Usuário Logado
  const jobs = allJobs.filter(j => j.cityId === user?.cityId);
  const installers = allInstallers.filter(i => i.cityId === user?.cityId);
  const services = allServices.filter(s => s.cityId === user?.cityId);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Busca na "Tabela" de Usuários
    const foundUser = DB_USERS.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  // CRUD Helpers com injeção de CityId
  const addJob = (job: Job) => {
    if (!user) return;
    const toInsert = { ...job, cityId: user.cityId };
    // Tenta persistir no Supabase, se falhar usa o local
    (async () => {
      try {
        const payload = { ...toInsert } as any;
        // keep cityId and installerId as-is (do not modify)
        // Map localized enums to DB enum values
        const mapStatusToDb = (s: any) => {
          switch (s) {
            case JobStatus.IN_PROGRESS: return 'IN_PROGRESS';
            case JobStatus.FINISHED: return 'FINISHED';
            case JobStatus.CANCELLED: return 'CANCELLED';
            default: return 'SCHEDULED';
          }
        };
        const mapPaymentToDb = (p: any) => {
          switch (p) {
            case PaymentStatus.PAID: return 'PAID';
            case PaymentStatus.LATE: return 'LATE';
            default: return 'PENDING';
          }
        };
        if (payload.status !== undefined) payload.status = mapStatusToDb(payload.status);
        if (payload.paymentStatus !== undefined) {
          payload.paymentStatus = mapPaymentToDb(payload.paymentStatus);
        }
        // Create qtd_serviços from items
        if (toInsert.items) {
          payload.qtd_serviços = toInsert.items.filter(i => i.quantity > 0).map(i => ({item: i.name, qtd: i.quantity}));
        }
        // remover campos que não existem na tabela jobs
        delete payload.items;
        delete payload.photoUrl;
        delete payload.notes;
        const { data, error } = await supabase.from('jobs').insert([payload]).select().single();
        if (error) {
          console.warn('Supabase insert job failed', error);
          setAllJobs(prev => [{ ...toInsert }, ...prev]);
        } else {
          setAllJobs(prev => [{ ...data }, ...prev]);
        }
      } catch (e) {
        console.warn(e);
        setAllJobs(prev => [{ ...toInsert }, ...prev]);
      }
    })();
  };

  const updateJob = (updatedJob: Job) => {
    (async () => {
      try {
        const payload = { ...updatedJob } as any;
        // keep cityId and installerId as-is (do not modify)
        // Map localized enums to DB enum values
        const mapStatusToDb = (s: any) => {
          switch (s) {
            case JobStatus.IN_PROGRESS: return 'IN_PROGRESS';
            case JobStatus.FINISHED: return 'FINISHED';
            case JobStatus.CANCELLED: return 'CANCELLED';
            default: return 'SCHEDULED';
          }
        };
        const mapPaymentToDb = (p: any) => {
          switch (p) {
            case PaymentStatus.PAID: return 'PAID';
            case PaymentStatus.LATE: return 'LATE';
            default: return 'PENDING';
          }
        };
        if (payload.status !== undefined) payload.status = mapStatusToDb(payload.status);
        if (payload.paymentStatus !== undefined) {
          payload.paymentStatus = mapPaymentToDb(payload.paymentStatus);
        }
        // Create qtd_serviços from items
        if (updatedJob.items) {
          payload.qtd_serviços = updatedJob.items.filter(i => i.quantity > 0).map(i => ({item: i.name, qtd: i.quantity}));
        }
        // remover campos que não existem na tabela jobs
        delete payload.items;
        delete payload.photoUrl;
        delete payload.notes;
        const { data, error } = await supabase.from('jobs').update(payload).eq('id', updatedJob.id).select().single();
        if (error) {
          console.warn('Supabase update job failed', error);
          setAllJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
        } else {
          setAllJobs(prev => prev.map(j => j.id === (data as any).id ? (data as Job) : j));
        }
      } catch (e) {
        console.warn(e);
        setAllJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
      }
    })();
  };

  const deleteJob = (id: string) => {
    (async () => {
      try {
        const { error } = await supabase.from('jobs').delete().eq('id', id);
        if (error) {
          console.warn('Supabase delete job failed', error);
          setAllJobs(prev => prev.filter(j => j.id !== id));
        } else {
          setAllJobs(prev => prev.filter(j => j.id !== id));
        }
      } catch (e) {
        console.warn(e);
        setAllJobs(prev => prev.filter(j => j.id !== id));
      }
    })();
  };

  const addInstaller = (installer: Installer) => {
    if (!user) return;
    const toInsert = { ...installer, cityId: user.cityId };
    (async () => {
      try {
        const payload = { ...toInsert } as any;
        // remover campos que não existem na tabela installers
        delete payload.photoUrl;
        const { data, error } = await supabase.from('installers').insert([payload]).select().single();
        if (error) {
          console.warn('Supabase insert installer failed', error);
          setAllInstallers(prev => [...prev, toInsert]);
        } else {
          setAllInstallers(prev => [...prev, data as Installer]);
        }
      } catch (e) {
        console.warn(e);
        setAllInstallers(prev => [...prev, toInsert]);
      }
    })();
  };

  const updateInstaller = (updated: Installer) => {
    (async () => {
      try {
        const payload = { ...updated } as any;
        // remover campos que não existem na tabela installers
        delete payload.photoUrl;
        const { data, error } = await supabase.from('installers').update(payload).eq('id', updated.id).select().single();
        if (error) {
          console.warn('Supabase update installer failed', error);
          setAllInstallers(prev => prev.map(i => i.id === updated.id ? updated : i));
        } else {
          setAllInstallers(prev => prev.map(i => i.id === (data as any).id ? (data as Installer) : i));
        }
      } catch (e) {
        console.warn(e);
        setAllInstallers(prev => prev.map(i => i.id === updated.id ? updated : i));
      }
    })();
  };

  const deleteInstaller = (id: string) => {
    (async () => {
      try {
        const { error } = await supabase.from('installers').delete().eq('id', id);
        if (error) {
          console.warn('Supabase delete installer failed', error);
          setAllInstallers(prev => prev.filter(i => i.id !== id));
        } else {
          setAllInstallers(prev => prev.filter(i => i.id !== id));
        }
      } catch (e) {
        console.warn(e);
        setAllInstallers(prev => prev.filter(i => i.id !== id));
      }
    })();
  };

  const getInstallerName = (id: string) => {
    const inst = allInstallers.find(i => i.id === id);
    return inst ? inst.name : 'Desconhecido';
  };

  const addService = (service: ServiceDefinition) => {
    if (!user) return;
    const toInsert = { ...service, cityId: user.cityId };
    (async () => {
      try {
        const { data, error } = await supabase.from('services').insert([toInsert]).select().single();
        if (error) {
          console.warn('Supabase insert service failed', error);
          setAllServices(prev => [...prev, toInsert]);
        } else {
          setAllServices(prev => [...prev, data as ServiceDefinition]);
        }
      } catch (e) {
        console.warn(e);
        setAllServices(prev => [...prev, toInsert]);
      }
    })();
  };

  const updateService = (updated: ServiceDefinition) => {
    (async () => {
      try {
        const { data, error } = await supabase.from('services').update(updated).eq('id', updated.id).select().single();
        if (error) {
          console.warn('Supabase update service failed', error);
          setAllServices(prev => prev.map(s => s.id === updated.id ? updated : s));
        } else {
          setAllServices(prev => prev.map(s => s.id === (data as any).id ? (data as ServiceDefinition) : s));
        }
      } catch (e) {
        console.warn(e);
        setAllServices(prev => prev.map(s => s.id === updated.id ? updated : s));
      }
    })();
  };

  const deleteService = (id: string) => {
    (async () => {
      try {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) {
          console.warn('Supabase delete service failed', error);
          setAllServices(prev => prev.filter(s => s.id !== id));
        } else {
          setAllServices(prev => prev.filter(s => s.id !== id));
        }
      } catch (e) {
        console.warn(e);
        setAllServices(prev => prev.filter(s => s.id !== id));
      }
    })();
  };

  const reorderInstallers = (order: string[]) => {
    if (!user) return;
    setAllInstallers(prev => {
      const cityId = user.cityId;
      const others = prev.filter(i => i.cityId !== cityId);
      const cityInstallers = prev.filter(i => i.cityId === cityId);
      const map = new Map(cityInstallers.map(i => [i.id, i]));
      const reordered = order.map(id => map.get(id)).filter(Boolean) as Installer[];
      const remaining = cityInstallers.filter(i => !order.includes(i.id));
      return [...others, ...reordered, ...remaining];
    });
  };

  return (
    <AppContext.Provider value={{
      jobs,
      installers,
      services,
      user,
      cities: DB_CITIES,
      isAuthenticated: !!user,
      login,
      logout,
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
      ,
      reorderInstallers
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
