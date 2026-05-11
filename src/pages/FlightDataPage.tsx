import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Check, Search, Calendar, MapPin, Gauge, Car, Bike, PersonStanding as Run, Rocket, MessageSquare, Navigation, Copy, CheckCheck } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { formatTime, formatTimeWithSeconds, formatDate } from "../lib/timezone";
import { useGtlHttp } from "../lib/useGtlHttp";
import FlightMap from "../components/FlightMap";

const DroneIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 8L12 16" />
    <path d="M8 12L16 12" />
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="18" cy="18" r="2" />
    <circle cx="6" cy="18" r="2" />
    <path d="M7.5 7.5L10 10" />
    <path d="M16.5 7.5L14 10" />
    <path d="M16.5 16.5L14 14" />
    <path d="M7.5 16.5L10 14" />
    <rect x="10" y="10" width="4" height="4" rx="1" />
  </svg>
);

interface DroneListItem {
  drone_id: string;
  drone_name: string;
  dock_name: string;
  total_minutes_saved: number;
  total_flights: number;
}

interface FlightListItem {
  id: string;           // Supabase UUID — used for routing only
  flight_id: string;    // FlytBase flight UUID — shown to user
  date: string;
  time: string;
  distance_km: string;
  duration_min: string;
  trigger_type: "alarm" | "manual";
  drone_name: string;
  dock_name: string;
  status: string;
}

interface ManualMode {
  mode: "car" | "bike" | "run";
  takeoff: string;
  reachGtl: string;
  eta: string;
  saved: string;
}

interface FlightDetailUI {
  id: string;
  date: string;
  time: string;
  triggerType: "alarm" | "manual";
  droneName: string;
  dockName: string;
  distance: string;
  gtlDistance: string;
  duration: string;
  maxAltitude: string;
  maxSpeed: string;
  takeoffTime: string;
  landingTime: string;
  avgSaved: string;
  note: string | null;
  manualModes: ManualMode[];
  droneTimeSeconds: number | null;   // raw seconds for map
  mapModes: { mode: 'car' | 'bike' | 'walk'; travel_seconds: number; time_saved_seconds: number }[];
  dockLat: number | null;
  dockLng: number | null;
  gtlLat: number | null;
  gtlLng: number | null;
}

function transformDetail(d: any, tz: import('../context/SettingsContext').TimezoneOption): FlightDetailUI {
  const takeoffIso = d.takeoff_time_iso ?? null;
  const landingIso = d.landing_time_iso ?? null;

  const manualModes: ManualMode[] = (d.manual_modes ?? []).map((m: any) => ({
    mode: m.mode === "walk" ? "run" : m.mode,
    takeoff: takeoffIso ? formatTime(takeoffIso, tz) : (d.takeoff_time?.substring(0, 5) ?? "—"),
    reachGtl: m.eta_iso ? formatTime(m.eta_iso, tz) : (m.eta_time ?? "—"),
    eta: m.travel_seconds ? `${Math.floor(m.travel_seconds / 60)}min` : "—",
    saved: m.time_saved_seconds ? `${Math.floor(m.time_saved_seconds / 60)}min` : "—",
  }));

  const mapModes = (d.manual_modes ?? []).map((m: any) => ({
    mode: (m.mode === "walk" ? "walk" : m.mode) as 'car' | 'bike' | 'walk',
    travel_seconds: m.travel_seconds ?? 0,
    time_saved_seconds: m.time_saved_seconds ?? 0,
  }));

  return {
    id: d.flight_id ?? d.id,
    date: takeoffIso ? formatDate(takeoffIso, tz) : (d.date ?? "—"),
    time: takeoffIso ? formatTime(takeoffIso, tz) : (d.takeoff_time?.substring(0, 5) ?? "—"),
    triggerType: d.trigger_type,
    droneName: d.drone_name ?? d.drone_id ?? "—",
    dockName: d.dock_name ?? "—",
    distance: d.flight_distance_m ? `${(d.flight_distance_m / 1000).toFixed(1)} km` : "—",
    gtlDistance: d.gtl_distance_m ? `${(d.gtl_distance_m / 1000).toFixed(2)} km` : "—",
    duration: d.drone_time_seconds ? formatDuration(d.drone_time_seconds) : "—",
    maxAltitude: d.max_altitude_m != null ? `${d.max_altitude_m}m` : "—",
    maxSpeed: d.max_speed_kmh != null ? `${d.max_speed_kmh} km/h` : "—",
    takeoffTime: takeoffIso ? formatTimeWithSeconds(takeoffIso, tz) : (d.takeoff_time ?? "—"),
    landingTime: landingIso ? formatTimeWithSeconds(landingIso, tz) : (d.landing_time ?? "—"),
    avgSaved: d.avg_saved_minutes != null ? String(d.avg_saved_minutes) : "—",
    note: d.note ?? null,
    manualModes,
    mapModes,
    droneTimeSeconds: d.drone_time_seconds ?? null,
    dockLat: d.dock_lat ?? null,
    dockLng: d.dock_lng ?? null,
    gtlLat: d.gtl_lat ?? null,
    gtlLng: d.gtl_lng ?? null,
  };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}min`;
  return `${m}min ${s}s`;
}

function FlightIdRow({ flightId }: { flightId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(flightId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-2 mt-1">
      <p className="text-sm font-mono text-zinc-500 tracking-tight">{flightId}</p>
      <button
        onClick={copy}
        className="p-1 rounded text-zinc-600 hover:text-emerald-400 transition-colors"
        title="Copy Flight ID"
      >
        {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export default function FlightDataPage() {
  const { activeSettings } = useSettings();
  const http = useGtlHttp();

  const [phase, setPhase] = useState<"selection" | "list" | "detail">("selection");
  const [selectedFlightDetail, setSelectedFlightDetail] = useState<FlightDetailUI | null>(null);
  const [selectedDrones, setSelectedDrones] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Drone list
  const [drones, setDrones] = useState<DroneListItem[]>([]);
  const [dronesLoading, setDronesLoading] = useState(true);

  // Flight list
  const [flights, setFlights] = useState<FlightListItem[]>([]);
  const [flightsTotal, setFlightsTotal] = useState(0);
  const [flightsLoading, setFlightsLoading] = useState(false);

  // Pagination
  const [dronePage, setDronePage] = useState(1);
  const [flightPage, setFlightPage] = useState(1);
  const DRONE_ITEMS_PER_PAGE = 6;
  const FLIGHT_ITEMS_PER_PAGE = 9;

  // ── Load drones ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setDronesLoading(true);
    http.get(`/drones`)
      .then((res: any) => setDrones(res.data?.drones ?? []))
      .catch((err: any) => console.error("[FlightDataPage drones]", err))
      .finally(() => setDronesLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load flights when entering list phase ────────────────────────────────────
  const loadFlights = useCallback((page: number) => {
    if (selectedDrones.length === 0) return;
    setFlightsLoading(true);
    const offset = (page - 1) * FLIGHT_ITEMS_PER_PAGE;
    const droneIds = selectedDrones.join(",");
    http.get(`/flights?drone_ids=${droneIds}&limit=${FLIGHT_ITEMS_PER_PAGE}&offset=${offset}`)
      .then((res: any) => {
        setFlights(res.data?.flights ?? []);
        setFlightsTotal(res.data?.total ?? 0);
      })
      .catch((err: any) => console.error("[FlightDataPage flights]", err))
      .finally(() => setFlightsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDrones]);

  useEffect(() => {
    if (phase === "list") {
      loadFlights(flightPage);
    }
  }, [phase, flightPage, loadFlights]);

  // ── Select flight detail ─────────────────────────────────────────────────────
  const openDetail = async (flightId: string) => {
    setLoadingDetail(true);
    setPhase("detail");
    try {
      const res: any = await http.get(`/flights/${flightId}`);
      setSelectedFlightDetail(transformDetail(res.data, activeSettings.timezone ?? 'uk'));
    } catch (err) {
      console.error("[FlightDataPage detail]", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleDrone = (id: string) => {
    setSelectedDrones(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedDrones.length === drones.length) {
      setSelectedDrones([]);
    } else {
      setSelectedDrones(drones.map(d => d.drone_id));
    }
  };

  const filteredDrones = drones.filter(d =>
    d.drone_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.dock_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalFlightPages = Math.max(1, Math.ceil(flightsTotal / FLIGHT_ITEMS_PER_PAGE));

  return (
    <div className="w-full max-w-7xl mx-auto px-10 py-10">
      <AnimatePresence mode="wait">
        {phase === "selection" ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-8"
          >
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black tracking-tighter text-on-surface uppercase">Select Drones</h2>
                <p className="text-zinc-500 font-label text-xs tracking-widest mt-2 uppercase">CHOOSE DRONE FOR ANALYSIS</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search drones..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-surface-container-low border border-white/5 rounded-full pl-10 pr-6 py-2.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all w-64"
                  />
                </div>
                <button
                  onClick={toggleAll}
                  className="px-6 py-2.5 bg-surface-container-high border border-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-highest transition-all"
                >
                  {selectedDrones.length === drones.length && drones.length > 0 ? "Deselect All" : "Select All"}
                </button>
              </div>
            </div>

            {dronesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-40 rounded-2xl border border-white/5 bg-primary/5 animate-pulse" />
                ))}
              </div>
            ) : filteredDrones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
                <DroneIcon className="w-16 h-16 text-zinc-500" />
                <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold">No drones found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDrones.slice((dronePage - 1) * DRONE_ITEMS_PER_PAGE, dronePage * DRONE_ITEMS_PER_PAGE).map((drone) => (
                  <div
                    key={drone.drone_id}
                    onClick={() => toggleDrone(drone.drone_id)}
                    className={`relative group cursor-pointer p-6 rounded-2xl border transition-all duration-300 ${
                      selectedDrones.includes(drone.drone_id)
                        ? "bg-primary/5 border-secondary shadow-[0_0_20px_rgba(250,133,0,0.1)]"
                        : "bg-primary/5 border-white/5 hover:border-secondary/30"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20 shadow-inner">
                        <DroneIcon className="w-7 h-7" />
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        selectedDrones.includes(drone.drone_id)
                          ? "bg-primary border-primary text-on-primary"
                          : "border-white/10"
                      }`}>
                        {selectedDrones.includes(drone.drone_id) && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white">{drone.dock_name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">ID: {drone.drone_id}</p>
                    <div className="mt-2 flex justify-end items-end">
                      <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-500 uppercase tracking-tighter">
                        {Math.round(drone.total_minutes_saved)}min Saved
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Drone Pagination */}
            {Math.ceil(filteredDrones.length / DRONE_ITEMS_PER_PAGE) > 1 && (
              <div className="flex justify-center items-center gap-4 mt-4">
                <button
                  disabled={dronePage === 1}
                  onClick={() => setDronePage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-white/10 text-zinc-500 disabled:opacity-20 hover:bg-white/5 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: Math.ceil(filteredDrones.length / DRONE_ITEMS_PER_PAGE) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setDronePage(i + 1)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black tracking-tighter transition-all ${dronePage === i + 1 ? "bg-primary text-on-primary shadow-[0_0_15px_rgba(255,255,255,0.15)]" : "bg-white/5 text-zinc-500 hover:text-white"}`}
                    >
                      0{i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={dronePage === Math.ceil(filteredDrones.length / DRONE_ITEMS_PER_PAGE)}
                  onClick={() => setDronePage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-white/10 text-zinc-500 disabled:opacity-20 hover:bg-white/5 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex justify-center mt-6 pb-12">
              <button
                disabled={selectedDrones.length === 0}
                onClick={() => { setFlightPage(1); setPhase("list"); }}
                className={`flex items-center gap-4 px-10 py-4 rounded-xl font-headline font-black uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95 border backdrop-blur-3xl ${
                  selectedDrones.length > 0
                  ? "bg-zinc-900/80 text-primary border-primary/40 hover:bg-zinc-900 hover:border-primary cursor-pointer shadow-2xl shadow-white/5"
                  : "bg-zinc-900/50 text-zinc-600 cursor-not-allowed pointer-events-none opacity-40 border-white/5"
                }`}
              >
                Proceed Analysis
                <ChevronRight className="w-4 h-4 text-primary" />
              </button>
            </div>
          </motion.div>

        ) : phase === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-10"
          >
            <div className="flex justify-between items-center bg-surface border-b border-white/5 pb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => setPhase("selection")}
                    className="p-1 px-4 bg-secondary/10 border border-secondary/30 rounded-full text-[10px] uppercase tracking-widest font-black text-secondary hover:bg-secondary hover:text-white transition-all shadow-lg shadow-secondary/5"
                  >
                    Back to selection
                  </button>
                  <div className="h-4 w-[1px] bg-white/10" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                    {selectedDrones.length} Devices Analyzed
                  </span>
                </div>
                <h2 className="text-4xl font-black tracking-tighter text-on-surface uppercase leading-none">FLIGHT TIMELINE</h2>
              </div>

              <div className="flex items-center gap-3 bg-zinc-900/50 p-1.5 rounded-xl border border-white/5">
                <button
                  disabled={flightPage === 1}
                  onClick={() => setFlightPage(p => p - 1)}
                  className="w-7 h-7 rounded-lg border border-white/10 text-zinc-500 disabled:opacity-20 hover:bg-white/5 flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                </button>
                <div className="flex gap-1.5">
                  {Array.from({ length: totalFlightPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFlightPage(i + 1)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black tracking-tighter transition-all border ${flightPage === i + 1 ? "bg-zinc-900 border-primary/50 text-primary shadow-[0_0_15px_rgba(255,255,255,0.15)]" : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={flightPage === totalFlightPages}
                  onClick={() => setFlightPage(p => p + 1)}
                  className="w-7 h-7 rounded-lg border border-white/10 text-zinc-500 disabled:opacity-20 hover:bg-white/5 flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {flightsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-56 rounded-2xl border border-white/5 bg-primary/5 animate-pulse" />
                ))}
              </div>
            ) : flights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
                <DroneIcon className="w-16 h-16 text-zinc-500" />
                <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold">No flights found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flights.map((flight) => (
                  <motion.div
                    key={flight.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    onClick={() => openDetail(flight.id)}
                    className="bg-primary/5 border border-white/5 rounded-2xl overflow-hidden group cursor-pointer hover:border-secondary/50 transition-all duration-300 shadow-xl"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div className="px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-md shadow-[0_0_10px_rgba(250,133,0,0.1)]">
                          <span className="text-[9px] font-black text-secondary tracking-widest uppercase">
                            {flight.start_time_iso ? formatDate(flight.start_time_iso, activeSettings.timezone ?? 'uk') : flight.date}
                          </span>
                        </div>
                        {activeSettings.postFlightAuth && !flight.verified && (
                          <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-[8px] font-black text-amber-400 tracking-widest uppercase">Pending Auth</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-8">
                        <div className="text-left">
                          <p className="text-2xl font-black text-on-surface tracking-tighter leading-none">DOCK</p>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">{flight.dock_name}</p>
                        </div>
                        <div className="flex-grow flex flex-col items-center px-4 relative">
                          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent absolute top-1/2 -translate-y-1/2" />
                          <div className="relative z-10 p-2 bg-zinc-900 rounded-full border border-white/5 text-secondary">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-on-surface tracking-tighter leading-none">GTL</p>
                          <p className={`text-[9px] uppercase tracking-widest mt-1 font-black ${flight.trigger_type === 'alarm' ? 'text-secondary' : 'text-zinc-500'}`}>
                            {flight.trigger_type === 'alarm' ? 'ALARM RESPONSE' : 'MANUAL CONTROL'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-4 border-t border-white/5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-primary" />
                            <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold">Range</p>
                          </div>
                          <p className="text-[11px] font-black text-on-surface uppercase tracking-tight">{flight.distance_km}</p>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-secondary" />
                            <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold">Launch</p>
                          </div>
                          <p className="text-[11px] font-black text-on-surface uppercase tracking-tight">
                            {flight.start_time_iso ? formatTime(flight.start_time_iso, activeSettings.timezone ?? 'uk') : flight.time}
                          </p>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold">Time</p>
                          </div>
                          <p className="text-[11px] font-black text-on-surface uppercase tracking-tight">{flight.duration_min}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-black/20 px-6 py-3 flex justify-between items-center group-hover:bg-secondary/10 transition-colors border-t border-white/5">
                      <span className="text-[8px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors truncate max-w-[80%]" title={flight.flight_id ?? flight.id}>
                        FLIGHT ID: {flight.flight_id ?? flight.id}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-secondary translate-x-0 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Bottom Pagination */}
            {totalFlightPages > 1 && (
              <div className="flex justify-center items-center gap-3 bg-zinc-900/50 p-2 rounded-xl border border-white/5 w-fit mx-auto mt-8 mb-20 shadow-2xl">
                <button
                  disabled={flightPage === 1}
                  onClick={() => { setFlightPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-8 h-8 rounded-lg border border-white/10 text-zinc-500 disabled:opacity-20 hover:bg-white/5 flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
                <div className="flex gap-1.5">
                  {Array.from({ length: totalFlightPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setFlightPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black tracking-tighter transition-all border ${flightPage === i + 1 ? "bg-zinc-900 border-primary/50 text-primary shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"}`}
                    >
                      0{i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={flightPage === totalFlightPages}
                  onClick={() => { setFlightPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-8 h-8 rounded-lg border border-white/10 text-zinc-500 disabled:opacity-20 hover:bg-white/5 flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>

        ) : (
          /* ── Flight Detail ─────────────────────────────────────────────── */
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col gap-12"
          >
            <div className="flex justify-between items-center bg-surface pb-6 border-b border-white/5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-4 mb-2">
                  <button
                    onClick={() => setPhase("list")}
                    className="p-1 px-4 bg-secondary/10 border border-secondary/30 rounded-full text-[10px] uppercase tracking-widest font-black text-secondary hover:bg-secondary hover:text-white transition-all shadow-lg shadow-secondary/5"
                  >
                    Back to timeline
                  </button>
                </div>
                {loadingDetail ? (
                  <div className="h-16 w-96 rounded-xl bg-white/5 animate-pulse" />
                ) : (
                  <>
                    <h1 className="text-4xl font-black tracking-tighter text-on-surface uppercase leading-none">Flight ID</h1>
                    <FlightIdRow flightId={selectedFlightDetail?.id ?? ""} />
                    <div className="flex items-center gap-4 mt-3">
                      <p className="text-lg font-bold text-zinc-500 tracking-tight">{selectedFlightDetail?.date}</p>
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                      <p className="text-lg font-bold text-zinc-500 tracking-tight">{selectedFlightDetail?.time}</p>
                    </div>
                  </>
                )}
              </div>
              {!loadingDetail && (
                <div className={`px-5 py-2 rounded-xl border-2 font-black text-[12px] tracking-[0.2em] uppercase h-fit ${
                  selectedFlightDetail?.triggerType === 'alarm'
                    ? 'bg-secondary/10 border-secondary text-secondary shadow-[0_0_20px_rgba(250,133,0,0.2)]'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                }`}>
                  {selectedFlightDetail?.triggerType === 'alarm' ? 'ALARM RESPONSE' : 'MANUAL CONTROL'}
                </div>
              )}
            </div>

            {loadingDetail ? (
              <div className="grid grid-cols-2 gap-12">
                <div className="h-96 rounded-[40px] border border-white/5 bg-zinc-900 animate-pulse" />
                <div className="h-96 rounded-[40px] border border-white/5 bg-zinc-900 animate-pulse" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Drone Metrics */}
                <div className="flex flex-col gap-8 h-full">
                  <div className="flex flex-col gap-8 p-10 bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[40px] shadow-2xl flex-grow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] leading-none">Drone Metrics</h3>
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                        <DroneIcon className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-12 gap-x-12">
                      {[
                        { label: "Drone Name", value: selectedFlightDetail?.droneName },
                        { label: "Dock Station", value: selectedFlightDetail?.dockName },
                        { label: "Distance to GTL", value: selectedFlightDetail?.gtlDistance },
                        { label: "Time to Target", value: selectedFlightDetail?.duration },
                        { label: "Total Flight Distance", value: selectedFlightDetail?.distance },
                        { label: "Takeoff Time", value: selectedFlightDetail?.takeoffTime },
                        { label: "Landing Time", value: selectedFlightDetail?.landingTime },
                        { label: "Max Speed", value: selectedFlightDetail?.maxSpeed },
                      ].map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-2">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">{item.label}</p>
                          <p className="text-2xl font-black text-on-surface tracking-tighter leading-tight drop-shadow-sm">{item.value ?? "—"}</p>
                        </div>
                      ))}
                    </div>

                    {/* Notes */}
                    <div className="mt-8 flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={12} className="text-emerald-500" />
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] leading-none">Flight Log / Notes</h3>
                      </div>
                      <div className="p-6 rounded-3xl border border-white/5 bg-black/40 min-h-[140px]">
                        {selectedFlightDetail?.note ? (
                          <p className="text-xs text-zinc-300 font-medium leading-relaxed">{selectedFlightDetail.note}</p>
                        ) : (
                          <p className="text-xs text-zinc-600 font-medium leading-relaxed italic">No note added</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manual Response Modes */}
                <div className="flex flex-col gap-8 h-full">
                  <div className="flex flex-col gap-6 p-10 bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[40px] shadow-2xl flex-grow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] leading-none">Manual Response Metrics</h3>
                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.1em]">powered by Google Maps</p>
                      </div>
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                        <Gauge className="w-5 h-5" />
                      </div>
                    </div>

                    {selectedFlightDetail?.manualModes && selectedFlightDetail.manualModes.length > 0 ? (
                      <div className="flex flex-col gap-10">
                        {selectedFlightDetail.manualModes.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-6 p-8 bg-black/40 border border-white/5 rounded-3xl group hover:border-emerald-500/30 transition-all duration-500">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center text-on-surface group-hover:text-emerald-500 group-hover:scale-110 transition-all shadow-inner">
                                  {item.mode === 'car' && <Car className="w-6 h-6" />}
                                  {item.mode === 'bike' && <Bike className="w-6 h-6" />}
                                  {item.mode === 'run' && <Run className="w-6 h-6" />}
                                </div>
                                <h4 className="text-xl font-black text-on-surface uppercase tracking-tight">
                                  {item.mode === 'run' ? 'Person' : item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}
                                </h4>
                                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                  Effectiveness: +{item.saved}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                              <div className="flex flex-col gap-1">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Drone Takeoff</p>
                                <p className="text-sm font-black text-on-surface">{item.takeoff}</p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Reach GTL</p>
                                <p className="text-sm font-black text-on-surface">{item.reachGtl}</p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">ETA</p>
                                <p className="text-sm font-black text-on-surface">{item.eta}</p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest leading-none">Saved</p>
                                <p className="text-sm font-black text-emerald-500">{item.saved}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-grow flex items-center justify-center">
                        <p className="text-zinc-600 text-xs uppercase tracking-widest font-bold">Benchmark data unavailable</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Route Visualization */}
            {!loadingDetail && activeSettings.showMapVisual && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 gap-12"
              >
                <div className="p-8 bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] leading-none">Route Visualization</h3>
                      <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.1em]">Powered by Mapbox</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 border-t-2 border-dashed border-[#82ECFF] shadow-[0_0_6px_#82ECFF80]" />
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Drone Path</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Dock</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">GTL</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative h-[420px] bg-zinc-950 rounded-3xl border border-white/5 overflow-hidden">
                    {selectedFlightDetail?.dockLat && selectedFlightDetail?.gtlLat ? (
                      <FlightMap
                        dockLat={selectedFlightDetail.dockLat}
                        dockLng={selectedFlightDetail.dockLng!}
                        gtlLat={selectedFlightDetail.gtlLat}
                        gtlLng={selectedFlightDetail.gtlLng!}
                        dockName={selectedFlightDetail.dockName}
                        gtlDistance={selectedFlightDetail.gtlDistance !== "—" ? selectedFlightDetail.gtlDistance : undefined}
                        droneTimeSeconds={selectedFlightDetail.droneTimeSeconds ?? undefined}
                        manualModes={selectedFlightDetail.mapModes}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-40">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#2c7bf2_1px,transparent_1px)] [background-size:30px_30px]" />
                        <Navigation size={32} className="text-primary" />
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Coordinates unavailable</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Fact */}
            {!loadingDetail && (
              <div className="mt-6 flex items-center justify-center p-8 bg-zinc-950/80 backdrop-blur-3xl border border-white/5 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.15)] max-w-2xl mx-auto w-full">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-lg shadow-emerald-500/10">
                    <Rocket className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">QUICK FACT</p>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <span className="text-xl font-black text-on-surface tracking-tight uppercase px-5 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-inner">
                      This drone on an average saves <span className="text-emerald-500">{selectedFlightDetail?.avgSaved} min</span> per flight
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
