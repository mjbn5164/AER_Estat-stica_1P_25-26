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
    const value = payload[0].value; 
    const dataKey = payload[0].dataKey;
    const name = data.subject || data.range || data.name || data.subjectName;
    const unit = dataKey === 'percentageBelowTen' ? '%' : '';
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
      const response = await fetch('/api/listSheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Não foi possível aceder à folha');
      }

      const { sheets } = await response.json();

      setAvailableSheets(sheets);
      localStorage.setItem('google_sheet_id', sheetId);
      setIsConnected(true);

      // Carrega automaticamente a primeira turma se existir
      if (sheets.length > 0) {
        handleLoadSheet(sheets[0].name);
      }
    } catch (err: any) {
      console.error(err);
      alert("ERRO: Verifique o ID da Folha de Cálculo ou as permissões.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSheet = async (sheetName: string) => {
    setLoading(true);
    setSelectedSheet(sheetName);
    try {
      const response = await fetch('/api/loadSheetData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId, sheetName }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Falha ao ler a Google Sheet');
      }

      const { textData } = await response.json();

      if (!textData.trim()) {
        throw new Error('A sheet está vazia ou não tem dados');
      }

      const prompt = `
        Analise a seguinte pauta escolar e extraia os dados.
        Retorne APENAS um JSON válido (array de objetos).
        Campos obrigatórios: numero (number), aluno (string), portugues, ingles, matematica, psicologia, quimica, educacaoFisica, emrc (numbers).
        Se a nota não existir ou for "F", assuma 0.
        
        DADOS:
        ${textData}
      `;

      const aiResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const aiData = await aiResponse.json();

      if (aiData.error) {
        throw new Error(aiData.error);
      }

      let cleanText = '';
      if (aiData.candidates?.[0]?.content?.parts) {
        cleanText = aiData.candidates[0].content.parts
          .map((part: any) => part.text || '')
          .join('');
      } else {
        throw new Error('Resposta inesperada da IA Gemini');
      }

      cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();

      if (!cleanText) {
        throw new Error('A IA não devolveu dados válidos');
      }

      const rawExtracted = JSON.parse(cleanText);

      const validatedData: StudentData[] = rawExtracted.map((student: any, index: number) => ({
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
      setActiveTab('table');
    } catch (err: any) {
      console.error(err);
      alert("Erro ao processar dados: " + (err.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('google_sheet_id');
    setSheetId('');
    setIsConnected(false);
    setData([]);
    setAvailableSheets([]);
    setActiveTab('home');
  };

  // ... (o resto do código – stats, gráficos, render, etc. – fica exatamente igual ao que tinhas antes)

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

  // ... (todo o resto do código – bestSubject, render functions, JSX, StatCard – permanece igual ao teu original)

  // (para não repetir o código todo aqui, mantém o que tinhas desde "const bestSubject = ..." até ao final com export default App; e StatCard)

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
    // ... (o return completo com o sidebar, main, gráficos, etc. – mantém exatamente o teu código original)
    // Só garante que na secção {activeTab === 'home' && ( ... )} tem o map das availableSheets para mostrar os botões das turmas

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
  );

  // ... (o resto do return, modais, etc. – igual ao teu)

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
