import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  Check,
  Calendar,
  MapPin,
  Gauge,
  Timer,
  Car,
  Bike,
  PersonStanding as Run,
  ShieldCheck,
  Rocket,
  CheckSquare,
  CheckCircle,
  MessageSquare,
  Navigation,
  Send,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useGtlHttp } from "../lib/useGtlHttp";
import FlightMap from "../components/FlightMap";

const DroneIcon = ({ className, size }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} width={size} height={size}>
    <path d="M12 8L12 16" /><path d="M8 12L16 12" />
    <circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" />
    <circle cx="18" cy="18" r="2" /><circle cx="6" cy="18" r="2" />
    <path d="M7.5 7.5L10 10" /><path d="M16.5 7.5L14 10" />
    <path d="M16.5 16.5L14 14" /><path d="M7.5 16.5L10 14" />
    <rect x="10" y="10" width="4" height="4" rx="1" />
  </svg>
);

interface PendingFlight {
  id: string;
  flight_id: string;
  date: string;
  time: string;
  distance_km: string;
  duration_min: string;
  trigger_type: "alarm" | "manual";
  drone_name: string;
  dock_name: string;
  benchmark: any;
}

interface ManualMode {
  mode: "car" | "bike" | "run";
  takeoff: string;
  reachGtl: string;
  eta: string;
  saved: string;
}

interface FlightDetailFull {
  id: string;
  date: string;
  time: string;
  triggerType: "alarm" | "manual";
  droneName: string;
  dockName: string;
  distance: string;
  duration: string;
  maxAltitude: string;
  maxSpeed: string;
  takeoffTime: string;
  landingTime: string;
  manualModes: ManualMode[];
  dockLat: number | null;
  dockLng: number | null;
  gtlLat: number | null;
  gtlLng: number | null;
}

function transformDetail(d: any): FlightDetailFull {
  const manualModes: ManualMode[] = (d.manual_modes ?? []).map((m: any) => ({
    mode: m.mode === "walk" ? "run" : m.mode,
    takeoff: d.takeoff_time?.substring(0, 5) ?? "—",
    reachGtl: m.eta_time ?? "—",
    eta: m.travel_seconds ? `${Math.floor(m.travel_seconds / 60)}min` : "—",
    saved: m.time_saved_seconds ? `${Math.floor(m.time_saved_seconds / 60)}min` : "—",
  }));

  return {
    id: d.flight_id ?? d.id,
    date: d.date ?? "—",
    time: d.takeoff_time?.substring(0, 5) ?? "—",
    triggerType: d.trigger_type,
    droneName: d.drone_name ?? "—",
    dockName: d.dock_name ?? "—",
    distance: d.flight_distance_m ? `${(d.flight_distance_m / 1000).toFixed(1)} km` : "—",
    duration: d.drone_time_seconds ? `${Math.floor(d.drone_time_seconds / 60)}min` : "—",
    maxAltitude: d.max_altitude_m != null ? `${d.max_altitude_m}m` : "—",
    maxSpeed: d.max_speed_kmh != null ? `${d.max_speed_kmh} km/h` : "—",
    takeoffTime: d.takeoff_time ?? "—",
    landingTime: d.landing_time ?? "—",
    manualModes,
    dockLat: d.dock_lat ?? null,
    dockLng: d.dock_lng ?? null,
    gtlLat: d.gtl_lat ?? null,
    gtlLng: d.gtl_lng ?? null,
  };
}

export default function PostFlightAuthPage() {
  const { activeSettings } = useSettings();
  const http = useGtlHttp();

  const [phase, setPhase] = useState<"list" | "detail">("list");
  const [pendingFlights, setPendingFlights] = useState<PendingFlight[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFlight, setSelectedFlight] = useState<PendingFlight | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<FlightDetailFull | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isValidated, setIsValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  // Fetch pending flights
  useEffect(() => {
    setLoading(true);
    http.get(`/pfa/pending`)
      .then((res: any) => setPendingFlights(res.data?.pending ?? []))
      .catch((err: any) => console.error("[PFA pending]", err))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (flight: PendingFlight) => {
    setSelectedFlight(flight);
    setIsValidated(false);
    setNoteText("");
    setNoteSaved(false);
    setPhase("detail");
    setDetailLoading(true);
    try {
      const res: any = await http.get(`/flights/${flight.id}`);
      setSelectedDetail(transformDetail(res.data));
    } catch (err) {
      console.error("[PFA detail]", err);
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedFlight || isValidated || isValidating) return;
    setIsValidating(true);
    try {
      await http.patch(`/pfa/${selectedFlight.id}/verify`);
      setIsValidated(true);
      setShowSuccess(true);
      // Remove flight from pending list
      setPendingFlights(prev => prev.filter(f => f.id !== selectedFlight.id));
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("[PFA verify]", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedFlight || !noteText.trim() || noteSaved || noteSaving) return;
    setNoteSaving(true);
    try {
      await http.post(`/pfa/${selectedFlight.id}/note`, { note: noteText.trim() });
      setNoteSaved(true);
    } catch (err: any) {
      // 409 = note already exists
      if (err?.response?.status === 409) {
        setNoteSaved(true);
      } else {
        console.error("[PFA note]", err);
      }
    } finally {
      setNoteSaving(false);
    }
  };

  const selectedIndex = selectedFlight
    ? pendingFlights.findIndex(f => f.id === selectedFlight.id) + 1
    : 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-10 py-10 min-h-screen">
      <AnimatePresence mode="wait">
        {phase === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-10"
          >
            <div className="flex justify-between items-end border-b border-white/5 pb-8">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-max">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Verification Portal</span>
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-on-surface uppercase leading-none">
                  Post Flight Authentication
                </h1>
                <p className="text-zinc-500 font-label text-xs tracking-widest mt-2 uppercase">
                  {loading ? "Loading..." : `Pending Verification: ${pendingFlights.length} MISSION LOGS`}
                </p>
              </div>

              <AnimatePresence>
                {showSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[2200] flex items-center gap-3 py-4 px-10 bg-emerald-500 text-white rounded-full shadow-[0_0_60px_rgba(16,185,129,0.4)] backdrop-blur-3xl font-black uppercase text-sm tracking-[0.3em]"
                  >
                    <Rocket className="w-6 h-6 animate-pulse" />
                    Flight Data Ingested
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-72 rounded-[40px] border border-white/5 bg-zinc-900/40 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pendingFlights.map((flight) => (
                  <motion.div
                    key={flight.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -6, scale: 1.01 }}
                    onClick={() => openDetail(flight)}
                    className="bg-black/60 backdrop-blur-3xl border border-white/5 rounded-[40px] overflow-hidden group cursor-pointer hover:border-emerald-500/40 transition-all duration-500 shadow-2xl relative"
                  >
                    <div className="p-10 flex flex-col gap-10">
                      <div className="flex">
                        <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-inner shadow-emerald-500/5">
                          <span className="text-xs font-black text-emerald-500 tracking-[0.2em] uppercase">{flight.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <p className="text-5xl font-black text-on-surface tracking-tighter leading-none">DOCK</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] mt-3 font-black">{flight.dock_name}</p>
                        </div>
                        <div className="flex-grow flex flex-col items-center px-6 relative">
                          <div className="w-full h-px bg-zinc-800 absolute top-1/2 -translate-y-1/2" />
                          <div className="relative z-10 p-2.5 bg-black border border-white/10 rounded-full text-emerald-500 shadow-xl shadow-black/40">
                            <ChevronRight className="w-5 h-5 translate-x-[1px]" />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-5xl font-black text-on-surface tracking-tighter leading-none">GTL</p>
                          <p className="text-[10px] text-emerald-500 uppercase tracking-[0.4em] mt-3 font-black">
                            {flight.trigger_type === 'alarm' ? 'ALARM RESPONSE' : 'MANUAL CONTROL'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 py-8 border-t border-white/5">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2"><MapPin size={14} className="text-emerald-500" /><p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-black">Range</p></div>
                          <p className="text-xl font-black text-on-surface tracking-tight">{flight.distance_km}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2"><Calendar size={14} className="text-emerald-500" /><p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-black">Launch</p></div>
                          <p className="text-xl font-black text-on-surface tracking-tight">{flight.time}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2"><Timer size={14} className="text-emerald-500" /><p className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-black">Time</p></div>
                          <p className="text-xl font-black text-on-surface tracking-tight">{flight.duration_min}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/40 px-10 py-5 flex justify-between items-center group-hover:bg-emerald-500/10 transition-all border-t border-white/5">
                      <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors tracking-widest uppercase">
                        UID: {flight.id}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && pendingFlights.length === 0 && (
              <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-30">
                <div className="w-32 h-32 bg-zinc-900 rounded-full border border-white/5 flex items-center justify-center">
                  <CheckSquare size={48} className="text-zinc-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">System Clear</h3>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] mt-2 text-zinc-500">All mission logs validated</p>
                </div>
              </div>
            )}
          </motion.div>

        ) : (
          /* ── Detail View ──────────────────────────────────────────────── */
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
                    className="p-1 px-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] uppercase tracking-widest font-black text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/5"
                  >
                    Back to logs
                  </button>
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-emerald-500 uppercase leading-[0.8]">
                  {detailLoading ? "Loading..." : `Flight Number ${selectedIndex > 0 ? selectedIndex : "—"}`}
                </h1>
                <div className="flex items-center gap-4 mt-4">
                  <p className="text-lg font-bold text-zinc-500 tracking-tight uppercase">UID: {selectedFlight?.id}</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  <p className="text-lg font-bold text-zinc-500 tracking-tight">{selectedFlight?.date} @ {selectedFlight?.time}</p>
                </div>
              </div>
              <div className={`px-5 py-2 rounded-xl border-2 font-black text-[12px] tracking-[0.2em] uppercase h-fit ${
                selectedFlight?.trigger_type === 'alarm'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400'
              }`}>
                {selectedFlight?.trigger_type === 'alarm' ? 'ALARM RESPONSE' : 'MANUAL CONTROL'}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
              {/* Left/Middle: Metrics (3 cols) */}
              <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Drone Metrics */}
                <div className="flex flex-col gap-8 p-10 bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[40px] shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] leading-none">Drone Metrics</h3>
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><DroneIcon size={20} /></div>
                  </div>

                  {detailLoading ? (
                    <div className="grid grid-cols-2 gap-y-8 gap-x-8">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
                          <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-y-12 gap-x-12">
                      {[
                        { label: "Device ID", value: selectedDetail?.droneName },
                        { label: "Dock Name", value: selectedDetail?.dockName },
                        { label: "Total Distance", value: selectedDetail?.distance },
                        { label: "Flight Time", value: selectedDetail?.duration },
                        { label: "Maximum Altitude", value: selectedDetail?.maxAltitude },
                        { label: "Maximum Speed", value: selectedDetail?.maxSpeed },
                        { label: "Takeoff Time", value: selectedDetail?.takeoffTime },
                        { label: "Landing Time", value: selectedDetail?.landingTime },
                      ].map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-2">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none">{item.label}</p>
                          <p className="text-2xl font-black text-on-surface tracking-tighter leading-tight">{item.value ?? "—"}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Note Section */}
                  <div className="mt-8 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={12} className="text-emerald-500" />
                      <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] leading-none">Flight Log / Notes</h3>
                    </div>
                    {noteSaved ? (
                      <div className="p-6 rounded-3xl border border-emerald-500/20 bg-black/40 min-h-[100px]">
                        <p className="text-xs text-zinc-300 font-medium leading-relaxed">{noteText || "Note saved."}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          disabled={isValidated}
                          placeholder="Add an operator note for this flight..."
                          rows={4}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/40 resize-none transition-all placeholder:text-zinc-700"
                        />
                        <button
                          disabled={!noteText.trim() || isValidated || noteSaving}
                          onClick={handleSaveNote}
                          className="self-end flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[10px] font-black text-emerald-500 uppercase tracking-widest disabled:opacity-30 hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          <Send size={12} />
                          {noteSaving ? "Saving..." : "Save Note"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual Response Metrics */}
                <div className="flex flex-col gap-6 p-10 bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[40px] shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] leading-none">Manual Response Metrics</h3>
                      <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.1em]">powered by Google Maps</p>
                    </div>
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Gauge size={20} /></div>
                  </div>

                  {detailLoading ? (
                    <div className="flex-grow space-y-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-32 rounded-3xl bg-zinc-800 animate-pulse" />
                      ))}
                    </div>
                  ) : !selectedDetail?.manualModes?.length ? (
                    <div className="flex-grow flex items-center justify-center">
                      <p className="text-zinc-600 text-xs uppercase tracking-widest font-bold">Benchmark data unavailable</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-10">
                      {selectedDetail.manualModes.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-6 p-8 bg-black/40 border border-white/5 rounded-3xl group hover:border-emerald-500/30 transition-all duration-500">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-emerald-500 transition-all shadow-inner">
                              {item.mode === 'car' && <Car size={24} />}
                              {item.mode === 'bike' && <Bike size={24} />}
                              {item.mode === 'run' && <Run size={24} />}
                            </div>
                            <h4 className="text-xl font-black text-on-surface uppercase tracking-tight">
                              {item.mode === 'run' ? 'Person' : item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}
                            </h4>
                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-widest shrink-0">
                              +{item.saved}
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4">
                            <div className="flex flex-col gap-1">
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Takeoff</p>
                              <p className="text-sm font-black text-on-surface">{item.takeoff}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">GTL</p>
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
                  )}
                </div>
              </div>

              {/* Right: Validation Gate */}
              <div className="flex flex-col gap-8 lg:sticky lg:top-32">
                <div className="flex flex-col gap-6 p-8 bg-black/80 backdrop-blur-3xl border border-white/5 rounded-[32px] shadow-2xl relative group min-w-[240px]">
                  <div className="flex flex-col w-full">
                    <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.3em] leading-none mb-3">Flight Verification</p>
                    <h3 className="text-xs font-black text-on-surface uppercase tracking-widest leading-none">Post-Flight Auth</h3>
                  </div>

                  <div
                    onClick={!isValidated && !isValidating ? handleValidate : undefined}
                    className={`flex items-center justify-between w-full select-none p-4 bg-white/5 rounded-2xl border border-white/5 transition-all ${
                      isValidated ? "cursor-default opacity-60" : "cursor-pointer hover:border-emerald-500/30"
                    }`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isValidated ? "text-emerald-500" : "text-zinc-500"}`}>
                      {isValidating ? "Validating..." : isValidated ? "Validated ✓" : "Validate"}
                    </span>
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-500 ${
                      isValidated
                        ? "bg-emerald-500 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        : "bg-zinc-950 border-white/10"
                    }`}>
                      <Check className={`w-5 h-5 text-white transition-all duration-500 ${isValidated ? "opacity-100 scale-100" : "opacity-0 scale-50"}`} strokeWidth={3} />
                    </div>
                  </div>

                  {isValidated && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="py-3 px-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">Locked & Ingested</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Route Visualization */}
            {activeSettings.showMapVisual && !detailLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 gap-12"
              >
                <div className="p-8 bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] leading-none">Route Visualization</h3>
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
                    {selectedDetail?.dockLat && selectedDetail?.gtlLat ? (
                      <FlightMap
                        dockLat={selectedDetail.dockLat}
                        dockLng={selectedDetail.dockLng!}
                        gtlLat={selectedDetail.gtlLat}
                        gtlLng={selectedDetail.gtlLng!}
                        dockName={selectedDetail.dockName}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:40px_40px]" />
                        <Navigation size={32} className="text-emerald-500 opacity-40" />
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Coordinates unavailable</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Success notification */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2200] flex items-center gap-3 py-3 px-8 bg-emerald-900/90 border border-emerald-500/20 text-emerald-100 rounded-full shadow-[0_10px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl font-black uppercase text-[10px] tracking-[0.4em]"
                >
                  <Rocket className="w-4 h-4 text-emerald-500" />
                  Flight Data Ingested
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
