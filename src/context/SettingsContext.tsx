import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Settings {
  postFlightAuth: boolean;
  showMapVisual: boolean;
  reportPrompt: string;
}

interface SettingsContextType {
  settings: Settings;           // draft (what's shown in UI)
  activeSettings: Settings;     // committed (what's used in logic)
  updateSettings: (newSettings: Partial<Settings>) => void;
  hasUnsavedChanges: boolean;
  commitChanges: () => void;
  restoreDefaults: () => void;
  loadSettings: (s: Settings) => void;  // load from backend without marking unsaved
}

export const DEFAULT_REPORT_PROMPT = `You are a drone operations analyst generating a professional PDF performance report for FlytBase.

Use the JSON metrics data provided to produce a structured report with the following sections:

1. COVER - Customer name, report period, generated date
2. EXECUTIVE SUMMARY (1 paragraph) - Total GTL events, completed vs failed, total time saved vs car
3. RESPONSE PERFORMANCE - Avg drone time-to-target, fastest/slowest response, avg time saved per incident
4. GROUND RESPONSE COMPARISON - Table: Drone vs Car vs Bike vs Walk; total time, time saved, efficiency %
5. ASSET BREAKDOWN (per drone) - Flights, avg response time, total minutes saved; highlight top performer
6. INCIDENT TYPE SPLIT - Alarm-triggered vs Manual GTL (count and %)
7. TREND ANALYSIS - Time-saved trend across the period; peak activity highlighted
8. NOTABLE FLIGHTS - Best single flight (most time saved); flagged/failed incidents
9. FLIGHT NOTES - Operator notes for verified flights in this period (if any)

Format as clean professional markdown suitable for PDF conversion. Use tables where appropriate. Be concise and data-driven.`;

export const INITIAL_SETTINGS: Settings = {
  postFlightAuth: false,
  showMapVisual: true,
  reportPrompt: DEFAULT_REPORT_PROMPT,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('flytbase_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [draftSettings, setDraftSettings] = useState<Settings>(settings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const isDifferent = JSON.stringify(settings) !== JSON.stringify(draftSettings);
    setHasUnsavedChanges(isDifferent);
  }, [settings, draftSettings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setDraftSettings(prev => ({ ...prev, ...newSettings }));
  };

  const commitChanges = () => {
    setSettings(draftSettings);
    localStorage.setItem('flytbase_settings', JSON.stringify(draftSettings));
    setHasUnsavedChanges(false);
  };

  const restoreDefaults = () => {
    setDraftSettings(INITIAL_SETTINGS);
  };

  /** Load settings from the backend without triggering "unsaved changes" */
  const loadSettings = (s: Settings) => {
    setSettings(s);
    setDraftSettings(s);
    localStorage.setItem('flytbase_settings', JSON.stringify(s));
  };

  return (
    <SettingsContext.Provider value={{
      settings: draftSettings,
      activeSettings: settings,
      updateSettings,
      hasUnsavedChanges,
      commitChanges,
      restoreDefaults,
      loadSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
