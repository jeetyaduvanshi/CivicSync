import { useState, useEffect } from 'react';
import {
  Search, MapPin, Navigation, Star, Clock,
  Accessibility, Baby, GlassWater,
  Shield, Toilet, ChevronDown, ChevronUp,
  MessageSquare, ExternalLink, Loader2, X
} from 'lucide-react';

interface WashroomPublic {
  washroomId: string;
  locationName: string;
  lat?: number;
  lng?: number;
  status: string;
  amenities: Record<string, boolean>;
  lastUpdated: string;
}

const AMENITY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  handRails: { label: 'Hand Rails', icon: Accessibility, color: '#6366f1' },
  sanitaryPads: { label: 'Sanitary Pads', icon: Shield, color: '#ec4899' },
  wheelchairAccess: { label: 'Wheelchair', icon: Accessibility, color: '#8b5cf6' },
  babyChanging: { label: 'Baby Station', icon: Baby, color: '#f59e0b' },
  drinkingWater: { label: 'Drinking Water', icon: GlassWater, color: '#06b6d4' },
  mirror: { label: 'Mirror', icon: Star, color: '#64748b' },
  westernToilet: { label: 'Western Toilet', icon: Toilet, color: '#2563eb' },
  indianToilet: { label: 'Indian Toilet', icon: Toilet, color: '#16a34a' },
};

export default function WashroomFinder() {
  const [washrooms, setWashrooms] = useState<WashroomPublic[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    fetchWashrooms();
  }, []);

  const fetchWashrooms = async (q?: string) => {
    try {
      setLoading(true);
      const url = q ? `/api/public/washrooms?search=${encodeURIComponent(q)}` : '/api/public/washrooms';
      const res = await fetch(url);
      const data = await res.json();
      setWashrooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWashrooms(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const getStatusConfig = (status: string) => {
    if (status === 'Red') return { label: 'Closed / Emergency', bg: '#fef2f2', text: '#dc2626', border: '#fecaca', dot: '#ef4444' };
    if (status === 'Yellow') return { label: 'Maintenance Needed', bg: '#fffbeb', text: '#d97706', border: '#fde68a', dot: '#f59e0b' };
    return { label: 'Open & Clean', bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', dot: '#22c55e' };
  };

  const getDirectionsUrl = (w: WashroomPublic) => {
    if (w.lat && w.lng) return `https://www.google.com/maps/dir/?api=1&destination=${w.lat},${w.lng}&travelmode=walking`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(w.locationName + ' Delhi')}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%, #f0fdf4 100%)',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* ──── Hero Header ──── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)',
        padding: '32px 20px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, left: '20%', width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '6px 14px',
            marginBottom: 12, fontSize: 12, fontWeight: 600, color: '#dbeafe',
            backdropFilter: 'blur(8px)',
          }}>
            <Shield size={14} /> CivicSync • MCD Smart City Initiative
          </div>

          <h1 style={{
            fontSize: 28, fontWeight: 900, color: 'white', margin: '0 0 8px',
            letterSpacing: '-0.03em', lineHeight: 1.2,
          }}>
            🚻 Find a Washroom Near You
          </h1>
          <p style={{ fontSize: 14, color: '#93c5fd', margin: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            Search public washrooms by area name. Check amenities, live status & get directions — all before you visit.
          </p>

          {/* Search Bar */}
          <div style={{
            marginTop: 24,
            background: 'white',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 4px 4px 16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            maxWidth: 520,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by area... e.g. Palam, Ramesh Nagar, Mayapuri"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: 14,
                fontWeight: 500,
                color: '#0f172a',
                background: 'transparent',
                padding: '12px 0',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: 8,
                  padding: '6px', cursor: 'pointer', display: 'flex',
                }}
              >
                <X size={16} color="#64748b" />
              </button>
            )}
            <button style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <Search size={14} /> Search
            </button>
          </div>
        </div>
      </div>

      {/* ──── Results ──── */}
      <div style={{ maxWidth: 800, margin: '-24px auto 0', padding: '0 16px 40px', position: 'relative', zIndex: 2 }}>

        {/* Results count */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, padding: '0 4px',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
            {loading ? 'Searching...' : `${washrooms.length} washroom${washrooms.length !== 1 ? 's' : ''} found`}
            {search && <span style={{ color: '#94a3b8' }}> for "{search}"</span>}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Loader2 size={32} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 12, fontWeight: 500 }}>Finding washrooms...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Empty state */}
        {!loading && washrooms.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'white', borderRadius: 20,
            border: '1px solid #e2e8f0',
          }}>
            <MapPin size={40} color="#cbd5e1" />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#475569', marginTop: 12 }}>No washrooms found</p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Try searching with a different area name</p>
          </div>
        )}

        {/* Cards */}
        {!loading && washrooms.map((w) => {
          const sc = getStatusConfig(w.status);
          const isExpanded = expandedCard === w.washroomId;
          const availableAmenities = Object.entries(w.amenities || {}).filter(([, v]) => v === true);

          return (
            <div
              key={w.washroomId}
              style={{
                background: 'white',
                borderRadius: 20,
                border: '1px solid #e2e8f0',
                marginBottom: 12,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s',
              }}
            >
              {/* Top color strip */}
              <div style={{ height: 3, background: sc.dot }} />

              {/* Main content */}
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedCard(isExpanded ? null : w.washroomId)}
              >
                {/* Status dot */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: sc.bg, border: `1.5px solid ${sc.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: sc.dot,
                    boxShadow: `0 0 8px ${sc.dot}40`,
                  }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0,
                    letterSpacing: '-0.01em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {w.locationName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: sc.text,
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      padding: '2px 8px', borderRadius: 6,
                    }}>
                      {sc.label}
                    </span>
                    {availableAmenities.length > 0 && (
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                        {availableAmenities.length} amenities
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons + expand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <a
                    href={getDirectionsUrl(w)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
                      padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 700, color: '#2563eb',
                      textDecoration: 'none', cursor: 'pointer',
                    }}
                  >
                    <Navigation size={12} /> Directions
                  </a>
                  {isExpanded
                    ? <ChevronUp size={18} color="#94a3b8" />
                    : <ChevronDown size={18} color="#94a3b8" />
                  }
                </div>
              </div>

              {/* Expanded — Amenities + details */}
              {isExpanded && (
                <div style={{
                  padding: '0 20px 20px',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: 16,
                }}>
                  {/* Amenities Grid */}
                  <p style={{
                    fontSize: 10, fontWeight: 800, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px',
                  }}>
                    Available Amenities
                  </p>

                  {availableAmenities.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                      gap: 8,
                    }}>
                      {availableAmenities.map(([key]) => {
                        const config = AMENITY_CONFIG[key];
                        if (!config) return null;
                        const Icon = config.icon;
                        return (
                          <div
                            key={key}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              background: '#f8fafc', borderRadius: 10,
                              padding: '10px 12px', border: '1px solid #e2e8f0',
                            }}
                          >
                            <div style={{
                              width: 28, height: 28, borderRadius: 8,
                              background: `${config.color}15`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <Icon size={14} color={config.color} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>
                              {config.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                      No amenity information available yet.
                    </p>
                  )}

                  {/* Not available amenities */}
                  {Object.entries(w.amenities || {}).filter(([, v]) => !v).length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{
                        fontSize: 10, fontWeight: 800, color: '#cbd5e1',
                        textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px',
                      }}>
                        Not Available
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {Object.entries(w.amenities || {}).filter(([, v]) => !v).map(([key]) => {
                          const config = AMENITY_CONFIG[key];
                          if (!config) return null;
                          return (
                            <span key={key} style={{
                              fontSize: 10, fontWeight: 600, color: '#cbd5e1',
                              background: '#f8fafc', border: '1px solid #e2e8f0',
                              padding: '4px 10px', borderRadius: 6,
                              textDecoration: 'line-through',
                            }}>
                              {config.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick links */}
                  <div style={{
                    display: 'flex', gap: 8, marginTop: 16,
                    flexWrap: 'wrap',
                  }}>
                    <a
                      href={`/feedback/${w.washroomId}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                        padding: '8px 14px', fontSize: 11, fontWeight: 700, color: '#16a34a',
                        textDecoration: 'none',
                      }}
                    >
                      <MessageSquare size={12} /> Give Feedback
                    </a>
                    <a
                      href={getDirectionsUrl(w)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10,
                        padding: '8px 14px', fontSize: 11, fontWeight: 700, color: '#2563eb',
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={12} /> Open in Google Maps
                    </a>
                  </div>

                  {/* Last updated */}
                  {w.lastUpdated && (
                    <p style={{ fontSize: 10, color: '#cbd5e1', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                      <Clock size={10} /> Last updated: {new Date(w.lastUpdated).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Footer */}
        <p style={{
          fontSize: 11, color: '#94a3b8', textAlign: 'center',
          marginTop: 24, fontWeight: 500,
        }}>
          CivicSync • Municipal Corporation of Delhi 🇮🇳
        </p>
      </div>
    </div>
  );
}
