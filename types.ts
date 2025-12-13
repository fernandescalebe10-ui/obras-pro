
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

export interface Installer {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  active: boolean;
}

export interface JobItem {
  name: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface Job {
  id: string;
  orderNumber: string;
  clientName: string;
  address: string;
  date: string; // ISO String
  description: string; // Used as Service Order details
  value: number;
  status: JobStatus;
  paymentStatus: PaymentStatus;
  installerId: string;
  items?: JobItem[]; // Detailed items
  photoUrl?: string; // Base64 string for the photo
  notes?: string;
}

export interface KPI {
  totalRevenue: number;
  totalPending: number;
  totalJobs: number;
  jobsThisMonth: number;
}
