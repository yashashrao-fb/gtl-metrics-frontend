import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  CalendarDays,
  History,
  Database,
  Check,
  Plus,
  BarChart3,
  Download,
  FileText,
  ExternalLink,
} from "lucide-react";
import CustomDatePicker from "../components/CustomDatePicker";
import { WaveLoader } from "../components/ui/wave-loader";
import { format } from "date-fns";
import { useGtlHttp } from "../lib/useGtlHttp";

interface ReportTemplate {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  features: string[];
}

const TEMPLATES: ReportTemplate[] = [
  {
    id: "week",
    title: "Week Report",
    subtitle: "Report based off the last 7 days",
    icon: Calendar,
    features: ["Last 7 days data analysis", "Time saved across all modes", "Overall mission trends", "Tactical operational insights"]
  },
  {
    id: "month",
    title: "Month Report",
    subtitle: "Report based off the last 30 days",
    icon: CalendarDays,
    features: ["30-day week-by-week analysis", "Peak saving day identification", "Top efficiency week pinpointing", "Monthly fleet health summary"]
  },
  {
    id: "year",
    title: "Year Report",
    subtitle: "Report based off the previous year",
    icon: History,
    features: ["Annual massive savings audit", "High-impact flight highlights", "Seasonal efficiency trends", "Long-term ROI projection"]
  },
  {
    id: "all-time",
    title: "All Time Report",
    subtitle: "All time data since deployment",
    icon: Database,
    features: ["Lifetime performance metrics", "Historical duration benchmarks", "Star flight contributor log", "Infrastructure scaling milestones"]
  }
];

interface RecentReport {
  id: string;
  report_type: string;
  period_from: string;
  period_to: string;
  storage_url: string;
  generated_at: string;
}

const DroneIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 4v4m0 0l-4-4m4 4l4-4" /><path d="M4 12h4m0 0l-4-4m4 4l-4 4" />
    <path d="M20 12h-4m0 0l4-4m-4 4l4 4" /><path d="M12 20v-4m0 0l-4 4m4-4l4 4" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function ReportsPage() {
  const http = useGtlHttp();

  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Load recent reports
  useEffect(() => {
    setReportsLoading(true);
    http.get(`/reports/recent`)
      .then((res: any) => setRecentReports(res.data?.reports ?? []))
      .catch((err: any) => console.error("[ReportsPage recent]", err))
      .finally(() => setReportsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Progress animation while generating
  useEffect(() => {
    if (isGenerating) {
      setGenerationProgress(0);
      const interval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90; // Stop at 90, API call completion pushes to 100
          }
          return prev + 1.5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const handleGenerate = async (id: string, customFrom?: string, customTo?: string) => {
    setIsGenerating(id);
    setGenerateError(null);
    try {
      await http.post('/reports/generate', {
        report_type: id,
        ...(customFrom && { from: customFrom }),
        ...(customTo && { to: customTo }),
      });
      setGenerationProgress(100);
      // Refresh recent reports
      const res: any = await http.get(`/reports/recent`);
      setRecentReports(res.data?.reports ?? []);
    } catch (err: any) {
      setGenerateError(err?.response?.data?.error ?? 'Report generation failed');
    } finally {
      setTimeout(() => {
        setIsGenerating(null);
        setGenerationProgress(0);
      }, 600);
    }
  };

  const handleBuildCustom = () => {
    if (!dateRange.start || !dateRange.end) return;
    handleGenerate('custom', dateRange.start.toISOString(), dateRange.end.toISOString());
  };

  const formatReportLabel = (r: RecentReport): string => {
    const type = r.report_type.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
    const date = format(new Date(r.generated_at), 'MMM d, yyyy');
    return `${type} — ${date}`;
  };

  const formatReportMeta = (r: RecentReport): string => {
    const from = format(new Date(r.period_from), 'MMM d');
    const to = format(new Date(r.period_to), 'MMM d, yyyy');
    return `${from} – ${to}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="font-headline font-black text-5xl tracking-tighter text-on-surface mb-4">
          Automated Intelligence Reports
        </h1>
        <p className="text-sm font-label text-zinc-500 tracking-wider uppercase max-w-2xl mx-auto">
          Generate comprehensive operational insights with a single click. Select a template or define your date range.
        </p>
      </div>

      {/* Error banner */}
      {generateError && (
        <div className="mb-8 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-widest text-center">
          {generateError}
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 relative">
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm rounded-[2.5rem] flex flex-col items-center justify-center border border-white/5"
            >
              <div className="w-full max-w-md px-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    Synthesizing {TEMPLATES.find(t => t.id === isGenerating)?.title ?? 'Custom Report'}...
                  </span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                    {Math.min(100, Math.round(generationProgress))}%
                  </span>
                </div>
                <div className="h-1 w-full bg-zinc-800 rounded-full relative overflow-hidden mb-8">
                  <motion.div
                    className="absolute top-0 bottom-0 bg-primary"
                    animate={{ width: `${generationProgress}%` }}
                  />
                  <motion.div
                    className="absolute top-1/2 -ml-3"
                    animate={{ left: `${generationProgress}%` }}
                    style={{ y: "-50%" }}
                  >
                    <DroneIcon className="w-6 h-6 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  </motion.div>
                </div>

                <WaveLoader
                  bars={8}
                  className="bg-primary"
                  message="Compiling FlytBase and Google Maps data..."
                  messagePlacement="bottom"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {TEMPLATES.map((template, idx) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative group bg-zinc-950/50 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 flex flex-col h-full transition-all duration-500 hover:border-primary/50 hover:bg-zinc-950 hover:shadow-[0_0_40px_rgba(44,123,242,0.1)] hover:-translate-y-1"
          >
            <div className="flex justify-center mb-8">
              <div className="p-4 rounded-2xl bg-white/5 text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-500">
                <template.icon className="w-8 h-8" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-black text-white mb-2">{template.title}</h3>
              <p className="text-xs text-zinc-500 font-medium">{template.subtitle}</p>
            </div>

            <div className="flex-grow">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Focus Analysis</p>
              <ul className="space-y-4 mb-8">
                {template.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-zinc-300 font-medium leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleGenerate(template.id)}
              disabled={!!isGenerating}
              className="w-full py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 bg-white border border-white/20 text-black hover:bg-zinc-100 hover:shadow-lg hover:shadow-white/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3 h-3" />
              Generate
            </button>
          </motion.div>
        ))}
      </div>

      {/* Custom + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-8 bg-zinc-950 border border-white/5 rounded-[2.5rem] p-10 md:p-12 relative overflow-visible"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Plus className="w-5 h-5 text-secondary" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Custom Strategy Report</h2>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                Need a targeted analysis? Define your date range and our AI will synthesize a custom flight efficacy report for your selected time range.
              </p>
            </div>

            <div className="flex flex-col items-end gap-6 w-full md:w-auto relative">
              <div className="flex flex-col gap-2 w-full sm:w-64">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Range Selection</label>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-primary outline-none transition-all w-full flex items-center justify-between group"
                >
                  <span className={dateRange.start ? "text-white" : "text-zinc-600"}>
                    {dateRange.start && dateRange.end
                      ? `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d, yyyy')}`
                      : "Select dates..."}
                  </span>
                  <Calendar className="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors" />
                </button>
              </div>

              {showDatePicker && (
                <div className="absolute top-full right-0 mt-4 z-[100] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <CustomDatePicker
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    onChange={(start, end) => setDateRange({ start, end })}
                    onClose={() => setShowDatePicker(false)}
                  />
                </div>
              )}

              <button
                onClick={handleBuildCustom}
                disabled={!dateRange.start || !dateRange.end || !!isGenerating}
                className="h-[46px] px-8 bg-zinc-100 text-zinc-950 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-secondary hover:text-on-secondary transition-all w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg hover:shadow-secondary/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Build Report
              </button>
            </div>
          </div>
        </motion.div>

        {/* Recent exports */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 bg-zinc-950/50 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-10 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Recent Exports
            </h2>
          </div>

          <div className="space-y-6 flex-grow">
            {reportsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse shrink-0" />
                  <div className="flex-grow space-y-2">
                    <div className="h-3 w-3/4 bg-zinc-800 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-zinc-800 rounded animate-pulse" />
                  </div>
                </div>
              ))
            ) : recentReports.length === 0 ? (
              <div className="flex items-center justify-center h-full py-8">
                <p className="text-zinc-600 text-xs uppercase tracking-widest font-bold text-center">No reports generated yet</p>
              </div>
            ) : (
              recentReports.map((report) => (
                <div key={report.id} className="group cursor-default">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-all shrink-0">
                      <FileText className="w-5 h-5 text-zinc-500 group-hover:text-primary" />
                    </div>
                    <div className="flex-grow overflow-hidden">
                      <p className="text-[10px] font-bold text-white uppercase tracking-wider truncate mb-1">{formatReportLabel(report)}</p>
                      <div className="flex items-center gap-2 text-[9px] text-zinc-600 font-medium">
                        <span>{formatReportMeta(report)}</span>
                        {report.storage_url && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-zinc-800" />
                            <a href={report.storage_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors">
                              <ExternalLink size={10} />
                              Open
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] text-center italic">
              Showing last 3 exports
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
