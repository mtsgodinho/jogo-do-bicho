
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, AppState, Bet, Draw, Animal } from './types.ts';
import { ANIMALS, STORAGE_KEY } from './constants.tsx';
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
  Gamepad2,
  Database,
  Download,
  Upload,
  Users,
  RefreshCw
} from 'lucide-react';

// --- Sub-Components ---
const AnimalIcon: React.FC<{ animal: Animal; className?: string }> = ({ animal, className = "" }) => {
  const isUrl = animal.icon.startsWith('http');
  if (isUrl) {
    return (
      <div className={`relative overflow-hidden bg-slate-800 rounded-md flex items-center justify-center ${className}`}>
        <img src={animal.icon} alt={animal.name} className="w-full h-full object-cover" loading="lazy" />
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
    users: [{ id: '1', username: 'admin', rpName: 'Diretor Geral', balance: 1000000, role: UserRole.ADMIN, createdAt: Date.now() }],
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
  const [loginData, setLoginData] = useState({ username: '' });
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(100);
  
  const [newUser, setNewUser] = useState({ username: '', rpName: '', role: UserRole.USER, balance: 5000 });
  const [dbCode, setDbCode] = useState('');
  const [showImportOnLogin, setShowImportOnLogin] = useState(false);

  useEffect(() => { saveState(state); }, [state]);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => { setToast({ message, type }); }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = state.users.find(u => u.username.toLowerCase() === loginData.username.trim().toLowerCase());
    if (user) { 
      setState(prev => ({ ...prev, currentUser: user })); 
      setView('DASHBOARD'); 
      showToast(`Bem-vindo, ${user.rpName}!`); 
    } else { 
      showToast('Usuário não autorizado neste computador.', 'error'); 
    }
  };

  const handleLogout = () => { setState(prev => ({ ...prev, currentUser: null })); setView('LOGIN'); showToast('Sessão encerrada.'); };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.users.find(u => u.username.toLowerCase() === newUser.username.trim().toLowerCase())) {
      showToast('Este usuário já existe.', 'error');
      return;
    }
    const createdUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: newUser.username.trim(),
      rpName: newUser.rpName.trim(),
      balance: newUser.balance,
      role: newUser.role,
      createdAt: Date.now()
    };
    setState(prev => ({ ...prev, users: [...prev.users, createdUser] }));
    setNewUser({ username: '', rpName: '', role: UserRole.USER, balance: 5000 });
    showToast(`Usuário ${createdUser.rpName} criado!`);
  };

  const exportDB = () => {
    const data = btoa(JSON.stringify({ users: state.users, bets: state.bets, draws: state.draws }));
    setDbCode(data);
    navigator.clipboard.writeText(data);
    showToast('Código copiado! Envie para seu amigo.');
  };

  const importDB = () => {
    try {
      if (!dbCode.trim()) return;
      const decoded = JSON.parse(atob(dbCode.trim()));
      setState(prev => ({ ...prev, users: decoded.users, bets: decoded.bets, draws: decoded.draws }));
      showToast('Dados sincronizados com sucesso!');
      setDbCode('');
      setShowImportOnLogin(false);
    } catch (e) {
      showToast('Código inválido ou corrompido.', 'error');
    }
  };

  const placeBet = (animalId: number, amount: number) => {
    if (!state.currentUser) return;
    if (amount <= 0 || state.currentUser.balance < amount) { showToast('Erro na aposta.', 'error'); return; }
    const animal = ANIMALS.find(a => a.id === animalId)!;
    const newBet: Bet = { id: Math.random().toString(36).substr(2, 9), userId: state.currentUser.id, animalId, amount, drawId: null, status: 'PENDING', potentialWin: amount * animal.multiplier, createdAt: Date.now() };
    setState(prev => {
      const updatedBalance = prev.currentUser!.balance - amount;
      const updatedUsers = prev.users.map(u => u.id === prev.currentUser!.id ? { ...u, balance: updatedBalance } : u);
      return { ...prev, currentUser: { ...prev.currentUser!, balance: updatedBalance }, users: updatedUsers, bets: [...prev.bets, newBet] };
    });
    showToast(`Aposta no ${animal.name} confirmada!`);
  };

  const executeDraw = () => {
    const num = Math.floor(Math.random() * 100) + 1;
    const animal = ANIMALS.find(a => a.numbers.includes(num))!;
    const drawId = Math.random().toString(36).substr(2, 9);
    const newDraw: Draw = { id: drawId, drawTime: Date.now(), winningNumber: num, winningAnimalId: animal.id, status: 'COMPLETED' };
    setState(prev => {
      const updatedBets = prev.bets.map(b => b.status !== 'PENDING' ? b : { ...b, drawId, status: b.animalId === animal.id ? 'WON' : 'LOST' as any });
      let updatedUsers = [...prev.users];
      updatedBets.filter(b => b.status === 'WON' && b.drawId === drawId).forEach(w => {
        updatedUsers = updatedUsers.map(u => u.id === w.userId ? { ...u, balance: u.balance + w.potentialWin } : u);
      });
      return { ...prev, users: updatedUsers, currentUser: updatedUsers.find(u => u.id === prev.currentUser?.id) || null, draws: [newDraw, ...prev.draws], bets: updatedBets };
    });
    showToast(`RESULTADO: ${animal.name.toUpperCase()}!`);
  };

  const isAdmin = state.currentUser?.role === UserRole.ADMIN;
  const myBets = state.bets.filter(b => b.userId === state.currentUser?.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {view === 'LOGIN' ? (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)] overflow-hidden">
            <div className="p-10 bg-indigo-600 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <Trophy size={64} className="mb-4 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] relative z-10" />
              <h1 className="text-4xl font-black mb-1 relative z-10 tracking-tighter">BichoRP</h1>
              <p className="text-indigo-100 text-sm font-medium relative z-10 opacity-80">SISTEMA DE EXTRAÇÃO OFICIAL</p>
            </div>
            <div className="p-8 space-y-6">
              {!showImportOnLogin ? (
                <>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Identidade RP</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center font-bold text-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-600" 
                        placeholder="NOME DE USUÁRIO" 
                        value={loginData.username} 
                        onChange={e => setLoginData({username: e.target.value})} 
                        required 
                      />
                    </div>
                    <button className="w-full bg-indigo-600 hover:bg-indigo-500 p-4 rounded-xl font-black text-sm tracking-widest transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-900/40 uppercase">
                      Acessar Sistema
                    </button>
                  </form>
                  <div className="pt-4 border-t border-slate-800/50 text-center">
                    <button 
                      onClick={() => setShowImportOnLogin(true)} 
                      className="text-xs text-slate-500 hover:text-indigo-400 font-bold transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                      <RefreshCw size={14} /> JOGADOR NÃO ENCONTRADO? SINCRONIZAR
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex gap-3 items-start">
                    <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-200 leading-relaxed uppercase font-bold">
                      Cole o código enviado pelo Diretor para liberar seu acesso neste computador.
                    </p>
                  </div>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-[10px] font-mono h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                    placeholder="COLE O CÓDIGO AQUI..." 
                    value={dbCode} 
                    onChange={e => setDbCode(e.target.value)}
                  ></textarea>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setShowImportOnLogin(false)}
                      className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                      VOLTAR
                    </button>
                    <button 
                      onClick={importDB}
                      className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                    >
                      <Upload size={14} /> SINCRONIZAR
                    </button>
                  </div>
                </div>
              )}
              <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-tighter">BichoRP v2.0 • Protegido por Diretor de Extração</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Navigation view={view} setView={setView} currentUser={state.currentUser} onLogout={handleLogout} />
          <main className="max-w-6xl mx-auto p-4 md:p-8">
            {view === 'DASHBOARD' && (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                   <div>
                      <h1 className="text-2xl font-bold">Olá, {state.currentUser?.rpName}</h1>
                      <p className="text-slate-400">Status: <span className={isAdmin ? 'text-rose-400' : 'text-emerald-400'}>{isAdmin ? 'ADMINISTRADOR' : 'APOSTADOR'}</span></p>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm"><p className="text-slate-500 text-xs mb-1 uppercase font-bold">Saldo</p><h2 className="text-3xl font-bold font-mono text-emerald-400">RP$ {state.currentUser?.balance.toLocaleString()}</h2></div>
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm"><p className="text-slate-500 text-xs mb-1 uppercase font-bold">Minhas Apostas</p><h2 className="text-3xl font-bold font-mono text-indigo-400">{myBets.length}</h2></div>
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 border-l-4 border-l-amber-500 shadow-sm">
                    <p className="text-slate-500 text-xs mb-1 uppercase font-bold">Último Ganhador</p>
                    {state.draws[0] ? <div className="flex items-center gap-2"><AnimalIcon animal={ANIMALS.find(a => a.id === state.draws[0].winningAnimalId)!} className="w-8 h-8 text-xl" /><span className="font-bold">{ANIMALS.find(a => a.id === state.draws[0].winningAnimalId)?.name}</span></div> : <span className="text-slate-500 italic">Nenhum ainda</span>}
                  </div>
                </div>
              </div>
            )}

            {view === 'BET' && (
              <div className="space-y-6">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Gamepad2 className="text-emerald-400"/> Fazer Jogo</h2>
                  <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                    <span className="px-4 text-xs font-bold text-slate-500">VALOR</span>
                    <input type="number" value={betAmount} onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))} className="bg-slate-950 border-none rounded-lg p-2 w-28 font-mono text-emerald-400 font-bold focus:ring-1 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {ANIMALS.map(a => (
                    <div key={a.id} onClick={() => setSelectedAnimalId(a.id)} className={`group p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedAnimalId === a.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900'}`}>
                      <div className="h-20 flex items-center justify-center mb-3"><AnimalIcon animal={a} className="w-16 h-16 text-4xl" /></div>
                      <p className="font-bold text-xs text-center uppercase mb-3">{a.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); placeBet(a.id, betAmount); }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] py-2 rounded-lg font-bold transition-colors">APOSTAR</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'HISTORY' && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-6 border-b border-slate-800 font-bold flex items-center justify-between">
                  <span>{isAdmin ? 'Histórico Global de Extrações' : 'Minhas Apostas Realizadas'}</span>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {isAdmin ? (
                    state.draws.length === 0 ? <div className="p-12 text-center text-slate-500 italic">Nenhum sorteio realizado.</div> :
                    state.draws.map(d => (
                      <div key={d.id} className="p-4 flex justify-between items-center border-b border-slate-800 hover:bg-slate-800/30">
                        <div className="flex items-center gap-4">
                          <AnimalIcon animal={ANIMALS.find(a => a.id === d.winningAnimalId)!} className="w-12 h-12 text-2xl" />
                          <div><span className="font-bold block uppercase">{ANIMALS.find(a => a.id === d.winningAnimalId)?.name}</span><span className="text-[10px] text-slate-500 font-mono">{new Date(d.drawTime).toLocaleString()}</span></div>
                        </div>
                        <div className="text-right"><span className="font-mono text-indigo-400 font-bold text-xl">Nº {String(d.winningNumber).padStart(2, '0')}</span></div>
                      </div>
                    ))
                  ) : (
                    myBets.length === 0 ? <div className="p-12 text-center text-slate-500 italic">Você não fez nenhuma aposta.</div> :
                    [...myBets].reverse().map(b => (
                      <div key={b.id} className="p-4 flex justify-between items-center border-b border-slate-800">
                        <div className="flex items-center gap-4">
                          <AnimalIcon animal={ANIMALS.find(a => a.id === b.animalId)!} className="w-10 h-10 text-xl" />
                          <div><span className="font-bold block text-sm uppercase">{ANIMALS.find(a => a.id === b.animalId)?.name}</span><span className="text-[10px] text-slate-500">Valor: RP$ {b.amount}</span></div>
                        </div>
                        <div className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${b.status === 'WON' ? 'border-emerald-500 text-emerald-500' : b.status === 'LOST' ? 'border-rose-500 text-rose-500' : 'border-amber-500 text-amber-500'}`}>{b.status === 'WON' ? 'VITÓRIA' : b.status === 'LOST' ? 'PERDIDA' : 'PENDENTE'}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {view === 'ADMIN' && isAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-400"><UserPlus size={20}/> Cadastrar Usuário</h2>
                    <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
                      <div className="col-span-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Login (Identidade)</label><input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required /></div>
                      <div className="col-span-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Nome RP</label><input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm" value={newUser.rpName} onChange={e => setNewUser({...newUser, rpName: e.target.value})} required /></div>
                      <div className="col-span-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Cargo</label><select className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}><option value={UserRole.USER}>Apostador</option><option value={UserRole.ADMIN}>Diretor</option></select></div>
                      <div className="col-span-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Créditos</label><input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm" value={newUser.balance} onChange={e => setNewUser({...newUser, balance: Number(e.target.value)})} /></div>
                      <button className="col-span-2 bg-indigo-600 p-3 rounded-xl font-bold text-sm hover:bg-indigo-500 mt-2 uppercase tracking-widest">AUTORIZAR ACESSO</button>
                    </form>
                  </div>

                  <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-400"><Database size={20}/> Banco de Dados</h2>
                    <p className="text-xs text-slate-500 mb-6 italic uppercase font-bold tracking-tighter">Exportar para outros computadores:</p>
                    <div className="space-y-4">
                       <button onClick={exportDB} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 p-4 rounded-xl font-black text-xs transition-colors border border-slate-700 uppercase tracking-widest">
                         <Download size={16}/> Copiar Código de Backup
                       </button>
                       <div className="border-t border-slate-800 pt-4">
                          <p className="text-[9px] text-slate-600 mb-2 uppercase font-bold">Importar Backup Externo:</p>
                          <textarea className="w-full bg-slate-950 p-3 rounded-lg text-[10px] font-mono mb-2 h-20 outline-none border border-slate-800" placeholder="Cole o código aqui..." value={dbCode} onChange={e => setDbCode(e.target.value)}></textarea>
                          <button onClick={importDB} className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 p-3 rounded-lg font-bold text-xs transition-colors border border-indigo-500/30 uppercase tracking-widest">
                            <Upload size={14}/> Sincronizar Agora
                          </button>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-900 p-8 rounded-2xl border-2 border-dashed border-rose-500/30 text-center shadow-xl">
                    <h2 className="text-xl font-bold mb-6 uppercase tracking-widest text-rose-500">Extração Oficial</h2>
                    <button onClick={executeDraw} className="bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all w-full p-8 rounded-3xl font-black text-4xl shadow-xl shadow-rose-900/40 border-b-8 border-rose-800">SORTEAR 🎲</button>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-slate-800 pb-2"><Users size={18} className="text-emerald-400"/> Lista de Registros ({state.users.length})</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {state.users.map(u => (
                        <div key={u.id} className="flex justify-between items-center py-2 px-3 bg-slate-800/40 rounded border border-slate-700/50">
                          <div><span className="font-bold text-xs">{u.rpName}</span><span className="text-[10px] text-slate-500 block">ID: {u.username}</span></div>
                          <div className="text-right"><span className="font-mono text-emerald-400 font-bold text-xs">RP$ {u.balance.toLocaleString()}</span></div>
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
