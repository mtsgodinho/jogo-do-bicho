
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole, AppState, Bet, Draw, Animal } from './types';
import { ANIMALS, INITIAL_CREDITS, STORAGE_KEY } from './constants';
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

// --- Global State Helper ---
const loadState = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse state", e);
    }
  }
  return {
    currentUser: null,
    users: [
      { id: '1', username: 'admin', rpName: 'Padrinho do Bicho', balance: 999999, role: UserRole.ADMIN, createdAt: Date.now() },
      { id: '2', username: 'player', rpName: 'Apostador Nato', balance: 5000, role: UserRole.USER, createdAt: Date.now() }
    ],
    bets: [],
    draws: [
      { id: 'initial-draw', drawTime: Date.now() + 3600000, winningNumber: null, winningAnimalId: null, status: 'SCHEDULED' }
    ],
    animals: ANIMALS
  };
};

const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// --- Components ---

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl z-50 flex items-center space-x-2 animate-bounce ${
      type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
    }`}>
      {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
      <span className="font-medium">{message}</span>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'BET' | 'HISTORY' | 'ADMIN'>('LOGIN');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  // States that were previously conditional (Rules of Hooks fix)
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(100);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = state.users.find(u => u.username === loginData.username);
    if (user) {
      setState(prev => ({ ...prev, currentUser: user }));
      setView('DASHBOARD');
      showToast(`Bem-vindo, ${user.rpName}!`);
    } else {
      showToast('Usuário não encontrado.', 'error');
    }
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    setView('LOGIN');
    showToast('Até a próxima!');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as any;
    const username = target.regUsername.value;
    const rpName = target.regRpName.value;
    
    if (state.users.find(u => u.username === username)) {
      showToast('Usuário já existe.', 'error');
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      rpName,
      balance: INITIAL_CREDITS,
      role: UserRole.USER,
      createdAt: Date.now()
    };

    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUser: newUser
    }));
    setView('DASHBOARD');
    showToast('Conta criada com sucesso!');
  };

  const placeBet = (animalId: number, amount: number) => {
    if (!state.currentUser) return;
    if (amount <= 0) {
      showToast('Valor inválido.', 'error');
      return;
    }
    if (state.currentUser.balance < amount) {
      showToast('Saldo insuficiente.', 'error');
      return;
    }

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
      return {
        ...prev,
        currentUser: { ...prev.currentUser!, balance: updatedBalance },
        users: prev.users.map(u => u.id === prev.currentUser!.id ? { ...u, balance: updatedBalance } : u),
        bets: [...prev.bets, newBet]
      };
    });
    showToast(`Aposta de RP$ ${amount} no ${animal.name} confirmada!`);
  };

  const executeDraw = (manualWinningNumber?: number) => {
    const winningNumber = manualWinningNumber !== undefined ? manualWinningNumber : Math.floor(Math.random() * 100) + 1;
    const winningAnimal = ANIMALS.find(a => a.numbers.includes(winningNumber));

    if (!winningAnimal) return;

    const currentDrawId = Math.random().toString(36).substr(2, 9);
    const newDraw: Draw = {
      id: currentDrawId,
      drawTime: Date.now(),
      winningNumber,
      winningAnimalId: winningAnimal.id,
      status: 'COMPLETED'
    };

    const updatedBets = state.bets.map(bet => {
      if (bet.status === 'PENDING') {
        const isWin = bet.animalId === winningAnimal.id;
        return {
          ...bet,
          drawId: currentDrawId,
          status: isWin ? 'WON' : 'LOST' as any
        };
      }
      return bet;
    });

    const winners = updatedBets.filter(b => b.status === 'WON' && b.drawId === currentDrawId);
    let updatedUsers = [...state.users];
    
    winners.forEach(winner => {
      updatedUsers = updatedUsers.map(u => 
        u.id === winner.userId ? { ...u, balance: u.balance + winner.potentialWin } : u
      );
    });

    setState(prev => {
      const newCurrentUser = updatedUsers.find(u => u.id === prev.currentUser?.id) || null;
      return {
        ...prev,
        users: updatedUsers,
        currentUser: newCurrentUser,
        draws: [newDraw, ...prev.draws],
        bets: updatedBets
      };
    });

    showToast(`Sorteio realizado! O vencedor foi o ${winningAnimal.icon} ${winningAnimal.name}!`);
  };

  // Views as sub-renders to keep hooks at top level
  const renderLogin = () => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        <div className="p-12 flex flex-col justify-center bg-indigo-600 text-white">
          <div className="mb-8">
            <Trophy size={48} className="mb-4" />
            <h1 className="text-4xl font-bold mb-2">BichoRP</h1>
            <p className="text-indigo-100 text-lg">O melhor sistema de apostas fictícias para o seu Roleplay. Totalmente imersivo e sem dinheiro real.</p>
          </div>
          <div className="space-y-4 text-sm opacity-80">
            <p>✓ Gestão de Créditos RP</p>
            <p>✓ Sorteios Real-time</p>
            <p>✓ Painel Administrativo</p>
          </div>
        </div>
        <div className="p-8 md:p-12">
          <div className="mb-8 flex justify-center space-x-4 border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white">Acessar Conta</h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">Usuário</label>
              <input 
                type="text" 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Seu login..."
                value={loginData.username}
                onChange={e => setLoginData({...loginData, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">Senha (RP)</label>
              <input 
                type="password" 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
                value={loginData.password}
                onChange={e => setLoginData({...loginData, password: e.target.value})}
              />
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-indigo-500/20 transition-all">
              Entrar no Sistema
            </button>
          </form>
          <div className="mt-8 pt-8 border-t border-slate-800">
            <h3 className="text-slate-400 text-sm mb-4 text-center italic">Ainda não tem cadastro RP?</h3>
            <form onSubmit={handleRegister} className="space-y-4">
               <input name="regUsername" type="text" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-slate-600" placeholder="Novo usuário login..." />
              <input name="regRpName" type="text" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-slate-600" placeholder="Nome do seu Personagem RP..." />
              <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold py-2 rounded-lg transition-colors">
                Criar Conta Fictícia
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const Navigation = () => (
    <nav className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('DASHBOARD')}>
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Trophy className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            BichoRP
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <button onClick={() => setView('DASHBOARD')} className={`flex items-center space-x-1 ${view === 'DASHBOARD' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-white'}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button onClick={() => setView('BET')} className={`flex items-center space-x-1 ${view === 'BET' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-white'}`}>
            <Play size={18} />
            <span>Apostar</span>
          </button>
          <button onClick={() => setView('HISTORY')} className={`flex items-center space-x-1 ${view === 'HISTORY' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-white'}`}>
            <HistoryIcon size={18} />
            <span>Histórico</span>
          </button>
          {state.currentUser?.role === UserRole.ADMIN && (
            <button onClick={() => setView('ADMIN')} className={`flex items-center space-x-1 ${view === 'ADMIN' ? 'text-rose-400 font-semibold' : 'text-slate-400 hover:text-white'}`}>
              <Settings size={18} />
              <span>Admin</span>
            </button>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 flex items-center space-x-2">
            <Wallet size={16} className="text-emerald-400" />
            <span className="text-sm font-mono font-bold text-slate-100">RP$ {state.currentUser?.balance.toLocaleString()}</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-400 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );

  const renderDashboard = () => {
    const userBets = state.bets.filter(b => b.userId === state.currentUser?.id);
    const winRate = userBets.length ? (userBets.filter(b => b.status === 'WON').length / userBets.length) * 100 : 0;
    const lastDraw = state.draws.find(d => d.status === 'COMPLETED');
    const winningAnimal = ANIMALS.find(a => a.id === lastDraw?.winningAnimalId);
    const chartData = state.draws.slice(0, 7).reverse().map((d, i) => ({
      name: `Sorteio ${i + 1}`,
      value: d.winningNumber || 0
    }));

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4 text-slate-400 font-medium">
            <span>Seu Saldo RP</span>
            <Wallet className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold font-mono">RP$ {state.currentUser?.balance.toLocaleString()}</h2>
          <p className="text-slate-500 text-sm mt-2">Créditos Fictícios</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4 text-slate-400 font-medium">
            <span>Taxa de Vitória</span>
            <TrendingUp className="text-indigo-500" />
          </div>
          <h2 className="text-3xl font-bold font-mono">{winRate.toFixed(1)}%</h2>
          <p className="text-slate-500 text-sm mt-2">Baseado em {userBets.length} apostas</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-4 text-slate-400 font-medium">
            <span>Último Vencedor</span>
            <Trophy className="text-amber-500" />
          </div>
          {lastDraw ? (
            <div className="flex items-center space-x-3">
              <span className="text-4xl">{winningAnimal?.icon}</span>
              <div>
                <h2 className="text-xl font-bold">{winningAnimal?.name}</h2>
                <p className="text-slate-500 text-sm font-mono">Dezena: {lastDraw.winningNumber}</p>
              </div>
            </div>
          ) : <p className="text-slate-500">Aguardando sorteio.</p>}
        </div>
        <div className="md:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <h3 className="text-lg font-bold mb-6 text-slate-100 flex items-center space-x-2">
            <TrendingUp size={20} className="text-indigo-400" />
            <span>Tendência de Números</span>
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={3} dot={{ r: 6, fill: '#818cf8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <h3 className="text-lg font-bold mb-4 text-slate-100 flex items-center space-x-2">
            <HistoryIcon size={20} className="text-slate-400" />
            <span>Sorteios Recentes</span>
          </h3>
          <div className="space-y-3">
            {state.draws.filter(d => d.status === 'COMPLETED').slice(0, 5).map(draw => {
              const animal = ANIMALS.find(a => a.id === draw.winningAnimalId);
              return (
                <div key={draw.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{animal?.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{animal?.name}</p>
                      <p className="text-xs text-slate-500 font-mono">#{draw.winningNumber}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(draw.drawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              );
            })}
          </div>
          <button onClick={() => setView('HISTORY')} className="w-full mt-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Ver histórico completo →</button>
        </div>
      </div>
    );
  };

  const renderBet = () => (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sala de Apostas</h1>
          <p className="text-slate-400">Escolha seu bicho e tente a sorte!</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-4">
           <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Valor da Aposta</p>
              <div className="flex items-center space-x-3 mt-1">
                <button onClick={() => setBetAmount(Math.max(10, betAmount - 50))} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-white">-</button>
                <input type="number" className="w-24 bg-transparent text-center font-mono font-bold text-xl text-white focus:outline-none" value={betAmount} onChange={e => setBetAmount(Number(e.target.value))} />
                <button onClick={() => setBetAmount(betAmount + 50)} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 text-white">+</button>
              </div>
           </div>
           <button disabled={!selectedAnimalId} onClick={() => selectedAnimalId && placeBet(selectedAnimalId, betAmount)} className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all ${selectedAnimalId ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
             Confirmar Aposta
           </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {ANIMALS.map(animal => (
          <div key={animal.id} onClick={() => setSelectedAnimalId(animal.id)} className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer group hover:scale-105 active:scale-95 ${selectedAnimalId === animal.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
            <div className="flex flex-col items-center text-center">
              <span className="text-5xl mb-3 group-hover:rotate-12 transition-transform">{animal.icon}</span>
              <h4 className="font-bold text-lg mb-1">{animal.name}</h4>
              <div className="flex flex-wrap justify-center gap-1">
                {animal.numbers.map(n => <span key={n} className="text-[10px] font-mono px-1 bg-slate-800 text-slate-400 rounded">{n.toString().padStart(2, '0')}</span>)}
              </div>
              <div className="mt-3 text-xs font-bold text-emerald-400">Paga: {animal.multiplier}x</div>
            </div>
            {selectedAnimalId === animal.id && <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"><CheckCircle2 size={16} className="text-white" /></div>}
          </div>
        ))}
      </div>
    </>
  );

  const renderHistory = () => {
    const userBets = state.bets.filter(b => b.userId === state.currentUser?.id).reverse();
    const completedDraws = state.draws.filter(d => d.status === 'COMPLETED');

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800">
            <h3 className="font-bold flex items-center space-x-2"><Play size={18} className="text-indigo-400" /><span>Minhas Apostas</span></h3>
          </div>
          <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
            {userBets.length > 0 ? userBets.map(bet => {
              const animal = ANIMALS.find(a => a.id === bet.animalId);
              return (
                <div key={bet.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{animal?.icon}</span>
                    <div>
                      <p className="font-bold">{animal?.name}</p>
                      <p className="text-xs text-slate-500">{new Date(bet.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">RP$ {bet.amount}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${bet.status === 'WON' ? 'bg-emerald-500/20 text-emerald-400' : bet.status === 'LOST' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-400'}`}>
                      {bet.status === 'WON' ? `VENCEU (+RP$ ${bet.potentialWin})` : bet.status === 'LOST' ? 'PERDEU' : 'PENDENTE'}
                    </span>
                  </div>
                </div>
              );
            }) : <div className="p-8 text-center text-slate-500 italic">Nenhuma aposta registrada.</div>}
          </div>
        </div>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800">
            <h3 className="font-bold flex items-center space-x-2"><Calendar size={18} className="text-amber-400" /><span>Resultados Globais</span></h3>
          </div>
          <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
            {completedDraws.length > 0 ? completedDraws.map(draw => {
              const animal = ANIMALS.find(a => a.id === draw.winningAnimalId);
              return (
                <div key={draw.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{animal?.icon}</span>
                    <div>
                      <p className="font-bold">{animal?.name}</p>
                      <p className="text-xs text-slate-500">{new Date(draw.drawTime).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right"><p className="text-2xl font-mono font-bold text-slate-400">#{draw.winningNumber}</p></div>
                </div>
              );
            }) : <div className="p-8 text-center text-slate-500 italic">Nenhum sorteio realizado ainda.</div>}
          </div>
        </div>
      </div>
    );
  };

  const renderAdmin = () => {
    const totalVolume = state.bets.reduce((acc, b) => acc + b.amount, 0);
    const totalPayout = state.bets.filter(b => b.status === 'WON').reduce((acc, b) => acc + b.potentialWin, 0);
    const profit = totalVolume - totalPayout;
    const statsData = [{ name: 'Volume Apostado', value: totalVolume }, { name: 'Prêmios Pagos', value: totalPayout }];

    return (
      <>
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-3xl font-bold text-white mb-2">Painel do Bicheiro</h1><p className="text-rose-400 font-medium">Controle total da operação de RP.</p></div>
          <button onClick={() => executeDraw()} className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-rose-600/20 transition-all"><Play size={20} /><span>Executar Sorteio Agora</span></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800"><p className="text-slate-500 text-sm font-bold uppercase mb-2 tracking-wider">Lucro Operacional</p><h3 className={`text-3xl font-bold font-mono ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>RP$ {profit.toLocaleString()}</h3></div>
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800"><p className="text-slate-500 text-sm font-bold uppercase mb-2 tracking-wider">Apostas Ativas</p><h3 className="text-3xl font-bold font-mono text-slate-100">{state.bets.filter(b => b.status === 'PENDING').length}</h3></div>
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800"><p className="text-slate-500 text-sm font-bold uppercase mb-2 tracking-wider">Total de Players</p><h3 className="text-3xl font-bold font-mono text-slate-100">{state.users.length}</h3></div>
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800"><p className="text-slate-500 text-sm font-bold uppercase mb-2 tracking-wider">Draws Realizados</p><h3 className="text-3xl font-bold font-mono text-slate-100">{state.draws.filter(d => d.status === 'COMPLETED').length}</h3></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-[400px]">
            <h3 className="text-lg font-bold mb-6 text-slate-100">Balanço de Créditos</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 bg-slate-800/50 border-b border-slate-800"><h3 className="font-bold flex items-center space-x-2"><UserIcon size={18} className="text-indigo-400" /><span>Gestão de Usuários (RP)</span></h3></div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
              {state.users.map(user => (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-400"><UserIcon size={20} /></div><div><p className="font-bold text-sm text-white">{user.rpName}</p><p className="text-xs text-slate-500">@{user.username}</p></div></div>
                  <div className="flex items-center space-x-4"><div className="text-right"><p className="text-xs font-mono font-bold text-emerald-400">RP$ {user.balance.toLocaleString()}</p><p className="text-[10px] text-slate-500 uppercase">{user.role}</p></div>
                  <button onClick={() => { const amountStr = prompt(`Adicionar Créditos para ${user.rpName}:`, "1000"); const amount = parseInt(amountStr || "0"); if (!isNaN(amount)) { setState(prev => ({ ...prev, users: prev.users.map(u => u.id === user.id ? { ...u, balance: u.balance + amount } : u), currentUser: prev.currentUser?.id === user.id ? { ...prev.currentUser, balance: prev.currentUser.balance + amount } : prev.currentUser })); showToast(`Créditos adicionados para ${user.rpName}!`); } }} className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><Wallet size={16} /></button></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderContent = () => {
    switch(view) {
      case 'DASHBOARD': return renderDashboard();
      case 'BET': return renderBet();
      case 'HISTORY': return renderHistory();
      case 'ADMIN': return renderAdmin();
      default: return renderDashboard();
    }
  };

  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen bg-slate-950">
        {renderLogin()}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />
      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
