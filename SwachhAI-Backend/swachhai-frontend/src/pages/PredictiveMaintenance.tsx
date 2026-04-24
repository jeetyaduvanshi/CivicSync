import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Activity, Droplets, Clock, AlertTriangle, RefreshCw,
  TrendingDown, ShieldAlert, Zap, Gauge, Filter, BrainCircuit
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ═══════════════════════ Types ═══════════════════════ */

interface Prediction {
  washroomId: string;
  locationName: string;
  currentWater: number;
  currentSoap: number;
  waterDepletionRate: number;   // units/hour
  soapDepletionRate: number;
  waterHoursLeft: number | null;  // null = stable / rising
  soapHoursLeft: number | null;
  waterTrend: { time: string; value: number }[];
  soapTrend: { time: string; value: number }[];
}

type SeverityLevel = 'critical' | 'warning' | 'watch' | 'healthy';

/* ═══════════════════════ Helpers ═══════════════════════ */

function getSeverity(hoursLeft: number | null): SeverityLevel {
  if (hoursLeft === null) return 'healthy';
  if (hoursLeft <= 4) return 'critical';
  if (hoursLeft <= 8) return 'warning';
  if (hoursLeft <= 16) return 'watch';
  return 'healthy';
}

function worstSeverity(a: SeverityLevel, b: SeverityLevel): SeverityLevel {
  const rank: Record<SeverityLevel, number> = { critical: 0, warning: 1, watch: 2, healthy: 3 };
  return rank[a] <= rank[b] ? a : b;
}

const SEVERITY_STYLES: Record<SeverityLevel, {
  badge: string; bg: string; border: string; text: string; glow: string; icon: string;
}> = {
  critical: {
    badge: 'bg-red-500 text-white',
    bg: 'bg-gradient-to-br from-red-50 to-red-100/40',
    border: 'border-red-200',
    text: 'text-red-600',
    glow: 'shadow-red-500/10',
    icon: 'bg-red-100 text-red-600',
  },
  warning: {
    badge: 'bg-amber-500 text-white',
    bg: 'bg-gradient-to-br from-amber-50 to-amber-100/40',
    border: 'border-amber-200',
    text: 'text-amber-600',
    glow: 'shadow-amber-500/10',
    icon: 'bg-amber-100 text-amber-600',
  },
  watch: {
    badge: 'bg-blue-500 text-white',
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100/40',
    border: 'border-blue-200',
    text: 'text-blue-600',
    glow: 'shadow-blue-500/10',
    icon: 'bg-blue-100 text-blue-600',
  },
  healthy: {
    badge: 'bg-emerald-500 text-white',
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/40',
    border: 'border-emerald-200',
    text: 'text-emerald-600',
    glow: 'shadow-emerald-500/10',
    icon: 'bg-emerald-100 text-emerald-600',
  },
};

const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  critical: 'CRITICAL',
  warning: 'WARNING',
  watch: 'MONITORING',
  healthy: 'OPTIMAL',
};

function formatHours(h: number | null): string {
  if (h === null) return '—';
  if (h <= 0) return 'EMPTY NOW';
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h >= 999) return '∞';
  return `${Math.round(h)}h`;
}

/* ═══════════════════════ Component ═══════════════════════ */

export default function PredictiveMaintenance({ washrooms: _washrooms }: { washrooms: any[] }) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'all'>('all');
  const { logout } = useAuth();

  const fetchPredictions = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await axios.get('/api/predictive');
      setPredictions(res.data);
    } catch (error: any) {
      if (error.response?.status === 401) logout();
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchPredictions]);

  // Sort by urgency (lowest hoursLeft first)
  const sorted = [...predictions].sort((a, b) => {
    const aMin = Math.min(a.waterHoursLeft ?? 9999, a.soapHoursLeft ?? 9999);
    const bMin = Math.min(b.waterHoursLeft ?? 9999, b.soapHoursLeft ?? 9999);
    return aMin - bMin;
  });

  const filtered = filterSeverity === 'all'
    ? sorted
    : sorted.filter(p => {
        const sev = worstSeverity(getSeverity(p.waterHoursLeft), getSeverity(p.soapHoursLeft));
        return sev === filterSeverity;
      });

  // Summary KPIs
  const criticalCount = predictions.filter(p =>
    getSeverity(p.waterHoursLeft) === 'critical' || getSeverity(p.soapHoursLeft) === 'critical'
  ).length;
  const warningCount = predictions.filter(p => {
    const sev = worstSeverity(getSeverity(p.waterHoursLeft), getSeverity(p.soapHoursLeft));
    return sev === 'warning';
  }).length;
  const healthyCount = predictions.filter(p => {
    const sev = worstSeverity(getSeverity(p.waterHoursLeft), getSeverity(p.soapHoursLeft));
    return sev === 'healthy';
  }).length;
  const soonestDepletion = sorted.length > 0
    ? Math.min(
        sorted[0]?.waterHoursLeft ?? 9999,
        sorted[0]?.soapHoursLeft ?? 9999
      )
    : null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl p-3.5 shadow-xl shadow-slate-200/50">
        <p className="text-xs font-bold text-slate-900 mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs py-0.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500 font-medium">{entry.name}:</span>
            <span className="font-bold text-slate-800">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  };

  /* ──── Loading ──── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 mx-auto mb-4">
            <BrainCircuit className="w-7 h-7 text-white animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm font-medium">AI is analyzing depletion patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ──── Header Banner ──── */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BrainCircuit className="w-5 h-5 text-purple-200" />
              <p className="text-purple-100 text-sm font-medium">Predictive Intelligence</p>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
              AI Maintenance Forecast 🔮
            </h1>
            <p className="text-purple-100/80 mt-2 text-sm max-w-lg">
              Predicting resource depletion before it happens. Analyzing 24-hour telemetry trends to estimate when each washroom will need restocking.
            </p>
          </div>
          <button
            onClick={fetchPredictions}
            disabled={refreshing}
            className="self-start sm:self-auto flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ──── KPI Summary Cards ──── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Critical Alerts"
          value={criticalCount.toString()}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="red"
          subtitle="Needs immediate action"
        />
        <KPICard
          title="Warnings"
          value={warningCount.toString()}
          icon={<ShieldAlert className="w-4 h-4" />}
          color="amber"
          subtitle="Restock within 8 hrs"
        />
        <KPICard
          title="All Healthy"
          value={healthyCount.toString()}
          icon={<Zap className="w-4 h-4" />}
          color="emerald"
          subtitle="Resources sufficient"
        />
        <KPICard
          title="Soonest Depletion"
          value={soonestDepletion !== null && soonestDepletion < 9999 ? formatHours(soonestDepletion) : '—'}
          icon={<Clock className="w-4 h-4" />}
          color={soonestDepletion !== null && soonestDepletion <= 4 ? 'red' : soonestDepletion !== null && soonestDepletion <= 8 ? 'amber' : 'blue'}
          subtitle="Nearest resource exhaustion"
        />
      </div>

      {/* ──── Severity Filter ──── */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
          {(['all', 'critical', 'warning', 'watch', 'healthy'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterSeverity === sev
                  ? sev === 'all' ? 'bg-slate-800 text-white shadow-md'
                    : `${SEVERITY_STYLES[sev].badge} shadow-md`
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {sev === 'all' ? 'All' : SEVERITY_LABELS[sev]}
              {sev !== 'all' && (
                <span className="ml-1.5 opacity-80">
                  ({sev === 'critical' ? criticalCount : sev === 'warning' ? warningCount : sev === 'healthy' ? healthyCount :
                    predictions.filter(p => {
                      const s = worstSeverity(getSeverity(p.waterHoursLeft), getSeverity(p.soapHoursLeft));
                      return s === sev;
                    }).length
                  })
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ──── Prediction Cards ──── */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BrainCircuit className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-600">No Predictions Available</p>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            {predictions.length === 0
              ? 'Not enough telemetry data yet. Predictions require at least 2 data points within the last 24 hours per washroom.'
              : 'No washrooms match the selected filter.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((pred) => {
            const severity = worstSeverity(getSeverity(pred.waterHoursLeft), getSeverity(pred.soapHoursLeft));
            const style = SEVERITY_STYLES[severity];
            const isExpanded = expandedCard === pred.washroomId;

            return (
              <div
                key={pred.washroomId}
                className={`glass-card border ${style.border} ${style.bg} shadow-lg ${style.glow} overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer`}
                onClick={() => setExpandedCard(isExpanded ? null : pred.washroomId)}
              >
                {/* Card Header */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.icon}`}>
                        <Gauge className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 tracking-tight">{pred.locationName || pred.washroomId}</h3>
                        <p className="text-xs text-slate-500 font-medium">{pred.washroomId}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${style.badge}`}>
                      {SEVERITY_LABELS[severity]}
                    </span>
                  </div>

                  {/* Resource Bars */}
                  <div className="space-y-3">
                    {/* Water */}
                    <ResourceBar
                      label="Water Level"
                      icon={<Droplets className="w-3.5 h-3.5" />}
                      current={pred.currentWater}
                      hoursLeft={pred.waterHoursLeft}
                      rate={pred.waterDepletionRate}
                      color="cyan"
                    />
                    {/* Soap */}
                    <ResourceBar
                      label="Soap Level"
                      icon={<Activity className="w-3.5 h-3.5" />}
                      current={pred.currentSoap}
                      hoursLeft={pred.soapHoursLeft}
                      rate={pred.soapDepletionRate}
                      color="violet"
                    />
                  </div>
                </div>

                {/* Expanded — Depletion Trend Chart */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-200/60 pt-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-slate-400" />
                      24-Hour Depletion Trend
                    </h4>

                    {pred.waterTrend.length < 2 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">Insufficient data for trend visualization</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart
                          data={pred.waterTrend.map((wt, i) => ({
                            time: wt.time,
                            water: wt.value,
                            soap: pred.soapTrend[i]?.value ?? 0,
                          }))}
                          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id={`waterGrad-${pred.washroomId}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id={`soapGrad-${pred.washroomId}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis
                            dataKey="time"
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.5} label={{ value: 'Critical', fill: '#ef4444', fontSize: 10 }} />
                          <Area
                            type="monotone"
                            dataKey="water"
                            name="Water"
                            stroke="#06B6D4"
                            strokeWidth={2}
                            fill={`url(#waterGrad-${pred.washroomId})`}
                            dot={{ r: 2.5, fill: '#06B6D4', strokeWidth: 1.5, stroke: '#fff' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="soap"
                            name="Soap"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            fill={`url(#soapGrad-${pred.washroomId})`}
                            dot={{ r: 2.5, fill: '#8B5CF6', strokeWidth: 1.5, stroke: '#fff' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                )}

                {/* Footer CTA */}
                <div className={`px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-center ${
                  severity === 'critical' ? 'bg-red-100/60 text-red-600' :
                  severity === 'warning' ? 'bg-amber-100/60 text-amber-600' :
                  severity === 'watch' ? 'bg-blue-100/60 text-blue-600' :
                  'bg-emerald-100/60 text-emerald-600'
                }`}>
                  {isExpanded ? '▲ Click to collapse' : '▼ Click for depletion trend'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ ResourceBar ═══════════════════════ */

function ResourceBar({ label, icon, current, hoursLeft, rate, color }: {
  label: string;
  icon: React.ReactNode;
  current: number;
  hoursLeft: number | null;
  rate: number;
  color: 'cyan' | 'violet';
}) {
  const barColor = color === 'cyan' ? 'bg-cyan-500' : 'bg-violet-500';
  const barTrack = color === 'cyan' ? 'bg-cyan-100' : 'bg-violet-100';
  const severity = getSeverity(hoursLeft);
  const sevStyle = SEVERITY_STYLES[severity];

  return (
    <div className="bg-white/70 rounded-xl p-3 border border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`${color === 'cyan' ? 'text-cyan-600' : 'text-violet-600'}`}>{icon}</span>
          <span className="text-xs font-semibold text-slate-700">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-900">{current}%</span>
          {hoursLeft !== null && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${sevStyle.badge}`}>
              <Clock className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />
              {formatHours(hoursLeft)} left
            </span>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className={`h-2 rounded-full ${barTrack} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${current <= 20 ? 'bg-red-500' : barColor} transition-all duration-700`}
          style={{ width: `${Math.max(0, Math.min(100, current))}%` }}
        />
      </div>
      {rate > 0 && (
        <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          Depleting at ~{rate.toFixed(1)}%/hr
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════ KPI Card ═══════════════════════ */

function KPICard({ title, value, icon, color, subtitle }: any) {
  const styles: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    iconBg: 'bg-blue-100' },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  iconBg: 'bg-indigo-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   iconBg: 'bg-amber-100' },
    red:     { bg: 'bg-red-50',     text: 'text-red-600',     iconBg: 'bg-red-100' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  iconBg: 'bg-violet-100' },
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
      <h3 className="text-2xl lg:text-3xl font-black text-slate-900">{value}</h3>
      {subtitle && <p className="text-[10px] text-slate-400 mt-1 font-medium">{subtitle}</p>}
    </div>
  );
}
