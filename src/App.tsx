import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, 
  Trophy, 
  LayoutGrid, 
  Upload, 
  ClipboardList, 
  Trash2, 
  Download, 
  RefreshCw, 
  UserPlus,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Tab = 'list' | 'draw' | 'group';

interface Group {
  id: number;
  members: string[];
}

// --- Mock Data ---
const MOCK_NAMES = [
  "陳小明", "林美玲", "張大華", "李秀英", "王志強", 
  "黃雅婷", "郭建宏", "徐淑芬", "周俊傑", "吳佩珊",
  "蔡明憲", "許嘉文", "鄭雅文", "謝宗翰", "洪詩涵",
  "蘇郁婷", "曾冠宇", "劉家豪", "葉子瑄", "潘奕辰"
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [names, setNames] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  
  // --- List Management Logic ---
  const duplicates = useMemo(() => {
    const counts: Record<string, number> = {};
    names.forEach(name => {
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.keys(counts).filter(name => counts[name] > 1);
  }, [names]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const parsedNames = results.data
          .flat()
          .map(n => String(n).trim())
          .filter(n => n && n !== '姓名' && n !== 'Name');
        setNames(prev => [...new Set([...prev, ...parsedNames])]);
      },
      header: false
    });
  };

  const handlePaste = () => {
    const newNames = inputText
      .split(/[\n,，]/)
      .map(n => n.trim())
      .filter(n => n);
    setNames(prev => [...prev, ...newNames]);
    setInputText('');
  };

  const removeDuplicates = () => {
    setNames(prev => Array.from(new Set(prev)));
  };

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);

  const clearList = () => {
    setNames([]);
    setShowClearConfirm(false);
  };

  const loadMockData = () => {
    setNames(MOCK_NAMES);
  };

  // --- Lucky Draw Logic ---
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [drawHistory, setDrawHistory] = useState<string[]>([]);
  const [currentDisplay, setCurrentDisplay] = useState('?');

  const startDraw = () => {
    if (names.length === 0) return;
    setDrawError(null);
    
    const availableNames = allowRepeat 
      ? names 
      : names.filter(n => !drawHistory.includes(n));

    if (availableNames.length === 0) {
      setDrawError('所有人都已經抽過了！');
      return;
    }

    setIsDrawing(true);
    setWinner(null);

    let count = 0;
    const duration = 3000;
    const interval = 80;
    const totalSteps = duration / interval;

    const timer = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * availableNames.length);
      setCurrentDisplay(availableNames[randomIndex]);
      count++;

      if (count >= totalSteps) {
        clearInterval(timer);
        const finalWinner = availableNames[Math.floor(Math.random() * availableNames.length)];
        setWinner(finalWinner);
        setCurrentDisplay(finalWinner);
        setIsDrawing(false);
        setDrawHistory(prev => [finalWinner, ...prev]);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, interval);
  };

  // --- Grouping Logic ---
  const [groupSize, setGroupSize] = useState(4);
  const [groups, setGroups] = useState<Group[]>([]);

  const generateGroups = () => {
    if (names.length === 0) return;
    
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const newGroups: Group[] = [];
    
    for (let i = 0; i < shuffled.length; i += groupSize) {
      newGroups.push({
        id: Math.floor(i / groupSize) + 1,
        members: shuffled.slice(i, i + groupSize)
      });
    }
    setGroups(newGroups);
  };

  const downloadGroupsCSV = () => {
    if (groups.length === 0) return;
    
    const csvData = groups.flatMap(g => 
      g.members.map(m => ({ '組別': `第 ${g.id} 組`, '姓名': m }))
    );
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `分組結果_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Users className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">HR Smart Tools</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Lucky Draw & Grouping</p>
            </div>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('list')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'list' ? "bg-white shadow-sm text-indigo-600" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <ClipboardList className="w-4 h-4" />
              名單管理
            </button>
            <button 
              onClick={() => setActiveTab('draw')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'draw' ? "bg-white shadow-sm text-indigo-600" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Trophy className="w-4 h-4" />
              獎品抽籤
            </button>
            <button 
              onClick={() => setActiveTab('group')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'group' ? "bg-white shadow-sm text-indigo-600" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              自動分組
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* List Management Tab */}
          {activeTab === 'list' && (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                    新增名單
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">上傳 CSV 檔案</label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500">點擊或拖拽上傳</span>
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-slate-500">或</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">貼上姓名 (以換行或逗號分隔)</label>
                      <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="例如：陳小明, 林美玲..."
                        className="w-full h-32 p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                      />
                      <button 
                        onClick={handlePaste}
                        className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        新增至名單
                      </button>
                    </div>

                    <button 
                      onClick={loadMockData}
                      className="w-full py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      載入模擬名單
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">名單預覽</h2>
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        {names.length} 人
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {duplicates.length > 0 && (
                        <button 
                          onClick={removeDuplicates}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          移除重複 ({duplicates.length})
                        </button>
                      )}
                      {showClearConfirm ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-red-500">確定？</span>
                          <button onClick={clearList} className="text-xs font-bold text-red-600 hover:underline">是</button>
                          <button onClick={() => setShowClearConfirm(false)} className="text-xs font-bold text-slate-400 hover:underline">否</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowClearConfirm(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-red-600 transition-colors text-xs font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          清空
                        </button>
                      )}
                    </div>
                  </div>

                  {names.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                      <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
                      <p>目前尚無名單，請從左側新增</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto max-h-[600px] pr-2">
                      {names.map((name, idx) => (
                        <div 
                          key={`${name}-${idx}`}
                          className={cn(
                            "p-3 rounded-xl border text-sm flex items-center justify-between group transition-all",
                            duplicates.includes(name) 
                              ? "bg-amber-50 border-amber-200 text-amber-900" 
                              : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm"
                          )}
                        >
                          <span className="truncate flex items-center gap-2">
                            {duplicates.includes(name) && <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                            {name}
                          </span>
                          <button 
                            onClick={() => setNames(prev => prev.filter((_, i) => i !== idx))}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Lucky Draw Tab */}
          {activeTab === 'draw' && (
            <motion.div 
              key="draw"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-slate-900 mb-2">幸運大抽籤</h2>
                  <p className="text-slate-500">點擊下方按鈕開始隨機抽取獎品得主</p>
                </div>

                <div className="flex justify-center mb-10">
                  <div className="relative">
                    <div className="w-64 h-64 rounded-full bg-slate-50 border-8 border-slate-100 flex items-center justify-center shadow-inner">
                      <motion.div 
                        key={currentDisplay}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={cn(
                          "text-4xl font-black tracking-wider",
                          isDrawing ? "text-indigo-600" : winner ? "text-emerald-600" : "text-slate-300"
                        )}
                      >
                        {currentDisplay}
                      </motion.div>
                    </div>
                    {winner && (
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        恭喜中獎！
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                  {drawError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {drawError}
                    </motion.div>
                  )}
                  <div className="flex items-center gap-6 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={allowRepeat} 
                          onChange={(e) => setAllowRepeat(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:bg-indigo-600 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                      </div>
                      <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">允許重複中獎</span>
                    </label>
                    <div className="w-px h-4 bg-slate-300"></div>
                    <div className="text-sm font-bold text-slate-500">
                      剩餘名額: <span className="text-slate-900">{allowRepeat ? '∞' : names.length - drawHistory.length}</span>
                    </div>
                  </div>

                  <button 
                    disabled={isDrawing || names.length === 0}
                    onClick={startDraw}
                    className={cn(
                      "group relative px-12 py-4 rounded-2xl font-black text-xl transition-all shadow-lg active:scale-95",
                      isDrawing || names.length === 0
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200"
                    )}
                  >
                    {isDrawing ? "正在抽取..." : "立即抽籤"}
                  </button>
                </div>
              </div>

              {drawHistory.length > 0 && (
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-indigo-500" />
                      中獎紀錄
                    </h3>
                    <button 
                      onClick={() => setDrawHistory([])}
                      className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                    >
                      清除紀錄
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {drawHistory.map((name, idx) => (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={`${name}-${idx}`}
                        className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 flex items-center gap-2"
                      >
                        <span className="text-indigo-400 text-xs">#{drawHistory.length - idx}</span>
                        {name}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Grouping Tab */}
          {activeTab === 'group' && (
            <motion.div 
              key="group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold">自動分組工具</h2>
                    <p className="text-sm text-slate-500">設定每組人數，系統將隨機分配名單</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <span className="text-sm font-bold text-slate-600 ml-2">每組人數</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setGroupSize(Math.max(2, groupSize - 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600"
                        >-</button>
                        <span className="w-8 text-center font-black text-indigo-600">{groupSize}</span>
                        <button 
                          onClick={() => setGroupSize(groupSize + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600"
                        >+</button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={generateGroups}
                      disabled={names.length === 0}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      開始分組
                    </button>

                    {groups.length > 0 && (
                      <button 
                        onClick={downloadGroupsCSV}
                        className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        下載 CSV
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={group.id}
                      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-indigo-600">第 {group.id} 組</h3>
                        <span className="text-xs font-bold text-slate-400">{group.members.length} 人</span>
                      </div>
                      <div className="space-y-2">
                        {group.members.map((member, mIdx) => (
                          <div key={mIdx} className="bg-slate-50 p-3 rounded-xl text-sm font-medium text-slate-700 flex items-center gap-3">
                            <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                              {mIdx + 1}
                            </div>
                            {member}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white h-64 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <LayoutGrid className="w-12 h-12 mb-3 opacity-20" />
                  <p>設定人數並點擊「開始分組」以查看結果</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-12 text-center text-slate-400 text-sm">
        <p>© 2026 HR Smart Tools. Crafted for professional HR management.</p>
      </footer>
    </div>
  );
}
