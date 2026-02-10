
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
  TriangleAlert
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
        <button onClick={() => setView('HISTORY')} className={`flex items-center space-x-1 transition-colors ${view === 'HISTORY' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}><HistoryIcon size={18} /><span>{currentUser?.role === UserRole.ADMIN ? 'Histórico' : 'Minhas Apostas'}</span></button>
        {currentUser?.role === UserRole.ADMIN && <button onClick={() => setView('ADMIN')} className={`flex items-center space-x-1 transition-colors ${view === 'ADMIN' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-rose-200'}`}><Settings size={18} /><span>Gerenciamento</span></button>}
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
  const defaultAdmin: User = { 
    id: '1', 
    username: 'admin', 
    password: '123', 
    rpName: 'Diretor Geral', 
    balance: 1000000, 
    role: UserRole.ADMIN, 
    createdAt: Date.now() 
  };

  const initialState: AppState = {
    currentUser: null,
    users: [defaultAdmin],
    bets: [],
    draws: [],
    animals: ANIMALS
  };

  if (typeof window === 'undefined') return initialState;
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try { 
      const parsed = JSON.parse(saved);
      return {
        currentUser: parsed.currentUser || null,
        users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : [defaultAdmin],
        bets: Array.isArray(parsed.bets) ? parsed.bets : [],
        draws: Array.isArray(parsed.draws) ? parsed.draws : [],
        animals: ANIMALS
      };
    } catch (e) { 
      return initialState;
    }
  }
  return initialState;
};

const saveState = (state: AppState) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); };

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'BET' | 'HISTORY' | 'ADMIN'>('LOGIN');
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
    const cleanPassword = loginForm.password.trim();
    
    // Procura o usuário ignorando espaços e maiúsculas no nome
    const user = state.users.find(u => 
      u.username.trim().toLowerCase() === cleanUsername
    );
    
    if (!user) {
      showToast('Usuário não encontrado. Peça o Código Master para sincronizar.', 'error');
      return;
    }

    if (user.password.trim() === cleanPassword) { 
      setState(prev => ({ ...prev, currentUser: user })); 
      setView('DASHBOARD'); 
      showToast(`Bem-vindo, ${user.rpName}!`); 
    } else { 
      showToast('Senha incorreta para este usuário.', 'error'); 
    }
  };

  const handleHardReset = () => {
    if (window.confirm("⚠️ ATENÇÃO: Isso vai APAGAR TUDO deste navegador e resetar para o padrão. Use isso se o Código Master não estiver funcionando. Continuar?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleLogout = () => { 
    setState(prev => ({ ...prev, currentUser: null })); 
    setView('LOGIN'); 
    setLoginForm({ username: '', password: '' }); 
    showToast('Sessão encerrada.'); 
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNewUser = newUser.username.trim().toLowerCase();
    if (state.users.find(u => u.username.toLowerCase().trim() === cleanNewUser)) {
      showToast('Este login já existe.', 'error');
      return;
    }
    const createdUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: newUser.username.trim(),
      password: newUser.password.trim(),
      rpName: newUser.rpName.trim(),
      balance: newUser.balance,
      role: newUser.role,
      createdAt: Date.now()
    };
    setState(prev => ({ ...prev, users: [...prev.users, createdUser] }));
    setNewUser({ username: '', password: '', rpName: '', role: UserRole.USER, balance: 5000 });
    showToast(`Conta de ${createdUser.rpName} criada!`);
  };

  const deleteUser = (userId: string) => {
    if (userId === '1') { showToast('Impossível remover o Master.', 'error'); return; }
    setState(prev => ({ ...prev, users: prev.users.filter(u => u.id !== userId) }));
    showToast('Usuário removido.');
  };

  const exportDB = () => {
    try {
      const data = btoa(JSON.stringify({ 
        users: state.users, 
        bets: state.bets, 
        draws: state.draws 
      }));
      navigator.clipboard.writeText(data);
      showToast('Código Master copiado com sucesso!');
    } catch (e) {
      showToast('Erro ao gerar código.', 'error');
    }
  };

  const importDB = () => {
    try {
      const code = dbCode.trim();
      if (!code) return;
      const decoded = JSON.parse(atob(code));
      
      if (!decoded.users) throw new Error("Dados inválidos");

      const newStateData = { 
        currentUser: null,
        users: decoded.users, 
        bets: Array.isArray(decoded.bets) ? decoded.bets : [], 
        draws: Array.isArray(decoded.draws) ? decoded.draws : [],
        animals: ANIMALS
      };
      
      // Persistência imediata
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStateData));
      showToast('Sincronização concluída! Recarregando...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      showToast('Código inválido ou corrompido.', 'error');
    }
  };

  const placeBet = (animalId: number, amount: number) => {
    if (!state.currentUser) return;
    if (amount <= 0 || state.currentUser.balance < amount) { showToast('Saldo insuficiente.', 'error'); return; }
    const animal = ANIMALS.find(a => a.id === animalId)!;
    const newBet: Bet = { id: Math.random().toString(36).substr(2, 9), userId: state.currentUser.id, animalId, amount, drawId: null, status: 'PENDING', potentialWin: amount * animal.multiplier, createdAt: Date.now() };
    setState(prev => {
      const updatedBalance = prev.currentUser!.balance - amount;
      const updatedUsers = prev.users.map(u => u.id === prev.currentUser!.id ? { ...u, balance: updatedBalance } : u);
      return { ...prev, currentUser: { ...prev.currentUser!, balance: updatedBalance }, users: updatedUsers, bets: [...prev.bets, newBet] };
    });
    showToast(`Aposta confirmada!`);
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
    showToast(`Extração concluída: ${animal.name}!`);
  };

  const isAdmin = state.currentUser?.role === UserRole.ADMIN;
  const myBets = state.bets.filter(b => b.userId === state.currentUser?.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {view === 'LOGIN' ? (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-6">
                <Lock className="text-white" size={32} />
              </div>
              <h1 className="text-4xl font-black tracking-tighter mb-1">BICHO RP</h1>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
                  {state.users.length} Contas no Dispositivo
                </span>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
              {!showImport ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Seu Login</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 pl-12 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700" 
                        placeholder="Nome de usuário"
                        value={loginForm.username}
                        onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Sua Senha</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 pl-12 pr-12 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700" 
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button className="w-full bg-indigo-600 hover:bg-indigo-500 p-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98]">
                    Entrar no Jogo
                  </button>
                  
                  <div className="pt-4 border-t border-slate-800/50 flex flex-col gap-3">
                    <button type="button" onClick={() => setShowImport(true)} className="w-full text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase transition-colors flex items-center justify-center gap-2">
                      <Upload size={12}/> Importar Dados (Código Master)
                    </button>
                    <button type="button" onClick={handleHardReset} className="w-full text-[10px] text-rose-500/50 hover:text-rose-500 font-bold uppercase transition-colors flex items-center justify-center gap-2">
                      <TriangleAlert size={12}/> Limpar Dados / Resetar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="text-center space-y-2">
                    <h3 className="text-sm font-bold uppercase">Sincronização Master</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Cole o código do Administrador para liberar seu acesso</p>
                  </div>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-[10px] font-mono h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder:text-slate-800" 
                    placeholder="Cole o código aqui..." 
                    value={dbCode} 
                    onChange={e => setDbCode(e.target.value)}
                  ></textarea>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowImport(false)} className="p-3 bg-slate-800 rounded-xl text-xs font-bold uppercase">Cancelar</button>
                    <button onClick={importDB} className="p-3 bg-indigo-600 rounded-xl text-xs font-bold uppercase">Sincronizar</button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-center text-[9px] text-slate-700 font-bold uppercase tracking-widest">Simulador Local v3.5.0 • GTA RP</p>
          </div>
        </div>
      ) : (
        <>
          <Navigation view={view} setView={setView} currentUser={state.currentUser} onLogout={handleLogout} />
          <main className="max-w-6xl mx-auto p-4 md:p-8">
            {view === 'DASHBOARD' && (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Painel de Controle</h1>
                    <p className="text-slate-400 font-bold">Jogador: <span className="text-indigo-400">{state.currentUser?.rpName}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 uppercase block">Status da Rede</span>
                    <span className="text-[10px] text-emerald-500 font-black uppercase flex items-center gap-1 justify-end"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Offline / Local</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg group hover:border-emerald-500/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <Wallet className="text-emerald-400" size={24} />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saldo Fictício</span>
                    </div>
                    <h2 className="text-3xl font-black font-mono text-emerald-400">RP$ {state.currentUser?.balance?.toLocaleString() || 0}</h2>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg group hover:border-indigo-500/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <Gamepad2 className="text-indigo-400" size={24} />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meus Jogos</span>
                    </div>
                    <h2 className="text-3xl font-black font-mono text-indigo-400">{myBets.length}</h2>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 border-l-4 border-amber-500 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <Trophy className="text-amber-500" size={24} />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Último Sorteado</span>
                    </div>
                    {state.draws && state.draws.length > 0 && state.draws[0] ? (
                      <div className="flex items-center gap-3">
                        <AnimalIcon animal={ANIMALS.find(a => a.id === state.draws[0].winningAnimalId)} className="w-10 h-10 text-2xl" />
                        <span className="font-black text-lg uppercase">{ANIMALS.find(a => a.id === state.draws[0].winningAnimalId)?.name || '---'}</span>
                      </div>
                    ) : <span className="text-slate-600 italic text-sm uppercase font-bold">Nenhum</span>}
                  </div>
                </div>
              </div>
            )}

            {view === 'BET' && (
              <div className="space-y-6">
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                  <h2 className="text-xl font-black uppercase tracking-tight">Escolha seu Bicho</h2>
                  <div className="flex items-center bg-slate-950 rounded-2xl p-2 border border-slate-800">
                    <span className="px-4 text-[10px] font-black text-slate-500 uppercase">Valor da Aposta</span>
                    <input 
                      type="number" 
                      value={betAmount} 
                      onChange={e => setBetAmount(Math.max(1, Number(e.target.value)))} 
                      className="bg-slate-800 border-none rounded-xl p-3 w-32 font-mono text-emerald-400 font-bold text-center focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {ANIMALS.map(a => (
                    <div 
                      key={a.id} 
                      onClick={() => setSelectedAnimalId(a.id)} 
                      className={`group p-6 rounded-3xl border-2 transition-all cursor-pointer shadow-md ${selectedAnimalId === a.id ? 'border-indigo-500 bg-indigo-500/10 shadow-indigo-500/20' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}
                    >
                      <div className="h-20 flex items-center justify-center mb-4"><AnimalIcon animal={a} className="w-16 h-16 text-5xl" /></div>
                      <p className="font-black text-xs text-center uppercase mb-4 tracking-tighter">{a.name}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); placeBet(a.id, betAmount); }} 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] py-3 rounded-xl font-black transition-all shadow-md shadow-indigo-900/30 uppercase tracking-widest active:scale-95"
                      >
                        Apostar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {view === 'HISTORY' && (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 font-black uppercase tracking-widest text-xs flex justify-between bg-slate-900/50">
                  <span>{isAdmin ? 'Todos os Sorteios do Sistema' : 'Meu Histórico de Jogos'}</span>
                </div>
                <div className="max-h-[65vh] overflow-y-auto">
                  {isAdmin ? (
                    (!state.draws || state.draws.length === 0) ? <div className="p-12 text-center text-slate-600 italic">Sem extrações até o momento.</div> :
                    state.draws.map(d => (
                      <div key={d.id} className="p-6 flex justify-between items-center border-b border-slate-800 last:border-0 hover:bg-slate-800/20 transition-colors">
                        <div className="flex items-center gap-6">
                          <AnimalIcon animal={ANIMALS.find(a => a.id === d.winningAnimalId)} className="w-14 h-14 text-3xl" />
                          <div>
                            <span className="font-black block uppercase text-lg">{ANIMALS.find(a => a.id === d.winningAnimalId)?.name || '---'}</span>
                            <span className="text-[10px] text-slate-500 font-mono font-bold">{new Date(d.drawTime).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Número Sorteado</span>
                          <span className="font-mono text-indigo-400 font-black text-3xl">Nº {String(d.winningNumber || 0).padStart(2, '0')}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    (!myBets || myBets.length === 0) ? <div className="p-12 text-center text-slate-600 italic">Você ainda não fez nenhuma aposta.</div> :
                    [...myBets].reverse().map(b => (
                      <div key={b.id} className="p-5 flex justify-between items-center border-b border-slate-800 last:border-0">
                        <div className="flex items-center gap-4">
                          <AnimalIcon animal={ANIMALS.find(a => a.id === b.animalId)} className="w-10 h-10 text-2xl" />
                          <div>
                            <span className="font-black block text-sm uppercase tracking-tight">{ANIMALS.find(a => a.id === b.animalId)?.name || '---'}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Lance: RP$ {b.amount?.toLocaleString() || 0}</span>
                          </div>
                        </div>
                        <div className={`text-[10px] font-black px-4 py-2 rounded-xl border uppercase tracking-widest ${b.status === 'WON' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : b.status === 'LOST' ? 'border-rose-500 text-rose-500 bg-rose-500/10' : 'border-amber-500 text-amber-500 bg-amber-500/10'}`}>
                          {b.status === 'WON' ? 'Ganhou' : b.status === 'LOST' ? 'Perdeu' : 'Pendente'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {view === 'ADMIN' && isAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Create User Form */}
                  <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-indigo-400 uppercase tracking-tighter"><UserPlus size={24}/> Criar Conta de Amigo</h2>
                    <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
                      <div className="col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Login</label>
                        <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-500" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="Ex: amigorp" required />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Senha</label>
                        <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-500" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Senha" required />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nome no GTA</label>
                        <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-500" value={newUser.rpName} onChange={e => setNewUser({...newUser, rpName: e.target.value})} placeholder="Ex: Zé" required />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Saldo</label>
                        <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-500" value={newUser.balance} onChange={e => setNewUser({...newUser, balance: Number(e.target.value)})} />
                      </div>
                      <button className="col-span-2 bg-indigo-600 hover:bg-indigo-500 p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all mt-2 shadow-lg shadow-indigo-900/20 active:scale-[0.98]">
                        Confirmar Criação
                      </button>
                    </form>
                  </div>

                  {/* Sync Instructions */}
                  <div className="bg-slate-900 p-8 rounded-3xl border border-indigo-500/30 shadow-xl bg-gradient-to-br from-slate-900 to-slate-950">
                    <h2 className="text-xl font-black mb-4 flex items-center gap-3 text-emerald-400 uppercase tracking-tighter"><Database size={24}/> Gerar Código de Sincronia</h2>
                    <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/20 mb-6">
                       <p className="text-[11px] text-slate-400 font-bold uppercase leading-relaxed flex gap-2">
                          <Info size={16} className="text-indigo-400 shrink-0"/>
                          Sempre que criar um amigo, você deve enviar o Código Master para ele sincronizar o navegador dele com o seu.
                       </p>
                    </div>
                    <button onClick={exportDB} className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 p-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]">
                      <Download size={18}/> COPIAR CÓDIGO MASTER
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Draw Control */}
                  <div className="bg-slate-900 p-8 rounded-3xl border-2 border-dashed border-rose-500/30 text-center shadow-xl">
                    <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-rose-500">Mesa de Extração</h2>
                    <button onClick={executeDraw} className="bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all w-full p-10 rounded-full font-black text-5xl shadow-xl shadow-rose-900/40 border-b-8 border-rose-800">SORTEAR 🎲</button>
                  </div>

                  {/* Users List with Passwords */}
                  <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                      <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Users size={16} className="text-emerald-400"/> Contas Sincronizadas</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {state.users && state.users.map(u => (
                        <div key={u.id} className="flex justify-between items-center p-4 border-b border-slate-800 hover:bg-slate-800/30 transition-all">
                          <div>
                            <span className="font-black text-xs uppercase block text-indigo-300">{u.rpName}</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                               <span className="text-[8px] text-slate-500 font-mono uppercase bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">Log: {u.username}</span>
                               <span className="text-[8px] text-emerald-500 font-mono uppercase bg-slate-950 px-1.5 py-0.5 rounded border border-emerald-900/30">Pass: {u.password}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="text-right">
                               <span className="font-mono text-emerald-400 font-black text-xs">RP$ {u.balance?.toLocaleString() || 0}</span>
                             </div>
                             <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-700 hover:text-rose-500 transition-colors">
                               <Trash2 size={16} />
                             </button>
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
