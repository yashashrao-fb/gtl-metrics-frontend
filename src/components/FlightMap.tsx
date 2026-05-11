import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export interface ManualModeInfo {
  mode: 'car' | 'bike' | 'walk';
  travel_seconds: number;
  time_saved_seconds: number;
}

interface FlightMapProps {
  dockLat: number;
  dockLng: number;
  gtlLat: number;
  gtlLng: number;
  dockName?: string;
  gtlDistance?: string;
  droneTimeSeconds?: number;
  manualModes?: ManualModeInfo[];
}

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

function curvedArc(
  from: [number, number],
  to: [number, number],
  curvature = 0.25,
  steps = 120,
): [number, number][] {
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const cx = mx + (-dy / len) * len * curvature;
  const cy = my + (dx / len)  * len * curvature;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([
      (1-t)*(1-t)*from[0] + 2*(1-t)*t*cx + t*t*to[0],
      (1-t)*(1-t)*from[1] + 2*(1-t)*t*cy + t*t*to[1],
    ]);
  }
  return pts;
}

function fmt(s: number): string {
  const m = Math.round(s / 60);
  if (m >= 60) return `${Math.floor(m/60)}h ${m%60}min`;
  return `${m}min`;
}

export default function FlightMap({
  dockLat, dockLng, gtlLat, gtlLng,
  dockName = 'Dock',
  gtlDistance,
  droneTimeSeconds,
  manualModes = [],
}: FlightMapProps) {
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const mapRef      = useRef<mapboxgl.Map | null>(null);
  const initialised = useRef(false);

  useEffect(() => {
    if (!TOKEN || !wrapperRef.current || initialised.current) return;
    initialised.current = true;
    mapboxgl.accessToken = TOKEN;

    const map = new mapboxgl.Map({
      container: wrapperRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [(dockLng + gtlLng) / 2, (dockLat + gtlLat) / 2],
      zoom: 12,
      pitch: 0,
      attributionControl: false,
    });
    mapRef.current = map;

    requestAnimationFrame(() => map.resize());

    map.on('load', () => {
      map.resize();

      const from: [number, number] = [dockLng, dockLat];
      const to:   [number, number] = [gtlLng,  gtlLat];
      const arc   = curvedArc(from, to, 0.22);

      map.addSource('drone-arc', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: arc }, properties: {} },
      });

      // Outer atmospheric glow
      map.addLayer({ id: 'arc-halo', type: 'line', source: 'drone-arc',
        paint: { 'line-color': '#2C7BF2', 'line-width': 18, 'line-opacity': 0.06, 'line-blur': 12 } });

      // Inner glow
      map.addLayer({ id: 'arc-glow', type: 'line', source: 'drone-arc',
        paint: { 'line-color': '#82ECFF', 'line-width': 6, 'line-opacity': 0.18, 'line-blur': 4 } });

      // White core
      map.addLayer({ id: 'arc-core', type: 'line', source: 'drone-arc',
        paint: { 'line-color': '#ffffff', 'line-width': 1.5, 'line-opacity': 0.5, 'line-dasharray': [1, 0] } });

      // Primary cyan dashed line
      map.addLayer({ id: 'arc-dash', type: 'line', source: 'drone-arc',
        paint: { 'line-color': '#82ECFF', 'line-width': 2.5, 'line-opacity': 1, 'line-dasharray': [5, 4] } });

      map.fitBounds(
        new mapboxgl.LngLatBounds(
          [Math.min(dockLng, gtlLng), Math.min(dockLat, gtlLat)],
          [Math.max(dockLng, gtlLng), Math.max(dockLat, gtlLat)],
        ),
        { padding: { top: 90, bottom: 100, left: 90, right: 90 }, maxZoom: 15, duration: 1200 },
      );
    });

    // ── Dock marker ─────────────────────────────────────────────────────────
    // Wrapper is exactly 32×32 px (the circle) — label is absolutely positioned
    // so it doesn't shift the element's bounding-box center off the coordinate.
    const dockEl = document.createElement('div');
    dockEl.className = 'gtl-marker-dock';
    dockEl.innerHTML = `
      <div class="marker-ring-wrapper">
        <div class="marker-pulse"></div>
        <div class="marker-core dock-core">
          <svg viewBox="0 0 16 16" fill="none" width="10" height="10">
            <path d="M8 1L15 5.5V10.5L8 15L1 10.5V5.5L8 1Z" stroke="white" stroke-width="1.5"/>
          </svg>
        </div>
      </div>
      <div class="marker-label">${dockName}</div>`;
    new mapboxgl.Marker({ element: dockEl, anchor: 'center' }).setLngLat([dockLng, dockLat]).addTo(map);

    // ── GTL marker ───────────────────────────────────────────────────────────
    const gtlEl = document.createElement('div');
    gtlEl.className = 'gtl-marker-target';
    gtlEl.innerHTML = `
      <div class="marker-ring-wrapper">
        <div class="marker-pulse target-pulse"></div>
        <div class="marker-core target-core">
          <svg viewBox="0 0 16 16" fill="none" width="10" height="10">
            <circle cx="8" cy="8" r="4" fill="white"/>
            <circle cx="8" cy="8" r="6.5" stroke="white" stroke-width="1"/>
          </svg>
        </div>
      </div>
      <div class="marker-label target-label">GTL</div>`;
    new mapboxgl.Marker({ element: gtlEl, anchor: 'center' }).setLngLat([gtlLng, gtlLat]).addTo(map);

    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(wrapperRef.current!);

    return () => { ro.disconnect(); map.remove(); mapRef.current = null; initialised.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!TOKEN) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Set VITE_MAPBOX_TOKEN in .env</p>
      </div>
    );
  }

  const car  = manualModes.find(m => m.mode === 'car');
  const bike = manualModes.find(m => m.mode === 'bike');
  const walk = manualModes.find(m => (m.mode as string) === 'walk');

  return (
    <div className="relative w-full h-full">
      <div ref={wrapperRef} style={{ position: 'absolute', inset: 0, borderRadius: '1.5rem' }} />

      {/* Distance pill */}
      {gtlDistance && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl border border-[#82ECFF]/25 rounded-full shadow-[0_0_20px_rgba(130,236,255,0.15)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#82ECFF] animate-pulse shadow-[0_0_6px_#82ECFF]" />
            <span className="text-[11px] font-black text-white uppercase tracking-widest">{gtlDistance}</span>
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">drone path</span>
          </div>
        </div>
      )}

      {/* Time comparison strip */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none flex items-stretch gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-xl backdrop-blur-xl">
        {/* Drone */}
        {droneTimeSeconds != null && (
          <div className="flex flex-col items-center px-5 py-3 bg-[#82ECFF]/10 min-w-[72px]">
            <span className="text-[8px] font-black text-[#82ECFF] uppercase tracking-[0.15em] mb-1">Drone</span>
            <span className="text-[15px] font-black text-white leading-none">{fmt(droneTimeSeconds)}</span>
          </div>
        )}
        {/* Divider */}
        {droneTimeSeconds != null && (car || bike || walk) && (
          <div className="w-px bg-white/10 self-stretch" />
        )}
        {car && (
          <div className="flex flex-col items-center px-4 py-3 bg-red-500/10 min-w-[72px]">
            <span className="text-[8px] font-black text-red-400 uppercase tracking-[0.15em] mb-1">Car</span>
            <span className="text-[15px] font-black text-white leading-none">{fmt(car.travel_seconds)}</span>
            {car.time_saved_seconds > 0 && (
              <span className="text-[8px] font-black text-emerald-400 mt-0.5">−{fmt(car.time_saved_seconds)}</span>
            )}
          </div>
        )}
        {bike && (
          <div className="flex flex-col items-center px-4 py-3 bg-orange-500/10 min-w-[72px]">
            <span className="text-[8px] font-black text-orange-400 uppercase tracking-[0.15em] mb-1">Bike</span>
            <span className="text-[15px] font-black text-white leading-none">{fmt(bike.travel_seconds)}</span>
            {bike.time_saved_seconds > 0 && (
              <span className="text-[8px] font-black text-emerald-400 mt-0.5">−{fmt(bike.time_saved_seconds)}</span>
            )}
          </div>
        )}
        {walk && (
          <div className="flex flex-col items-center px-4 py-3 bg-purple-500/10 min-w-[72px]">
            <span className="text-[8px] font-black text-purple-400 uppercase tracking-[0.15em] mb-1">Walk</span>
            <span className="text-[15px] font-black text-white leading-none">{fmt(walk.travel_seconds)}</span>
            {walk.time_saved_seconds > 0 && (
              <span className="text-[8px] font-black text-emerald-400 mt-0.5">−{fmt(walk.time_saved_seconds)}</span>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-2 right-3 z-10 pointer-events-none">
        <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Powered by Mapbox</span>
      </div>
    </div>
  );
}
