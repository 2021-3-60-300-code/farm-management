/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Waves, 
  Trees as TreeIcon, 
  Beef, 
  Users, 
  Calculator,
  Plus,
  Coins,
  Search,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Milk,
  TrendingUp,
  X,
  Save,
  Trash2,
  ChevronRight,
  Info,
  Download,
  Upload,
  Settings
} from 'lucide-react';
import { useFarmData } from './hooks/useFarmData';
import { cn } from './lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { PondRecord, TreeRecord, CattleRecord, LaborRecord, Transaction, AppData } from './types';
import { loginWithGoogle, logout, auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

type ActiveTab = 'dashboard' | 'ponds' | 'trees' | 'cattle' | 'labor' | 'profit';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const { 
    data, 
    loading,
    toast,
    updatePonds, 
    updateTrees, 
    addCattle, 
    deleteCattle, 
    addLabor, 
    deleteLabor, 
    resetData, 
    exportData, 
    importData, 
    addTransaction,
    exportMonthlyCSV
  } = useFarmData();

  const [online, setOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  React.useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 font-bold animate-pulse">খামার ডেটা সিঙ্ক হচ্ছে...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView data={data} setActiveTab={setActiveTab} onExport={exportData} onImport={importData} />;
      case 'ponds': return <PondView ponds={data.ponds} transactions={data.transactions} onUpdate={updatePonds} onAddTransaction={addTransaction} />;
      case 'trees': return <TreeView trees={data.trees} transactions={data.transactions} onUpdate={updateTrees} />;
      case 'cattle': return <CattleView cattle={data.cattle} transactions={data.transactions} onAdd={addCattle} onDelete={deleteCattle} />;
      case 'labor': return <LaborView labor={data.labor} transactions={data.transactions} onAdd={addLabor} onDelete={deleteLabor} />;
      case 'profit': return <ProfitLossView data={data} onExportCSV={exportMonthlyCSV} onAddTransaction={addTransaction} />;
      default: return <DashboardView data={data} setActiveTab={setActiveTab} onExport={exportData} onImport={importData} />;
    }
  };

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto relative shadow-2xl bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-primary text-white p-4 shadow-lg z-50 rounded-b-3xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {user ? (
              <img src={user.photoURL || ''} alt="User" className="w-10 h-10 rounded-2xl border-2 border-white/20" referrerPolicy="no-referrer" />
            ) : (
              <div className="bg-white/20 p-2 rounded-xl">
                <LayoutDashboard size={20} />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold leading-none">{user ? user.displayName?.split(' ')[0] : 'আপনার খামার'}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", online ? "bg-green-400" : "bg-orange-400")} />
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">
                  {online ? (user ? 'ক্লাউড সিঙ্ক চালু' : 'লোকাল মোড') : 'অফলাইন মোড'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!user ? (
              <button 
                onClick={loginWithGoogle}
                className="bg-white text-primary px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-md active:scale-95 transition-transform"
              >
                লগইন
              </button>
            ) : (
              <button 
                onClick={logout}
                className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
                title="লগ আউট"
              >
                <Plus size={18} className="rotate-45" />
              </button>
            )}
            <button onClick={resetData} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 px-4 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-xl text-white font-bold text-sm whitespace-nowrap",
              toast.type === 'success' ? "bg-green-600" : "bg-red-500"
            )}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-zinc-100 pb-2 pt-1 px-4 z-50 rounded-t-[40px] shadow-[0_-10px_30px_-15px_rgba(45,90,39,0.3)]">
        <div className="flex justify-between items-center h-16">
          <NavItem icon={<LayoutDashboard size={22} />} label="হোম" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Waves size={22} />} label="পুকুর" active={activeTab === 'ponds'} onClick={() => setActiveTab('ponds')} />
          <NavItem icon={<TreeIcon size={22} />} label="বাগান" active={activeTab === 'trees'} onClick={() => setActiveTab('trees')} />
          <NavItem icon={<Beef size={22} />} label="গরু" active={activeTab === 'cattle'} onClick={() => setActiveTab('cattle')} />
          <NavItem icon={<Users size={22} />} label="শ্রমিক" active={activeTab === 'labor'} onClick={() => setActiveTab('labor')} />
          <NavItem icon={<Calculator size={22} />} label="হিসাব" active={activeTab === 'profit'} onClick={() => setActiveTab('profit')} />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 transition-all duration-300 relative",
        active ? "text-primary scale-110" : "text-zinc-400"
      )}
    >
      <div className={cn(
        "p-2 rounded-2xl transition-all duration-300",
        active ? "bg-primary/10 text-primary" : ""
      )}>
        {icon}
      </div>
      <span className={cn("text-[8px] font-bold uppercase tracking-widest", active ? "opacity-100 mt-0.5" : "opacity-0 h-0")}>{label}</span>
    </button>
  );
}

// --- Helper Functions for Stats ---
const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getDate() === now.getDate() && 
         d.getMonth() === now.getMonth() && 
         d.getFullYear() === now.getFullYear();
};

const isThisMonth = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && 
         d.getFullYear() === now.getFullYear();
};

function MiniStat({ label, value, type = 'neutral' }: { label: string, value: string, type?: 'positive' | 'negative' | 'neutral' }) {
  const colorClass = type === 'positive' ? 'text-green-600' : type === 'negative' ? 'text-red-500' : 'text-zinc-800';
  return (
    <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100/50">
      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={cn("text-xs font-black", colorClass)}>{value}</p>
    </div>
  );
}

// --- Views ---

function DashboardView({ data, setActiveTab, onExport, onImport }: { data: AppData, setActiveTab: (t: ActiveTab) => void, onExport: () => void, onImport: (file: File) => void }) {
  const currentMonthName = new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' });
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  
  const monthlyTransactions = data.transactions.filter((t: any) => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonthIdx;
  });

  const lifetimeIncome = data.transactions.filter((t: any) => t.type === 'আয়').reduce((sum: number, t: any) => sum + t.amount, 0);
  const lifetimeExpense = data.transactions.filter((t: any) => t.type === 'ব্যয়').reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalLaborCost = data.labor.reduce((sum: number, l: any) => sum + (l.attendance ? (Number(l.wage) || 0) : 0), 0);
  const totalPondExp = data.ponds.reduce((sum: number, p: any) => sum + (Number(p.feedExpense) || 0), 0);
  const totalPondSales = data.ponds.reduce((sum: number, p: any) => sum + (Number(p.sales) || 0), 0);
  const totalTreeInc = data.trees.reduce((sum: number, t: any) => sum + (Number(t.income) || 0), 0);
  const totalTreeExp = data.trees.reduce((sum: number, t: any) => sum + (Number(t.expense) || 0), 0);

  // Hybrid Calculation: Use record totals as the primary source for their categories
  // to ensure they are ALWAYS included, and transactions for everything else.
  // We filter out categorical transactions from the monthly sum to avoid double counting.
  const otherMonthlyInc = monthlyTransactions
    .filter((t: any) => t.type === 'আয়' && !['পুকুর', 'বাগান'].includes(t.category))
    .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

  const otherMonthlyExp = monthlyTransactions
    .filter((t: any) => t.type === 'ব্যয়' && !['পুকুর', 'বাগান', 'শ্রমিক'].includes(t.category))
    .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

  // Summary for the dashboard: Includes all record DATA plus other transactions.
  const monthIncome = totalPondSales + totalTreeInc + otherMonthlyInc;
  const monthExpense = totalPondExp + totalTreeExp + totalLaborCost + otherMonthlyExp;
  
  const monthDiff = monthIncome - monthExpense;

  return (
    <div className="space-y-6 pb-20">
      {/* Dynamic Summary Card */}
      <div className="bg-primary text-white p-7 rounded-[40px] shadow-2xl shadow-primary/30 space-y-6 relative overflow-hidden active:scale-[0.98] transition-transform">
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
              {monthDiff >= 0 ? "সর্বমোট লাভ" : "সর্বমোট ক্ষতি"} (খামার সারসংক্ষেপ)
            </p>
            <h2 className="text-4xl font-black tracking-tighter">৳{Math.abs(monthDiff).toLocaleString()}</h2>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-black/5 p-4 rounded-3xl border border-white/5">
            <p className="text-[9px] font-black text-white/50 uppercase mb-1">মোট আয়</p>
            <p className="text-xl font-bold">৳{monthIncome.toLocaleString()}</p>
          </div>
          <div className="bg-black/5 p-4 rounded-3xl border border-white/5">
            <p className="text-[9px] font-black text-white/50 uppercase mb-1">মোট ব্যয়</p>
            <p className="text-xl font-bold">৳{monthExpense.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl" />
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-4">
        <QuickMenu icon={<Waves />} label="পুকুর" sub="৪টি পরিচালনা" color="bg-blue-50 text-blue-600" onClick={() => setActiveTab('ponds')} />
        <QuickMenu icon={<TreeIcon />} label="বাগান" sub="ইনভেন্টরি" color="bg-green-50 text-green-600" onClick={() => setActiveTab('trees')} />
        <QuickMenu icon={<Beef />} label="গবাদি পশু" sub="দুধ ও স্বাস্থ্য" color="bg-orange-50 text-orange-600" onClick={() => setActiveTab('cattle')} />
        <QuickMenu icon={<Users />} label="শ্রমিক" sub="হাজিরা ও বেতন" color="bg-purple-50 text-purple-600" onClick={() => setActiveTab('labor')} />
      </div>

      {/* Recent Activity */}

      <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold opacity-60 flex items-center gap-2">
            <Calendar size={16} /> সাম্প্রতিক কার্যক্রম
          </h3>
        </div>
        <div className="space-y-3">
          {data.transactions.length === 0 ? (
            <p className="text-[10px] text-zinc-300 text-center py-4 italic">কোনো সাম্প্রতিক লেনদেন নেই</p>
          ) : (
            data.transactions.slice(0, 5).map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 border-b border-zinc-50 pb-2 last:border-0 last:pb-0">
                <div className={cn("w-2 h-2 rounded-full", t.type === 'আয়' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]")} />
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-zinc-700">{t.category} - {t.subCategory || 'অন্যান্য'}</p>
                  <p className="text-[8px] text-zinc-400">{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <p className={cn("text-xs font-black", t.type === 'আয়' ? "text-green-600" : "text-red-500")}>
                  {t.type === 'আয়' ? '+' : '-'} ৳{t.amount}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Backup & Restore Section */}
      <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-zinc-400 mb-2">
          <Settings size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider">ডেটা ব্যাকআপ ও রিস্টোর</h3>
        </div>
        
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          আপনার ফোনের মেমরিতে সব ডেটা সেভ করে রাখতে নিচের বাটনে ক্লিক করুন। ব্রাউজার ক্যাশ মুছে গেলেও আপনি যেকোনো সময় ঐ ফাইলটি এখানে আপলোড করে ডেটা ফিরে পাবেন।
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onExport}
            className="flex items-center justify-center gap-2 bg-secondary/10 text-secondary py-3 rounded-2xl text-xs font-bold hover:bg-secondary/20 transition-all active:scale-95"
          >
            <Download size={16} /> ব্যাকআপ রিসিভ
          </button>
          
          <label className="flex items-center justify-center gap-2 bg-primary/10 text-primary py-3 rounded-2xl text-xs font-bold hover:bg-primary/20 transition-all active:scale-95 cursor-pointer">
            <Upload size={16} /> রিস্টোর ফাইল
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  onImport(e.target.files[0]);
                }
              }} 
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function QuickMenu({ icon, label, sub, color, onClick }: { icon: React.ReactNode, label: string, sub: string, color: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-white p-4 rounded-3xl shadow-sm border border-zinc-100 text-left hover:shadow-md transition-all active:scale-95 flex flex-col gap-4 group">
      <div className={cn("p-3 rounded-2xl w-fit group-hover:scale-110 transition-transform", color)}>
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-zinc-800">{label}</h4>
        <p className="text-[10px] text-zinc-400 font-medium">{sub}</p>
      </div>
    </button>
  );
}

function PondView({ ponds, transactions, onUpdate, onAddTransaction }: { ponds: PondRecord[], transactions: Transaction[], onUpdate: (p: PondRecord[]) => void, onAddTransaction: (t: Omit<Transaction, 'id'>) => void }) {
  const [editingPond, setEditingPond] = useState<PondRecord | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newPond, setNewPond] = useState<Partial<PondRecord>>({ pondName: '', seedCount: 0, feedExpense: 0, sales: 0, growthNotes: '' });

  const pondTransactions = transactions.filter(t => t.category === 'পুকুর');
  const todayProfit = pondTransactions.filter(t => isToday(t.date)).reduce((s, t) => s + (t.type === 'আয়' ? t.amount : -t.amount), 0);
  const monthProfit = pondTransactions.filter(t => isThisMonth(t.date)).reduce((s, t) => s + (t.type === 'আয়' ? t.amount : -t.amount), 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPond) {
      const updated = ponds.map(p => p.id === editingPond.id ? { ...editingPond, lastUpdated: new Date().toISOString() } : p);
      onUpdate(updated);
      setEditingPond(null);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPond.pondName) {
      const record: PondRecord = {
        id: Date.now().toString(),
        pondName: newPond.pondName,
        seedCount: Number(newPond.seedCount) || 0,
        feedExpense: Number(newPond.feedExpense) || 0,
        sales: Number(newPond.sales) || 0,
        growthNotes: newPond.growthNotes || '',
        lastUpdated: new Date().toISOString()
      };
      onUpdate([...ponds, record]);
      setShowAdd(false);
      setNewPond({ pondName: '', seedCount: 0, feedExpense: 0, sales: 0, growthNotes: '' });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('আপনি কি এই পুকুরটি মুছে ফেলতে চান?')) {
      onUpdate(ponds.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Mini Dashboard */}
      <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm space-y-4 mb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Waves size={14} /> পুকুর সারসংক্ষেপ
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="আজকের লাভ/ক্ষতি" value={`৳${todayProfit}`} type={todayProfit >= 0 ? (todayProfit > 0 ? 'positive' : 'neutral') : 'negative'} />
          <MiniStat label="এই মাসের লাভ/ক্ষতি" value={`৳${monthProfit}`} type={monthProfit >= 0 ? 'positive' : 'negative'} />
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Waves /> পুকুর ব্যবস্থাপনা
        </h2>
        <button onClick={() => setShowAdd(true)} className="bg-primary text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform"><Plus size={20} /></button>
      </div>

      {ponds.map(pond => (
        <div key={pond.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-zinc-100 flex items-center gap-4 group relative overflow-hidden">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Waves size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-zinc-800">{pond.pondName}</h3>
            <div className="flex gap-2 text-[10px] text-zinc-400 font-medium">
              <span>পোনা: {pond.seedCount}</span>
              <span>•</span>
              <span>খরচ: ৳{pond.feedExpense}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setEditingPond(pond)}
              className="bg-zinc-50 p-3 rounded-2xl text-zinc-400 hover:text-primary transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <button 
              onClick={() => handleDelete(pond.id)}
              className="p-3 text-zinc-200 hover:text-red-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
          
          <div className="absolute top-0 right-10 p-3 text-[10px] font-bold text-primary bg-primary/5 rounded-bl-xl">
            আয়: ৳{pond.sales}
          </div>
        </div>
      ))}

      {/* Add Form Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.form 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleAdd}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-center">নতুন পুকুর যোগ করুন</h3>
              <div className="space-y-4">
                <InputField label="পুকুরের নাম" value={newPond.pondName} onChange={v => setNewPond({...newPond, pondName: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="পোনা গণনা" type="number" value={newPond.seedCount} onChange={v => setNewPond({...newPond, seedCount: Number(v)})} />
                  <InputField label="খাদ্য খরচ (৳)" type="number" value={newPond.feedExpense} onChange={v => setNewPond({...newPond, feedExpense: Number(v)})} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-zinc-100 py-4 rounded-2xl font-bold">বাতিল</button>
                <button type="submit" className="flex-[2] bg-primary text-white py-4 rounded-2xl font-bold">যোগ করুন</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Form Modal */}
      <AnimatePresence>
        {editingPond && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingPond(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleSave}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">পুকুর আপডেট করুন</h3>
                <button type="button" onClick={() => setEditingPond(null)} className="p-2 bg-zinc-50 rounded-full text-zinc-400"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <InputField label="পুকুরের নাম" value={editingPond.pondName} onChange={v => setEditingPond({...editingPond, pondName: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="পোনা গণনা" type="number" value={editingPond.seedCount} onChange={v => setEditingPond({...editingPond, seedCount: Number(v)})} />
                  <InputField label="মোট খাদ্য খরচ (৳)" type="number" value={editingPond.feedExpense} onChange={v => setEditingPond({...editingPond, feedExpense: Number(v)})} />
                </div>
                <InputField label="মোট বিক্রয় (৳)" type="number" value={editingPond.sales} onChange={v => setEditingPond({...editingPond, sales: Number(v)})} />
                <InputField label="বৃদ্ধির বিবরণ" value={editingPond.growthNotes} onChange={v => setEditingPond({...editingPond, growthNotes: v})} />
              </div>

              <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                <Save size={20} /> সেভ করুন
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text" }: { label: string, value: any, onChange: (v: string) => void, type?: string }) {
  // Use a display value that is empty string if it's a number and value is 0
  const displayValue = type === "number" && (value === 0 || value === "0") ? "" : value;

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">{label}</label>
      <input 
        type={type}
        value={displayValue}
        placeholder={type === "number" ? "0" : ""}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
      />
    </div>
  );
}

function TreeView({ trees, transactions, onUpdate }: { trees: TreeRecord[], transactions: Transaction[], onUpdate: (t: TreeRecord[]) => void }) {
  const [editingTree, setEditingTree] = useState<TreeRecord | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTree, setNewTree] = useState<Partial<TreeRecord>>({ type: '', count: 0, harvestCount: 0, income: 0, expense: 0, lastFertilized: '' });

  const treeTransactions = transactions.filter(t => t.category === 'বাগান');
  const todayProfit = treeTransactions.filter(t => isToday(t.date)).reduce((s, t) => s + (t.type === 'আয়' ? t.amount : -t.amount), 0);
  const monthProfit = treeTransactions.filter(t => isThisMonth(t.date)).reduce((s, t) => s + (t.type === 'আয়' ? t.amount : -t.amount), 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTree) {
      onUpdate(trees.map(t => t.id === editingTree.id ? editingTree : t));
      setEditingTree(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('আপনি কি এই গাছের রেকর্ডটি মুছে ফেলতে চান?')) {
      onUpdate(trees.filter(t => t.id !== id));
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTree.type) {
      const record: TreeRecord = {
        id: Date.now().toString(),
        type: newTree.type,
        count: Number(newTree.count) || 0,
        harvestCount: Number(newTree.harvestCount) || 0,
        income: Number(newTree.income) || 0,
        expense: Number(newTree.expense) || 0,
        lastFertilized: newTree.lastFertilized || ''
      };
      onUpdate([...trees, record]);
      setShowAdd(false);
      setNewTree({ type: '', count: 0, harvestCount: 0, income: 0, expense: 0, lastFertilized: '' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Mini Dashboard */}
      <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm space-y-4 mb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-green-700 uppercase tracking-widest flex items-center gap-2">
            <TreeIcon size={14} /> বাগান সারসংক্ষেপ
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="আজকের লেনদেন" value={`৳${Math.abs(todayProfit)}`} type={todayProfit >= 0 ? (todayProfit > 0 ? 'positive' : 'neutral') : 'negative'} />
          <MiniStat label="এই মাসের লাভ" value={`৳${monthProfit}`} type={monthProfit >= 0 ? 'positive' : 'negative'} />
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <TreeIcon /> বাগান ব্যবস্থাপনা
        </h2>
        <button onClick={() => setShowAdd(true)} className="bg-primary text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform"><Plus size={20} /></button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {trees.map(tree => (
          <div key={tree.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-zinc-100 flex flex-col items-center text-center relative pt-8 group">
            <button 
              onClick={() => handleDelete(tree.id)}
              className="absolute top-4 right-4 text-zinc-200 hover:text-red-500 transition-colors z-10"
            >
              <Trash2 size={16} />
            </button>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-sm">
              <TreeIcon size={24} />
            </div>
            <h3 className="font-bold text-zinc-800">{tree.type}</h3>
            
            <div className="grid grid-cols-2 gap-2 w-full my-4">
              <div className="bg-zinc-50 rounded-2xl p-2">
                <p className="text-[14px] font-black text-secondary">{tree.count}</p>
                <p className="text-[8px] text-zinc-400 font-bold uppercase">গাছ</p>
              </div>
              <div className="bg-zinc-50 rounded-2xl p-2">
                <p className="text-[14px] font-black text-primary">{tree.harvestCount}</p>
                <p className="text-[8px] text-zinc-400 font-bold uppercase">ফলন</p>
              </div>
            </div>
            
            <div className="w-full space-y-2 mb-4">
              <div className="flex justify-between text-[10px] px-1 font-bold">
                <span className="text-green-600">আয়: ৳{tree.income}</span>
                <span className="text-red-500">ব্যয়: ৳{tree.expense}</span>
              </div>
              <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (tree.income > 0 ? (tree.income / (tree.income + tree.expense || 1)) * 100 : 0))}%` }} />
              </div>
            </div>

            <button 
              onClick={() => setEditingTree(tree)}
              className="bg-primary/5 text-primary w-full py-2 rounded-xl text-xs font-bold hover:bg-primary/10 transition-colors"
            >
              আপডেট
            </button>
          </div>
        ))}
      </div>

      {/* Add Form Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.form 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleAdd}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-center">নতুন বাগান রেকর্ড</h3>
              <div className="space-y-4">
                <InputField label="গাছের ধরণ (যেমন: আম, লিচু)" value={newTree.type} onChange={v => setNewTree({...newTree, type: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="গাছের সংখ্যা" type="number" value={newTree.count} onChange={v => setNewTree({...newTree, count: Number(v)})} />
                  <InputField label="ফলন (টি)" type="number" value={newTree.harvestCount} onChange={v => setNewTree({...newTree, harvestCount: Number(v)})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="খরচ (৳)" type="number" value={newTree.expense} onChange={v => setNewTree({...newTree, expense: Number(v)})} />
                  <InputField label="বিক্রয় (৳)" type="number" value={newTree.income} onChange={v => setNewTree({...newTree, income: Number(v)})} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-zinc-100 py-4 rounded-2xl font-bold">বাতিল</button>
                <button type="submit" className="flex-[2] bg-primary text-white py-4 rounded-2xl font-bold">যোগ করুন</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingTree && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingTree(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleSave}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold">বাগান আপডেট করুন</h3>
                <button type="button" onClick={() => setEditingTree(null)} className="p-2 bg-zinc-50 rounded-full text-zinc-400"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="গাছের সংখ্যা" type="number" value={editingTree.count} onChange={v => setEditingTree({...editingTree, count: Number(v)})} />
                  <InputField label="ফলন (টি)" type="number" value={editingTree.harvestCount} onChange={v => setEditingTree({...editingTree, harvestCount: Number(v)})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="মোট খরচ (৳)" type="number" value={editingTree.expense} onChange={v => setEditingTree({...editingTree, expense: Number(v)})} />
                  <InputField label="মোট বিক্রয় (৳)" type="number" value={editingTree.income} onChange={v => setEditingTree({...editingTree, income: Number(v)})} />
                </div>
                <InputField label="শেষ সার প্রদানের তারিখ" type="date" value={editingTree.lastFertilized} onChange={v => setEditingTree({...editingTree, lastFertilized: v})} />
              </div>

              <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                <Save size={20} /> সেভ করুন
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CattleView({ cattle, transactions, onAdd, onDelete }: { cattle: CattleRecord[], transactions: Transaction[], onAdd: (c: CattleRecord) => void, onDelete: (id: string) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<CattleRecord>>({ tagId: '', milkProduction: 0, healthStatus: 'সুস্থ', expense: 0 });

  const cattleTransactions = transactions.filter(t => t.category === 'গরু');
  const todayExp = cattleTransactions.filter(t => isToday(t.date) && t.type === 'ব্যয়').reduce((s, t) => s + t.amount, 0);
  const monthExp = cattleTransactions.filter(t => isThisMonth(t.date) && t.type === 'ব্যয়').reduce((s, t) => s + t.amount, 0);
  const todayMilk = cattle.filter(c => isToday(c.date)).reduce((s, c) => s + (Number(c.milkProduction) || 0), 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecord.tagId && newRecord.milkProduction !== undefined) {
      onAdd({
        id: Date.now().toString(),
        tagId: newRecord.tagId,
        milkProduction: Number(newRecord.milkProduction),
        healthStatus: newRecord.healthStatus || 'সুস্থ',
        expense: Number(newRecord.expense) || 0,
        date: new Date().toLocaleDateString()
      } as CattleRecord);
      setShowAdd(false);
      setNewRecord({ tagId: '', milkProduction: 0, healthStatus: 'সুস্থ', expense: 0 });
    }
  };

  return (
    <div className="space-y-4">
      {/* Mini Dashboard */}
      <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm space-y-4 mb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
            <Beef size={14} /> গরুর সারসংক্ষেপ
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="আজকের দুধ (L)" value={`${todayMilk} L`} />
          <MiniStat label="এই মাসের খরচ" value={`৳${monthExp}`} type="negative" />
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Beef /> গবাদি পশু
        </h2>
        <button onClick={() => setShowAdd(true)} className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform">
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {cattle.length === 0 && (
          <div className="bg-white p-10 rounded-[32px] text-center border-2 border-dashed border-zinc-100 opacity-50">
            <Info className="mx-auto mb-2 text-zinc-300" size={32} />
            <p className="text-sm font-bold text-zinc-400">এখনো কোনো রেকর্ড নেই</p>
          </div>
        )}
        
        {cattle.map(record => (
          <div key={record.id} className="bg-white p-4 rounded-[24px] shadow-sm flex items-center gap-4 relative group">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
              <Milk size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="bg-orange-100 text-orange-700 text-[9px] px-2 py-0.5 rounded-md font-black">ট্যাগ: {record.tagId}</span>
                <span className="text-[10px] text-zinc-400 font-medium">{record.date}</span>
              </div>
              <p className="font-bold text-zinc-800 text-sm">{record.milkProduction} লিটার দুধ</p>
              <p className="text-[10px] text-zinc-400">স্বাস্থ্য: {record.healthStatus}</p>
            </div>
            <button 
              onClick={() => onDelete(record.id)}
              className="p-3 text-zinc-200 hover:text-red-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleAdd}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold mb-2 text-center">নতুন গরু রেকর্ড</h3>
              <div className="space-y-4">
                <InputField label="ট্যাগ আইডি" value={newRecord.tagId} onChange={v => setNewRecord({...newRecord, tagId: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="দুধের পরিমাণ" type="number" value={newRecord.milkProduction} onChange={v => setNewRecord({...newRecord, milkProduction: Number(v)})} />
                  <InputField label="খরচ (খাদ্য/ওষুধ)" type="number" value={newRecord.expense} onChange={v => setNewRecord({...newRecord, expense: Number(v)})} />
                </div>
                <InputField label="স্বাস্থ্যের অবস্থা" value={newRecord.healthStatus} onChange={v => setNewRecord({...newRecord, healthStatus: v})} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-zinc-100 py-4 rounded-2xl font-bold">বাতিল</button>
                <button type="submit" className="flex-[2] bg-primary text-white py-4 rounded-2xl font-bold">রিসোর্ড যোগ করুন</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LaborView({ labor, transactions, onAdd, onDelete }: { labor: LaborRecord[], transactions: Transaction[], onAdd: (l: LaborRecord) => void, onDelete: (id: string) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newLabor, setNewLabor] = useState<Partial<LaborRecord>>({ name: '', wage: 0, workDescription: 'ভরণপোষণ', laborType: 'দৈনিক' });

  const laborTransactions = transactions.filter(t => t.category === 'শ্রমিক');
  const todayCost = laborTransactions.filter(t => isToday(t.date)).reduce((s, t) => s + t.amount, 0);
  const monthCost = laborTransactions.filter(t => isThisMonth(t.date)).reduce((s, t) => s + t.amount, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLabor.name) {
      const record: LaborRecord = {
        id: Date.now().toString(),
        name: newLabor.name,
        wage: Number(newLabor.wage) || 0,
        workDescription: newLabor.workDescription || 'ভরণপোষণ',
        laborType: (newLabor.laborType as any) || 'দৈনিক',
        attendance: true,
        date: new Date().toISOString()
      };
      onAdd(record);
      setShowAdd(false);
      setNewLabor({ name: '', wage: 0, workDescription: 'ভরণপোষণ', laborType: 'দৈনিক' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Mini Dashboard */}
      <div className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm space-y-4 mb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-purple-700 uppercase tracking-widest flex items-center gap-2">
            <Users size={14} /> শ্রমিক সারসংক্ষেপ
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="আজকের মজুরি" value={`৳${todayCost}`} type="negative" />
          <MiniStat label="এই মাসের খরচ" value={`৳${monthCost}`} type="negative" />
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Users /> শ্রমিক হাজিরা
        </h2>
        <button onClick={() => setShowAdd(true)} className="bg-primary text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform"><Plus size={20} /></button>
      </div>

      <div className="space-y-3">
        {labor.length === 0 ? (
          <div className="bg-white p-10 rounded-[32px] text-center border border-dashed border-zinc-200">
            <Users className="mx-auto text-zinc-200 mb-2" size={40} />
            <p className="text-sm text-zinc-400 font-bold">কোনো শ্রমিকের তথ্য নেই। উপরের + বাটন চেপে যোগ করুন।</p>
          </div>
        ) : (
          [...labor].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(person => (
            <div key={person.id} className="bg-white p-4 rounded-[24px] shadow-sm flex items-center gap-4 border-l-4 border-primary">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-zinc-800">{person.name}</h4>
                  <span className={cn("text-[8px] px-2 py-0.5 rounded-full font-black uppercase", person.laborType === 'মাসিক' ? "bg-purple-100 text-purple-600" : "bg-zinc-100 text-zinc-500")}>
                    {person.laborType || 'দৈনিক'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium tracking-wide">
                  {person.date && person.date.includes('T') ? new Date(person.date).toLocaleDateString('bn-BD') : person.date} • {person.workDescription}
                </p>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="font-bold text-secondary text-sm">৳{person.wage}</p>
                  <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">বর্তমান</span>
                </div>
                <button 
                  onClick={() => onDelete(person.id)}
                  className="p-2 text-zinc-200 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onSubmit={handleAdd}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold mb-4">শ্রমিক তথ্য যোগ করুন</h3>
              
              <div className="flex bg-zinc-50 p-1 rounded-2xl">
                <button type="button" onClick={() => setNewLabor({...newLabor, laborType: 'দৈনিক'})} className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all", newLabor.laborType === 'দৈনিক' ? "bg-white text-primary shadow-sm" : "text-zinc-400")}>দৈনিক</button>
                <button type="button" onClick={() => setNewLabor({...newLabor, laborType: 'মাসিক'})} className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all", newLabor.laborType === 'মাসিক' ? "bg-white text-primary shadow-sm" : "text-zinc-400")}>মাসিক</button>
              </div>

              <div className="space-y-4">
                <InputField label="শ্রমিকের নাম" value={newLabor.name} onChange={v => setNewLabor({...newLabor, name: v})} />
                <InputField label="মজুরি (৳)" type="number" value={newLabor.wage} onChange={v => setNewLabor({...newLabor, wage: Number(v)})} />
                <InputField label="কাজের বিবরণ" value={newLabor.workDescription} onChange={v => setNewLabor({...newLabor, workDescription: v})} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-zinc-100 py-4 rounded-2xl font-bold">বাতিল</button>
                <button type="submit" className="flex-[2] bg-primary text-white py-4 rounded-2xl font-bold">সেভ</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NewTransactionForm({ onAdd, onClose }: { onAdd: (t: Omit<Transaction, 'id'>) => void, onClose: () => void }) {
  const [t, setT] = useState<Partial<Transaction>>({ type: 'ব্যয়', category: 'অন্যান্য', amount: 0, subCategory: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (t.amount && t.amount > 0) {
      onAdd({
        type: t.type as any,
        category: t.category as any,
        amount: t.amount,
        subCategory: t.subCategory || 'বিবিধ',
        date: new Date().toISOString()
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.form 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl space-y-4"
      >
        <h3 className="text-lg font-bold text-center">নতুন লেনদেন যোগ করুন</h3>
        <div className="flex bg-zinc-50 p-1 rounded-2xl">
          <button type="button" onClick={() => setT({...t, type: 'ব্যয়'})} className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all", t.type === 'ব্যয়' ? "bg-white text-red-500 shadow-sm" : "text-zinc-400")}>ব্যয়</button>
          <button type="button" onClick={() => setT({...t, type: 'আয়'})} className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all", t.type === 'আয়' ? "bg-white text-green-600 shadow-sm" : "text-zinc-400")}>আয়</button>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">বিভাগ</label>
            <select 
              value={t.category} 
              onChange={e => setT({...t, category: e.target.value as any})}
              className="w-full bg-zinc-50 border-none rounded-2xl p-4 text-sm font-medium outline-none appearance-none"
            >
              <option value="পুকুর">পুকুর</option>
              <option value="গরু">গরু</option>
              <option value="শ্রমিক">শ্রমিক</option>
              <option value="বাগান">বাগান</option>
              <option value="অন্যান্য">অন্যান্য</option>
            </select>
          </div>
          <InputField label="বিবরণ" value={t.subCategory} onChange={v => setT({...t, subCategory: v})} />
          <InputField label="পরিমাণ (৳)" type="number" value={t.amount} onChange={v => setT({...t, amount: Number(v)})} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 bg-zinc-100 py-4 rounded-2xl font-bold">বাতিল</button>
          <button type="submit" className="flex-[2] bg-primary text-white py-4 rounded-2xl font-bold">সেভ লেনদেন</button>
        </div>
      </motion.form>
    </div>
  );
}

function ProfitLossView({ data, onExportCSV, onAddTransaction }: { data: AppData, onExportCSV: (ts: Transaction[], name: string) => void, onAddTransaction: (t: Omit<Transaction, 'id'>) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'সব' | 'আয়' | 'ব্যয়'>('সব');
  
  const transactions = data.transactions;

  // Group transactions by Month
  const groupTransactionsByMonth = () => {
    const months: Record<string, { income: number, expense: number, transactions: Transaction[] }> = {};
    
    // 1. Initialise with dedicated categories from objects to ensure they are represented in the totals
    // (This helps show garden/pond totals in the monthly view header even if individual transactions aren't logged)
    // Note: Usually we'd want historical snapshots, but here we'll use current totals for the current month summary.
    const currentMonthBN = new Date().toLocaleString('bn-BD', { month: 'long', year: 'numeric' });
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthYear = date.toLocaleString('bn-BD', { month: 'long', year: 'numeric' });
      
      if (!months[monthYear]) {
        months[monthYear] = { income: 0, expense: 0, transactions: [] };
      }
      
      if (t.type === 'আয়') months[monthYear].income += t.amount;
      else months[monthYear].expense += t.amount;
      
      months[monthYear].transactions.push(t);
    });

    // 2. Ensure current monthly sums include Ponds/Trees/Labor if not already captured
    if (!months[currentMonthBN]) {
        months[currentMonthBN] = { income: 0, expense: 0, transactions: [] };
    }

    const pondSales = data.ponds.reduce((sum, p) => sum + (Number(p.sales) || 0), 0);
    const treeInc = data.trees.reduce((sum, t) => sum + (Number(t.income) || 0), 0);
    const pondExp = data.ponds.reduce((sum, p) => sum + (Number(p.feedExpense) || 0), 0);
    const treeExp = data.trees.reduce((sum, t) => sum + (Number(t.expense) || 0), 0);
    const laborCost = data.labor.reduce((sum, l) => sum + (l.attendance ? (Number(l.wage) || 0) : 0), 0);

    // Categories already in transactions for current month
    const transPondInc = months[currentMonthBN].transactions.filter(t => t.category === 'পুকুর' && t.type === 'আয়').reduce((s, t) => s + t.amount, 0);
    const transTreeInc = months[currentMonthBN].transactions.filter(t => t.category === 'বাগান' && t.type === 'আয়').reduce((s, t) => s + t.amount, 0);
    const transPondExp = months[currentMonthBN].transactions.filter(t => t.category === 'পুকুর' && t.type === 'ব্যয়').reduce((s, t) => s + t.amount, 0);
    const transTreeExp = months[currentMonthBN].transactions.filter(t => t.category === 'বাগান' && t.type === 'ব্যয়').reduce((s, t) => s + t.amount, 0);
    const transLabor = months[currentMonthBN].transactions.filter(t => t.category === 'শ্রমিক' && t.type === 'ব্যয়').reduce((s, t) => s + t.amount, 0);

    // Merge record totals if they aren't fully reflected in transactions yet
    months[currentMonthBN].income += Math.max(0, pondSales + treeInc - transPondInc - transTreeInc);
    months[currentMonthBN].expense += Math.max(0, pondExp + treeExp + laborCost - transPondExp - transTreeExp - transLabor);

    return Object.entries(months).sort((a, b) => {
      const dateA = a[1].transactions.length > 0 ? new Date(a[1].transactions[0].date).getTime() : Date.now();
      const dateB = b[1].transactions.length > 0 ? new Date(b[1].transactions[0].date).getTime() : Date.now();
      return dateB - dateA;
    });
  };

  const monthlyData = groupTransactionsByMonth();

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (t.subCategory?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'সব' ? true : t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalPondSales = data.ponds.reduce((sum: number, p: any) => sum + (Number(p.sales) || 0), 0);
  const treeInc = data.trees.reduce((sum: number, t: any) => sum + (Number(t.income) || 0), 0);
  const pondExp = data.ponds.reduce((sum: number, p: any) => sum + (Number(p.feedExpense) || 0), 0);
  const treeExp = data.trees.reduce((sum: number, t: any) => sum + (Number(t.expense) || 0), 0);
  const laborCost = data.labor.reduce((sum, l) => sum + (l.attendance ? (Number(l.wage) || 0) : 0), 0);
  
  // Total balance including all sources but adjusting for duplicates in categorized transactions
  const totalBalance = (totalPondSales + treeInc - pondExp - treeExp - laborCost) +
    transactions.filter(t => !['পুকুর', 'বাগান', 'শ্রমিক'].includes(t.category)).reduce((sum, t) => sum + (t.type === 'আয়' ? t.amount : -t.amount), 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-4 rounded-[24px] shadow-sm">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Calculator /> অর্থ ও লাভ-ক্ষতি
        </h2>
        <button onClick={() => setShowAdd(true)} className="bg-primary text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform">
          <Plus size={20} />
        </button>
      </div>

      <AnimatePresence>
        {showAdd && <NewTransactionForm onAdd={onAddTransaction} onClose={() => setShowAdd(false)} />}
      </AnimatePresence>

      {/* Aggregate Balance Card */}
      <div className="bg-secondary text-white p-7 rounded-[40px] shadow-2xl shadow-secondary/30 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
        <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] relative z-10">সর্বমোট ব্যালেন্স</p>
        <div className="flex justify-between items-end relative z-10">
          <h2 className="text-4xl font-black tracking-tighter">
            ৳{totalBalance.toLocaleString()}
          </h2>
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <Coins size={24} />
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="খুঁজুন..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-zinc-100 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex bg-white p-1 rounded-2xl border border-zinc-100">
            {(['সব', 'আয়', 'ব্যয়'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black transition-all", filterType === type ? "bg-primary text-white shadow-sm" : "text-zinc-400")}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Summary Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1 flex justify-between items-center">
          <span>মাসিক খতিয়ান</span>
          <BookOpen size={14} />
        </h3>
        
        {monthlyData.length === 0 && (
          <div className="bg-white p-8 rounded-[32px] text-center border border-dashed border-zinc-200">
            <p className="text-xs font-bold text-zinc-300">কোনো রেকর্ড নেই</p>
          </div>
        )}

        <div className="space-y-4">
          {monthlyData.map(([month, data]) => (
            <div key={month} className="bg-white rounded-[32px] border border-zinc-100 overflow-hidden shadow-sm">
              <div className="bg-zinc-50/50 p-4 border-b border-zinc-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-zinc-700 text-sm">{month}</h4>
                  <button 
                    onClick={() => onExportCSV(data.transactions, month)}
                    className="p-1.5 text-zinc-400 hover:text-primary bg-white rounded-xl shadow-sm transition-colors border border-zinc-100"
                  >
                    <Download size={14} />
                  </button>
                </div>
                <div className={cn("text-[10px] font-black px-2 py-1 rounded-lg uppercase", (data.income - data.expense) >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                  { (data.income - data.expense) >= 0 ? 'লাভ' : 'ক্ষতি' }: ৳{Math.abs(data.income - data.expense).toLocaleString()}
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 p-3 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase mb-1">আয়</p>
                  <p className="font-bold text-green-600 text-sm">৳{data.income.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-50 p-3 rounded-2xl">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase mb-1">ব্যয়</p>
                  <p className="font-bold text-red-500 text-sm">৳{data.expense.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT TRANSACTIONS LEDGER */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-1">লেনদেনের বিস্তারিত</h3>
        <div className="bg-white rounded-[32px] border border-zinc-100 overflow-hidden shadow-sm">
          {filteredTransactions.slice(0, 15).map((t, idx) => (
            <div key={t.id} className={cn("p-4 flex items-center justify-between transition-colors", idx !== 0 && "border-t border-zinc-50")}>
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", t.type === 'আয়' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500")}>
                  {t.type === 'আয়' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                </div>
                <div>
                  <h4 className="font-bold text-zinc-800 text-xs">{t.category}</h4>
                  <p className="text-[9px] text-zinc-400 font-medium">{t.subCategory} • {new Date(t.date).toLocaleDateString('bn-BD')}</p>
                </div>
              </div>
              <p className={cn("font-black text-sm", t.type === 'আয়' ? "text-green-600" : "text-red-500")}>
                {t.type === 'আয়' ? '+' : '-'}৳{t.amount.toLocaleString()}
              </p>
            </div>
          ))}
          {filteredTransactions.length > 15 && (
            <div className="p-4 text-center text-zinc-400 text-[10px] font-bold bg-zinc-50/50">
              আরও অনেক লেনদেন রয়েছে...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- End of Views ---


