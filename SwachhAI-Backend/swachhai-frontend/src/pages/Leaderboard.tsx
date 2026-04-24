import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Trophy, Star, TrendingUp, TrendingDown, AlertTriangle, UserCheck,
  FileText, RefreshCw, Medal, ChevronDown, ChevronUp, Send,
  CheckCircle2, XCircle, MessageSquare, BarChart3, X, Stamp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LeaderboardEntry {
  rank: number;
  washroomId: string;
  locationName: string;
  avgRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
  topIssues: { issue: string; count: number }[];
  lastFeedback: string;
  nodalOfficer: { id: string; name: string; email: string } | null;
  status: string;
}

/* ────────── Notice Preview Modal ────────── */
function NoticeModal({
  entry,
  onClose,
  onSend,
  sending
}: {
  entry: LeaderboardEntry;
  onClose: () => void;
  onSend: () => void;
  sending: boolean;
}) {
  const issueList = entry.topIssues.map(i => `${i.issue} (${i.count} complaints)`).join(', ');

  const draftSummary =
    `MCD HQ has reviewed the public feedback for ${entry.locationName} ` +
    `and found the average citizen rating to be ${entry.avgRating}/5.0 across ${entry.totalReviews} reviews.\n\n` +
    (issueList ? `Top reported issues: ${issueList}.\n\n` : '') +
    `This notice requires your immediate attention. Please report to MCD office within 48 hours ` +
    `with a written explanation and corrective action plan for the above washroom under your supervision.\n\n` +
    `— Municipal Corporation of Delhi (MCD), CivicSync Operations`;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stamp className="w-5 h-5 text-red-200" />
              <h3 className="font-black text-lg">Official Performance Notice</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-red-100 text-sm mt-1">Preview the notice before sending</p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* To / About */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To</p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {entry.nodalOfficer?.name || 'Unassigned'}
              </p>
              <p className="text-[11px] text-slate-400">{entry.nodalOfficer?.email || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Washroom</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{entry.locationName}</p>
              <p className="text-[11px] text-slate-400">Rating: ⭐ {entry.avgRating}/5</p>
            </div>
          </div>

          {/* Subject */}
          <div className="bg-red-50 rounded-xl p-3 border border-red-100">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Subject</p>
            <p className="text-sm font-bold text-red-800 mt-1">
              ⚠️ Performance Notice — {entry.locationName}
            </p>
          </div>

          {/* Drafted Summary */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Notice Body (Auto-Drafted)</p>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
              {draftSummary}
            </div>
          </div>

          {/* Issues breakdown */}
          {entry.topIssues.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Attached: Issue Breakdown</p>
              <div className="space-y-1.5">
                {entry.topIssues.map((iss, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <XCircle className="w-3 h-3 text-red-400" />
                      {iss.issue}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{iss.count} reports</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What happens next */}
          <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-3">
            <p className="text-xs font-bold text-blue-800">📩 What happens when you send:</p>
            <ul className="text-[11px] text-blue-700/80 mt-1.5 space-y-1 list-disc list-inside">
              <li>This notice will appear on the officer's CivicSync dashboard</li>
              <li>A Telegram alert will be sent immediately</li>
              <li>The officer must report to MCD office within 48 hours</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-md shadow-red-500/20 disabled:opacity-50"
          >
            {sending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? 'Sending...' : 'Send Official Notice'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────── Main Leaderboard ────────── */
export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [noticeSending, setNoticeSending] = useState(false);
  const [noticeSent, setNoticeSent] = useState<Set<string>>(new Set());
  const [noticeModalEntry, setNoticeModalEntry] = useState<LeaderboardEntry | null>(null);
  const { logout } = useAuth();

  const fetchLeaderboard = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await axios.get('/api/leaderboard');
      setData(res.data);
    } catch (error: any) {
      if (error.response?.status === 401) logout();
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleSendNotice = async (entry: LeaderboardEntry) => {
    if (!entry.nodalOfficer) return;
    setNoticeSending(true);
    try {
      await axios.post('/api/notices', {
        targetOfficerId: entry.nodalOfficer.id,
        targetOfficerName: entry.nodalOfficer.name,
        washroomId: entry.washroomId,
        locationName: entry.locationName,
        avgRating: entry.avgRating,
        totalReviews: entry.totalReviews,
        topIssues: entry.topIssues
      });
      setNoticeSent(prev => new Set(prev).add(entry.washroomId));
      setNoticeModalEntry(null);
    } catch (err) {
      console.error('Failed to send notice:', err);
    } finally {
      setNoticeSending(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (rating >= 3) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-amber-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
    return <span className="text-sm font-bold text-slate-400">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-amber-50 to-amber-100/40 border-amber-200/60';
    if (rank === 2) return 'bg-gradient-to-r from-slate-50 to-slate-100/40 border-slate-200/60';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-orange-100/30 border-orange-200/60';
    return 'bg-white border-slate-200/60';
  };

  const StarBar = ({ rating }: { rating: number }) => {
    const full = Math.floor(rating);
    const partial = rating - full;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`w-4 h-4 ${i <= full ? 'text-amber-400 fill-amber-400'
              : i === full + 1 && partial > 0 ? 'text-amber-400 fill-amber-200'
                : 'text-slate-200'
              }`}
          />
        ))}
      </div>
    );
  };

  const DistributionBar = ({ distribution, total }: { distribution: Record<number, number>; total: number }) => (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map(star => {
        const count = distribution[star] || 0;
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold w-4 text-right">{star}</span>
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${star >= 4 ? 'bg-emerald-400' : star === 3 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-slate-400 font-medium w-6 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 mx-auto mb-4">
            <Trophy className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading Leaderboard...</p>
        </div>
      </div>
    );
  }

  const avgOverall = data.length > 0
    ? Math.round((data.reduce((sum, d) => sum + d.avgRating, 0) / data.length) * 10) / 10
    : 0;
  const totalReviews = data.reduce((sum, d) => sum + d.totalReviews, 0);
  const poorPerformers = data.filter(d => d.avgRating < 3).length;

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Notice Modal */}
      {noticeModalEntry && (
        <NoticeModal
          entry={noticeModalEntry}
          onClose={() => setNoticeModalEntry(null)}
          onSend={() => handleSendNotice(noticeModalEntry)}
          sending={noticeSending}
        />
      )}

      {/* ──── Header Banner ──── */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-amber-200" />
              <p className="text-amber-100 text-sm font-medium">Performance Leaderboard</p>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
              Washroom Rankings 🏆
            </h1>
            <p className="text-amber-100/80 mt-2 text-sm max-w-lg">
              Ranked by public feedback. Send official notices to underperforming officers.
            </p>
          </div>
          <button
            onClick={fetchLeaderboard}
            disabled={refreshing}
            className="self-start sm:self-auto flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ──── Summary Cards ──── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 lg:p-5">
          <div className="flex justify-between items-start mb-3">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Avg Rating</p>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600"><Star className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl lg:text-3xl font-black text-slate-900">{avgOverall}⭐</h3>
        </div>
        <div className="glass-card p-4 lg:p-5">
          <div className="flex justify-between items-start mb-3">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Reviews</p>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600"><MessageSquare className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl lg:text-3xl font-black text-slate-900">{totalReviews}</h3>
        </div>
        <div className="glass-card p-4 lg:p-5">
          <div className="flex justify-between items-start mb-3">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Locations</p>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600"><BarChart3 className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl lg:text-3xl font-black text-slate-900">{data.length}</h3>
        </div>
        <div className="glass-card p-4 lg:p-5">
          <div className="flex justify-between items-start mb-3">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Underperforming</p>
            <div className="p-2 rounded-xl bg-red-100 text-red-600"><AlertTriangle className="w-4 h-4" /></div>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900">{poorPerformers}</h3>
            {poorPerformers > 0 && <TrendingDown className="w-4 h-4 text-red-500 mb-1" />}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">rating &lt; 3.0</p>
        </div>
      </div>

      {/* ──── Leaderboard Table ──── */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Washroom Rankings
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Sorted by average user rating (highest first)
            </p>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold">No feedback data yet</p>
            <p className="text-xs mt-1">Rankings will appear once public feedback is submitted</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.map((entry) => {
              const ratingStyle = getRatingColor(entry.avgRating);
              const isExpanded = expandedRow === entry.washroomId;
              const isNoticeSent = noticeSent.has(entry.washroomId);

              return (
                <div key={entry.washroomId}>
                  {/* Main Row */}
                  <div
                    className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors ${getRankBg(entry.rank)}`}
                    onClick={() => setExpandedRow(isExpanded ? null : entry.washroomId)}
                  >
                    {/* Rank */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/60 border border-slate-200/60 shadow-sm">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* Location */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{entry.locationName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {entry.nodalOfficer ? (
                          <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> {entry.nodalOfficer.name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">No officer assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2 justify-end">
                        <StarBar rating={entry.avgRating} />
                        <span className={`text-lg font-black ${ratingStyle.text}`}>{entry.avgRating}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {entry.totalReviews} review{entry.totalReviews !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Send Notice / Top Performer badge */}
                    <div className="shrink-0 hidden sm:block">
                      {entry.nodalOfficer && !isNoticeSent ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setNoticeModalEntry(entry); }}
                          className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors border ${
                            entry.avgRating < 3
                              ? 'text-red-600 bg-red-50 hover:bg-red-100 border-red-200/60'
                              : 'text-slate-500 bg-slate-50 hover:bg-slate-100 border-slate-200/60'
                          }`}
                        >
                          <Stamp className="w-3 h-3" />
                          Send Notice
                        </button>
                      ) : isNoticeSent ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Notice Sent
                        </span>
                      ) : entry.avgRating >= 4 ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-full">
                          <TrendingUp className="w-3 h-3" /> Top Performer
                        </span>
                      ) : null}
                    </div>

                    {/* Expand icon */}
                    <div className="shrink-0 text-slate-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 py-4 bg-slate-50/50 border-t border-slate-100 animate-fade-in-up">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

                        {/* Rating Distribution */}
                        <div>
                          <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Rating Breakdown</h5>
                          <DistributionBar distribution={entry.distribution} total={entry.totalReviews} />
                        </div>

                        {/* Top Complaints */}
                        <div>
                          <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Top Issues</h5>
                          {entry.topIssues.length > 0 ? (
                            <div className="space-y-2">
                              {entry.topIssues.map((iss, i) => (
                                <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-100">
                                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                    <XCircle className="w-3 h-3 text-red-400" />
                                    {iss.issue}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400">{iss.count}x</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">No specific issues reported</p>
                          )}
                        </div>

                        {/* Nodal Officer + Notice Action */}
                        <div>
                          <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Assigned Officer</h5>
                          {entry.nodalOfficer ? (
                            <div className="bg-white rounded-xl border border-slate-100 p-4">
                              <p className="font-bold text-slate-900 text-sm">{entry.nodalOfficer.name}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{entry.nodalOfficer.email}</p>

                              {/* Send Notice button (also for mobile) */}
                              <div className="mt-3">
                                {isNoticeSent ? (
                                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Notice Delivered ✓
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setNoticeModalEntry(entry)}
                                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-4 py-2.5 rounded-xl transition-colors shadow-md shadow-red-500/20"
                                  >
                                    <Stamp className="w-3.5 h-3.5" />
                                    Send Official Notice
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-amber-50 rounded-xl border border-amber-200/60 p-4">
                              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                No officer assigned
                              </p>
                              <p className="text-[11px] text-amber-600/70 mt-1">
                                Assign a Nodal Officer from Manage Users
                              </p>
                            </div>
                          )}

                          {entry.lastFeedback && (
                            <p className="text-[10px] text-slate-400 mt-3 font-medium">
                              Last feedback: {new Date(entry.lastFeedback).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
