import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, Legend
} from 'recharts';
import {
  Activity, Wind, Droplets, TrendingUp, TrendingDown,
  Calendar, Filter, RefreshCw, AlertTriangle, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TelemetryRecord {
  _id: string;
  washroomId: string;
  locationName?: string;
  status: string;
  sensors: {
    ammonia: number;
    waterLevel: number;
    soapLevel: number;
    sosAlert: boolean;
  };
  timestamp: string;
}

interface ChartDataPoint {
  time: string;
  fullTime: string;
  ammonia: number;
  waterLevel: number;
  soapLevel: number;
}

const TIME_RANGES = [
  { label: '24h', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '7 Days', days: 7 },
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
];

export default function Analytics({ washrooms }: { washrooms: any[] }) {
  const [logs, setLogs] = useState<TelemetryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedWashroom, setSelectedWashroom] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();

  const fetchAnalytics = useCallback(async () => {
    try {
      setRefreshing(true);
      const params: any = { days: selectedDays };
      if (selectedWashroom !== 'all') params.washroomId = selectedWashroom;

      const res = await axios.get('/api/analytics', { params });
      setLogs(res.data);
    } catch (error: any) {
      if (error.response?.status === 401) logout();
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDays, selectedWashroom]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Aggregate data into chart-friendly format (group by hour or day depending on range)
  const chartData: ChartDataPoint[] = (() => {
    if (logs.length === 0) return [];

    const groupByInterval = selectedDays <= 1 ? 'hour' : selectedDays <= 7 ? '3hour' : 'day';

    const buckets = new Map<string, { ammonia: number[]; waterLevel: number[]; soapLevel: number[] }>();

    logs.forEach((log) => {
      const d = new Date(log.timestamp);
      let key: string;

      if (groupByInterval === 'hour') {
        key = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
      } else if (groupByInterval === '3hour') {
        const roundedHour = Math.floor(d.getHours() / 3) * 3;
        key = `${d.getMonth() + 1}/${d.getDate()} ${roundedHour}:00`;
      } else {
        key = `${d.getMonth() + 1}/${d.getDate()}`;
      }

      if (!buckets.has(key)) {
        buckets.set(key, { ammonia: [], waterLevel: [], soapLevel: [] });
      }
      const bucket = buckets.get(key)!;
      bucket.ammonia.push(log.sensors.ammonia);
      bucket.waterLevel.push(log.sensors.waterLevel);
      bucket.soapLevel.push(log.sensors.soapLevel);
    });

    return Array.from(buckets.entries()).map(([key, values]) => ({
      time: key,
      fullTime: key,
      ammonia: Math.round(values.ammonia.reduce((a, b) => a + b, 0) / values.ammonia.length),
      waterLevel: Math.round(values.waterLevel.reduce((a, b) => a + b, 0) / values.waterLevel.length),
      soapLevel: Math.round(values.soapLevel.reduce((a, b) => a + b, 0) / values.soapLevel.length),
    }));
  })();

  // Summary stats
  const latestAmmonia = logs.length > 0 ? logs[logs.length - 1].sensors.ammonia : 0;
  const avgAmmonia = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + l.sensors.ammonia, 0) / logs.length)
    : 0;
  const peakAmmonia = logs.length > 0
    ? Math.max(...logs.map(l => l.sensors.ammonia))
    : 0;
  const alertCount = logs.filter(l => l.sensors.ammonia > 1000).length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl p-3.5 shadow-xl shadow-slate-200/50">
        <p className="text-xs font-bold text-slate-900 mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs py-0.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500 font-medium">{entry.name}:</span>
            <span className="font-bold text-slate-800">{entry.value} {entry.name === 'Ammonia' ? 'ppm' : '%'}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mb-4">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ──── Header Banner ──── */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-500 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-blue-200" />
              <p className="text-blue-100 text-sm font-medium">Historical Analytics</p>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
              Sensor Telemetry Trends 📊
            </h1>
            <p className="text-blue-100/80 mt-2 text-sm max-w-lg">
              Track ammonia levels, water supply, and soap availability across all monitored washrooms over time.
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="self-start sm:self-auto flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ──── Filters ──── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Time range pills */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            {TIME_RANGES.map((range) => (
              <button
                key={range.days}
                onClick={() => setSelectedDays(range.days)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDays === range.days
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Washroom filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedWashroom}
            onChange={(e) => setSelectedWashroom(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer"
          >
            <option value="all">All Washrooms</option>
            {washrooms.map((w: any) => (
              <option key={w.washroomId} value={w.washroomId}>
                {w.washroomId} — {w.locationName || 'Unknown'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ──── KPI Summary Cards ──── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current NH₃"
          value={`${latestAmmonia} ppm`}
          icon={<Wind className="w-4 h-4" />}
          color="blue"
          trend={latestAmmonia > avgAmmonia ? 'up' : 'down'}
        />
        <StatCard
          title="Average NH₃"
          value={`${avgAmmonia} ppm`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="indigo"
        />
        <StatCard
          title="Peak NH₃"
          value={`${peakAmmonia} ppm`}
          icon={<AlertTriangle className="w-4 h-4" />}
          color={peakAmmonia > 1000 ? 'red' : 'amber'}
        />
        <StatCard
          title="High NH₃ Events"
          value={alertCount.toString()}
          icon={<Activity className="w-4 h-4" />}
          color={alertCount > 0 ? 'red' : 'emerald'}
          subtitle={`readings > 1000 ppm`}
        />
      </div>

      {/* ──── Main Chart: Ammonia Levels ──── */}
      <div className="glass-card p-5 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Wind className="w-5 h-5 text-blue-500" />
              Ammonia Level Trend
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              NH₃ concentration over the last {selectedDays} {selectedDays === 1 ? 'day' : 'days'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Ammonia (ppm)
            </span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <BarChart3 className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-medium">No telemetry data yet</p>
            <p className="text-xs text-slate-400 mt-1">Data will appear here once sensors start reporting</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="ammoniaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'ppm', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 11 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="ammonia"
                name="Ammonia"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fill="url(#ammoniaGrad)"
                dot={{ r: 3, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#3B82F6', strokeWidth: 3, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ──── Secondary Chart: Water & Soap Levels ──── */}
      <div className="glass-card p-5 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-500" />
              Supply Levels
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Water tank and soap dispenser levels over time
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Water (%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Soap (%)
            </span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Droplets className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-medium">No supply data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                label={{ value: '%', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: 11 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', fontWeight: 600 }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                type="monotone"
                dataKey="waterLevel"
                name="Water Level"
                stroke="#06B6D4"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#06B6D4', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#06B6D4', strokeWidth: 3, stroke: '#fff' }}
              />
              <Line
                type="monotone"
                dataKey="soapLevel"
                name="Soap Level"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#8B5CF6', strokeWidth: 3, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ──── Data Table ──── */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Recent Telemetry Records
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            Latest {Math.min(logs.length, 20)} of {logs.length} records
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Washroom</th>
                <th className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">NH₃ (ppm)</th>
                <th className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Water</th>
                <th className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Soap</th>
                <th className="text-left py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(-20).reverse().map((log) => (
                <tr key={log._id} className="border-t border-slate-100 hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-5 text-xs text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-5">
                    <span className="font-bold text-slate-800 font-mono text-xs">{log.washroomId}</span>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`font-bold text-xs ${log.sensors.ammonia > 1000 ? 'text-red-600' : 'text-slate-700'}`}>
                      {log.sensors.ammonia}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`font-bold text-xs ${log.sensors.waterLevel < 20 ? 'text-red-600' : 'text-slate-700'}`}>
                      {log.sensors.waterLevel}%
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`font-bold text-xs ${log.sensors.soapLevel < 20 ? 'text-red-600' : 'text-slate-700'}`}>
                      {log.sensors.soapLevel}%
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      log.status === 'Red' ? 'bg-red-50 text-red-600 border border-red-200' :
                      log.status === 'Yellow' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      {log.status === 'Red' ? 'Critical' : log.status === 'Yellow' ? 'Warning' : 'Healthy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">No records found for this time range</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───── Stat Card ───── */
function StatCard({ title, value, icon, color, trend, subtitle }: any) {
  const styles: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    iconBg: 'bg-blue-100' },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  iconBg: 'bg-indigo-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   iconBg: 'bg-amber-100' },
    red:     { bg: 'bg-red-50',     text: 'text-red-600',     iconBg: 'bg-red-100' },
  };
  const s = styles[color] || styles.blue;

  return (
    <div className="glass-card p-4 lg:p-5">
      <div className="flex justify-between items-start mb-3">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <div className={`p-2 rounded-xl ${s.iconBg} ${s.text}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <h3 className="text-2xl lg:text-3xl font-black text-slate-900">{value}</h3>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500 mb-1" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-emerald-500 mb-1" />}
      </div>
      {subtitle && <p className="text-[10px] text-slate-400 mt-1 font-medium">{subtitle}</p>}
    </div>
  );
}
