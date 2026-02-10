
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
  <nav className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-40">
    <div className="max-w-6xl mx-auto flex justify-between items-center">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('DASHBOARD')}>
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Trophy className="text-white" size={24} />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">BichoRP</span>
      </div>
      <div className="hidden md:flex items-center space-x-6">
        <button onClick={() => setView('DASHBOARD')} className={`flex items-center space-x-1 ${view === 'DASHBOARD' ? 'text-indigo-400' : 'text-slate-400'}`}><LayoutDashboard size={18} /><span>Dashboard</span></button>
        <button onClick={() => setView('BET')} className={`flex items-center space-x-1 ${view === 'BET' ? 'text-indigo-400' : 'text-slate-400'}`}><Play size={18} /><span>Apostar</span></button>
        <button onClick={() => setView('HISTORY')} className={`flex items-center space-x-1 ${view === 'HISTORY' ? 'text-indigo-400' : 'text-slate-400'}`}><HistoryIcon size={18} /><span>Histórico</span></button>
        {currentUser?.role === UserRole.ADMIN && <button onClick={() => setView('ADMIN')} className={`flex items-center space-x-1 ${view === 'ADMIN' ? 'text-rose-400' : 'text-slate-400'}`}><Settings size={18} /><span>Admin</span></button>}
      </div>
      <div className="flex items-center space-x-4">
        <div className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 flex items-center space-x-2"><Wallet size={16} className="text-emerald-400" /><span className="text-sm font-mono font-bold text-slate-100">RP$ {currentUser?.balance.toLocaleString()}</span></div>
        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-400"><LogOut size={20} /></button>
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
    showToast(`Sorteio: ${animal.icon} ${animal.name}!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {view === 'LOGIN' ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-4xl grid md:grid-cols-2 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
            <div className="p-12 bg-indigo-600 flex flex-col justify-center">
              <Trophy size={48} className="mb-4" />
              <h1 className="text-4xl font-bold mb-2">BichoRP</h1>
              <p className="opacity-90">Simulador imersivo para servidores de Roleplay.</p>
            </div>
            <div className="p-8">
              <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-xl font-bold mb-6">Acessar Painel</h2>
                <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3" placeholder="Usuário..." value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} />
                <input type="password" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3" placeholder="Senha RP..." value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
                <button className="w-full bg-indigo-600 p-3 rounded-lg font-bold">Entrar</button>
              </form>
              <div className="mt-8 pt-8 border-t border-slate-800">
                <p className="text-sm text-slate-500 mb-4">Novo por aqui?</p>
                <form onSubmit={handleRegister} className="space-y-2">
                  <input name="regUsername" className="w-full bg-slate-900 border border-slate-800 p-2 text-sm rounded-lg" placeholder="Login..." />
                  <input name="regRpName" className="w-full bg-slate-900 border border-slate-800 p-2 text-sm rounded-lg" placeholder="Nome Personagem..." />
                  <button className="w-full bg-slate-800 p-2 rounded-lg text-sm">Criar Conta</button>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <p className="text-slate-400 text-sm mb-2">Saldo</p>
                  <h2 className="text-3xl font-bold font-mono text-emerald-400">RP$ {state.currentUser?.balance.toLocaleString()}</h2>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <p className="text-slate-400 text-sm mb-2">Apostas</p>
                  <h2 className="text-3xl font-bold font-mono">{state.bets.filter(b => b.userId === state.currentUser?.id).length}</h2>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 border-l-4 border-l-amber-500">
                  <p className="text-slate-400 text-sm mb-2">Último Resultado</p>
                  {state.draws[0]?.winningAnimalId ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-3xl">{ANIMALS.find(a => a.id === state.draws[0].winningAnimalId)?.icon}</span>
                      <span className="font-bold">{ANIMALS.find(a => a.id === state.draws[0].winningAnimalId)?.name}</span>
                    </div>
                  ) : <span>Aguardando...</span>}
                </div>
              </div>
            )}
            {view === 'BET' && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {ANIMALS.map(a => (
                  <div key={a.id} onClick={() => setSelectedAnimalId(a.id)} className={`p-4 rounded-xl border-2 cursor-pointer text-center transition-all ${selectedAnimalId === a.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900'}`}>
                    <span className="text-4xl block mb-2">{a.icon}</span>
                    <p className="font-bold text-sm">{a.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); placeBet(a.id, betAmount); }} className="mt-2 w-full bg-emerald-600 text-xs p-1 rounded font-bold">Apostar</button>
                  </div>
                ))}
              </div>
            )}
            {view === 'HISTORY' && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 font-bold">Histórico Global</div>
                {state.draws.filter(d => d.status === 'COMPLETED').map(d => (
                  <div key={d.id} className="p-4 flex justify-between border-b border-slate-800 last:border-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{ANIMALS.find(a => a.id === d.winningAnimalId)?.icon}</span>
                      <span>{ANIMALS.find(a => a.id === d.winningAnimalId)?.name}</span>
                    </div>
                    <span className="font-mono text-slate-500">Dezena: {d.winningNumber}</span>
                  </div>
                ))}
              </div>
            )}
            {view === 'ADMIN' && (
              <div className="space-y-6">
                <button onClick={executeDraw} className="bg-rose-600 w-full p-4 rounded-xl font-bold text-xl shadow-lg">EXECUTAR SORTEIO AGORA</button>
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                  <h3 className="font-bold mb-4">Jogadores Ativos</h3>
                  {state.users.map(u => (
                    <div key={u.id} className="flex justify-between py-2 border-b border-slate-800 last:border-0">
                      <span>{u.rpName} (@{u.username})</span>
                      <span className="font-mono text-emerald-400">RP$ {u.balance.toLocaleString()}</span>
                    </div>
                  ))}
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
