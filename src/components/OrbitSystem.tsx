import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useAnimationFrame } from "motion/react";
import { Home, Map, User, Settings, FileText, TrendingUp, Lock } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

function DroneIcon({ className }: { className?: string }) {
  return (
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
}

export interface OrbitKpis {
  outer: { title: string; value: string; subtitle: string };
  middle: { title: string; value: string; subtitle: string };
  inner: { title: string; value: string; subtitle: string };
}

interface OrbitSystemProps {
  onShowMetric: (title: string, value: string, subtitle: string, style: "vertical" | "radial" | "horizontal") => void;
  onNavigate?: (page: string) => void;
  mode?: "radar" | "global";
  activePage?: string;
  kpis?: OrbitKpis;
}

interface RadialItem {
  icon: any;
  label: string;
  path: string;
}

const RADIAL_ITEMS: RadialItem[] = [
  { icon: Home, label: "Home", path: "dashboard" },
  { icon: DroneIcon, label: "Flight Data", path: "flight-data" },
  { icon: Map, label: "Post Flight Authentication", path: "post-flight-auth" },
  { icon: Settings, label: "System Settings", path: "settings" },
  { icon: TrendingUp, label: "Statistics", path: "statistics" },
  { icon: User, label: "Account", path: "account" },
  { icon: FileText, label: "Reports", path: "reports" },
];

interface RadialButtonProps {
  item: RadialItem;
  index: number;
  isExpanded: boolean;
  onNavigate?: (page: string) => void;
  onAccountClick?: () => void;
  key?: any;
}

function RadialButton({ item, index, isExpanded, onNavigate, onAccountClick, totalItems, mode }: RadialButtonProps & { totalItems: number, mode: "radar" | "global" }) {
  const [isHovered, setIsHovered] = useState(false);
  const { activeSettings } = useSettings();

  const isDisabled = item.path === "post-flight-auth" && !activeSettings.postFlightAuth;
  
  // Positioning calculation based on mode
  let x = 0;
  let y = 0;

  if (mode === "radar") {
    const angle = (index * (360 / totalItems) - 90) * (Math.PI / 180);
    const radius = 160;
    x = Math.cos(angle) * radius;
    y = Math.sin(angle) * radius;
  } else {
    // Top-Right Global Mode: Straight vertical line below cross
    x = 0;
    y = (index + 1) * 54; // Equally spaced vertically, tightened for closer grouping
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) return;
    
    if (item.path === "account") {
      onAccountClick?.();
    } else if (item.path !== "#") {
      onNavigate?.(item.path);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
      animate={{ opacity: 1, x, y, scale: 1 }}
      exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
      transition={{ 
        delay: index * 0.04, 
        type: "spring", 
        stiffness: 400, 
        damping: 25,
        mass: 0.6
      }}
      className="absolute top-1/2 left-1/2 -ml-6 -mt-6 pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button 
        onClick={handleClick}
        disabled={isDisabled}
        className={`w-12 h-12 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative group ${
          isDisabled 
          ? "opacity-30 cursor-not-allowed grayscale border-zinc-800" 
          : "text-zinc-400 hover:text-secondary hover:border-secondary cursor-pointer"
        }`}
      >
        <item.icon className={`w-5 h-5 transition-transform ${!isDisabled ? "group-hover:scale-110" : ""}`} />
        {isDisabled && <Lock size={10} className="absolute bottom-2 right-2 text-zinc-500" />}
        
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: mode === "global" ? 10 : 0, y: mode === "global" ? 0 : 10, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                x: mode === "global" ? -80 : 0, 
                y: mode === "global" ? 0 : -45, 
                scale: 1 
              }}
              exit={{ opacity: 0, x: mode === "global" ? 10 : 0, y: mode === "global" ? 0 : 10, scale: 0.8 }}
              className={`absolute whitespace-nowrap bg-zinc-900 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border border-white/10 shadow-xl pointer-events-none z-[100] ${isDisabled ? "text-zinc-500" : ""}`}
            >
              {item.label} {isDisabled && " (Protocol Offline)"}
              <div className={`absolute ${
                mode === "global" 
                  ? "right-[-4px] top-1/2 -mt-1 border-t border-r" 
                  : "bottom-[-4px] left-1/2 -ml-1 border-r border-b"
              } w-2 h-2 bg-zinc-900 border-white/10 rotate-45`} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

function OrbitingDrone({ 
  radius, 
  duration, 
  reverse = false, 
  sweepAngle, 
  icon: Icon
}: { 
  radius: number; 
  duration: number; 
  reverse?: boolean; 
  sweepAngle: number;
  icon: any;
}) {
  const [currentAngle, setCurrentAngle] = useState(0);
  
  useAnimationFrame((time) => {
    const period = duration * 1000;
    const progress = (time % period) / period;
    const angle = (reverse ? (1 - progress) : progress) * 360;
    setCurrentAngle(angle % 360);
  });

  const diff = Math.abs(sweepAngle - currentAngle);
  const isHit = diff < 15 || diff > 345;

  return (
    <motion.div 
      className="absolute flex items-center justify-center pointer-events-none"
      style={{ 
        width: radius * 2, 
        height: radius * 2,
        rotate: currentAngle
      }}
    >
      <div className="absolute top-0 -translate-y-1/2 flex flex-col items-center">
        <motion.div
          animate={{
            scale: isHit ? 1.15 : 1,
            boxShadow: isHit 
              ? "0 0 25px rgba(44,123,242,0.8), 0 0 10px rgba(44,123,242,0.4)" 
              : "0 0 15px rgba(44,123,242,0.1)",
            backgroundColor: isHit ? "rgba(44,123,242,0.15)" : "rgba(10,25,47,0.8)"
          }}
          className="p-1 md:p-1.5 rounded-full border border-primary/30 flex items-center justify-center transition-all duration-500"
        >
          <Icon 
            className={`w-3 h-3 md:w-5 md:h-5 transition-colors duration-500 ${isHit ? "text-white" : "text-primary/60"}`} 
          />
        </motion.div>
        
        <AnimatePresence>
          {isHit && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute w-full h-full rounded-full border border-primary/40 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function OrbitSystem({ onShowMetric, onNavigate, mode = "radar", activePage, kpis }: OrbitSystemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sweepAngle, setSweepAngle] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const toggleRadial = () => {
    setIsExpanded(!isExpanded);
    if (showLogoutConfirm) setShowLogoutConfirm(false);
  };

  useAnimationFrame((time) => {
    if (isExpanded) return;
    const sweepDuration = 8000;
    setSweepAngle(((time % sweepDuration) / sweepDuration) * 360);
  });

  const isRadar = mode === "radar";

  const triggerButton = (
    <button
      onClick={toggleRadial}
      className={`relative z-[70] transition-all duration-500 flex items-center justify-center border hover:scale-105 active:scale-95 ${
        isRadar ? "w-12 h-12 md:w-16 md:h-16" : "w-8 h-8"
      } rounded-full ${
        isExpanded 
        ? "bg-zinc-800 border-white/20 shadow-xl" 
        : "bg-zinc-900 border-primary/40 shadow-[0_0_30px_rgba(44,123,242,0.25)] hover:border-primary group"
      }`}
    >
      <div className={`relative ${isRadar ? "w-5 h-3.5" : "w-3.5 h-2"}`}>
        <motion.div 
          initial={false}
          animate={{ 
            rotate: isExpanded ? 45 : 0, 
            y: isExpanded ? (isRadar ? 7 : 4) : 0 
          }}
          className={`absolute top-0 ${isRadar ? "w-5" : "w-3.5"} h-0.5 rounded-full transition-colors ${isExpanded ? "bg-white" : "bg-primary shadow-[0_0_8px_rgba(255,255,255,0.6)]"}`}
        />
        <motion.div 
          initial={false}
          animate={{ opacity: isExpanded ? 0 : 1 }}
          className={`absolute top-[5px] ${isRadar ? "w-5" : "w-3.5"} h-0.5 rounded-full transition-colors ${isExpanded ? "bg-white" : "bg-primary shadow-[0_0_8px_rgba(255,255,255,0.6)]"}`}
        />
        <motion.div 
          initial={false}
          animate={{ 
            rotate: isExpanded ? -45 : 0, 
            y: isExpanded ? (isRadar ? -7 : -4) : 0 
          }}
          className={`absolute bottom-0 ${isRadar ? "w-5" : "w-3.5"} h-0.5 rounded-full transition-colors ${isExpanded ? "bg-white" : "bg-primary shadow-[0_0_8px_rgba(255,255,255,0.6)]"}`}
        />
      </div>
      {!isExpanded && (
        <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
      )}
    </button>
  );

  return (
    <div className={`transition-all duration-500 ${
      isRadar 
        ? "relative w-[300px] h-[300px] md:w-[600px] md:h-[600px]" 
        : "fixed top-6 right-10 w-8 h-8"
    } flex items-center justify-center z-[150]`}>
      
      {!isExpanded && (
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
          !isRadar ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}>
          <div className="absolute w-full h-px bg-primary/5 pointer-events-none" />
          <div className="absolute h-full w-px bg-primary/5 pointer-events-none" />
          
          {[100, 200, 300, 400, 500, 600].map((size) => (
            <div 
              key={size}
              className="absolute border border-primary/5 rounded-full pointer-events-none"
              style={{ width: size, height: size }}
            />
          ))}

          {isRadar && (
            <motion.div 
              className="absolute w-full h-full rounded-full pointer-events-none opacity-30 overflow-hidden"
              style={{ rotate: sweepAngle }}
            >
              <div 
                className="absolute inset-0"
                style={{
                  background: "conic-gradient(from 268deg, rgba(44,123,242,0.2) 0deg, transparent 45deg)"
                }}
              />
              <div className="absolute top-0 bottom-1/2 left-1/2 w-[1.5px] bg-primary/60 shadow-[0_0_15px_rgba(44,123,242,0.8)] -translate-x-1/2" />
            </motion.div>
          )}

          {isRadar && (
            <>
              <div
                onClick={() => {
                  const k = kpis?.outer ?? { title: "Flight Volume", value: "—", subtitle: "Total Missions" };
                  onShowMetric(k.title, k.value, k.subtitle, "vertical");
                }}
                className="absolute w-[500px] h-[500px] md:w-[600px] md:h-[600px] border border-white/5 rounded-full cursor-pointer hover:border-primary/20 transition-all duration-500 flex items-center justify-center"
              >
                <OrbitingDrone radius={300} duration={40} sweepAngle={sweepAngle} icon={DroneIcon} />
              </div>

              <div
                onClick={() => {
                  const k = kpis?.middle ?? { title: "Avg Response", value: "—", subtitle: "Seconds to Target" };
                  onShowMetric(k.title, k.value, k.subtitle, "radial");
                }}
                className="absolute w-[350px] h-[350px] md:w-[420px] md:h-[420px] border border-white/5 rounded-full cursor-pointer hover:border-primary/20 transition-all duration-500 flex items-center justify-center"
              >
                <OrbitingDrone radius={210} duration={30} reverse sweepAngle={sweepAngle} icon={DroneIcon} />
              </div>

              <div
                onClick={() => {
                  const k = kpis?.inner ?? { title: "Hours Saved", value: "—", subtitle: "Total vs Car" };
                  onShowMetric(k.title, k.value, k.subtitle, "horizontal");
                }}
                className="absolute w-[200px] h-[200px] md:w-[240px] md:h-[240px] border border-white/5 rounded-full cursor-pointer hover:border-primary/20 transition-all duration-500 flex items-center justify-center"
              >
                <OrbitingDrone radius={120} duration={20} sweepAngle={sweepAngle} icon={DroneIcon} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Primary Trigger when not expanded */}
      {!isExpanded && triggerButton}

      {/* Expanded View Portal - Covers EVERYTHING with solid background */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-[2000] bg-black ${isRadar ? "flex items-center justify-center" : ""}`}
              onClick={toggleRadial}
            >
              <div 
                className={`flex items-center justify-center ${isRadar ? "relative" : "absolute top-6 right-10 w-8 h-8"}`}
                onClick={e => e.stopPropagation()}
              >
                {RADIAL_ITEMS.map((item, index) => (
                  <RadialButton 
                    key={index} 
                    item={item} 
                    index={index} 
                    isExpanded={isExpanded} 
                    onNavigate={(page) => {
                      onNavigate?.(page);
                      setIsExpanded(false);
                    }}
                    onAccountClick={() => setShowLogoutConfirm(true)}
                    totalItems={RADIAL_ITEMS.length}
                    mode={mode}
                  />
                ))}
                {triggerButton}
              </div>

              {/* Logout Confirmation inside Portal for visibility */}
              <AnimatePresence>
                {showLogoutConfirm && (
                  <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-[2100] w-[280px] bg-zinc-900/95 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-5"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Authentication</span>
                      <span className="text-sm font-bold text-white">End Session?</span>
                    </div>
                    <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => {
                          console.log("Logged Out");
                          setShowLogoutConfirm(false);
                          setIsExpanded(false);
                        }}
                        className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-500 transition-all"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
