
export interface City {
  id: number;
  name: string;
}

export enum JobStatus {
  SCHEDULED = 'Agendada',
  IN_PROGRESS = 'Em andamento',
  FINISHED = 'Finalizada',
  CANCELLED = 'Cancelada'
}

export enum PaymentStatus {
  PAID = 'Pago',
  PENDING = 'Pendente',
  LATE = 'Atrasado'
}

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string; // Simulação de senha para o login
  cityId: number;
}

export interface Installer {
  id: string;
  cityId: number; // Chave estrangeira para City
  name: string;
  phone: string;
  specialty: string;
  active: boolean;
  photoUrl?: string;
  pixKey?: string;
}

export interface ServiceDefinition {
  id: string;
  cityId: number; // Chave estrangeira para City
  name: string;
  defaultPrice: number;
}

export interface JobItem {
  name: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface Job {
  id: string;
  cityId: number; // Chave estrangeira para City
  orderNumber: string;
  clientName: string;
  address: string;
  date: string; 
  description: string;
  value: number;
  status: JobStatus;
  paymentStatus: PaymentStatus;
  installerId: string;
  items?: JobItem[]; 
  photoUrl?: string;
  pdfUrl?: string;
  pdfName?: string;
  notes?: string;
}

export interface KPI {
  totalRevenue: number;
  totalPending: number;
  totalJobs: number;
  jobsThisMonth: number;
}
