
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

          // PostgreSQL/Supabase podem retornar colunas em minúsculas (ordernumber, clientname)
          const col = (row: any, key: string) => row[key] ?? row[key.toLowerCase()];
          const mapped = jobsData.map((r: any) => {
            let items: JobItem[] | undefined = undefined;
            const qtdServicos = r.qtd_servicos;
            if (qtdServicos && Array.isArray(qtdServicos)) {
              items = [];
              qtdServicos.forEach((q: any) => {
                const name = q.item ?? q.name ?? '';
                const qtd = Number(q.qtd ?? q.quantity ?? 0);
                const service = servicesMap.get(name);
                const pricePerUnit = q.pricePerUnit != null ? Number(q.pricePerUnit) : (service?.defaultPrice ?? 0);
                const total = q.total != null ? Number(q.total) : qtd * pricePerUnit;
                if (name && (qtd > 0 || total > 0)) {
                  items.push({
                    name,
                    quantity: qtd,
                    pricePerUnit,
                    total
                  });
                }
              });
            }
            // Se o banco retornar items (jsonb) completo, usar
            if (r.items && Array.isArray(r.items) && r.items.length > 0) {
              items = r.items.map((i: any) => ({
                name: i.name || '',
                quantity: Number(i.quantity) || 0,
                pricePerUnit: Number(i.pricePerUnit) || 0,
                total: Number(i.total) || 0
              }));
            }

            return {
              id: r.id,
              cityId: col(r, 'cityId') != null ? Number(col(r, 'cityId')) : 1,
              orderNumber: col(r, 'orderNumber') || '',
              clientName: col(r, 'clientName') || '',
              address: col(r, 'address') || '',
              date: col(r, 'date') ? new Date(col(r, 'date')).toISOString() : new Date().toISOString(),
              description: col(r, 'description') || '',
              value: col(r, 'value') !== undefined && col(r, 'value') !== null ? Number(col(r, 'value')) : 0,
              status: (col(r, 'status') as JobStatus) || JobStatus.SCHEDULED,
              paymentStatus: (col(r, 'paymentStatus') as PaymentStatus) || PaymentStatus.PENDING,
              installerId: col(r, 'installerId') || '',
              items: items,
              qtd_servicos: qtdServicos || undefined,
              notes: col(r, 'notes') || undefined
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
    try {
      // Busca no Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        console.warn('Login failed:', error?.message);
        return false;
      }

      // Mapeia para o tipo User
      const user: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        cityId: data.cityId,
      };
      setUser(user);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => setUser(null);

  // Mapeia status/pagamento (pt-BR) para valores do banco
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

  // Payload para a tabela jobs no Supabase (apenas colunas que existem na tabela)
  const buildJobPayload = (job: Job) => {
    const qtd_servicos =
      job.items && job.items.length > 0
        ? job.items
            .filter(i => (i.quantity ?? 0) > 0 || (i.pricePerUnit ?? 0) > 0)
            .map(i => ({
              item: String(i.name ?? ''),
              qtd: Number(i.quantity) || 0,
              pricePerUnit: Number(i.pricePerUnit) || 0,
              total: Number(i.total) || 0
            }))
        : [];
    const payload: Record<string, unknown> = {
      id: job.id,
      cityId: job.cityId,
      orderNumber: job.orderNumber ?? '',
      clientName: job.clientName,
      address: job.address ?? '',
      date: job.date,
      description: job.description ?? '',
      value: Number(job.value ?? 0),
      status: mapStatusToDb(job.status),
      paymentStatus: mapPaymentToDb(job.paymentStatus),
      installerId: job.installerId,
      qtd_servicos: qtd_servicos.length > 0 ? qtd_servicos : null,
      notes: job.notes ?? null
    };
    delete payload.pdfName;
    delete payload.pdfUrl;
    delete payload.photoUrl; // coluna não existe na tabela jobs
    return payload;
  };

  // CRUD Helpers com injeção de CityId
  const addJob = (job: Job) => {
    if (!user) return;
    const toInsert = { ...job, cityId: user.cityId };
    (async () => {
      try {
        const payload = buildJobPayload(toInsert);
        const { data, error } = await supabase.from('jobs').insert([payload]).select().single();
        if (error) {
          console.error('Supabase insert job failed:', error.message, error.details);
          setAllJobs(prev => [{ ...toInsert }, ...prev]);
        } else {
          const inserted = data as any;
          setAllJobs(prev => [{ ...toInsert, id: inserted?.id ?? toInsert.id }, ...prev]);
        }
      } catch (e) {
        console.error('addJob exception', e);
        setAllJobs(prev => [{ ...toInsert }, ...prev]);
      }
    })();
  };

  const updateJob = (updatedJob: Job) => {
    (async () => {
      try {
        const payload = buildJobPayload(updatedJob);
        const { data, error } = await supabase.from('jobs').update(payload).eq('id', updatedJob.id).select().single();
        if (error) {
          console.warn('Supabase update job failed', error);
          setAllJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
        } else {
          setAllJobs(prev => prev.map(j => j.id === updatedJob.id ? { ...updatedJob } : j));
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
