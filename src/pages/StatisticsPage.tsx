import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  Legend
} from "recharts";
import { Car, Bike, User, TrendingUp, Clock, Target } from "lucide-react";
import ThreeDRadioGroup from "@/components/ui/three-d-radio-group";
import StatsFilter from "@/components/StatsFilter";
import { useGtlHttp } from "@/lib/useGtlHttp";

type TimeRange = "daily" | "weekly" | "monthly" | "all-time";
type TransportMode = "car" | "bike" | "person";

interface ChartPoint {
  name: string;
  manual: number;
  drone: number;
  saved: number;
}

interface PerformanceMix {
  name: string;
  icon: any;
  efficiency: string;
  color: string;
  time: string;
  efficiency_pct: number;
}

interface SummaryMetrics {
  total_saved_vs_car_seconds: number;
  total_distance_km: number;
  completed_events: number;
  avg_saved_vs_car_seconds: number | null;
}

function formatSavedTime(seconds: number): string {
  if (!seconds) return "0h";
  const hours = seconds / 3600;
  if (hours >= 1) return `${hours.toFixed(1)}h`;
  return `${Math.round(seconds / 60)}min`;
}

function formatSavedSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
  }
  return `${m}min`;
}

const FLYT_FACTS = [
  "Your ground team spent 40 hours in traffic this week. Our drones spent those 40 hours rested, recharged, and ready to beat the car again.",
  "Ground crews faced 112 red lights this month. Our drones saw zero—turns out the sky doesn't have intersections.",
  "At 42 min saved per flight, you've 'earned' 15 extra working days this year. We suggest a beach, or more drones.",
  "While cars were navigating 'Alternative Routes,' your drones were taking the only route that matters: The straight line.",
  "Your fleet saved enough CO2 this week to keep a small forest breathing easy for a year. Global warming is sweating.",
  "Gravity is the only thing holding us back, and even that's losing the argument.",
  "The average drone doesn't know what a 'pothole' is. It thinks they're just tiny, ground-level swimming pools for birds.",
  "You've bypassed 4,200 traffic jams this year. That's 4,200 times your team didn't have to listen to radio talk shows.",
  "Our drones have covered more vertical distance than three Mount Everests. They're basically high-altitude overachievers.",
];

const flytFact = FLYT_FACTS[Math.floor(Math.random() * FLYT_FACTS.length)];

// Map frontend period to backend period
function toBackendPeriod(p: TimeRange): string {
  return p === "all-time" ? "lifetime" : p;
}

// Map frontend mode to backend mode
function toBackendMode(m: TransportMode): string {
  return m === "person" ? "foot" : m;
}

export default function StatisticsPage() {
  const http = useGtlHttp();

  const [timeRange, setTimeRange] = useState<TimeRange>("weekly");
  const [activeMode, setActiveMode] = useState<TransportMode>("car");
  // "" = all drones (no filter)
  const [selectedDroneId, setSelectedDroneId] = useState<string>("");

  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [performanceMix, setPerformanceMix] = useState<PerformanceMix[]>([]);
  const [mixLoading, setMixLoading] = useState(true);

  // Build drone query param helper
  const droneParam = selectedDroneId ? `&drone_id=${selectedDroneId}` : "";

  // Fetch chart data when period, mode, or drone filter changes
  useEffect(() => {
    setChartLoading(true);
    const period = toBackendPeriod(timeRange);
    const mode = toBackendMode(activeMode);
    http.get(`/metrics/chart-data?period=${period}&mode=${mode}${droneParam}`)
      .then((res: any) => setChartData(res.data?.data ?? []))
      .catch((err: any) => console.error("[StatisticsPage chart-data]", err))
      .finally(() => setChartLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, activeMode, selectedDroneId]);

  // Fetch summary metrics when period or drone filter changes
  useEffect(() => {
    setSummaryLoading(true);
    const period = toBackendPeriod(timeRange);
    http.get(`/metrics/summary?period=${period}${droneParam}`)
      .then((res: any) => setSummary(res.data))
      .catch((err: any) => console.error("[StatisticsPage summary]", err))
      .finally(() => setSummaryLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, selectedDroneId]);

  // Fetch performance mix when period or drone filter changes
  useEffect(() => {
    setMixLoading(true);
    const period = toBackendPeriod(timeRange);
    http.get(`/metrics/performance-mix?period=${period}${droneParam}`)
      .then((res: any) => {
        const mix = (res.data?.mix ?? []).map((m: any) => {
          const modeLabel = m.mode === "car" ? "Vehicle (Car)"
            : m.mode === "bike" ? "Motorcycle"
            : "Pedestrian";
          const icon = m.mode === "car" ? Car : m.mode === "bike" ? Bike : User;
          const color = m.mode === "car" ? "#2C7BF2" : m.mode === "bike" ? "#FA8500" : "#A855F7";
          return {
            name: modeLabel,
            icon,
            efficiency: `${m.efficiency_pct}%`,
            efficiency_pct: m.efficiency_pct,
            color,
            time: formatSavedSeconds(m.total_saved_seconds),
          };
        });
        setPerformanceMix(mix);
      })
      .catch((err: any) => console.error("[StatisticsPage performance-mix]", err))
      .finally(() => setMixLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, selectedDroneId]);

  const modeColor = activeMode === 'car' ? "#2C7BF2" : activeMode === 'bike' ? "#FA8500" : "#A855F7";
  const manualLabel = activeMode === 'car' ? "Car Time" : activeMode === 'bike' ? "Bike Time" : "Pedestrian Time";

  const getMetrics = () => {
    if (summaryLoading || !summary) {
      return [
        { label: "Total Man-Hours Saved", value: "—", change: "...", icon: Clock },
        { label: "Total Distance Covered", value: "—", change: "...", icon: TrendingUp },
        { label: "Number of Flights", value: "—", change: "...", icon: Target },
        { label: "Saved Per Flight", value: "—", change: "Avg Delta", icon: Clock },
      ];
    }
    return [
      {
        label: "Total Man-Hours Saved",
        value: formatSavedTime(summary.total_saved_vs_car_seconds),
        change: "+vs car",
        icon: Clock,
      },
      {
        label: "Total Distance Covered",
        value: `${summary.total_distance_km.toFixed(1)} km`,
        change: "Flight paths",
        icon: TrendingUp,
      },
      {
        label: "Number of Flights",
        value: summary.completed_events.toLocaleString(),
        change: "Completed",
        icon: Target,
      },
      {
        label: "Saved Per Flight",
        value: summary.avg_saved_vs_car_seconds != null
          ? `${Math.round(summary.avg_saved_vs_car_seconds / 60)}min`
          : "—",
        change: "Avg Delta",
        icon: Clock,
      },
    ];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl min-w-[180px]">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 pb-2 border-b border-white/5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[10px] font-bold text-zinc-400 capitalize">{entry.name}:</span>
              </div>
              <span className="text-xs font-black text-white">{Math.round(entry.value / 60)}min</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="font-headline font-black text-5xl tracking-tighter text-on-surface mb-2">
            Operational Statistics
          </h1>
          <p className="text-sm font-label text-zinc-500 tracking-wider uppercase">
            Time Savings & Efficiency analysis across transport modes
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <ThreeDRadioGroup
            options={[
              { label: "Daily", value: "daily" },
              { label: "Weekly", value: "weekly" },
              { label: "Monthly", value: "monthly" },
              { label: "All Time", value: "all-time" }
            ]}
            value={timeRange}
            onValueChange={(val) => setTimeRange(val as TimeRange)}
          />
          <StatsFilter
            activeTimeRange={timeRange}
            onApply={(filters) => {
              setSelectedDroneId(filters.drone_id);
            }}
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {getMetrics().map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <metric.icon className="w-5 h-5 text-primary" />
              </div>
              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${metric.label === 'Number of Flights' ? 'bg-secondary/10 text-secondary' : 'bg-emerald-500/10 text-emerald-500'}`}>
                {metric.change}
              </span>
            </div>
            <h3 className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">
              {metric.label}
            </h3>
            <p className="text-3xl font-black text-white tracking-tighter">
              {summaryLoading ? <span className="text-zinc-700 animate-pulse">—</span> : metric.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Chart Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-zinc-950 border border-white/5 rounded-[2.5rem] p-8 md:p-10 min-h-[500px] flex flex-col"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Savings Distribution</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Comparative Analysis vs. {activeMode}</p>
            </div>

            <div className="flex gap-2 p-1 bg-zinc-900 rounded-xl">
              {(["car", "bike", "person"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveMode(mode)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all flex items-center gap-2 ${
                    activeMode === mode
                      ? "bg-zinc-800 text-white shadow-lg"
                      : "text-zinc-600 hover:text-zinc-300"
                  }`}
                >
                  {mode === 'car' ? <Car className="w-3 h-3" /> : mode === 'bike' ? <Bike className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-grow">
            {chartLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-zinc-600 text-xs uppercase tracking-widest font-bold">No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {timeRange === 'daily' ? (
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 60)}m`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '20px' }} />
                    <Bar dataKey="manual" name={manualLabel} fill={modeColor} radius={[6, 6, 0, 0]} barSize={40} />
                    <Bar dataKey="drone" name="Drone Time" fill="#22C55E" radius={[6, 6, 0, 0]} barSize={40} />
                    <Bar dataKey="saved" name="Time Saved" fill="#FA8500" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={modeColor} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={modeColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 60)}m`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" align="right" height={40} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '20px' }} />
                    <Area type="monotone" dataKey="manual" stroke={modeColor} strokeWidth={3} fillOpacity={1} fill="url(#colorManual)" name={manualLabel} animationDuration={1000} />
                    <Line type="monotone" dataKey="drone" stroke="#22C55E" strokeWidth={2} dot={{ r: 4, fill: '#22C55E', strokeWidth: 0 }} name="Drone Duration" animationDuration={1000} />
                    <Line type="monotone" dataKey="saved" stroke="#FA8500" strokeWidth={3} strokeDasharray="6 4" dot={false} name="Time Saved" animationDuration={1000} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Breakdown List */}
        <div className="space-y-6">
          <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 h-full flex flex-col">
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-10 flex items-center justify-between">
              Performance Mix
              <span className="text-[9px] text-zinc-500 font-medium">({timeRange})</span>
            </h2>

            <div className="space-y-10 flex-grow">
              {mixLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-6 w-full bg-zinc-800 rounded animate-pulse" />
                    <div className="h-2 w-full bg-zinc-800 rounded-full animate-pulse" />
                  </div>
                ))
              ) : performanceMix.length === 0 ? (
                <p className="text-zinc-600 text-xs uppercase tracking-widest font-bold text-center">No data</p>
              ) : (
                performanceMix.map((mode) => (
                  <div key={mode.name} className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <mode.icon className="w-4 h-4 text-zinc-400" />
                        </div>
                        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-tight">{mode.name}</span>
                      </div>
                      <span className="text-[11px] font-black text-white">{mode.time} saved</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, mode.efficiency_pct)}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                        style={{ backgroundColor: mode.color }}
                      />
                    </div>
                    <div className="flex justify-between mt-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Efficiency</span>
                        <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-tighter">{mode.efficiency}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-12 pt-12 border-t border-white/5">
              <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-12 h-12 text-primary" />
                </div>
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-3">FlytFact</p>
                <p className="text-xs text-zinc-400 leading-relaxed font-semibold italic">
                  "{flytFact}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
