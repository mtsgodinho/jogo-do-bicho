
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, AppState, Bet, Draw, Animal } from './types.ts';
import { ANIMALS, INITIAL_CREDITS, STORAGE_KEY } from './constants.tsx';
import { 
  Trophy, 
  History as HistoryIcon, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Wallet,
  AlertCircle,
  CheckCircle2,
  User as UserIcon,
  Play,
  UserPlus,
  ShieldCheck,
  Gamepad2
} from 'lucide-react';

// --- Sub-Components ---
const AnimalIcon: React.FC<{ animal: Animal; className?: string }> = ({ animal, className = "" }) => {
  const isUrl = animal.icon.startsWith('http');
  if (isUrl) {
    return (
      <div className={`relative overflow-hidden bg-slate-800 rounded-md flex items-center justify-center ${className}`}>
        <img 
          src={animal.icon} 
          alt={animal.name} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }
  return <span className={`flex items-center justify-center ${className}`}>{animal.icon}</span>;
};

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl z-50 flex items-center space-x-2 animate-bounce ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
      {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
      <span className="font-medium">{message}</span>
    </div>
  );
};

const Navigation: React.FC<{ view: string; setView: (v: any) => void; currentUser: User | null; onLogout: () => void }> = ({ view, setView, currentUser, onLogout }) => (
  <nav className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-40 shadow-xl">
    <div className="max-w-6xl mx-auto flex justify-between items-center">
      <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => setView('DASHBOARD')}>
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <Trophy className="text-white" size={24} />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">BichoRP</span>
      </div>
      <div className="hidden md:flex items-center space-x-6">
        <button onClick={() => setView('DASHBOARD')} className={`flex items-center space-x-1 transition-colors ${view === 'DASHBOARD' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}><LayoutDashboard size={18} /><span>Início</span></button>
        <button onClick={() => setView('BET')} className={`flex items-center space-x-1 transition-colors ${view === 'BET' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}><Play size={18} /><span>Apostar</span></button>
        <button onClick={() => setView('HISTORY')} className={`flex items-center space-x-1 transition-colors ${view === 'HISTORY' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}><HistoryIcon size={18} /><span>{currentUser?.role === UserRole.ADMIN ? 'Sorteios' : 'Minhas Apostas'}</span></button>
        {currentUser?.role === UserRole.ADMIN && <button onClick={() => setView('ADMIN')} className={`flex items-center space-x-1 transition-colors ${view === 'ADMIN' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-rose-200'}`}><Settings size={18} /><span>Gerenciamento</span></button>}
      </div>
      <div className="flex items-center space-x-4">
        <div className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 flex items-center space-x-2"><Wallet size={16} className="text-emerald-400" /><span className="text-sm font-mono font-bold text-slate-100">RP$ {currentUser?.balance.toLocaleString()}</span></div>
        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-400 transition-colors"><LogOut size={20} /></button>
      </div>
    </div>
  </nav>
);

// --- Helpers ---
const loadState = (): AppState => {
  if (typeof window === 'undefined') return { currentUser: null, users: [], bets: [], draws: [], animals: ANIMALS };
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { console.error("Falha ao ler estado", e); }
  }
  return {
    currentUser: null,
    users: [
      { id: '1', username: 'admin', rpName: 'Diretor Geral', balance: 1000000, role: UserRole.ADMIN, createdAt: Date.now() },
    ],
    bets: [],
    draws: [],
    animals: ANIMALS
  };
};

const saveState = (state: AppState) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); };

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'BET' | 'HISTORY' | 'ADMIN'>('LOGIN');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(100);
  
  // New User Form State (Admin Only)
  const [newUser, setNewUser] = useState({ username: '', rpName: '', role: UserRole.USER, balance: 5000 });

  useEffect(() => { saveState(state); }, [state]);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => { setToast({ message, type }); }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = state.users.find(u => u.username.toLowerCase() === loginData.username.toLowerCase());
    if (user) { 
      setState(prev => ({ ...prev, currentUser: user })); 
      setView('DASHBOARD'); 
      showToast(`Bem-vindo, ${user.rpName}!`); 
    } else { 
      showToast('Usuário não autorizado. Contate um Administrador.', 'error'); 
    }
  };

  const handleLogout = () => { 
    setState(prev => ({ ...prev, currentUser: null })); 
    setView('LOGIN'); 
    showToast('Sessão encerrada.'); 
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.users.find(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      showToast('Este usuário já existe.', 'error');
      return;
    }
    const createdUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: newUser.username,
      rpName: newUser.rpName,
      balance: newUser.balance,
      role: newUser.role,
      createdAt: Date.now()
    };
    setState(prev => ({ ...prev, users: [...prev.users, createdUser] }));
    setNewUser({ username: '', rpName: '', role: UserRole.USER, balance: 5000 });
    showToast(`Usuário ${createdUser.rpName} criado com sucesso!`);
  };

  const placeBet = (animalId: number, amount: number) => {
    if (!state.currentUser) return;
    if (amount <= 0) { showToast('Valor inválido.', 'error'); return; }
    if (state.currentUser.balance < amount) { showToast('Saldo insuficiente.', 'error'); return; }

    const animal = ANIMALS.find(a => a.id === animalId)!;
    const newBet: Bet = { 
      id: Math.random().toString(36).substr(2, 9), 
      userId: state.currentUser.id, 
      animalId, 
      amount, 
      drawId: null, 
      status: 'PENDING', 
      potentialWin: amount * animal.multiplier, 
      createdAt: Date.now() 
    };

    setState(prev => {
      const updatedBalance = prev.currentUser!.balance - amount;
      const updatedUsers = prev.users.map(u => u.id === prev.currentUser!.id ? { ...u, balance: updatedBalance } : u);
      return { 
        ...prev, 
        currentUser: { ...prev.currentUser!, balance: updatedBalance }, 
        users: updatedUsers, 
        bets: [...prev.bets, newBet] 
      };
    });
    showToast(`Aposta confirmada no ${animal.name}!`);
  };

  const executeDraw = () => {
    const num = Math.floor(Math.random() * 100) + 1;
    const animal = ANIMALS.find(a => a.numbers.includes(num))!;
    const drawId = Math.random().toString(36).substr(2, 9);
    
    const newDraw: Draw = { 
      id: drawId, 
      drawTime: Date.now(), 
      winningNumber: num, 
      winningAnimalId: animal.id, 
      status: 'COMPLETED' 
    };

    setState(prev => {
      const updatedBets = prev.bets.map(b => {
        if (b.status !== 'PENDING') return b;
        return { 
          ...b, 
          drawId, 
          status: b.animalId === animal.id ? 'WON' : 'LOST' as any 
        };
      });

      let updatedUsers = [...prev.users];
      updatedBets.filter(b => b.status === 'WON' && b.drawId === drawId).forEach(w => {
        updatedUsers = updatedUsers.map(u => u.id === w.userId ? { ...u, balance: u.balance + w.potentialWin } : u);
      });

      return { 
        ...prev, 
        users: updatedUsers, 
        currentUser: updatedUsers.find(u => u.id === prev.currentUser?.id) || null, 
        draws: [newDraw, ...prev.draws], 
        bets: updatedBets 
      };
    });
    showToast(`SORTEIO REALIZADO: ${animal.name.toUpperCase()}!`);
  };

  // Filtered views
  const myBets = state.bets.filter(b => b.userId === state.currentUser?.id);
  const isAdmin = state.currentUser?.role === UserRole.ADMIN;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {view === 'LOGIN' ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <div className="p-10 bg-indigo-600 flex flex-col items-center text-center">
              <Trophy size={64} className="mb-4 text-white drop-shadow-lg" />
              <h1 className="text-3xl font-bold mb-1">BichoRP</h1>
              <p className="text-indigo-100 text-sm">Sistema Exclusivo de Apostas RP</p>
            </div>
            <div className="p-8">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Identidade RP</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center font-bold" 
                    placeholder="DIGITE SEU USUÁRIO" 
                    value={loginData.username} 
                    onChange={e => setLoginData({...loginData, username: e.target.value})} 
                    required
                  />
                </div>
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 p-4 rounded-lg font-bold transition-all transform active:scale-95 shadow-lg shadow-indigo-900/40">
                  ENTRAR NO SISTEMA
                </button>
                <p className="text-[10px] text-center text-slate-600 uppercase mt-4">Somente usuários autorizados pelo administrador podem acessar.</p>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Navigation view={view} setView={setView} currentUser={state.currentUser} onLogout={handleLogout} />
          <main className="max-w-6xl mx-auto p-4 md:p-8">
            
            {view === 'DASHBOARD' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-100">Olá, {state.currentUser?.rpName}</h1>
                    <p className="text-slate-400">Bem-vindo ao seu terminal de apostas.</p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                    <ShieldCheck className={isAdmin ? 'text-rose-400' : 'text-emerald-400'} />
                    <span className="text-xs font-bold uppercase tracking-widest">{isAdmin ? 'Acesso Administrativo' : 'Acesso Apostador'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm hover:border-emerald-500/30 transition-colors">
                    <p className="text-slate-500 text-xs mb-1 uppercase font-bold">Saldo Disponível</p>
                    <h2 className="text-3xl font-bold font-mono text-emerald-400">RP$ {state.currentUser?.balance.toLocaleString()}</h2>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm hover:border-indigo-500/30 transition-colors">
                    <p className="text-slate-500 text-xs mb-1 uppercase font-bold">{isAdmin ? 'Total de Apostas (Global)' : 'Minhas Apostas'}</p>
                    <h2 className="text-3xl font-bold font-mono text-indigo-400">
                      {isAdmin ? state.bets.length : myBets.length}
                    </h2>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 border-l-4 border-l-amber-500 shadow-sm">
                    <p className="text-slate-500 text-xs mb-1 uppercase font-bold">Último Ganhador</p>
                    {state.draws[0] ? (
                      <div className="flex items-center space-x-3">
                        <AnimalIcon animal={ANIMALS.find(a => a.id === state.draws[0].winningAnimalId)!} className="w-10 h-10 text-2xl" />
                        <span className="font-bold text-lg">{ANIMALS.find(a => a.id === state.draws[0].winningAnimalId)?.name}</span>
                      </div>
                    ) : <span className="text-slate-500 italic">Nenhum sorteio ainda</span>}
                  </div>
                </div>

                {isAdmin && (
                  <div className="bg-indigo-900/10 border border-indigo-500/20 p-6 rounded-2xl">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Settings size={18}/> Visão Geral do Administrador</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                        <span className="text-slate-400">Total de Jogadores:</span>
                        <span className="font-bold">{state.users.length}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-900/50 rounded-lg">
                        <span className="text-slate-400">Créditos em Circulação:</span>
                        <span className="font-bold text-emerald-400">RP$ {state.users.reduce((acc, u) => acc + u.balance, 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {view === 'BET' && (
              <div className="space-y-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-full"><Gamepad2 className="text-emerald-500" /></div>
                      <div>
                        <h2 className="text-xl font-bold">Terminal de Apostas</h2>
                        <p className="text-sm text-slate-400">Selecione o animal da sorte e defina seu lance.</p>
                      </div>
                   </div>
                   <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                      <span className="px-4 text-xs font-bold text-slate-500">VALOR</span>
                      <input 
                        type="number" 
                        value={betAmount} 
                        onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))} 
                        className="bg-slate-950 border-none rounded-lg p-3 w-32 font-mono text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500 outline-none" 
                      />
                   </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {ANIMALS.map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => setSelectedAnimalId(a.id)} 
                      className={`group p-4 rounded-2xl border-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${selectedAnimalId === a.id ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}
                    >
                      <div className="h-24 flex items-center justify-center mb-4">
                        <AnimalIcon animal={a} className="w-20 h-20 text-5xl grayscale group-hover:grayscale-0 transition-all" />
                      </div>
                      <p className="font-bold text-sm mb-1 text-center uppercase tracking-widest">{a.name}</p>
                      <div className="flex flex-wrap justify-center gap-1 mb-4">
                        {a.numbers.map(n => <span key={n} className="text-[10px] bg-slate-800 px-1.5 rounded text-slate-400 font-mono">{String(n).padStart(2, '0')}</span>)}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); placeBet(a.id, betAmount); }} 
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-3 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-900/20"
                      >
                        CONFIRMAR APOSTA
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'HISTORY' && (
              <div className="space-y-6">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="p-6 border-b border-slate-800 font-bold flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HistoryIcon size={20} className="text-indigo-400" />
                      <span>{isAdmin ? 'Histórico Geral de Sorteios' : 'Meu Histórico de Jogos'}</span>
                    </div>
                    {!isAdmin && <span className="text-xs text-slate-500 font-normal italic">Somente suas apostas são exibidas aqui.</span>}
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto">
                    {isAdmin ? (
                      // Admin view: Draw History
                      state.draws.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">Nenhum sorteio registrado.</div>
                      ) : (
                        state.draws.map(d => (
                          <div key={d.id} className="p-6 flex justify-between items-center border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                            <div className="flex items-center space-x-6">
                              <AnimalIcon animal={ANIMALS.find(a => a.id === d.winningAnimalId)!} className="w-16 h-16 text-4xl" />
                              <div>
                                <span className="font-bold text-xl block uppercase tracking-tighter">{ANIMALS.find(a => a.id === d.winningAnimalId)?.name}</span>
                                <span className="text-xs text-slate-500 font-mono">{new Date(d.drawTime).toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-indigo-400 font-bold text-2xl">Nº {String(d.winningNumber).padStart(2, '0')}</span>
                              <span className="block text-[10px] text-slate-500 uppercase font-bold mt-1">Resultado Final</span>
                            </div>
                          </div>
                        ))
                      )
                    ) : (
                      // User view: Personal Bet History
                      myBets.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">Você ainda não realizou apostas.</div>
                      ) : (
                        [...myBets].reverse().map(b => {
                          const animal = ANIMALS.find(a => a.id === b.animalId)!;
                          return (
                            <div key={b.id} className="p-6 flex justify-between items-center border-b border-slate-800 last:border-0">
                              <div className="flex items-center space-x-4">
                                <AnimalIcon animal={animal} className="w-12 h-12 text-2xl" />
                                <div>
                                  <span className="font-bold block uppercase">{animal.name}</span>
                                  <span className="text-xs text-slate-500">Valor: RP$ {b.amount.toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                {b.status === 'PENDING' ? (
                                  <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-full border border-amber-500/20 uppercase">Aguardando</span>
                                ) : b.status === 'WON' ? (
                                  <div className="text-emerald-400">
                                    <span className="block font-bold text-lg">+ RP$ {b.potentialWin.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold uppercase">Vitória</span>
                                  </div>
                                ) : (
                                  <div className="text-slate-600">
                                    <span className="block font-bold text-lg">- RP$ {b.amount.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold uppercase">Perdida</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {view === 'ADMIN' && isAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Creation Section */}
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                    <UserPlus className="text-indigo-400" />
                    <h2 className="text-xl font-bold">Autorizar Novo Jogador</h2>
                  </div>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Login (Identificador)</label>
                        <input 
                          type="text" 
                          placeholder="Ex: marcos_silva"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 outline-none focus:ring-1 focus:ring-indigo-500"
                          value={newUser.username}
                          onChange={e => setNewUser({...newUser, username: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nome RP (Visível)</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Dr. Marcos"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 outline-none focus:ring-1 focus:ring-indigo-500"
                          value={newUser.rpName}
                          onChange={e => setNewUser({...newUser, rpName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Cargo</label>
                        <select 
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 outline-none focus:ring-1 focus:ring-indigo-500"
                          value={newUser.role}
                          onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                        >
                          <option value={UserRole.USER}>Apostador</option>
                          <option value={UserRole.ADMIN}>Administrador</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Saldo Inicial</label>
                        <input 
                          type="number" 
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 outline-none focus:ring-1 focus:ring-indigo-500"
                          value={newUser.balance}
                          onChange={e => setNewUser({...newUser, balance: Number(e.target.value)})}
                          required
                        />
                      </div>
                    </div>
                    <button className="w-full bg-indigo-600 hover:bg-indigo-500 p-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                      <UserPlus size={18} /> CRIAR CONTA AGORA
                    </button>
                  </form>
                </div>

                {/* System Control Section */}
                <div className="space-y-8">
                  <div className="bg-slate-900 p-8 rounded-2xl border-2 border-dashed border-rose-500/30 text-center shadow-2xl">
                    <h2 className="text-xl font-bold mb-2 uppercase tracking-widest text-rose-400">Sala de Sorteio</h2>
                    <p className="text-slate-500 text-sm mb-6 uppercase">O sorteio afeta todos os jogos pendentes imediatamente.</p>
                    <button onClick={executeDraw} className="bg-rose-600 hover:bg-rose-500 transition-all active:scale-95 w-full p-6 rounded-2xl font-black text-3xl shadow-xl shadow-rose-900/40 border-b-4 border-rose-800">
                      EXTRAÇÃO AGORA 🎲
                    </button>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm max-h-[400px] overflow-y-auto">
                    <h3 className="font-bold mb-4 flex items-center space-x-2 pb-2 border-b border-slate-800">
                      <UserIcon size={18} className="text-emerald-400" />
                      <span>Jogadores no Sistema ({state.users.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {state.users.map(u => (
                        <div key={u.id} className="flex justify-between items-center py-3 px-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
                          <div>
                            <span className="font-bold text-sm">{u.rpName}</span>
                            <span className="text-[10px] text-slate-500 block uppercase font-mono">ID: {u.username}</span>
                          </div>
                          <div className="text-right">
                             <span className="font-mono text-emerald-400 font-bold text-sm">RP$ {u.balance.toLocaleString()}</span>
                             <span className={`block text-[8px] uppercase font-bold ${u.role === UserRole.ADMIN ? 'text-rose-400' : 'text-indigo-400'}`}>{u.role}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
