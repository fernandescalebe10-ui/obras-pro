
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import logoImage from '../images/Granpisos.jpeg';

const Login: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('E-mail ou senha incorretos.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar entrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col animate-fade-in">
        {/* Header/Logo Section */}
        <div className="bg-white p-8 flex flex-col items-center justify-center border-b">
          <div className="h-24 w-full flex items-center justify-center mb-4">
            <img 
              src={logoImage} 
              alt="Logo" 
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <h2 className="text-4xl font-black tracking-tighter">
            <span className="text-blue-600">Gran</span><span className="text-red-600">piso</span>
          </h2>
          <p className="text-gray-500 text-sm mt-2 text-center font-medium uppercase tracking-wider">Acesso ao Departamento de Obras</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3 animate-shake">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 transition-all outline-none shadow-sm"
                  placeholder="exemplo@granpiso.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-400 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 transition-all outline-none shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-bold text-lg transition-all disabled:opacity-50 mt-4"
          >
            {loading ? (
              <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={20} className="mr-2" />
                Entrar no Sistema
              </>
            )}
          </button>
        </form>

        <div className="bg-gray-50 p-6 border-t">
          <p className="text-xs text-gray-400 text-center">Utilize suas credenciais corporativas. Em caso de perda, contate o TI Granpiso.</p>
          <div className="mt-4 flex justify-center gap-4 opacity-50 grayscale scale-75">
             <span className="text-[10px] font-bold px-2 py-1 bg-gray-200 rounded">Curitiba</span>
             <span className="text-[10px] font-bold px-2 py-1 bg-gray-200 rounded">Cascavel</span>
             <span className="text-[10px] font-bold px-2 py-1 bg-gray-200 rounded">M.C. Rondon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
