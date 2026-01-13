import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, Calendar, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { THEMES } from '@/lib/constants';
import type { Transaction, Profile, Theme } from '@/types';

interface AnalyticsProps {
  transactions: Transaction[];
  profiles: Record<string, Profile>;
  currentTheme: Theme;
  totalSavings: number;
  userTotals: Record<string, number>;
}

export function Analytics({ 
  transactions, 
  profiles, 
  currentTheme, 
  totalSavings,
  userTotals 
}: AnalyticsProps) {
  // Monthly data for line chart
  const monthlyData = useMemo(() => {
    const grouped: Record<string, { month: string; total: number; pea: number; cam: number }> = {};
    
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = { month: monthLabel, total: 0, pea: 0, cam: 0 };
      }
      
      grouped[monthKey].total += tx.amount;
      if (tx.userId === 'pea') grouped[monthKey].pea += tx.amount;
      if (tx.userId === 'cam') grouped[monthKey].cam += tx.amount;
    });
    
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data);
  }, [transactions]);

  // Cumulative data for area chart
  const cumulativeData = useMemo(() => {
    let runningTotal = 0;
    return monthlyData.map(item => {
      runningTotal += item.total;
      return { ...item, cumulative: runningTotal };
    });
  }, [monthlyData]);

  // Contribution breakdown for pie chart
  const pieData = useMemo(() => {
    return Object.entries(profiles).map(([id, profile]) => ({
      name: profile.name,
      value: userTotals[id] || 0,
      color: THEMES[profile.theme].color,
      emoji: profile.emoji
    }));
  }, [profiles, userTotals]);

  // Period comparison data
  const periodData = useMemo(() => {
    const grouped: Record<string, number> = {};
    
    transactions.forEach(tx => {
      if (tx.period) {
        grouped[tx.period] = (grouped[tx.period] || 0) + tx.amount;
      }
    });
    
    return Object.entries(grouped)
      .map(([period, amount]) => ({ period: period.replace(/, \d{4}$/, ''), amount }))
      .slice(-8);
  }, [transactions]);

  // Stats calculations
  const avgMonthly = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    return totalSavings / monthlyData.length;
  }, [monthlyData, totalSavings]);

  const contributionRatio = useMemo(() => {
    const peaPct = totalSavings > 0 ? ((userTotals.pea || 0) / totalSavings) * 100 : 50;
    return { pea: peaPct, cam: 100 - peaPct };
  }, [userTotals, totalSavings]);

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-600 mb-2">No data yet</h3>
        <p className="text-slate-400">Start adding savings to see your analytics!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Total Saved"
          value={formatCurrency(totalSavings)}
          color={currentTheme.bgClass}
        />
        <StatCard
          icon={<Calendar size={20} />}
          label="Avg Monthly"
          value={formatCurrency(avgMonthly)}
          color="bg-violet-500"
        />
        <StatCard
          icon={<Users size={20} />}
          label={`${profiles.pea?.name || 'Pea'}'s Share`}
          value={`${contributionRatio.pea.toFixed(0)}%`}
          color={THEMES[profiles.pea?.theme || 'emerald'].bgClass}
        />
        <StatCard
          icon={<Users size={20} />}
          label={`${profiles.cam?.name || 'Cam'}'s Share`}
          value={`${contributionRatio.cam.toFixed(0)}%`}
          color={THEMES[profiles.cam?.theme || 'indigo'].bgClass}
        />
      </div>

      {/* Growth Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <TrendingUp size={18} className={currentTheme.textClass} />
          Savings Growth
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeData}>
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentTheme.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={currentTheme.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [formatCurrency(value), 'Total']}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke={currentTheme.color}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCumulative)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contribution Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PieIcon size={18} className={currentTheme.textClass} />
            Contribution Split
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="text-lg">{entry.emoji}</span>
                <span className="text-sm font-medium text-slate-600">{entry.name}</span>
                <span className="text-sm font-bold" style={{ color: entry.color }}>
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Comparison Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar size={18} className={currentTheme.textClass} />
            Monthly Contributions
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar 
                  dataKey="pea" 
                  name={profiles.pea?.name || 'Pea'} 
                  fill={THEMES[profiles.pea?.theme || 'emerald'].color} 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  dataKey="cam" 
                  name={profiles.cam?.name || 'Cam'} 
                  fill={THEMES[profiles.cam?.theme || 'indigo'].color} 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Period Breakdown */}
      {periodData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Recent Pay Periods</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={periodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `₱${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={currentTheme.color}
                  strokeWidth={3}
                  dot={{ fill: currentTheme.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: currentTheme.color, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${color} text-white flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-slate-400 font-medium uppercase">{label}</p>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

