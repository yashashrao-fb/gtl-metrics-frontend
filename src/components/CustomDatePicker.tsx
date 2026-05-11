import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval, 
  isAfter, 
  isBefore,
  isWithinInterval
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DatePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  onClose?: () => void;
}

export default function CustomDatePicker({ startDate, endDate, onChange, onClose }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const nextMonth = addMonths(currentMonth, 1);

  const handleDateClick = (day: Date) => {
    if (!startDate || (startDate && endDate)) {
      onChange(day, null);
    } else if (isBefore(day, startDate)) {
      onChange(day, null);
    } else {
      onChange(startDate, day);
    }
  };

  const renderHeader = (month: Date, onPrev?: () => void, onNext?: () => void) => (
    <div className="flex items-center justify-between px-2 mb-4">
      {onPrev ? (
        <button onClick={onPrev} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-4 h-4 text-zinc-400" />
        </button>
      ) : <div className="w-6" />}
      
      <span className="text-sm font-bold text-white tracking-tight">
        {format(month, 'MMMM yyyy')}
      </span>

      {onNext ? (
        <button onClick={onNext} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <ChevronRight className="w-4 h-4 text-zinc-400" />
        </button>
      ) : <div className="w-6" />}
    </div>
  );

  const renderDays = () => {
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(monthStart);
    const startDateView = startOfWeek(monthStart);
    const endDateView = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDateView;
    let formattedDate = "";

    while (day <= endDateView) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const isSelected = (startDate && isSameDay(day, startDate)) || (endDate && isSameDay(day, endDate));
        const isInRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate });
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={`relative h-10 flex items-center justify-center cursor-pointer text-xs font-medium transition-all group
              ${!isCurrentMonth ? 'text-zinc-700' : 'text-zinc-300 hover:text-white'}
              ${isInRange && !isSelected ? 'bg-zinc-800/50' : ''}
              ${isSelected ? 'z-10' : ''}
            `}
            onClick={() => handleDateClick(cloneDay)}
          >
            {isSelected && (
              <motion.div 
                layoutId="activeRange"
                className="absolute inset-2 bg-zinc-100 rounded-lg -z-10"
                initial={false}
              />
            )}
            <span className={`${isSelected ? 'text-zinc-950 font-bold' : ''}`}>
              {formattedDate}
            </span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="body">{rows}</div>;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="bg-zinc-950 border border-white/10 rounded-[2rem] p-6 shadow-2xl overflow-hidden z-50 min-w-[600px]"
    >
      <div className="flex gap-8">
        <div className="flex-1">
          {renderHeader(currentMonth, () => setCurrentMonth(subMonths(currentMonth, 1)))}
          {renderDays()}
          {renderCells(currentMonth)}
        </div>
        <div className="w-[1px] bg-white/5 self-stretch" />
        <div className="flex-1">
          {renderHeader(nextMonth, undefined, () => setCurrentMonth(addMonths(currentMonth, 1)))}
          {renderDays()}
          {renderCells(nextMonth)}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Start Date</span>
            <span className="text-xs text-white font-bold">{startDate ? format(startDate, 'MMM d, yyyy') : '—'}</span>
          </div>
          <div className="w-4 h-[1px] bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">End Date</span>
            <span className="text-xs text-white font-bold">{endDate ? format(endDate, 'MMM d, yyyy') : '—'}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onClose}
            disabled={!startDate || !endDate}
            className="px-6 py-2 bg-primary text-on-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-all disabled:opacity-50 disabled:hover:bg-primary"
          >
            Apply Range
          </button>
        </div>
      </div>
    </motion.div>
  );
}
