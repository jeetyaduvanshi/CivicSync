import {
  ShieldAlert, HeartPulse, CheckCircle, AlertTriangle,
  Shield, Radio, Wifi, Lock, Eye
} from 'lucide-react';

export default function Safety({ washrooms }: any) {
  const sosActive = washrooms.filter((w: any) => w.sensors.sosAlert);
  const hasSos = sosActive.length > 0;

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ──── Hero Banner ──── */}
      <div className={`rounded-2xl p-6 lg:p-8 flex items-start gap-5 border relative overflow-hidden ${hasSos
        ? 'bg-gradient-to-r from-red-50 to-red-100/60 border-red-200'
        : 'bg-gradient-to-r from-blue-50 to-blue-100/60 border-blue-200/60'
        }`}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/30 -translate-y-1/2 translate-x-1/3" />
        <div className={`p-3 rounded-xl shrink-0 ${hasSos ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Safety Hub</h2>
          <p className="text-slate-500 mt-1 text-sm leading-relaxed max-w-xl">
            Monitoring medical anomalies via motion sensor correlation,
            and manual SOS button triggers in real-time.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              <Wifi className="w-3 h-3" /> ESP32 Connected
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
              <Lock className="w-3 h-3" /> Encrypted Feed
            </span>
          </div>
        </div>
      </div>

      {/* ──── Safety Modules Grid ──── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Medical Anomaly */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Medical Anomaly</h3>
              <p className="text-xs text-slate-400">PIR Motion + Timeout Logic</p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-emerald-700 font-bold text-sm">No anomalies detected</p>
              <p className="text-emerald-500 text-xs">All nodes reporting motion patterns</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label="Sensor" value="PIR HC-SR501" />
            <MiniStat label="Timeout" value="15 min" />
            <MiniStat label="Nodes" value={`${washrooms.length} Active`} />
            <MiniStat label="Blocked" value="0" />
          </div>
        </div>

        {/* Active Emergency */}
        <div className={`glass-card p-6 ${hasSos ? 'ring-2 ring-red-200 ring-offset-2' : ''}`}>
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2.5 rounded-xl ${hasSos ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-red-50 text-red-500'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Active Emergencies</h3>
              <p className="text-xs text-slate-400">Manual SOS + Auto-trigger</p>
            </div>
          </div>

          {hasSos ? (
            <div className="space-y-3">
              {sosActive.map((wr: any) => (
                <div
                  key={wr.washroomId}
                  className="bg-red-50 border border-red-200 p-4 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-black text-red-600 font-mono flex items-center gap-2">
                      <Radio className="w-4 h-4 animate-pulse" /> {wr.locationName || wr.washroomId}
                    </p>
                    <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                      SOS ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-red-500/80 mt-1">
                    Emergency trigger detected — dispatching nearest response unit
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl text-center">
              <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm font-semibold">No Active Emergencies</p>
              <p className="text-slate-400 text-xs mt-1">All safety systems nominal</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat label="SOS Button" value="Physical" />
            <MiniStat label="Response" value="Auto" />
          </div>
        </div>
      </div>

      {/* ──── Women's Safety Focus ──── */}
      <div className="glass-card p-6 lg:p-8">
        <div className="flex items-start gap-4 mb-5">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Women's Safety Initiative</h3>
            <p className="text-slate-400 text-sm mt-1">
              CivicSync is specifically designed to enhance women's safety in public washrooms through multi-layered AI protection.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: <AlertTriangle className="w-4 h-4" />, title: 'SOS Button', desc: 'Physical panic button with instant alert dispatch' },
            { icon: <Lock className="w-4 h-4" />, title: 'Door Lock Monitor', desc: 'Magnetic reed sensor for door tamper detection' },
            { icon: <HeartPulse className="w-4 h-4" />, title: 'Medical Timeout', desc: 'PIR sensor monitors for extended inactivity' },
          ].map(item => (
            <div key={item.title} className="bg-violet-50/50 border border-violet-100 p-4 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 mb-3">
                {item.icon}
              </div>
              <p className="font-bold text-slate-800 text-sm">{item.title}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───── Mini stat block ───── */
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-lg">
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}