
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceDefinition } from '../types';
import { Plus, Edit, Trash2, X, Save, DollarSign, Wrench } from 'lucide-react';

const Services: React.FC = () => {
  // Added user to destructuring to provide cityId for new service definitions
  const { services, addService, updateService, deleteService, user } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentService, setCurrentService] = useState<Partial<ServiceDefinition>>({
    name: '',
    defaultPrice: 0
  });

  const openCreateModal = () => {
    setCurrentService({ name: '', defaultPrice: 0 });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (service: ServiceDefinition) => {
    setCurrentService({ ...service });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Added user validation to ensure cityId is available for construction
    if (!currentService.name || !user) return;

    const serviceData: ServiceDefinition = {
      id: isEditing && currentService.id ? currentService.id : Date.now().toString(),
      cityId: user.cityId, // Injected cityId from current user context
      name: currentService.name,
      defaultPrice: Number(currentService.defaultPrice) || 0
    };

    if (isEditing) {
      updateService(serviceData);
    } else {
      addService(serviceData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este serviço? Isso não afetará obras já criadas.')) {
      deleteService(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Wrench className="text-primary" />
             Tabela de Instalações
           </h2>
           <p className="text-gray-500 text-sm mt-1">
             Gerencie os serviços padrão e seus preços. As alterações aqui refletirão nos novos cálculos de obras.
           </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Novo Serviço
        </button>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nome do Serviço</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Valor Padrão (Unitário/m²)</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.length === 0 ? (
                 <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-500">Nenhum serviço cadastrado.</td></tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{service.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gray-700 font-medium">
                        <span className="text-xs text-gray-400 mr-1">R$</span>
                        {service.defaultPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(service)} className="text-indigo-600 hover:text-indigo-900 mr-4 p-2 hover:bg-indigo-50 rounded-full transition-colors">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(service.id)} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl animate-fade-in">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700">Nome do Serviço</label>
                  <input 
                    type="text" 
                    required
                    className="mt-1 block w-full bg-white border border-gray-400 rounded-md shadow-sm p-2 focus:ring-primary focus:border-primary text-gray-900"
                    value={currentService.name}
                    onChange={e => setCurrentService({...currentService, name: e.target.value})}
                    placeholder="Ex: Instalação de Rodapé"
                  />
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700">Valor Padrão (R$)</label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">R$</span>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      required
                      className="block w-full bg-white border border-gray-400 rounded-md p-2 pl-10 focus:ring-primary focus:border-primary text-gray-900"
                      value={currentService.defaultPrice}
                      onChange={e => setCurrentService({...currentService, defaultPrice: parseFloat(e.target.value)})}
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Este valor será sugerido automaticamente na calculadora de obras.</p>
               </div>

               <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="w-full bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 font-medium"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="w-full bg-primary text-white py-2 rounded-md hover:bg-blue-700 shadow-sm font-bold flex justify-center items-center"
                  >
                    <Save size={18} className="mr-2" />
                    Salvar
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
