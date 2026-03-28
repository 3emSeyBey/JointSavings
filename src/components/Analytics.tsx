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
import { TrendingUp, PieChart as PieIcon, Calendar, Users, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { THEMES } from '@/lib/constants';
import { projectBalanceLinear } from '@/lib/forecast';
import { longestStreakFromSortedDates } from '@/lib/streaks';
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
  const memberIds = useMemo(() => {
    const ids = new Set<string>(Object.keys(profiles));
    transactions.forEach((tx) => ids.add(tx.userId));
    return [...ids].sort();
  }, [profiles, transactions]);

  // Monthly data for line chart (dynamic member keys)
  const monthlyData = useMemo(() => {
    type Row = Record<string, string | number>;
    const grouped: Record<string, Row> = {};

    transactions.forEach((tx) => {
      const date = new Date(`${tx.date}T12:00:00`);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' });

      if (!grouped[monthKey]) {
        const row: Row = { month: monthLabel, total: 0 };
        memberIds.forEach((id) => {
          row[id] = 0;
        });
        grouped[monthKey] = row;
      }

      grouped[monthKey].total = Number(grouped[monthKey].total) + tx.amount;
      const uid = tx.userId;
      const prev = Number(grouped[monthKey][uid] ?? 0);
      grouped[monthKey][uid] = prev + tx.amount;
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data);
  }, [transactions, memberIds]);

  // Cumulative data for area chart
  const cumulativeData = useMemo(() => {
    let runningTotal = 0;
    return monthlyData.map((item) => {
      runningTotal += Number(item.total);
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

  const shareByMember = useMemo(() => {
    return memberIds.map((id) => ({
      id,
      name: profiles[id]?.name || id,
      theme: profiles[id]?.theme || 'emerald',
      pct: totalSavings > 0 ? ((userTotals[id] || 0) / totalSavings) * 100 : 100 / Math.max(memberIds.length, 1),
    }));
  }, [memberIds, profiles, userTotals, totalSavings]);

  const categoryTotals = useMemo(() => {
    const m: Record<string, number> = {};
    transactions.forEach((tx) => {
      const c = tx.category || 'general';
      m[c] = (m[c] || 0) + tx.amount;
    });
    return Object.entries(m)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const savingsStreakDays = useMemo(() => {
    const dates = [...new Set(transactions.map((t) => t.date))].sort();
    return longestStreakFromSortedDates(dates);
  }, [transactions]);

  const forecast3mo = useMemo(
    () => projectBalanceLinear(totalSavings, avgMonthly, 3),
    [totalSavings, avgMonthly]
  );

  const exportCsv = () => {
    const header = 'date,amount,type,userId,spendSource,category,note\n';
    const rows = transactions
      .map((t) => {
        const type = t.entryKind === 'spend' ? 'spend' : 'saving';
        const src = t.spendSource ?? '';
        return `${t.date},${t.amount},${type},${t.userId},${src},${t.category || 'general'},"${(t.note || '').replace(/"/g, '""')}"`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `joint-savings-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      <div className="flex justify-stretch sm:justify-end">
        <button
          type="button"
          onClick={exportCsv}
          className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-11 px-4 py-2.5 rounded-xl text-sm font-bold text-white ${currentTheme.bgClass}`}
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp size={20} />}
          label="3-mo projection"
          value={formatCurrency(forecast3mo)}
          color="bg-sky-500"
        />
        <StatCard
          icon={<Calendar size={20} />}
          label="Best savings streak"
          value={`${savingsStreakDays} days`}
          color="bg-amber-500"
        />
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm sm:col-span-1">
          <p className="text-xs text-slate-400 font-medium uppercase mb-2">By category</p>
          <ul className="space-y-1 text-sm">
            {categoryTotals.slice(0, 6).map((c) => (
              <li key={c.category} className="flex justify-between gap-2">
                <span className="text-slate-600 capitalize">{c.category}</span>
                <span className="font-bold text-slate-800">{formatCurrency(c.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {shareByMember.map((m) => (
          <StatCard
            key={m.id}
            icon={<Users size={20} />}
            label={`${m.name}'s Share`}
            value={`${m.pct.toFixed(0)}%`}
            color={THEMES[m.theme].bgClass}
          />
        ))}
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
                {memberIds.map((id) => (
                  <Bar
                    key={id}
                    dataKey={id}
                    name={profiles[id]?.name || id}
                    fill={THEMES[profiles[id]?.theme || 'emerald'].color}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
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

