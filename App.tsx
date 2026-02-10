
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
  Calendar,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  User as UserIcon,
  Play
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
      { id: '1', username: 'admin', rpName: 'Padrinho do Bicho', balance: 999999, role: UserRole.ADMIN, createdAt: Date.now() },
      { id: '2', username: 'player', rpName: 'Apostador Nato', balance: 5000, role: UserRole.USER, createdAt: Date.now() }
    ],
    bets: [],
    draws: [{ id: 'init', drawTime: Date.now() + 3600000, winningNumber: null, winningAnimalId: null, status: 'SCHEDULED' }],
    animals: ANIMALS
  };
};

const saveState = (state: AppState) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); };

// --- Sub-Components ---
const AnimalIcon: React.FC<{ animal: Animal; className?: string }> = ({ animal, className = "" }) => {
  const isUrl = animal.icon.startsWith('http');
  if (isUrl) {
    return <img src={animal.icon} alt={animal.name} className={`object-cover rounded-md ${className}`} />;
  }
  return <span className={className}>{animal.icon}</span>;
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
        <button onClick={() => setView('DASHBOARD')} className={`flex items-center space-x-1 transition-colors ${view === 'DASHBOARD' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}><LayoutDashboard size={18} /><span>Dashboard</span></button>
        <button onClick={() => setView('BET')} className={`flex items-center space-x-1 transition-colors ${view === 'BET' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}><Play size={18} /><span>Apostar</span></button>
        <button onClick={() => setView('HISTORY')} className={`flex items-center space-x-1 transition-colors ${view === 'HISTORY' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}><HistoryIcon size={18} /><span>Histórico</span></button>
        {currentUser?.role === UserRole.ADMIN && <button onClick={() => setView('ADMIN')} className={`flex items-center space-x-1 transition-colors ${view === 'ADMIN' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-rose-200'}`}><Settings size={18} /><span>Admin</span></button>}
      </div>
      <div className="flex items-center space-x-4">
        <div className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 flex items-center space-x-2"><Wallet size={16} className="text-emerald-400" /><span className="text-sm font-mono font-bold text-slate-100">RP$ {currentUser?.balance.toLocaleString()}</span></div>
        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-400 transition-colors"><LogOut size={20} /></button>
      </div>
    </div>
  </nav>
);

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'BET' | 'HISTORY' | 'ADMIN'>('LOGIN');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(100);

  useEffect(() => { saveState(state); }, [state]);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => { setToast({ message, type }); }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = state.users.find(u => u.username === loginData.username);
    if (user) { setState(prev => ({ ...prev, currentUser: user })); setView('DASHBOARD'); showToast(`Bem-vindo, ${user.rpName}!`); }
    else { showToast('Usuário não encontrado.', 'error'); }
  };

  const handleLogout = () => { setState(prev => ({ ...prev, currentUser: null })); setView('LOGIN'); showToast('Até a próxima!'); };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as any;
    const username = target.regUsername.value;
    const rpName = target.regRpName.value;
    if (state.users.find(u => u.username === username)) { showToast('Usuário já existe.', 'error'); return; }
    const newUser: User = { id: Math.random().toString(36).substr(2, 9), username, rpName, balance: INITIAL_CREDITS, role: UserRole.USER, createdAt: Date.now() };
    setState(prev => ({ ...prev, users: [...prev.users, newUser], currentUser: newUser }));
    setView('DASHBOARD'); showToast('Conta criada!');
  };

  const placeBet = (animalId: number, amount: number) => {
    if (!state.currentUser || amount <= 0 || state.currentUser.balance < amount) { showToast('Erro na aposta.', 'error'); return; }
    const animal = ANIMALS.find(a => a.id === animalId)!;
    const newBet: Bet = { id: Math.random().toString(36).substr(2, 9), userId: state.currentUser.id, animalId, amount, drawId: null, status: 'PENDING', potentialWin: amount * animal.multiplier, createdAt: Date.now() };
    setState(prev => {
      const updatedBalance = prev.currentUser!.balance - amount;
      return { ...prev, currentUser: { ...prev.currentUser!, balance: updatedBalance }, users: prev.users.map(u => u.id === prev.currentUser!.id ? { ...u, balance: updatedBalance } : u), bets: [...prev.bets, newBet] };
    });
    showToast(`Aposta no ${animal.name} confirmada!`);
  };

  const executeDraw = () => {
    const num = Math.floor(Math.random() * 100) + 1;
    const animal = ANIMALS.find(a => a.numbers.includes(num))!;
    const drawId = Math.random().toString(36).substr(2, 9);
    const newDraw: Draw = { id: drawId, drawTime: Date.now(), winningNumber: num, winningAnimalId: animal.id, status: 'COMPLETED' };
    const updatedBets = state.bets.map(b => b.status === 'PENDING' ? { ...b, drawId, status: b.animalId === animal.id ? 'WON' : 'LOST' as any } : b);
    let updatedUsers = [...state.users];
    updatedBets.filter(b => b.status === 'WON' && b.drawId === drawId).forEach(w => {
      updatedUsers = updatedUsers.map(u => u.id === w.userId ? { ...u, balance: u.balance + w.potentialWin } : u);
    });
    setState(prev => ({ ...prev, users: updatedUsers, currentUser: updatedUsers.find(u => u.id === prev.currentUser?.id) || null, draws: [newDraw, ...prev.draws], bets: updatedBets }));
    showToast(`Sorteio: ${animal.name}!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {view === 'LOGIN' ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-4xl grid md:grid-cols-2 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <div className="p-12 bg-indigo-600 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy size={200} /></div>
              <Trophy size={48} className="mb-4 relative z-10" />
              <h1 className="text-4xl font-bold mb-2 relative z-10">BichoRP</h1>
              <p className="opacity-90 relative z-10">Simulador imersivo para servidores de Roleplay.</p>
            </div>
            <div className="p-8">
              <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-xl font-bold mb-6">Acessar Painel</h2>
                <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Usuário..." value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} />
                <input type="password" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Senha RP..." value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 p-3 rounded-lg font-bold transition-colors">Entrar</button>
              </form>
              <div className="mt-8 pt-8 border-t border-slate-800">
                <p className="text-sm text-slate-500 mb-4">Novo por aqui?</p>
                <form onSubmit={handleRegister} className="space-y-2">
                  <input name="regUsername" className="w-full bg-slate-900 border border-slate-800 p-2 text-sm rounded-lg outline-none focus:ring-1 focus:ring-indigo-400" placeholder="Login..." />
                  <input name="regRpName" className="w-full bg-slate-900 border border-slate-800 p-2 text-sm rounded-lg outline-none focus:ring-1 focus:ring-indigo-400" placeholder="Nome Personagem..." />
                  <button className="w-full bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-sm transition-colors">Criar Conta</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Navigation view={view} setView={setView} currentUser={state.currentUser} onLogout={handleLogout} />
          <main className="max-w-6xl mx-auto p-4 md:p-8">
            {view === 'DASHBOARD' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
                    <p className="text-slate-400 text-sm mb-2 uppercase tracking-wider font-semibold">Saldo Atual</p>
                    <h2 className="text-3xl font-bold font-mono text-emerald-400">RP$ {state.currentUser?.balance.toLocaleString()}</h2>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
                    <p className="text-slate-400 text-sm mb-2 uppercase tracking-wider font-semibold">Minhas Apostas</p>
                    <h2 className="text-3xl font-bold font-mono text-indigo-400">{state.bets.filter(b => b.userId === state.currentUser?.id).length}</h2>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 border-l-4 border-l-amber-500 shadow-sm">
                    <p className="text-slate-400 text-sm mb-2 uppercase tracking-wider font-semibold">Último Ganhador</p>
                    {state.draws[0]?.winningAnimalId ? (
                      <div className="flex items-center space-x-3">
                        <AnimalIcon animal={ANIMALS.find(a => a.id === state.draws[0].winningAnimalId)!} className="w-10 h-10 text-3xl" />
                        <span className="font-bold text-xl">{ANIMALS.find(a => a.id === state.draws[0].winningAnimalId)?.name}</span>
                      </div>
                    ) : <span className="text-slate-500">Aguardando sorteio...</span>}
                  </div>
                </div>
                {/* Aqui poderiam entrar gráficos de Recharts futuramente */}
              </div>
            )}
            {view === 'BET' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
                   <div>
                      <h2 className="text-lg font-bold">Faça sua Aposta</h2>
                      <p className="text-sm text-slate-400">Selecione um animal e defina o valor.</p>
                   </div>
                   <div className="mt-4 md:mt-0 flex items-center space-x-4">
                      <span className="text-sm text-slate-400 font-bold">VALOR:</span>
                      <input type="number" value={betAmount} onChange={e => setBetAmount(Number(e.target.value))} className="bg-slate-800 border border-slate-700 rounded-lg p-2 w-32 font-mono text-emerald-400 font-bold" />
                   </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {ANIMALS.map(a => (
                    <div key={a.id} onClick={() => setSelectedAnimalId(a.id)} className={`p-4 rounded-xl border-2 cursor-pointer text-center transition-all hover:shadow-lg hover:shadow-indigo-500/10 ${selectedAnimalId === a.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900'}`}>
                      <div className="h-16 flex items-center justify-center mb-2">
                        <AnimalIcon animal={a} className="w-14 h-14 text-4xl" />
                      </div>
                      <p className="font-bold text-sm mb-1 uppercase tracking-tight">{a.name}</p>
                      <p className="text-xs text-slate-500 font-mono mb-3">{a.numbers.join(',')}</p>
                      <button onClick={(e) => { e.stopPropagation(); placeBet(a.id, betAmount); }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 px-1 rounded font-bold transition-colors">APOSTAR</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {view === 'HISTORY' && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 font-bold flex items-center space-x-2">
                  <HistoryIcon size={20} className="text-indigo-400" />
                  <span>Histórico Global de Sorteios</span>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {state.draws.filter(d => d.status === 'COMPLETED').length === 0 ? (
                    <div className="p-12 text-center text-slate-500">Nenhum sorteio realizado ainda.</div>
                  ) : (
                    state.draws.filter(d => d.status === 'COMPLETED').map(d => (
                      <div key={d.id} className="p-4 flex justify-between items-center border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <AnimalIcon animal={ANIMALS.find(a => a.id === d.winningAnimalId)!} className="w-12 h-12 text-3xl" />
                          <div>
                            <span className="font-bold block">{ANIMALS.find(a => a.id === d.winningAnimalId)?.name}</span>
                            <span className="text-xs text-slate-500">{new Date(d.drawTime).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-indigo-400 font-bold text-lg">Nº {String(d.winningNumber).padStart(2, '0')}</span>
                          <span className="block text-xs text-slate-500 uppercase font-bold">Resultado</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {view === 'ADMIN' && (
              <div className="space-y-6">
                <div className="bg-slate-900 p-8 rounded-2xl border-2 border-dashed border-rose-500/30 text-center">
                  <h2 className="text-xl font-bold mb-4">Painel de Controle</h2>
                  <button onClick={executeDraw} className="bg-rose-600 hover:bg-rose-500 transition-all active:scale-95 w-full max-w-md p-6 rounded-xl font-bold text-2xl shadow-xl shadow-rose-900/20">
                    SORTEAR AGORA 🎲
                  </button>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
                  <h3 className="font-bold mb-4 flex items-center space-x-2">
                    <UserIcon size={20} className="text-emerald-400" />
                    <span>Jogadores Ativos ({state.users.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {state.users.map(u => (
                      <div key={u.id} className="flex justify-between items-center py-3 px-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div>
                          <span className="font-bold">{u.rpName}</span>
                          <span className="text-xs text-slate-500 block">@{u.username}</span>
                        </div>
                        <div className="text-right">
                           <span className="font-mono text-emerald-400 font-bold">RP$ {u.balance.toLocaleString()}</span>
                           <span className="block text-[10px] text-slate-500 uppercase">{u.role}</span>
                        </div>
                      </div>
                    ))}
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
