import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Filter, ChevronDown, Check } from "lucide-react";
import { useGtlHttp } from "@/lib/useGtlHttp";

interface DroneOption {
  drone_id: string;
  drone_name: string;
  dock_name: string;
}

interface StatsFilterProps {
  activeTimeRange: string;
  onApply: (filters: { drone_id: string; duration?: string }) => void;
}

export default function StatsFilter({ activeTimeRange, onApply }: StatsFilterProps) {
  const http = useGtlHttp();
  const [isOpen, setIsOpen] = useState(false);
  const [drones, setDrones] = useState<DroneOption[]>([]);
  // "" = All Drones (default — no filter applied)
  const [pendingDevice, setPendingDevice] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch real drones from backend
  useEffect(() => {
    http.get("/drones")
      .then((res: any) => {
        const list: DroneOption[] = (res.data?.drones ?? []).map((d: any) => ({
          drone_id: d.drone_id,
          drone_name: d.drone_name ?? d.drone_id,
          dock_name: d.dock_name ?? "",
        }));
        setDrones(list);
        // Don't auto-select — keep "" so "All Drones" is the default
      })
      .catch((err: any) => console.error("[StatsFilter drones]", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => {
    onApply({ drone_id: pendingDevice, duration: activeTimeRange });
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-5 py-2.5 bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-2xl text-[10px] font-bold text-white uppercase tracking-widest hover:border-primary/50 transition-all shadow-xl"
      >
        <Filter className="w-3.5 h-3.5" />
        Filters
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full z-[100] w-80 mt-2 bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden"
            style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)" }}
          >
            {/* Frosty Glossy Overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />
            <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.4)]" />

            <div className="relative z-10 space-y-6">
              {/* Device Section */}
              <div>
                <label className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] mb-4 block">
                  Select Device
                </label>

                {drones.length === 0 ? (
                  <div className="px-3 py-4 text-[11px] text-zinc-500 text-center">
                    Loading drones…
                  </div>
                ) : (
                  <div className="space-y-1 -mx-2">
                    {/* All Drones option */}
                    {[{ drone_id: "", drone_name: "All Drones", dock_name: "No filter applied" }, ...drones].map((drone) => {
                      const isActive = pendingDevice === drone.drone_id;
                      return (
                        <div
                          key={drone.drone_id || "__all__"}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl group cursor-pointer transition-all ${
                            isActive
                              ? "bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                              : "hover:bg-white/5"
                          }`}
                          onClick={() => setPendingDevice(drone.drone_id)}
                        >
                          <div className="flex flex-col">
                            <span className={`text-[11px] font-bold transition-colors ${isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}>
                              {drone.drone_name}
                            </span>
                            {drone.dock_name && (
                              <span className="text-[9px] text-zinc-600 font-medium mt-0.5">
                                {drone.dock_name}
                              </span>
                            )}
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${
                            isActive
                              ? "border-primary bg-primary shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                              : "border-zinc-700 bg-transparent"
                          }`}>
                            {isActive && <Check className="w-2.5 h-2.5 text-on-primary" strokeWidth={5} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Apply Button */}
              <button
                onClick={handleApply}
                className="w-full py-3 bg-primary hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
