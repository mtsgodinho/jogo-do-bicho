
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
  Key,
  Trash2,
  Lock,
  RefreshCcw,
  Eye,
  EyeOff,
  Info,
  ExternalLink,
  TriangleAlert,
  ArrowLeftRight,
  Share2
} from 'lucide-react';

// --- Sub-Components ---
const AnimalIcon: React.FC<{ animal: Animal | undefined; className?: string }> = ({ animal, className = "" }) => {
  if (!animal) return <div className={`bg-slate-800 rounded-md ${className} flex items-center justify-center`}>?</div>;
  const isUrl = animal.icon && animal.icon.startsWith('http');
  if (isUrl) {
    return (
      <div className={`relative overflow-hidden bg-slate-800 rounded-md flex items-center justify-center ${className}`}>
        <img src={animal.icon} alt={animal.name} className="w-full h-full object-cover" loading="lazy" />
      </div>
    );
  }
  return <span className={`flex items-center justify-center ${className}`}>{animal.icon || '🐾'}</span>;
};

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl z-50 flex items-center space-x-2 animate-bounce ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
      {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
      <span className="font-medium text-sm">{message}</span>
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
        <button onClick={() => setView('HISTORY')} className={`flex items-center space-x-1 transition-colors ${view === 'HISTORY' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}><HistoryIcon size={18} /><span>Histórico</span></button>
        <button onClick={() => setView('SYNC')} className={`flex items-center space-x-1 transition-colors ${view === 'SYNC' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-emerald-200'}`}><ArrowLeftRight size={18} /><span>Sincronizar</span></button>
        {currentUser?.role === UserRole.ADMIN && <button onClick={() => setView('ADMIN')} className={`flex items-center space-x-1 transition-colors ${view === 'ADMIN' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-rose-200'}`}><Settings size={18} /><span>Painel Admin</span></button>}
      </div>
      <div className="flex items-center space-x-4">
        <div className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 flex items-center space-x-2"><Wallet size={16} className="text-emerald-400" /><span className="text-sm font-mono font-bold text-slate-100">RP$ {currentUser?.balance?.toLocaleString() || 0}</span></div>
        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-400 transition-colors"><LogOut size={20} /></button>
      </div>
    </div>
  </nav>
);

// --- Helpers ---
const loadState = (): AppState => {
  const defaultAdmin: User = { id: '1', username: 'admin', password: '123', rpName: 'Diretor Geral', balance: 1000000, role: UserRole.ADMIN, createdAt: Date.now() };
  const initialState: AppState = { currentUser: null, users: [defaultAdmin], bets: [], draws: [], animals: ANIMALS };
  if (typeof window === 'undefined') return initialState;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { 
      const parsed = JSON.parse(saved);
      return { currentUser: parsed.currentUser || null, users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : [defaultAdmin], bets: Array.isArray(parsed.bets) ? parsed.bets : [], draws: Array.isArray(parsed.draws) ? parsed.draws : [], animals: ANIMALS };
    } catch (e) { return initialState; }
  }
  return initialState;
};

const saveState = (state: AppState) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); };

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'BET' | 'HISTORY' | 'ADMIN' | 'SYNC'>('LOGIN');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [newUser, setNewUser] = useState({ username: '', password: '', rpName: '', role: UserRole.USER, balance: 5000 });
  const [dbCode, setDbCode] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { saveState(state); }, [state]);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => { setToast({ message, type }); }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = loginForm.username.trim().toLowerCase();
    const user = state.users.find(u => u.username.trim().toLowerCase() === cleanUsername);
    if (!user) { showToast('Conta não encontrada neste dispositivo.', 'error'); return; }
    if (user.password.trim() === loginForm.password.trim()) { setState(prev => ({ ...prev, currentUser: user })); setView('DASHBOARD'); showToast(`Bem-vindo, ${user.rpName}!`); }
    else { showToast('Senha incorreta.', 'error'); }
  };

  const handleHardReset = () => { if (window.confirm("Isso apagará TUDO. Continuar?")) { localStorage.clear(); window.location.reload(); } };
  const handleLogout = () => { setState(prev => ({ ...prev, currentUser: null })); setView('LOGIN'); showToast('Sessão encerrada.'); };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.users.find(u => u.username.toLowerCase().trim() === newUser.username.trim().toLowerCase())) { showToast('Login existe.', 'error'); return; }
    const createdUser: User = { id: Math.random().toString(36).substr(2, 9), username: newUser.username.trim(), password: newUser.password.trim(), rpName: newUser.rpName.trim(), balance: newUser.balance, role: newUser.role, createdAt: Date.now() };
    setState(prev => ({ ...prev, users: [...prev.users, createdUser] }));
    setNewUser({ username: '', password: '', rpName: '', role: UserRole.USER, balance: 5000 });
    showToast(`Conta criada! Lembre-se de mandar o código master para seu amigo.`);
  };

  const deleteUser = (userId: string) => {
    if (userId === '1') return;
    setState(prev => ({ ...prev, users: prev.users.filter(u => u.id !== userId) }));
    showToast('Usuário removido.');
  };

  const exportState = () => {
    const data = btoa(JSON.stringify({ users: state.users, bets: state.bets, draws: state.draws }));
    navigator.clipboard.writeText(data);
    showToast('Código Master copiado!');
  };

  const importState = () => {
    try {
      const decoded = JSON.parse(atob(dbCode.trim()));
      const newStateData = { 
        ...state,
        users: decoded.users, 
        bets: decoded.bets, 
        draws: decoded.draws 
      };
      if (state.currentUser) {
        newStateData.currentUser = decoded.users.find((u: User) => u.id === state.currentUser?.id) || state.currentUser;
      }
      setState(newStateData);
      setDbCode('');
      setShowImport(false);
      showToast('Sincronização concluída!');
    } catch (e) { showToast('Código inválido.', 'error'); }
  };

  const placeBet = (animalId: number, amount: number) => {
    if (!state.currentUser || amount <= 0 || state.currentUser.balance < amount) { showToast('Saldo insuficiente.', 'error'); return; }
    const animal = ANIMALS.find(a => a.id === animalId)!;
    const newBet: Bet = { id: Math.random().toString(36).substr(2, 9), userId: state.currentUser.id, animalId, amount, drawId: null, status: 'PENDING', potentialWin: amount * animal.multiplier, createdAt: Date.now() };
    setState(prev => {
      const updatedBalance = prev.currentUser!.balance - amount;
      const updatedUsers = prev.users.map(u => u.id === prev.currentUser!.id ? { ...u, balance: updatedBalance } : u);
      return { ...prev, currentUser: { ...prev.currentUser!, balance: updatedBalance }, users: updatedUsers, bets: [...prev.bets, newBet] };
    });
    showToast(`Aposta feita! Envie seu código para o Admin.`);
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
      return { ...prev, users: updatedUsers, currentUser: updatedUsers.find(u => u.id === prev.currentUser?.id) || prev.currentUser, draws: [newDraw, ...prev.draws], bets: updatedBets };
    });
    showToast(`Sorteado: ${animal.name}! Mande o novo código master para todos.`);
  };

  const isAdmin = state.currentUser?.role === UserRole.ADMIN;
  const myBets = state.bets.filter(b => b.userId === state.currentUser?.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {view === 'LOGIN' ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl mb-6"><Lock className="text-white" size={32} /></div>
              <h1 className="text-4xl font-black mb-1">BICHO RP</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{state.users.length} Contas no Dispositivo</p>
            </div>
            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative">
              {!showImport ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  {state.users.length === 1 && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl flex gap-3 items-center mb-4">
                      <Info size={18} className="text-indigo-400 shrink-0" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">Nenhuma conta de jogador encontrada. Importe o código do Admin para entrar.</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Seu Login</label>
                    <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 font-bold outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Nome de usuário" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Sua Senha</label>
                    <input type="password" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 font-bold outline-none focus:ring-1 focus:ring-indigo-500" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
                  </div>
                  <button className="w-full bg-indigo-600 hover:bg-indigo-500 p-4 rounded-xl font-black uppercase transition-all shadow-lg active:scale-95">Entrar no Jogo</button>
                  <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                    <button type="button" onClick={() => setShowImport(true)} className="text-[11px] text-indigo-400 font-bold uppercase flex items-center justify-center gap-2 hover:text-indigo-300 transition-colors"><Upload size={14}/> Sincronizar (Código Master)</button>
                    <button type="button" onClick={handleHardReset} className="text-[10px] text-rose-500/50 font-bold uppercase flex items-center justify-center gap-2"><TriangleAlert size={12}/> Limpar Dados</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                  <h3 className="text-sm font-black uppercase text-center text-indigo-400">Importar Dados do Servidor</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase text-center">Cole o código recebido do Admin abaixo:</p>
                  <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-[10px] font-mono h-40 outline-none focus:ring-1 focus:ring-indigo-500 resize-none" placeholder="Pressione Ctrl+V aqui..." value={dbCode} onChange={e => setDbCode(e.target.value)}></textarea>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowImport(false)} className="p-3 bg-slate-800 rounded-xl text-xs font-bold uppercase">Voltar</button>
                    <button onClick={importState} className="p-3 bg-indigo-600 rounded-xl text-xs font-bold uppercase shadow-lg shadow-indigo-900/20">Sincronizar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <Navigation view={view} setView={setView} currentUser={state.currentUser} onLogout={handleLogout} />
          <main className="max-w-6xl mx-auto p-4 md:p-8">
            
            {view === 'SYNC' && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black uppercase">Central de Sincronia</h2>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-tight">O dinheiro só entra se você trocar os códigos!</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900 p-8 rounded-3xl border border-emerald-500/30 flex flex-col items-center text-center shadow-xl">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-emerald-500"><Download size={32}/></div>
                    <h3 className="font-black text-lg mb-2 uppercase">ENVIAR DADOS</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-6 leading-relaxed">Gere o código com suas apostas/prêmios e mande para os outros.</p>
                    <button onClick={exportState} className="w-full bg-emerald-600 hover:bg-emerald-500 p-4 rounded-xl font-black text-xs uppercase transition-all shadow-lg active:scale-95">Copiar Meu Código</button>
                  </div>
                  <div className="bg-slate-900 p-8 rounded-3xl border border-indigo-500/30 flex flex-col items-center text-center shadow-xl">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 text-indigo-500"><Upload size={32}/></div>
                    <h3 className="font-black text-lg mb-2 uppercase">RECEBER DADOS</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-6 leading-relaxed">Cole o código recebido para atualizar o saldo e as apostas.</p>
                    <div className="w-full space-y-3">
                      <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[9px] font-mono h-20 outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Cole aqui..." value={dbCode} onChange={e => setDbCode(e.target.value)}></textarea>
                      <button onClick={importState} className="w-full bg-indigo-600 hover:bg-indigo-500 p-4 rounded-xl font-black text-xs uppercase transition-all shadow-lg active:scale-95">Sincronizar Agora</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'DASHBOARD' && (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Painel de Jogador</h1>
                    <p className="text-slate-400 font-bold">Logado como: <span className="text-indigo-400">{state.currentUser?.rpName}</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800"><Wallet className="text-emerald-400 mb-4" size={24} /><h2 className="text-3xl font-black font-mono text-emerald-400">RP$ {state.currentUser?.balance?.toLocaleString() || 0}</h2></div>
                  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800"><Gamepad2 className="text-indigo-400 mb-4" size={24} /><h2 className="text-3xl font-black font-mono text-indigo-400">{myBets.length} Apostas</h2></div>
                  <div className="bg-slate-900 p-6 rounded-3xl border-l-4 border-amber-500"><Trophy className="text-amber-500 mb-4" size={24} />{state.draws[0] ? <div className="flex items-center gap-3"><AnimalIcon animal={ANIMALS.find(a => a.id === state.draws[0].winningAnimalId)} className="w-10 h-10 text-2xl" /><span className="font-black text-lg uppercase">{ANIMALS.find(a => a.id === state.draws[0].winningAnimalId)?.name}</span></div> : '---'}</div>
                </div>
              </div>
            )}

            {view === 'BET' && (
              <div className="space-y-6">
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex items-center justify-between gap-4 shadow-xl">
                  <h2 className="text-xl font-black uppercase">Escolha seu Bicho</h2>
                  <div className="flex items-center bg-slate-950 rounded-2xl p-2 border border-slate-800">
                    <span className="px-4 text-[10px] font-black text-slate-500 uppercase">Valor</span>
                    <input type="number" value={betAmount} onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))} className="bg-slate-800 rounded-xl p-3 w-32 font-mono text-emerald-400 font-bold text-center outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {ANIMALS.map(a => (
                    <div key={a.id} onClick={() => setSelectedAnimalId(a.id)} className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${selectedAnimalId === a.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900'}`}>
                      <div className="h-20 flex items-center justify-center mb-4"><AnimalIcon animal={a} className="w-16 h-16 text-5xl" /></div>
                      <p className="font-black text-xs text-center uppercase mb-4">{a.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); placeBet(a.id, betAmount); }} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] py-3 rounded-xl font-black uppercase active:scale-95">Apostar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'HISTORY' && (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 font-black uppercase text-xs flex justify-between bg-slate-900/50">
                  <span>{isAdmin ? 'Histórico Global' : 'Meus Resultados'}</span>
                </div>
                <div className="max-h-[65vh] overflow-y-auto p-4 space-y-4">
                  {(isAdmin ? state.draws : myBets.slice().reverse()).map((item: any) => (
                    isAdmin ? (
                      <div key={item.id} className="p-6 bg-slate-800/40 rounded-2xl flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <AnimalIcon animal={ANIMALS.find(a => a.id === item.winningAnimalId)} className="w-12 h-12 text-2xl" />
                          <div><span className="font-black block uppercase">{ANIMALS.find(a => a.id === item.winningAnimalId)?.name}</span><span className="text-[10px] text-slate-500 font-bold">{new Date(item.drawTime).toLocaleString()}</span></div>
                        </div>
                        <span className="font-mono text-indigo-400 font-black text-3xl">Nº {String(item.winningNumber).padStart(2, '0')}</span>
                      </div>
                    ) : (
                      <div key={item.id} className="p-5 bg-slate-800/40 rounded-2xl flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <AnimalIcon animal={ANIMALS.find(a => a.id === item.animalId)} className="w-10 h-10 text-xl" />
                          <div><span className="font-black block text-sm uppercase">{ANIMALS.find(a => a.id === item.animalId)?.name}</span><span className="text-[10px] text-slate-500 font-bold">RP$ {item.amount.toLocaleString()}</span></div>
                        </div>
                        <div className={`text-[10px] font-black px-4 py-2 rounded-xl border uppercase ${item.status === 'WON' ? 'border-emerald-500 text-emerald-500' : item.status === 'LOST' ? 'border-rose-500 text-rose-500' : 'border-amber-500 text-amber-500'}`}>
                          {item.status === 'WON' ? 'Ganhou' : item.status === 'LOST' ? 'Perdeu' : 'Pendente'}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {view === 'ADMIN' && isAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-indigo-400 uppercase"><UserPlus size={24}/> Gerenciar Contas</h2>
                    <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4 mb-8">
                      <input type="text" className="bg-slate-800 rounded-xl p-3 text-sm font-bold border border-slate-700 outline-none" placeholder="Login" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required />
                      <input type="text" className="bg-slate-800 rounded-xl p-3 text-sm font-bold border border-slate-700 outline-none" placeholder="Senha" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                      <input type="text" className="bg-slate-800 rounded-xl p-3 text-sm font-bold border border-slate-700 outline-none" placeholder="Nome GTA" value={newUser.rpName} onChange={e => setNewUser({...newUser, rpName: e.target.value})} required />
                      <input type="number" className="bg-slate-800 rounded-xl p-3 text-sm font-bold border border-slate-700 outline-none" placeholder="Saldo" value={newUser.balance} onChange={e => setNewUser({...newUser, balance: Number(e.target.value)})} />
                      <button className="col-span-2 bg-indigo-600 hover:bg-indigo-500 p-4 rounded-xl font-black uppercase text-xs transition-all shadow-lg active:scale-95">Criar Conta</button>
                    </form>
                    <div className="pt-6 border-t border-slate-800">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">Sincronia Rápida</h4>
                      <button onClick={exportState} className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 p-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]">
                        <Download size={18}/> COPIAR CÓDIGO MASTER
                      </button>
                      <p className="text-[9px] text-slate-600 font-bold uppercase mt-3 text-center">Mande este código para seus amigos entrarem no jogo.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-slate-900 p-8 rounded-3xl border-2 border-dashed border-rose-500/30 text-center shadow-xl">
                    <h2 className="text-xl font-black mb-6 uppercase text-rose-500">Mesa de Extração</h2>
                    <div className="mb-4 text-[10px] font-bold text-slate-500 uppercase">Apostas Pendentes: {state.bets.filter(b => b.status === 'PENDING').length}</div>
                    <button onClick={executeDraw} className="bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all w-full p-10 rounded-full font-black text-5xl border-b-8 border-rose-800 shadow-xl shadow-rose-950/50">SORTEAR 🎲</button>
                  </div>
                  <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-slate-800 bg-slate-900/50"><h3 className="font-black text-xs uppercase">Usuários ({state.users.length})</h3></div>
                    <div className="max-h-80 overflow-y-auto">
                      {state.users.map(u => (
                        <div key={u.id} className="flex justify-between items-center p-4 border-b border-slate-800">
                          <div><span className="font-black text-xs uppercase block text-indigo-300">{u.rpName}</span><span className="text-[9px] text-slate-500 font-mono uppercase">L: {u.username} | P: {u.password}</span></div>
                          <div className="flex items-center gap-4"><span className="font-mono text-emerald-400 font-black text-xs">RP$ {u.balance.toLocaleString()}</span><button onClick={() => deleteUser(u.id)} className="text-slate-700 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button></div>
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
