import { useState, useEffect } from 'react';
import {
  Activity, CheckCircle, Wrench, ShieldAlert, MapPin, Wind, Droplets,
  TrendingUp, ArrowUpRight, Star, MessageSquare, Stamp, AlertTriangle,
  Clock, ChevronDown, ChevronUp, Eye, Settings, X, Accessibility, Baby,
  GlassWater, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Dashboard({ washrooms, total, maintenance, alerts }: any) {
  const operational = washrooms.filter((w: any) => w.status === 'Green').length;
  const operationalPct = total > 0 ? Math.round((operational / total) * 100) : 100;
  const { user, isAdmin } = useAuth();

  // 💡 State: Coordinates से निकाला हुआ एड्रेस यहाँ सेव होगा
  const [addressMap, setAddressMap] = useState<any>({});
  const [feedbackStream, setFeedbackStream] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
  const [amenityModal, setAmenityModal] = useState<any>(null);
  const [amenityData, setAmenityData] = useState<Record<string, boolean>>({});
  const [amenitySaving, setAmenitySaving] = useState(false);

  // Fetch notices for Nodal Officers
  useEffect(() => {
    if (isAdmin) return;
    const fetchNotices = async () => {
      try {
        const res = await axios.get('/api/notices');
        setNotices(res.data);
      } catch (err) {
        console.log("Notices fetch error", err);
      }
    };
    fetchNotices();
    const noticeInt = setInterval(fetchNotices, 10000);
    return () => clearInterval(noticeInt);
  }, [isAdmin]);

  const markNoticeRead = async (noticeId: string) => {
    try {
      await axios.patch(`/api/notices/${noticeId}/read`);
      setNotices(prev => prev.map(n => n._id === noticeId ? { ...n, status: 'read', readAt: new Date() } : n));
    } catch (err) {
      console.log("Mark read error", err);
    }
  };

  // Feedback polling
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await axios.get('/api/feedback/stream');
        setFeedbackStream(res.data);
      } catch (err) {
        console.log("Feedback stream error", err);
      }
    };
    fetchFeedback();
    const int = setInterval(fetchFeedback, 5000);
    return () => clearInterval(int);
  }, []);

  // 🌍 Reverse Geocoding API (Lat/Lng to Text)
  useEffect(() => {
    washrooms.forEach((wr: any) => {
      if (wr.lat && wr.lng && !wr.locationName && !addressMap[wr.washroomId]) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${wr.lat}&lon=${wr.lng}`)
          .then(res => res.json())
          .then(data => {
            const areaName = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || "Smart City Zone";
            setAddressMap((prev: any) => ({ ...prev, [wr.washroomId]: areaName }));
          })
          .catch(err => console.log("Geocoding Error:", err));
      }
    });
  }, [washrooms]);

  const unreadNotices = notices.filter((n: any) => n.status === 'unread');

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* ──── MCD Notices Banner (Nodal Officers Only) ──── */}
      {!isAdmin && unreadNotices.length > 0 && (
        <div className="space-y-3">
          {unreadNotices.map((notice: any) => (
            <div
              key={notice._id}
              className="rounded-2xl border-2 border-red-200 bg-gradient-to-r from-red-50 via-white to-red-50 shadow-lg shadow-red-100/50 overflow-hidden animate-fade-in-up"
            >
              {/* Notice Header */}
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
                    <Stamp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-red-800 text-sm">{notice.subject}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Official Notice from MCD
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(notice.sentAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedNotice(expandedNotice === notice._id ? null : notice._id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {expandedNotice === notice._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => markNoticeRead(notice._id)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-100 hover:bg-red-200 border border-red-200 px-3 py-1.5 rounded-full transition-colors"
                    title="Mark as read"
                  >
                    <Eye className="w-3 h-3" /> Acknowledge
                  </button>
                </div>
              </div>

              {/* Expanded Notice Body */}
              {expandedNotice === notice._id && (
                <div className="px-5 pb-5 border-t border-red-100">
                  <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {notice.summary}
                  </div>

                  {notice.topIssues && notice.topIssues.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Reported Issues</p>
                      <div className="flex flex-wrap gap-2">
                        {notice.topIssues.map((iss: any, i: number) => (
                          <span key={i} className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                            {iss.issue} ({iss.count}x)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200/60 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                       <strong>Action Required:</strong> Please report to MCD office within 48 hours with a written explanation
                       and corrective action plan. Bring this notice reference for verification.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Read notices (collapsed) */}
      {!isAdmin && notices.filter((n: any) => n.status === 'read').length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {notices.filter((n: any) => n.status === 'read').length} acknowledged notice(s)
          </span>
        </div>
      )}

      {/* ──── Welcome Banner ──── */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-blue-100 text-sm font-medium mb-1">
            {isAdmin ? 'Municipal Corporation of Delhi' : 'Nodal Operations Center'}
          </p>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
            {isAdmin
              ? 'Welcome back, MCD Admin Department'
              : `Welcome back, Officer ${user?.name || ''}`
            }
          </h1>
          <p className="text-blue-100/80 mt-2 text-sm max-w-lg">
            {isAdmin
              ? `City-wide monitoring of ${total} smart sanitation ${total === 1 ? 'node' : 'nodes'}. All sensors reporting normally.`
              : `Managing ${total} assigned sanitation ${total === 1 ? 'node' : 'nodes'}. All systems operational.`
            }
          </p>
        </div>
      </div>

      {/* ──── KPI Grid ──── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Total Facilities" value={total} icon={<Activity />} color="blue" />
        <KpiCard title="Operational" value={`${operationalPct}%`} icon={<CheckCircle />} color="emerald" />
        <KpiCard title="Maintenance" value={maintenance} icon={<Wrench />} color="amber" />
        <KpiCard title="Critical Alerts" value={alerts} icon={<ShieldAlert />} color="red" alert={alerts > 0} />
        <KpiCard title="System Uptime" value="99.9%" icon={<TrendingUp />} color="blue" />
      </div>

      {/* ──── Section Header ──── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Live Infrastructure Nodes</h3>
          <p className="text-sm text-slate-400 mt-0.5">Real-time sensor telemetry from edge devices</p>
        </div>
      </div>

      {/* ──── Node Cards ──── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {washrooms.map((wr: any, idx: number) => {
          return (
            <div
              key={wr.washroomId}
              className="glass-card overflow-hidden group"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Status strip */}
              <div className={`h-1 w-full ${wr.status === 'Red' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                wr.status === 'Yellow' ? 'bg-gradient-to-r from-amber-300 to-amber-400' :
                  'bg-gradient-to-r from-emerald-400 to-emerald-500'
                }`} />

              {/* Header */}
              <div className="p-5 pb-3 flex justify-between items-start">
                <div>
                  <h4 className="text-base font-black text-slate-900 font-sans tracking-wider">{wr.locationName || wr.washroomId}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">
                    <MapPin className="w-3 h-3 text-blue-500" /> 
                    {/* 👇 बदलाव 2: पहले डेटाबेस का नाम, फिर API का नाम, फिर Locating... */}
                    {wr.washroomId} • {addressMap[wr.washroomId] || "Locating..."}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${wr.status === 'Red' ? 'bg-red-50 text-red-600 border border-red-200' :
                  wr.status === 'Yellow' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                    'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}>
                  {wr.status === 'Red' ? 'Critical' : wr.status === 'Yellow' ? 'Warning' : 'Healthy'}
                </span>
              </div>

              {/* Sensor Data */}
              <div className="px-5 pb-5 space-y-3">
                <SensorBar label="Ammonia" icon={<Wind className="w-4 h-4 text-slate-400" />} value={wr.sensors.ammonia} unit="ppm" max={200} warn={wr.sensors.ammonia > 1000} />
                <SensorBar label="Water Tank" icon={<Droplets className="w-4 h-4 text-blue-400" />} value={wr.sensors.waterLevel} unit="%" max={100} warn={wr.sensors.waterLevel < 20} />
                
                {/* Emergency SOS Indicator */}
                <div className="flex justify-between items-center text-sm mt-2 mb-1">
                  <span className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-400" /> Emergency SOS
                  </span>
                  <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${wr.sensors.sosAlert ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                    {wr.sensors.sosAlert ? 'SOS Triggered' : 'No SOS'}
                  </span>
                </div>
              </div>

              {/* Edit Amenities — Nodal Officers only */}
              {!isAdmin && (
                <div className="px-5 pb-4">
                  <button
                    onClick={() => {
                      setAmenityModal(wr);
                      setAmenityData(wr.amenities || {
                        handRails: false, sanitaryPads: false, wheelchairAccess: false,
                        babyChanging: false, drinkingWater: false, mirror: false,
                        westernToilet: false, indianToilet: true
                      });
                    }}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" /> Edit Amenities
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ──── Citizen Feedback Stream Widget ──── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Citizen Feedback Stream
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">Live reports from public QR portal</p>
          </div>
        </div>
        
        {feedbackStream.length === 0 ? (
          <div className="glass-card p-8 text-center text-slate-500 text-sm font-medium">
            No feedback entries found yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedbackStream.slice(0, 6).map((fb: any) => (
              <div key={fb._id} className="glass-card p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className="font-sans text-sm font-bold text-slate-800">{washrooms.find((w: any) => w.washroomId === fb.washroomId)?.locationName || fb.washroomId}</span>
                  <div className="flex items-center gap-0.5 bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-yellow-700">{fb.rating}.0</span>
                  </div>
                </div>
                {fb.issues && fb.issues.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {fb.issues.map((issue: string, i: number) => (
                      <span key={i} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                        {issue}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No specific issues reported.</p>
                )}
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(fb.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ──── Amenities Edit Modal ──── */}
      {amenityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAmenityModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Amenities</h3>
                <p className="text-xs text-slate-400 mt-0.5">{amenityModal.locationName || amenityModal.washroomId}</p>
              </div>
              <button onClick={() => setAmenityModal(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { key: 'handRails', label: 'Hand Rails (Elderly)', icon: <Accessibility className="w-4 h-4" />, color: 'text-indigo-500' },
                { key: 'sanitaryPads', label: 'Sanitary Pads (Women)', icon: <Shield className="w-4 h-4" />, color: 'text-pink-500' },
                { key: 'wheelchairAccess', label: 'Wheelchair Access', icon: <Accessibility className="w-4 h-4" />, color: 'text-purple-500' },
                { key: 'babyChanging', label: 'Baby Changing Station', icon: <Baby className="w-4 h-4" />, color: 'text-amber-500' },
                { key: 'drinkingWater', label: 'Drinking Water', icon: <GlassWater className="w-4 h-4" />, color: 'text-cyan-500' },
                { key: 'mirror', label: 'Mirror', icon: <Star className="w-4 h-4" />, color: 'text-slate-500' },
                { key: 'westernToilet', label: 'Western Toilet', icon: <CheckCircle className="w-4 h-4" />, color: 'text-blue-500' },
                { key: 'indianToilet', label: 'Indian Toilet', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-500' },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={item.color}>{item.icon}</span>
                    <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                  </div>
                  <div
                    className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                      amenityData[item.key] ? 'bg-blue-500' : 'bg-slate-200'
                    }`}
                    onClick={() => setAmenityData(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                      amenityData[item.key] ? 'left-5' : 'left-1'
                    }`} />
                  </div>
                </label>
              ))}
            </div>
            <div className="p-5 border-t border-slate-100">
              <button
                disabled={amenitySaving}
                onClick={async () => {
                  setAmenitySaving(true);
                  try {
                    const token = localStorage.getItem('swachh_token');
                    await axios.patch(
                      `/api/washrooms/${amenityModal.washroomId}/amenities`,
                      amenityData,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setAmenityModal(null);
                  } catch (err) {
                    console.error('Failed to update amenities:', err);
                  } finally {
                    setAmenitySaving(false);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {amenitySaving ? 'Saving...' : 'Save Amenities'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ───── KPI Card ───── */
function KpiCard({ title, value, icon, color, alert }: any) {
  const styles: Record<string, { bg: string; text: string; iconBg: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', iconBg: 'bg-amber-100', border: 'border-amber-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-100', border: 'border-red-100' },
  };
  const s = styles[color] || styles.blue;

  return (
    <div className={`glass-card p-4 lg:p-5 flex flex-col justify-between ${alert ? 'ring-2 ring-red-200 ring-offset-1' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <div className={`p-2 rounded-xl ${s.iconBg} ${s.text}`}>
          <span className="w-4 h-4 block">{icon}</span>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <h3 className={`text-2xl lg:text-3xl font-black ${alert ? 'text-red-600' : 'text-slate-900'}`}>{value}</h3>
        {!alert && <ArrowUpRight className="w-4 h-4 text-emerald-500 mb-1" />}
      </div>
    </div>
  );
}

/* ───── Sensor Bar ───── */
function SensorBar({ label, icon, value, unit, max, warn }: any) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between items-center text-sm mb-1.5">
        <span className="flex items-center gap-2 text-slate-500 font-medium text-xs">{icon} {label}</span>
        <span className={`font-mono font-bold text-xs ${warn ? 'text-red-500' : 'text-slate-700'}`}>
          {value} {unit}
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${warn ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'
            }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}