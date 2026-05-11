import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Map as MapIcon, FileEdit, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useGtlHttp } from "../lib/useGtlHttp";

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    hasUnsavedChanges,
    commitChanges,
    restoreDefaults
  } = useSettings();

  const http = useGtlHttp();

  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleCommit = async () => {
    if (!hasUnsavedChanges || isSaving) return;
    setIsSaving(true);

    try {
      // Persist to backend
      await http.put('/settings', {
        post_flight_auth: settings.postFlightAuth,
        show_map_visual: settings.showMapVisual,
        report_prompt: settings.reportPrompt,
      });
    } catch (err) {
      console.error('[SettingsPage commit]', err);
    } finally {
      setIsSaving(false);
    }

    // Always commit locally too
    commitChanges();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-l-4 border-primary pl-6 py-2">
        <h1 className="text-4xl font-headline font-black tracking-tighter text-on-surface uppercase italic">
          System Configuration
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Post-flight authentication */}
        <div className="flex flex-col gap-4 p-6 bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield size={80} className="text-primary" />
          </div>
          
          <div className="flex justify-between items-start gap-4 mb-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-primary uppercase">
                <Shield size={12} />
                <span>Data Authenticity</span>
              </div>
              <h2 className="text-xl font-bold text-on-surface">Post-flight Authentication</h2>
            </div>
            
            <button 
              onClick={() => updateSettings({ postFlightAuth: !settings.postFlightAuth })}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 flex items-center px-1 border backdrop-blur-md shadow-2xl ${
                settings.postFlightAuth 
                ? "bg-primary/40 border-primary/50 shadow-[0_0_15px_rgba(44,123,242,0.3)]" 
                : "bg-white/5 border-white/10 shadow-inner"
              }`}
            >
              <motion.div 
                animate={{ x: settings.postFlightAuth ? 24 : 0 }}
                className="w-4 h-4 bg-white/90 rounded-full shadow-lg"
              />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-400 leading-relaxed font-body italic">
              Enables a mandatory verification bridge between flight completion and dashboard ingestion. 
              When active, logs remain in a holding state until the pilot confirms data parity between telemetry 
              and Google Maps via email alert.
            </p>
          </div>

          {!settings.postFlightAuth && (
            <div className="py-2 px-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex items-center gap-3">
              <Info size={14} className="text-yellow-500 shrink-0" />
              <p className="text-[10px] font-medium text-yellow-500/80 uppercase tracking-wider">
                Direct Sync Enabled: Data bypasses validation.
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
            <div className="p-2 h-max bg-red-500/10 rounded-lg text-red-500">
              <AlertTriangle size={16} />
            </div>
            <p className="text-[11px] italic font-medium text-zinc-500 leading-normal">
              * Critical: Until and unless a flight has been acknowledged via the post flight authentication, 
              it will remain in the holding state and will not be populated in the main analytics dashboard.
            </p>
          </div>
        </div>

        {/* Section 2: Google Maps Visual */}
        <div className="flex flex-col gap-4 p-6 bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MapIcon size={80} className="text-primary" />
          </div>

          <div className="flex justify-between items-start gap-4 mb-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-primary uppercase">
                <MapIcon size={12} />
                <span>Visualization Layers</span>
              </div>
              <h2 className="text-xl font-bold text-on-surface">Time-to-Target Visuals</h2>
            </div>
            
            <button 
              onClick={() => updateSettings({ showMapVisual: !settings.showMapVisual })}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 flex items-center px-1 border backdrop-blur-md shadow-2xl ${
                settings.showMapVisual 
                ? "bg-primary/40 border-primary/50 shadow-[0_0_15px_rgba(44,123,242,0.3)]" 
                : "bg-white/5 border-white/10 shadow-inner"
              }`}
            >
              <motion.div 
                animate={{ x: settings.showMapVisual ? 24 : 0 }}
                className="w-4 h-4 bg-white/90 rounded-full shadow-lg"
              />
            </button>
          </div>

          <p className="text-sm text-zinc-400 leading-relaxed font-body italic mb-auto">
            Toggle the Google Maps overlay on the flight page. 
            When enabled, a map visual calculating real-time route 
            that will be visible in the primary observation deck.
          </p>

          <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/20 rounded-full w-max mt-4">
            <div className={`w-1.5 h-1.5 rounded-full ${settings.showMapVisual ? "bg-primary animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-zinc-700"}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">
              {settings.showMapVisual ? "Map Overlay: Active" : "Map Overlay: Offline"}
            </span>
          </div>
        </div>

        {/* Section 3: AI Prompt Generator */}
        <div className="lg:col-span-2 flex flex-col gap-6 p-8 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl relative">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.4em] text-primary uppercase">
              <FileEdit size={14} />
              <span>AI Engine Configuration</span>
            </div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight uppercase italic">Report Generator Prompt</h2>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-2xl italic pl-4 border-l border-primary/40">
              Modify the primary instruction set fed to the FlytBases' tactical agent. 
              This prompt dictates the tone, focus parameters, and depth of all generated mission summaries.
            </p>

            <div className="relative">
              <textarea
                value={settings.reportPrompt}
                onChange={(e) => updateSettings({ reportPrompt: e.target.value })}
                rows={4}
                className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl p-8 pt-10 text-sm font-mono text-zinc-300 focus:outline-none focus:border-primary/50 transition-all resize-none shadow-inner"
              />
              <div className="absolute bottom-4 right-6 flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-help group">
                <Info size={12} className="text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-primary transition-colors">
                  Recommended: Stay below 2048 tokens
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-4 pt-4 border-t border-white/5 relative">
            <div className="flex gap-4">
              <button 
                onClick={restoreDefaults}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 transition-all active:scale-95"
              >
                Restore Defaults
              </button>
              
              <button
                disabled={!hasUnsavedChanges || isSaving}
                onClick={handleCommit}
                className={`px-8 py-3 backdrop-blur-xl border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 group overflow-hidden relative active:scale-95 ${
                  hasUnsavedChanges && !isSaving
                  ? "bg-[#0a192f]/60 hover:bg-[#0a192f]/80 text-primary/90 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] cursor-pointer"
                  : "bg-zinc-800/40 text-zinc-600 border-white/5 cursor-not-allowed"
                }`}
              >
                <span className="relative z-10">{isSaving ? "Saving..." : "Commit Changes"}</span>
                {hasUnsavedChanges && !isSaving && <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />}
              </button>
            </div>

            {/* Success Deployment Notification */}
            <AnimatePresence>
              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="flex items-center gap-2 py-2 px-4 bg-primary/10 border border-primary/20 rounded-full shadow-[0_0_20px_rgba(44,123,242,0.1)]"
                >
                  <CheckCircle size={14} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary italic">Changes are deployed.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Decorative Grid Background Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-5 overflow-hidden z-[-1]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#2c7bf2_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>
    </div>
  );
}
