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
      setIsConnected(true);
    }
  }, []);

  const handleConnect = () => {
    if (!sheetId || sheetId.trim() === "") return;
    localStorage.setItem('google_sheet_id', sheetId);
    setIsConnected(true);
  };

  const handleLoadSheet =
