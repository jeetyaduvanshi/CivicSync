import { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, OverlayViewF, OverlayView } from '@react-google-maps/api';
import { MapPin, Radio } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '16px',
};

const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // Delhi

// Static options moved outside component to prevent re-renders
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ],
};

export default function LiveMap({ washrooms }: any) {
  const [addressMap, setAddressMap] = useState<any>({});
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Reverse Geocoding - deferred to after map load
  useEffect(() => {
    if (!isLoaded) return;
    
    // Process one by one with a slight delay to avoid blocking thread
    const processGeocoding = async () => {
      for (const wr of washrooms) {
        if (wr.lat && wr.lng && !wr.locationName && !addressMap[wr.washroomId]) {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${wr.lat}&lon=${wr.lng}`);
            const data = await res.json();
            const areaName = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || 'Smart City Zone';
            setAddressMap((prev: any) => ({ ...prev, [wr.washroomId]: areaName }));
            // Small artificial delay to prevent rate limiting / thread locking
            await new Promise(r => setTimeout(r, 300));
          } catch (err) {
            console.log('Geocoding Error:', err);
          }
        }
      }
    };
    
    processGeocoding();
  }, [washrooms, isLoaded]); // also depend on isLoaded so it waits

  const getColor = (status: string) => {
    if (status === 'Red') return '#ef4444';
    if (status === 'Yellow') return '#eab308';
    return '#22c55e';
  };

  if (loadError) {
    return (
      <div className="space-y-5 animate-fade-in-up">
        <div className="glass-card p-12 text-center">
          <MapPin className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Map Failed to Load</h3>
          <p className="text-sm text-slate-500 mt-1">Please check your Google Maps API key in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">.env</code> file.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-5 animate-fade-in-up">
        <div className="glass-card p-12 text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" /> Geo-Spatial Live View
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time facility locations with status indicators
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Healthy</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Warning</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical</span>
        </div>
      </div>

      {/* Google Map */}
      <div className="glass-card overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={11}
          options={mapOptions}
          onClick={() => setSelectedNode(null)}
        >
          {washrooms.map((wr: any) => {
            if (!wr.lat || !wr.lng) return null;
            const color = getColor(wr.status);

            return (
              <OverlayViewF
                key={wr.washroomId}
                position={{ lat: wr.lat, lng: wr.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div
                  style={{ position: 'relative', width: 90, height: 90, transform: 'translate(-50%, -50%)', cursor: 'pointer' }}
                  onClick={() => setSelectedNode(wr)}
                >
                  {/* Zone ring 4 (outermost) */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, width: 90, height: 90,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${color}30 0%, ${color}10 60%, transparent 100%)`,
                    animation: 'zonePulse 3s ease-in-out infinite',
                  }} />
                  {/* Zone ring 3 */}
                  <div style={{
                    position: 'absolute', top: 10, left: 10, width: 70, height: 70,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${color}45 0%, ${color}20 60%, transparent 100%)`,
                    animation: 'zonePulse 3s ease-in-out 0.5s infinite',
                  }} />
                  {/* Zone ring 2 */}
                  <div style={{
                    position: 'absolute', top: 22, left: 22, width: 46, height: 46,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${color}60 0%, ${color}35 60%, transparent 100%)`,
                    animation: 'zonePulse 3s ease-in-out 1s infinite',
                  }} />
                  {/* Zone ring 1 (inner glow) */}
                  <div style={{
                    position: 'absolute', top: 29, left: 29, width: 32, height: 32,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${color}90 0%, ${color}50 65%, transparent 100%)`,
                    animation: 'zonePulse 3s ease-in-out 1.5s infinite',
                  }} />
                  {/* Pin marker */}
                  <div style={{
                    position: 'absolute', top: 29, left: 33,
                    width: 24, height: 32,
                    filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
                  }}>
                    <svg viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <mask id={`pin-${wr.washroomId}`}>
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z" fill="white" />
                          <circle cx="12" cy="11" r="5" fill="black" />
                        </mask>
                      </defs>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z" fill={color} mask={`url(#pin-${wr.washroomId})`} />
                    </svg>
                  </div>
                </div>
              </OverlayViewF>
            );
          })}

          {/* Info window for selected node */}
          {selectedNode && selectedNode.lat && selectedNode.lng && (
            <OverlayViewF
              position={{ lat: selectedNode.lat, lng: selectedNode.lng }}
              mapPaneName={OverlayView.FLOAT_PANE}
            >
              <div
                style={{ transform: 'translate(-50%, -180px)' }}
                className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 min-w-[180px] text-center"
              >
                <div className="font-black text-base text-slate-900 mb-0.5">{selectedNode.locationName || selectedNode.washroomId}</div>
                <div className="text-slate-500 text-xs font-semibold mb-2">
                  {selectedNode.washroomId} • {addressMap[selectedNode.washroomId] || 'Locating Area...'}
                </div>
                <div className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${selectedNode.status === 'Red' ? 'bg-red-50 text-red-600' :
                  selectedNode.status === 'Yellow' ? 'bg-amber-50 text-amber-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                  {selectedNode.status === 'Red' ? '🔴 Critical' : selectedNode.status === 'Yellow' ? '🟡 Warning' : '🟢 Healthy'}
                </div>
                <div
                  className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white border-b border-r border-slate-200 rotate-45"
                />
              </div>
            </OverlayViewF>
          )}
        </GoogleMap>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Nodes Online', value: washrooms.length, color: 'text-blue-600 bg-blue-50' },
          { label: 'Healthy', value: washrooms.filter((w: any) => w.status === 'Green').length, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Alerts Active', value: washrooms.filter((w: any) => w.status === 'Red').length, color: 'text-red-600 bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className="glass-card p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold">{stat.label}</p>
              <p className="text-xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}