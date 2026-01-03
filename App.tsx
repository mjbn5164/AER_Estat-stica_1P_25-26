
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, LabelList, PieChart, Pie, Cell as PieCell
} from 'recharts';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Loader2,
  Table as TableIcon,
  Zap, 
  Trophy,
  X,
  Home,
  Layers,
  LogOut,
  Star,
  Orbit,
  Maximize
} from 'lucide-react';
import { StudentData, SubjectKey, SUBJECT_LABELS, SubjectStats, GradeDistribution, SheetInfo } from './types';

// PASSO 1: DEFINIR A CHAVE MESTRA FIXA
const MASTER_API_KEY = import.meta.env.VITE_API_KEY || "";

/**
 * Utilitário de conversão numérica para garantir integridade.
 */
const safeParseNumber = (val: any, fieldName: string): number => {
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return 0;
  const sanitized = val.trim().replace(',', '.');
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? 0 : parsed;
};

const formatDecimal = (val: number | string): string => {
  const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  if (isNaN(num)) return String(val);
  return num.toLocaleString('pt-PT', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 1 
  });
};

/**
 * CustomTooltip atualizado para garantir valores corretos e 30% mais área.
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Usamos diretamente o value do payload para precisão total no que está a ser visualizado
    const value = payload[0].value; 
    const dataKey = payload[0].dataKey;
    
    // Título ou nome da categoria
    const name = data.subject || data.range || data.name || data.subjectName;
    
    // Determinação da unidade (% para negativas, nada para contagens absolutas)
    const unit = dataKey === 'percentageBelowTen' ? '%' : '';
    
    // Cor vinda do payload ou do objeto de dados
    const color = payload[0].color || data.color || '#f43f5e';
    
    return (
      <div className="glass-panel p-4 border-2 border-white/20 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] min-w-[140px]">
        <p className="text-[12px] font-black uppercase tracking-widest mb-1" style={{ color }}>{name}</p>
        <p className="text-white text-lg font-mono font-bold">
          {formatDecimal(Math.abs(value))}{unit}
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Rótulo branco no topo das barras (#FFFFFF)
 */
const CustomBarLabel = (props: any) => {
  const { x, y, width, height, payload, fontSize, valueKey } = props;
  const value = payload?.[valueKey || 'count'];
  if (value === undefined || value === 0) return null;
  
  const isNegative = payload.chartValue < 0;
  const labelY = isNegative ? y + height + 20 : y - 12;
  const displayValue = Math.abs(value);
  const suffix = valueKey === 'percentageBelowTen' ? '%' : '';
  
  return (
    <text 
      x={x + width / 2} 
      y={labelY} 
      fill="#FFFFFF" 
      textAnchor="middle" 
      fontSize={fontSize || 12} 
      fontWeight="900"
      className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
    >
      {formatDecimal(displayValue)}{suffix}
    </text>
  );
};

const SubjectCardContent: React.FC<{ s: SubjectStats, isFocused?: boolean, onExpand?: () => void }> = ({ s, isFocused, onExpand }) => (
  <div className={`flex flex-col h-full transition-all duration-500 relative`}>
    {!isFocused && (
      <button 
        onClick={(e) => { e.stopPropagation(); onExpand?.(); }}
        className="absolute top-1 right-1 p-2 bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-all z-10"
      >
        <Maximize size={16} />
      </button>
    )}
    
    <div className="flex justify-between items-start mb-6">
      <h4 className={`font-bold font-orbitron text-white uppercase tracking-tight transition-all duration-500 ${isFocused ? 'neon-text-cyan text-5xl' : 'text-xl'}`}>{s.subject}</h4>
    </div>
    <div className={`grid ${isFocused ? 'grid-cols-3 gap-12' : 'grid-cols-1 gap-3'} mb-8 transition-all duration-500`}>
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <span className={`text-slate-500 uppercase font-bold tracking-widest ${isFocused ? 'text-[20px] text-slate-300' : 'text-[10px]'}`}>Média</span>
        <span className={`text-cyan-400 font-mono font-bold ${isFocused ? 'text-[40px]' : ''}`}>{formatDecimal(s.avg)}</span>
      </div>
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <span className={`text-slate-500 uppercase font-bold tracking-widest ${isFocused ? 'text-[20px] text-slate-300' : 'text-[10px]'}`}>Desvio Padrão</span>
        <span className={`text-purple-400 font-mono font-bold ${isFocused ? 'text-[40px]' : ''}`}>{formatDecimal(s.stdDev)}</span>
      </div>
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <span className={`text-slate-500 uppercase font-bold tracking-widest ${isFocused ? 'text-[20px] text-slate-300' : 'text-[10px]'}`}>% &lt; 10</span>
        <span className={`text-red-400 font-mono font-bold ${isFocused ? 'text-[40px]' : ''}`}>{formatDecimal(s.percentageBelowTen)}%</span>
      </div>
    </div>
    <div className={`${isFocused ? 'h-[400px]' : 'h-40'} w-full mt-auto relative`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={s.distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: isFocused ? 20 : 10 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          {/* barSize={40} faz o efeito 'bloco' que queres. radius={[8,8,0,0]} arredonda só o topo */}
          {/* Se estiver expandido (isFocused), usa 80px. Se não, usa 45px. Mantém o topo arredondado. */}  
       <Bar dataKey="chartValue" radius={[8, 8, 0, 0]} barSize={isFocused ? 100 : 45}>
            <LabelList content={<CustomBarLabel fontSize={isFocused ? 20 : 12} valueKey="count" />} />
            {s.distribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const App: React.FC = () => {
  const [sheetId, setSheetId] = useState<string>(localStorage.getItem('google_sheet_id') || '');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [availableSheets, setAvailableSheets] = useState<SheetInfo[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [data, setData] = useState<StudentData[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'overview' | 'subjects' | 'table'>('home');
  const [hoveredSubject, setHoveredSubject] = useState<number | null>(null);
  const [maximizedDashboardChart, setMaximizedDashboardChart] = useState<'success-failure' | 'top-negative' | 'lowest-avg-gauge' | 'highest-stddev-gauge' | null>(null);

  useEffect(() => {
    if (sheetId && sheetId.trim() !== "") {
      handleConnect();
    }
  }, []);

  const handleConnect = async () => {
    if (!sheetId || sheetId.trim() === "") return;
    setLoading(true);
    try {
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${MASTER_API_KEY}`);
      if (!response.ok) throw new Error("Não foi possível aceder à folha.");
      const metadata = await response.json();
      const sheets = metadata.sheets.map((s: any) => ({ name: s.properties.title, id: s.properties.sheetId }));
      setAvailableSheets(sheets);
      localStorage.setItem('google_sheet_id', sheetId);
      setIsConnected(true);
      if (sheets.length > 0) handleLoadSheet(sheets[0].name);
    } catch (err) {
      alert("ERRO: Verifique o ID da Folha de Cálculo.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSheet = async (sheetName: string) => {
    setLoading(true);
    setSelectedSheet(sheetName);
    try {
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'${sheetName}'?key=${MASTER_API_KEY}`);
      const result = await response.json();
      const rows = result.values;
      if (rows && rows.length > 0) {
        const textData = rows.map((r: any) => r.join(', ')).join('\n');
        const rawExtracted = await extractDataFromSheetsText(textData, MASTER_API_KEY);
        const validatedData: StudentData[] = rawExtracted.map((student, index) => ({
          numero: safeParseNumber(student.numero, `Nº`),
          aluno: String(student.aluno || `Aluno ${index + 1}`),
          portugues: safeParseNumber(student.portugues, `Port`),
          ingles: safeParseNumber(student.ingles, `Ing`),
          matematica: safeParseNumber(student.matematica, `Mat`),
          psicologia: safeParseNumber(student.psicologia, `Psi`),
          quimica: safeParseNumber(student.quimica, `Qui`),
          educacaoFisica: safeParseNumber(student.educacaoFisica, `EF`),
          emrc: safeParseNumber(student.emrc, `EMRC`),
        }));
        setData(validatedData);
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro ao ler dados da aba.");
    } finally {
      setLoading(false);
      setActiveTab('table'); 
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('google_sheet_id');
    setSheetId('');
    setIsConnected(false);
    setData([]);
    setActiveTab('home');
  };

  const stats = useMemo(() => {
    const keys: SubjectKey[] = ['portugues', 'ingles', 'matematica', 'psicologia', 'quimica', 'educacaoFisica', 'emrc'];
    return keys.map(key => {
      const grades = data.map(s => s[key]).filter(v => v !== undefined);
      const count = grades.length;
      const avg = count > 0 ? grades.reduce((a, b) => a + b, 0) / count : 0;
      const variance = count > 0 ? grades.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / count : 0;
      const countBelowTen = grades.filter(g => g < 10).length;
      const max = count > 0 ? Math.max(...grades) : 0;
      const min = count > 0 ? Math.min(...grades) : 0;
      const distribution: GradeDistribution[] = [
        { range: '< 10', count: countBelowTen, chartValue: -countBelowTen, color: '#f43f5e' },
        { range: '10-13', count: grades.filter(g => g >= 10 && g <= 13).length, chartValue: grades.filter(g => g >= 10 && g <= 13).length, color: '#f59e0b' },
        { range: '14-17', count: grades.filter(g => g >= 14 && g <= 17).length, chartValue: grades.filter(g => g >= 14 && g <= 17).length, color: '#22d3ee' },
        { range: '18-20', count: grades.filter(g => g >= 18).length, chartValue: grades.filter(g => g >= 18).length, color: '#d946ef' },
      ];
      return { 
        subject: SUBJECT_LABELS[key], 
        key, avg: Number(avg.toFixed(1)), stdDev: Number(Math.sqrt(variance).toFixed(1)), 
        max, min, count, countBelowTen, 
        percentageBelowTen: count > 0 ? Number(((countBelowTen / count) * 100).toFixed(1)) : 0, 
        distribution, allGrades: grades 
      };
    }) as SubjectStats[];
  }, [data]);

  const bestSubject = useMemo(() => stats.length ? [...stats].sort((a, b) => b.avg - a.avg)[0] : null, [stats]);
  const lowestAvgSubject = useMemo(() => stats.length ? [...stats].sort((a, b) => a.avg - b.avg)[0] : null, [stats]);
  const highestStdDevSubject = useMemo(() => stats.length ? [...stats].sort((a, b) => b.stdDev - a.stdDev)[0] : null, [stats]);
  
  const bestStudent = useMemo(() => {
    if (!data.length) return null;
    const studentAvgs = data.map(s => {
      const grades = [s.portugues, s.ingles, s.matematica, s.psicologia, s.quimica, s.educacaoFisica, s.emrc];
      return { name: s.aluno, avg: grades.reduce((a, b) => a + b, 0) / grades.length };
    });
    return studentAvgs.sort((a, b) => b.avg - a.avg)[0];
  }, [data]);

  const balanceData = useMemo(() => stats.map(s => ({ subject: s.subject, positives: s.count - s.countBelowTen, negatives: s.countBelowTen })), [stats]);

  const topNegativeSubjects = useMemo(() => {
    return [...stats]
      .sort((a, b) => b.percentageBelowTen - a.percentageBelowTen)
      .slice(0, 3)
      .map((s, idx) => {
        const specificColors = ['#D32F2F', '#EC407A', '#F48FB1'];
        return {
          ...s,
          color: specificColors[idx]
        };
      });
  }, [stats]);

  const renderSuccessFailureChart = (isMaximized = false) => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart layout="vertical" data={balanceData} margin={{ left: isMaximized ? 80 : 50, right: 30, top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.03)" />
        <XAxis type="number" hide />
        <YAxis 
          dataKey="subject" 
          type="category" 
          tick={{ fill: '#ffffff', fontSize: isMaximized ? 14 : 10, fontWeight: 'bold' }} 
          width={isMaximized ? 120 : 50} 
          axisLine={false} 
          tickLine={false} 
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
        <Bar dataKey="positives" stackId="a" fill="#10b981">
          <LabelList dataKey="positives" position="center" fill="#fff" fontSize={isMaximized ? 14 : 9} fontWeight="900" formatter={(val: number) => val === 0 ? '' : val} />
        </Bar>
        <Bar dataKey="negatives" stackId="a" fill="#f43f5e">
          <LabelList dataKey="negatives" position="center" fill="#fff" fontSize={isMaximized ? 14 : 9} fontWeight="900" formatter={(val: number) => val === 0 ? '' : val} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderTopNegativeChart = (isMaximized = false) => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={topNegativeSubjects} margin={{ top: isMaximized ? 60 : 35, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
        <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: '#ffffff', fontSize: isMaximized ? 24 : 16, fontWeight: 'bold' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff', fontSize: isMaximized ? 18 : 14, fontWeight: 'bold' }} unit="%" />
        {/* Cursor configurado como transparente para manter o fundo do gráfico 'preto' (idêntico ao original) durante o hover */}
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
        <Bar dataKey="percentageBelowTen" radius={[10, 10, 0, 0]}>
          <LabelList content={<CustomBarLabel fontSize={isMaximized ? 24 : 16} valueKey="percentageBelowTen" />} />
          {topNegativeSubjects.map((entry, index) => (
            <Cell key={`cell-neg-${index}`} fill={entry.color} className="drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderGauge = (value: number, max: number, color: string, label: string, isMaximized = false) => {
    const gaugeData = [
      { name: 'Value', value: value, color: color },
      { name: 'Remaining', value: Math.max(0, max - value), color: 'rgba(255,255,255,0.05)' }
    ];
    
    return (
      <div className="flex flex-col items-center justify-center h-full relative">
        <div className={`w-full ${isMaximized ? 'h-full' : 'h-40'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="70%"
                startAngle={180}
                endAngle={0}
                innerRadius={isMaximized ? "60%" : "50%"}
                outerRadius={isMaximized ? "90%" : "80%"}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {gaugeData.map((entry, index) => (
                  <PieCell key={`cell-${index}`} fill={entry.color} className={entry.name === 'Value' ? "drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" : ""} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={`absolute bottom-[20%] text-center`}>
          <div className={`font-orbitron font-black ${isMaximized ? 'text-6xl mb-2' : 'text-xl'}`} style={{ color }}>{formatDecimal(value)}</div>
          <div className={`font-bold uppercase tracking-widest text-slate-400 ${isMaximized ? 'text-lg' : 'text-[8px]'}`}>{label}</div>
        </div>
      </div>
    );
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
        <div className="glass-panel max-w-lg w-full p-10 rounded-[40px] border-2 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] mb-6"><Orbit className="text-white" size={40} /></div>
            <h1 className="text-4xl font-orbitron font-bold text-white uppercase tracking-tighter text-center">Nexus Link</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Agrupamento de Escolas de Redondo</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2">ID da Folha de Cálculo</label>
              <input type="text" placeholder="Introduzir Google Sheet ID..." className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 transition-all font-mono text-sm text-white" value={sheetId} onChange={(e) => setSheetId(e.target.value)} />
            </div>
            <button onClick={handleConnect} disabled={loading || !sheetId} className="w-full py-5 bg-emerald-500 text-white font-orbitron font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" /> : <><Zap /> Ligar Sistema</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-transparent text-slate-200 relative">
      <aside className="w-20 md:w-64 glass-panel border-r border-slate-800 flex flex-col items-center py-8 z-30 shrink-0">
        <div className="mb-12 w-full px-4 text-center">
          <div className="flex flex-col items-center mb-2">
            <Orbit className="text-cyan-400 mb-2 animate-pulse" size={32} />
            <span className="font-orbitron font-bold text-sm neon-text-magenta block">EduStats Nexus</span>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-6 w-full px-4">
          {[
            { id: 'home', icon: <Home size={24} />, label: 'Início', color: 'emerald' },
            { id: 'table', icon: <TableIcon size={24} />, label: 'Listagem', color: 'cyan' },
            { id: 'subjects', icon: <BookOpen size={24} />, label: 'Disciplinas', color: 'purple' },
            { id: 'overview', icon: <LayoutDashboard size={24} />, label: 'Dashboard', color: 'pink' }
          ].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as any)} 
              className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 transform 
                hover:-translate-y-2 hover:translate-x-2 
                hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] 
                ${activeTab === item.id ? `bg-${item.color}-500/20 text-${item.color}-400 shadow-lg` : 'text-slate-400 hover:text-white'}`}
            >
              {item.icon}
              <span className="hidden md:block font-bold text-xs uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto px-4 w-full">
          <button onClick={handleDisconnect} className="w-full p-3 glass-panel rounded-xl text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-2 transition-all hover:scale-105">
            <LogOut size={16} /> <span className="hidden md:block text-[10px] font-bold uppercase">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto relative">
        <header className="mb-10 flex items-center gap-6">
          <div className="bg-white p-2 rounded-2xl h-20 md:h-24 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <img src="/logo-aer.png" alt="Logótipo AER" className="h-full object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-orbitron font-bold neon-text-cyan uppercase leading-tight">
              Agrupamento de Escolas de <span className="neon-text-redondo-magenta">Redondo</span> 
              <span className="text-white text-base ml-2 block md:inline">| 2025/ 26 | 1.º Período</span>
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Análise de Dados Google Cloud | {selectedSheet}</p>
          </div>
        </header>

        {loading && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl">
            <Loader2 className="animate-spin text-cyan-500 mb-4" size={64} />
            <p className="text-cyan-400 font-orbitron tracking-widest animate-pulse">SINCRONIZANDO...</p>
          </div>
        )}

        {activeTab === 'home' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="glass-panel p-8 rounded-3xl border-l-4 border-emerald-500 shadow-2xl">
                <h2 className="text-2xl font-orbitron font-bold text-white mb-6 flex items-center gap-3"><Layers className="text-emerald-400" /> Turmas Detectadas</h2>
                <div className="grid grid-cols-2 gap-3">
                  {availableSheets.map((s) => (
                    <button 
                      key={s.id} 
                      onClick={() => handleLoadSheet(s.name)} 
                      className={`p-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all transform hover:-translate-y-1 hover:translate-x-1 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] ${selectedSheet === s.name ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-slate-900 hover:bg-slate-800 text-slate-400'}`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && data.length > 0 && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard title="Total de Alunos" value={data.length} icon={<Users />} color="cyan" />
              <StatCard title="Média Global" value={stats.reduce((a, b) => a + b.avg, 0) / stats.length} icon={<TrendingUp />} color="purple" />
              <StatCard title="Aluno com Média Mais Alta" value={bestStudent?.avg || 0} subtitle={bestStudent?.name || "N/A"} icon={<Trophy />} color="emerald" />
              <StatCard title="Disciplina Com Média Mais Alta" value={bestSubject?.avg || 0} subtitle={bestSubject?.subject || "N/A"} icon={<Star />} color="red" />
            </div>

           {/* Alterámos de GRID para FLEX para controlar as larguras exatas (30%, 35%, 25%) */}
            <div className="flex flex-col lg:flex-row gap-4 justify-center items-stretch">
              
              {/* ESQUERDA: Sucesso/Insucesso (30% do espaço) */}
              <div className="w-full lg:w-[30%] glass-panel p-6 rounded-3xl relative overflow-hidden h-[450px] shadow-2xl border-t border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xs font-orbitron font-bold uppercase text-white">Sucesso/Insucesso</h2>
                  <button 
                    onClick={() => setMaximizedDashboardChart('success-failure')}
                    className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                  >
                    <Maximize size={16} />
                  </button>
                </div>
                {renderSuccessFailureChart()}
              </div>
              
              {/* MEIO: Top 3 Negativas (35% do espaço - O maior) */}
              <div className="w-full lg:w-[35%] glass-panel p-6 rounded-3xl h-[450px] shadow-2xl border-t border-white/5 relative">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xs font-orbitron font-bold uppercase text-white">Top 3 Disciplinas com Maior % de Negativas</h2>
                  <button 
                    onClick={() => setMaximizedDashboardChart('top-negative')}
                    className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                  >
                    <Maximize size={16} />
                  </button>
                </div>
                {renderTopNegativeChart()}
              </div>

              {/* DIREITA: Coluna de Gauges (25% do espaço) */}
              <div className="w-full lg:w-[25%] flex flex-col gap-4 h-[450px]">
                {/* Gauge de Média Mais Baixa */}
                <div className="glass-panel p-4 rounded-3xl flex-1 shadow-2xl border-t border-white/5 relative flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-[10px] font-orbitron font-bold uppercase text-white truncate max-w-[80%]">Média Mais Baixa: {lowestAvgSubject?.subject}</h2>
                    <button 
                      onClick={() => setMaximizedDashboardChart('lowest-avg-gauge')}
                      className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                    >
                      <Maximize size={14} />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0">
                    {lowestAvgSubject && renderGauge(lowestAvgSubject.avg, 20, '#f43f5e', 'Média')}
                  </div>
                </div>

                {/* Gauge de Maior Desvio Padrão */}
                <div className="glass-panel p-4 rounded-3xl flex-1 shadow-2xl border-t border-white/5 relative flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-[10px] font-orbitron font-bold uppercase text-white truncate max-w-[80%]">Maior Desvio: {highestStdDevSubject?.subject}</h2>
                    <button 
                      onClick={() => setMaximizedDashboardChart('highest-stddev-gauge')}
                      className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
                    >
                      <Maximize size={14} />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0">
                    {highestStdDevSubject && renderGauge(highestStdDevSubject.stdDev, 10, '#d946ef', 'Desvio Padrão')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-4 animate-in slide-in-from-bottom-6 duration-500">
            {stats.map((s, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl border-l-4 border-cyan-500 group h-[350px] relative overflow-hidden shadow-2xl">
                <SubjectCardContent s={s} onExpand={() => setHoveredSubject(idx)} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'table' && (
          <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800 animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
            <div className="overflow-x-auto p-6">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-slate-500 uppercase tracking-[0.2em] font-black">
                    <th className="px-6 py-4">Nº</th>
                    <th className="px-6 py-4">Aluno</th>
                    {Object.values(SUBJECT_LABELS).map((label, i) => <th key={i} className="px-6 py-4 text-center">{label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.map((student) => (
                    <tr key={student.numero} className="bg-slate-900/40 rounded-xl hover:bg-cyan-500/10 transition-all">
                      <td className="px-6 py-4 text-cyan-400 font-mono font-bold">{student.numero}</td>
                      <td className="px-6 py-4 font-semibold text-slate-200">{student.aluno}</td>
                      {[student.portugues, student.ingles, student.matematica, student.psicologia, student.quimica, student.educacaoFisica, student.emrc].map((grade, idx) => (
                        <td key={idx} className={`px-6 py-4 font-mono font-bold text-center ${grade >= 10 ? 'text-emerald-400' : 'text-red-400'}`}>{grade}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL PARA DISCIPLINAS */}
      {hoveredSubject !== null && activeTab === 'subjects' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-950/80 animate-in duration-300">
          <div className="relative z-10 glass-panel p-16 rounded-[40px] border-2 border-cyan-500/50 shadow-[0_0_120px_rgba(34,211,238,0.4)] w-[1000px] max-w-full">
            <SubjectCardContent s={stats[hoveredSubject]} isFocused />
            <button onClick={() => setHoveredSubject(null)} className="absolute top-8 right-8 text-slate-400 hover:text-white transition-all hover:scale-110"><X size={32} /></button>
          </div>
        </div>
      )}

      {/* MODAL PARA GRÁFICOS DO DASHBOARD (70% AREA) */}
      {maximizedDashboardChart !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-slate-950/80 animate-in duration-300">
          <div className="relative z-10 glass-panel p-12 rounded-[40px] border-2 border-white/20 shadow-2xl w-[70vw] h-[70vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-orbitron font-bold text-white uppercase tracking-widest">
                {maximizedDashboardChart === 'success-failure' && 'Sucesso/Insucesso'}
                {maximizedDashboardChart === 'top-negative' && 'Top 3 Disciplinas com Maior % de Negativas'}
                {maximizedDashboardChart === 'lowest-avg-gauge' && `Média Mais Baixa: ${lowestAvgSubject?.subject}`}
                {maximizedDashboardChart === 'highest-stddev-gauge' && `Maior Desvio Padrão: ${highestStdDevSubject?.subject}`}
              </h2>
              <button 
                onClick={() => setMaximizedDashboardChart(null)} 
                className="text-slate-400 hover:text-white transition-all hover:scale-110"
              >
                <X size={32} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              {maximizedDashboardChart === 'success-failure' && renderSuccessFailureChart(true)}
              {maximizedDashboardChart === 'top-negative' && renderTopNegativeChart(true)}
              {maximizedDashboardChart === 'lowest-avg-gauge' && lowestAvgSubject && renderGauge(lowestAvgSubject.avg, 20, '#f43f5e', 'Média', true)}
              {maximizedDashboardChart === 'highest-stddev-gauge' && highestStdDevSubject && renderGauge(highestStdDevSubject.stdDev, 10, '#d946ef', 'Desvio Padrão', true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: string, subtitle?: string }> = ({ title, value, icon, color, subtitle }) => (
  <div className={`glass-panel p-6 rounded-3xl border-l-4 border-${color}-500 group transition-all shadow-lg hover:shadow-2xl hover:scale-105`}>
    <div className="flex items-center gap-4 mb-2">
      <div className={`p-2 bg-${color}-500/10 rounded-lg text-${color}-400 group-hover:bg-${color}-500 group-hover:text-white transition-all`}>{icon}</div>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{title}</p>
    </div>
    <div className="flex flex-col">
      <h3 className={`text-2xl font-orbitron font-black neon-text-${color}`}>{typeof value === 'number' ? formatDecimal(value) : value}</h3>
      {subtitle && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase truncate group-hover:text-white">{subtitle}</p>}
    </div>
  </div>
);

export default App;
