import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  AlertTriangle, CheckSquare, Wrench,
  UserCheck, MapPin, QrCode, X, Printer, Loader2,
  ClipboardList, Bell, CheckCircle2, Clock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

/* ——— Types ——— */
interface TaskType {
  _id: string;
  washroomId: string;
  locationName: string;
  issue: string;
  severity: 'Red' | 'Yellow';
  status: 'open' | 'in_progress' | 'resolved';
  assignedTo: string | null;
  assignedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

/* ────────── QR Print Modal ────────── */
function QrModal({ washroomId, locationName, onClose }: { washroomId: string; locationName?: string; onClose: () => void }) {
  const displayId = locationName || washroomId;
  const cleanerUrl = `${window.location.origin}/qr/${washroomId}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${displayId}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@600;900&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            .card { text-align: center; padding: 40px; border: 3px dashed #cbd5e1; border-radius: 20px; }
            .title { font-size: 24px; font-weight: 900; margin-bottom: 4px; }
            .subtitle { font-size: 13px; color: #64748b; font-weight: 600; margin-bottom: 24px; }
            .qr-wrap { display: inline-block; padding: 16px; background: white; border-radius: 12px; border: 2px solid #e2e8f0; }
            .wid { margin-top: 20px; font-size: 24px; font-weight: 900; }
            .instruction { margin-top: 12px; font-size: 12px; color: #94a3b8; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">CivicSync</div>
            <div class="subtitle">Scan to mark washroom as cleaned</div>
            <div class="qr-wrap">
              <img src="${`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cleanerUrl)}`}" width="200" height="200" />
            </div>
            <div class="wid">${displayId}</div>
            <div class="instruction">Scan this QR code with your phone camera</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '24px', padding: '32px',
          width: '100%', maxWidth: '360px', textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={onClose}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '6px', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={18} />
          </button>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
          QR Code
        </h3>
        <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '20px' }}>
          Print & attach to washroom entrance
        </p>

        <div
          style={{
            display: 'inline-block', padding: '20px', background: '#f8fafc',
            borderRadius: '16px', border: '2px solid #e2e8f0',
          }}
        >
          <QRCodeSVG
            value={cleanerUrl}
            size={180}
            level="H"
            includeMargin={false}
            style={{ display: 'block' }}
          />
        </div>

        <p style={{ marginTop: '16px', fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>
          {displayId}
        </p>
        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', wordBreak: 'break-all', fontWeight: 500 }}>
          {cleanerUrl}
        </p>

        <button
          onClick={handlePrint}
          style={{
            marginTop: '20px', width: '100%', padding: '14px',
            fontSize: '14px', fontWeight: 700, color: 'white',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            border: 'none', borderRadius: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
          }}
        >
          <Printer size={16} /> Print QR Code
        </button>
      </div>
    </div>
  );
}

/* ────────── Helper: relative time ────────── */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ────────── Issue Tracker (Nodal Officer View) ────────── */
export default function Dispatch({ washrooms }: any) {
  const [qrModal, setQrModal] = useState<{ id: string; name?: string } | null>(null);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const token = localStorage.getItem('swachh_token');
      const res = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // Derive active issues INSTANTLY from real-time live washroom telemetry
  const activeIssues = washrooms
    .filter((w: any) => w.status === 'Yellow' || w.status === 'Red')
    .map((w: any) => {
      // Find matching active task to see if worker is assigned
      const activeTask = tasks.find(
        (t) => t.washroomId === w.washroomId && (t.status === 'open' || t.status === 'in_progress')
      );

      // Determine the precise issue dynamically if not present
      let issueStr = activeTask ? activeTask.issue : 'Needs Inspection';
      if (!activeTask) {
        if (w.sensors?.sosAlert) issueStr = 'SOS Alert';
        else if (w.sensors?.ammonia > 1000) issueStr = 'High Ammonia/Odor';
        else if (w.sensors?.waterLevel < 20) issueStr = 'Low Water';
      }

      return {
        _id: activeTask ? activeTask._id : `virtual-${w.washroomId}`,
        washroomId: w.washroomId,
        locationName: w.locationName || w.washroomId,
        issue: issueStr,
        severity: w.status,
        status: activeTask ? activeTask.status : 'open',
        assignedTo: activeTask ? activeTask.assignedTo : null,
        createdAt: activeTask ? activeTask.createdAt : w.lastUpdated || new Date().toISOString(),
      };
    });

  // Resolved in last 48 hours
  // Show all resolved tasks from last 48h — use resolvedAt if available, createdAt as fallback
  const resolvedTasks = tasks.filter((t: TaskType) => {
    if (t.status !== 'resolved') return false;
    const resolvedTime = t.resolvedAt ? new Date(t.resolvedAt).getTime()
      : t.createdAt ? new Date(t.createdAt).getTime() : Date.now();
    return Date.now() - resolvedTime < 48 * 60 * 60 * 1000;
  });

  const criticalCount = activeIssues.filter((t: TaskType) => t.severity === 'Red').length;

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in-up">

      {/* QR Modal */}
      {qrModal && <QrModal washroomId={qrModal.id} locationName={qrModal.name} onClose={() => setQrModal(null)} />}

      {/* ──── Header ──── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" /> Issue Tracker
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time issues for your assigned washrooms — workers are auto-notified
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {criticalCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200/60 px-3 py-1.5 rounded-full animate-pulse">
              <AlertTriangle className="w-3 h-3" /> {criticalCount} Critical
            </span>
          )}
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/60">
            {activeIssues.length} active issue{activeIssues.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-full">
            <Bell className="w-3 h-3" /> Workers auto-notified
          </span>
        </div>
      </div>

      {/* ──── Alert Banner ──── */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200/60 text-sm text-blue-800">
        <Bell className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
        <p>
          <strong>Automatic Alerts:</strong> Workers are notified instantly via Telegram when a new issue is detected.
          They will scan the QR code outside the washroom to submit their resolution.
        </p>
      </div>

      {/* ──── Loading indicator ──── */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}

      {/* ──── Two Column Layout ──── */}
      {!loading && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* ── Active Issues ── */}
          <div className="glass-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-lg bg-red-50 text-red-600"><AlertTriangle className="w-4 h-4" /></div>
                Active Issues
              </h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                activeIssues.length > 0
                  ? 'bg-red-100 text-red-700 border-red-200/60'
                  : 'bg-slate-100 text-slate-500 border-slate-200/60'
              }`}>
                {activeIssues.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {activeIssues.length > 0 ? (
                activeIssues.map((task: TaskType) => (
                  <div
                    key={task._id}
                    className={`p-4 rounded-xl border transition-all hover:shadow-md ${
                      task.severity === 'Red'
                        ? 'bg-red-50/60 border-red-200 hover:border-red-300'
                        : 'bg-amber-50/40 border-amber-200/60 hover:border-amber-300'
                    }`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-black text-slate-900 text-sm leading-tight">
                        {task.locationName || task.washroomId}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setQrModal({ id: task.washroomId, name: task.locationName })}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Show QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.severity === 'Red'
                            ? 'bg-red-100 text-red-600 border border-red-200'
                            : 'bg-amber-100 text-amber-600 border border-amber-200'
                        }`}>
                          {task.severity === 'Red' ? 'CRITICAL' : 'WARNING'}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {task.locationName}
                    </p>

                    {/* Issue */}
                    <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Wrench className="w-3 h-3 text-slate-400" />
                      {task.issue}
                    </p>

                    {/* Status */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1.5">
                        {task.status === 'in_progress' ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            <Clock className="w-2.5 h-2.5" /> Worker En Route
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Bell className="w-2.5 h-2.5 animate-pulse" /> Alert Sent
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{timeAgo(task.createdAt)}</span>
                    </div>

                    {/* Worker name (if assigned via QR) */}
                    {task.assignedTo && (
                      <p className="text-[10px] text-blue-600 mt-2 flex items-center gap-1 font-semibold">
                        <UserCheck className="w-3 h-3" /> {task.assignedTo} is handling this
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center text-center py-12">
                  <div>
                    <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-semibold">All Clear!</p>
                    <p className="text-slate-300 text-xs mt-1">No active issues for your washrooms</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Resolved ── */}
          <div className="glass-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><CheckSquare className="w-4 h-4" /></div>
                Resolved (48h)
              </h3>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                {resolvedTasks.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {resolvedTasks.length > 0 ? (
                resolvedTasks.map((task) => (
                  <div key={task._id} className="p-4 rounded-xl bg-emerald-50/30 border border-emerald-100/60 hover:bg-emerald-50/50 transition-colors">
                    {/* Top */}
                    <div className="flex items-start justify-between mb-1 gap-2">
                      <span className="font-bold text-slate-900 text-sm leading-tight">{task.locationName || task.washroomId}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold shrink-0">
                        {task.resolvedAt ? timeAgo(task.resolvedAt) : ''}
                      </span>
                    </div>

                    {/* Issue */}
                    <p className="text-xs text-slate-600 font-medium mb-2 flex items-center gap-1.5">
                      <Wrench className="w-3 h-3 text-slate-400" />
                      {task.issue}
                    </p>

                    {/* Worker who resolved */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {task.assignedTo ? (
                        <p className="text-xs font-bold text-emerald-700">
                          Resolved by <span className="text-emerald-900">{task.assignedTo}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium">Resolved via QR scan</p>
                      )}
                    </div>

                    {/* Severity badge */}
                    <div className="mt-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        task.severity === 'Red'
                          ? 'bg-red-50 text-red-500 border-red-200/60'
                          : 'bg-amber-50 text-amber-500 border-amber-200/60'
                      }`}>
                        Was {task.severity === 'Red' ? 'CRITICAL' : 'WARNING'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center text-center py-12">
                  <div>
                    <CheckSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-semibold">No resolved tasks</p>
                    <p className="text-slate-300 text-xs mt-1">Resolved issues will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ──── QR Codes Section ──── */}
      {washrooms.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600"><QrCode className="w-4 h-4" /></div>
                Washroom QR Codes
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 ml-9">
                Workers scan these to submit their task resolution
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:block">Click any QR to print</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {washrooms.map((wr: any) => {
              // Determine issue string for badge
              let issueBadge = '';
              if (wr.status !== 'Green') {
                if (wr.sensors?.sosAlert) issueBadge = 'SOS Alert';
                else if (wr.sensors?.ammonia > 1000) issueBadge = 'High Ammonia';
                else if (wr.sensors?.waterLevel < 20) issueBadge = 'Low Water';
                else issueBadge = 'Needs Inspection';
              }

              return (
                <button
                  key={`qr-${wr.washroomId}`}
                  onClick={() => setQrModal({ id: wr.washroomId, name: wr.locationName })}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200/60 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group"
                >
                  <div className="p-2 bg-white rounded-lg border border-slate-100 group-hover:border-blue-200 transition-colors">
                    <QRCodeSVG
                      value={`${window.location.origin}/cleaner/${wr.washroomId}`}
                      size={64}
                      level="M"
                    />
                  </div>
                  <div className="flex flex-col items-center w-full px-1">
                    <span className="font-bold text-xs text-slate-700 group-hover:text-blue-700 transition-colors text-center w-full truncate" title={wr.locationName || wr.washroomId}>
                      {wr.locationName || wr.washroomId}
                    </span>
                    {issueBadge && (
                      <span className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate w-full text-center">
                        {issueBadge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                    wr.status === 'Green'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                      : wr.status === 'Red'
                        ? 'bg-red-50 text-red-600 border border-red-200/60'
                        : 'bg-amber-50 text-amber-600 border border-amber-200/60'
                  }`}>
                    {wr.status.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}