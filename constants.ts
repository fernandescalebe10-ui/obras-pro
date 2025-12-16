import { Installer, Job, JobStatus, PaymentStatus, ServiceDefinition } from './types';

export const INITIAL_INSTALLERS: Installer[] = [
  { id: '1', name: 'Carlos Silva', phone: '(11) 99999-1234', specialty: 'Elétrica', active: true },
  { id: '2', name: 'João Santos', phone: '(11) 98888-4321', specialty: 'Hidráulica', active: true },
  { id: '3', name: 'Marcos Oliveira', phone: '(11) 97777-5678', specialty: 'Geral', active: true },
];

export const INITIAL_SERVICES: ServiceDefinition[] = [
  { id: '1', name: 'Piso Laminado', defaultPrice: 25.00 },
  { id: '2', name: 'Piso Vinílico', defaultPrice: 30.00 },
  { id: '3', name: 'Rodapé até 10cm em mdf', defaultPrice: 12.00 },
  { id: '4', name: 'Rodapé até 10cm em poliestireno', defaultPrice: 15.00 },
  { id: '5', name: 'Rodapé até 15cm em mdf', defaultPrice: 18.00 },
  { id: '6', name: 'Rodapé até 15cm em poliestireno', defaultPrice: 22.00 },
  { id: '7', name: 'Cordão', defaultPrice: 8.00 },
  { id: '8', name: 'Remoção de Piso', defaultPrice: 10.00 },
  { id: '9', name: 'Remoção de Rodapé', defaultPrice: 5.00 },
  { id: '10', name: 'Instalação Escada Piso Laminado', defaultPrice: 45.00 },
  { id: '11', name: 'Instalação Escada Piso Vinílico', defaultPrice: 50.00 }
];

export const INITIAL_JOBS: Job[] = [
  {
    id: '101',
    orderNumber: 'PED-001',
    clientName: 'Ana Souza',
    address: 'Rua das Flores, 123',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    description: 'Instalação elétrica completa',
    value: 1500.00,
    status: JobStatus.FINISHED,
    paymentStatus: PaymentStatus.PAID,
    installerId: '1',
    notes: 'Cliente muito satisfeita.'
  },
  {
    id: '102',
    orderNumber: 'PED-002',
    clientName: 'Roberto Lima',
    address: 'Av. Paulista, 1000',
    date: new Date().toISOString(),
    description: 'Reparo hidráulico urgente',
    value: 450.00,
    status: JobStatus.IN_PROGRESS,
    paymentStatus: PaymentStatus.PENDING,
    installerId: '2'
  },
  {
    id: '103',
    orderNumber: 'PED-003',
    clientName: 'Construtora Tech',
    address: 'Rua Augusta, 500',
    date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    description: 'Instalação de painéis',
    value: 5000.00,
    status: JobStatus.SCHEDULED,
    paymentStatus: PaymentStatus.PENDING,
    installerId: '3'
  },
  {
    id: '104',
    orderNumber: 'PED-004',
    clientName: 'Maria Fernada',
    address: 'Alameda Santos, 200',
    date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    description: 'Pintura e acabamento',
    value: 2000.00,
    status: JobStatus.FINISHED,
    paymentStatus: PaymentStatus.LATE,
    installerId: '3'
  }
];