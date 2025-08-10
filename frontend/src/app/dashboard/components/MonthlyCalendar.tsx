"use client";
import React, { useMemo, useState } from 'react';
import { Appointment } from '../../../types';

interface Props {
  appointments: Appointment[];
  month: number; // 0-11
  year: number;
  onSelectAppointment?: (appt: Appointment) => void;
  onMonthChange?: (year: number, month: number) => void; // optional external handler
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}
function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const MonthlyCalendar: React.FC<Props> = ({
  appointments,
  month: controlledMonth,
  year: controlledYear,
  onSelectAppointment,
  onMonthChange,
}) => {
  const [internalYear, setInternalYear] = useState(controlledYear);
  const [internalMonth, setInternalMonth] = useState(controlledMonth);
  // If parent changes props, sync internal state
  React.useEffect(()=> { setInternalYear(controlledYear); setInternalMonth(controlledMonth); }, [controlledYear, controlledMonth]);
  const month = internalMonth;
  const year = internalYear;
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [focusDay, setFocusDay] = useState<number | null>(null);
  const first = startOfMonth(year, month);
  const dim = daysInMonth(year, month);
  const leadingBlanks = first.getDay();

  const apptsByDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach((a) => {
      const d = new Date(a.appointmentDatetime);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const key = d.getDate().toString();
        map[key] = map[key] || [];
        map[key].push(a);
      }
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) =>
        a.appointmentDatetime.localeCompare(b.appointmentDatetime)
      )
    );
    return map;
  }, [appointments, month, year]);

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < leadingBlanks; i++) {
  cells.push(<td key={'blank-' + i} className="h-28 border border-gray-700 rounded bg-surface-800" />);
  }

  for (let day = 1; day <= dim; day++) {
    const appts = apptsByDay[day.toString()] || [];
    const dateKey = `${year}-${month + 1}-${day}`;
    const isActive = activeDate === dateKey;

    cells.push(
      <td key={dateKey} className="relative align-top p-0">
        <button
          type="button"
          className="h-28 border border-gray-700 rounded p-1 flex flex-col text-xs group focus:outline-none focus:ring-2 focus:ring-accent-500 text-left w-full bg-surface-800 hover:bg-surface-700"
          aria-label={`Day ${day} with ${appts.length} appointments`}
          tabIndex={focusDay === day || (focusDay === null && day === 1) ? 0 : -1}
          onFocus={()=> setFocusDay(day)}
          onKeyDown={(e) => {
            const move = (targetDay: number) => {
              setFocusDay(targetDay);
              requestAnimationFrame(()=>{
                const el = document.querySelector<HTMLButtonElement>(`button[data-day='${targetDay}']`);
                el?.focus();
              });
            };
            if (e.key === 'ArrowRight' && day + 1 <= dim) { e.preventDefault(); move(day + 1); }
            else if (e.key === 'ArrowLeft' && day - 1 >= 1) { e.preventDefault(); move(day - 1); }
            else if (e.key === 'ArrowDown' && day + 7 <= dim) { e.preventDefault(); move(day + 7); }
            else if (e.key === 'ArrowUp' && day - 7 >= 1) { e.preventDefault(); move(day - 7); }
            else if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveDate(prev => prev === dateKey ? null : dateKey);
              if (appts.length === 1 && onSelectAppointment) onSelectAppointment(appts[0]);
            }
          }}
          data-day={day}
          onClick={() => {
            setActiveDate((prev) => (prev === dateKey ? null : dateKey));
            if (appts.length === 1 && onSelectAppointment) {
              onSelectAppointment(appts[0]);
            }
          }}
        >
          <div className="text-[11px] font-medium mb-1 text-gray-300">{day}</div>
          <div className="space-y-0.5 overflow-hidden">
            {appts.slice(0, 3).map((a) => {
              const timeLabel = new Date(a.appointmentDatetime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={a.id}
                  className={`block w-full text-left truncate rounded px-1 py-0.5 border ${
                    a.status === 'canceled'
                      ? 'bg-red-900/30 border-red-600/40 text-red-200'
                      : 'bg-accent-600/20 border-accent-500/40 text-accent-200'
                  }`}
                  aria-label={`Appointment at ${timeLabel} for ${a.patient?.name || 'Patient'}`}
                >
                  {timeLabel} {a.patient?.name || ''}
                </div>
              );
            })}
            {appts.length > 3 && (
              <div className="text-[10px] text-gray-500">
                +{appts.length - 3} more
              </div>
            )}
          </div>
        </button>

        {isActive && appts.length > 1 && (
          <div className="absolute z-20 top-full left-0 mt-1 w-56 bg-surface-900 shadow-lg border border-gray-700 rounded p-2 text-xs" aria-label={`Appointments for day ${day}`}>
            <ul className="space-y-1 max-h-48 overflow-y-auto" aria-label="Appointment list for selected day">
              {appts.map((a) => {
                const timeLabel = new Date(a.appointmentDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <li key={a.id}>
                    <button type="button" onClick={() => onSelectAppointment?.(a)} className="w-full text-left hover:underline text-gray-200" aria-label={`Select appointment at ${timeLabel} for ${a.patient?.name || 'Patient'}`}> {timeLabel} – {a.patient?.name || 'Patient'} ({a.status})</button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </td>
    );
  }

  // chunk cells into rows of 7
  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
  <div className="w-full" aria-label="Monthly calendar">
      <div className="flex items-center justify-between mb-3" aria-label="Calendar navigation">
        <button
          type="button"
          aria-label="Previous month"
          className="px-2 py-1 text-xs bg-surface-700 rounded hover:bg-surface-600 text-gray-200"
          onClick={() => {
            const newMonth = month - 1 < 0 ? 11 : month - 1;
            const newYear = month - 1 < 0 ? year - 1 : year;
            setInternalMonth(newMonth); setInternalYear(newYear); setActiveDate(null);
            onMonthChange?.(newYear, newMonth);
          }}
        >
          ◀
        </button>
  <div className="text-sm font-medium text-gray-200" aria-label="Current month label">
          {new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </div>
        <button
          type="button"
          aria-label="Next month"
          className="px-2 py-1 text-xs bg-surface-700 rounded hover:bg-surface-600 text-gray-200"
          onClick={() => {
            const newMonth = month + 1 > 11 ? 0 : month + 1;
            const newYear = month + 1 > 11 ? year + 1 : year;
            setInternalMonth(newMonth); setInternalYear(newYear); setActiveDate(null);
            onMonthChange?.(newYear, newMonth);
          }}
        >
          ▶
        </button>
      </div>
      <table className="w-full border-collapse" aria-label="Calendar dates">
        <thead>
          <tr>
            {dayNames.map(d => <th key={d} scope="col" className="text-center text-xs font-semibold uppercase tracking-wide text-gray-400 p-1">{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={'row-'+(r[0] as any)?.key+ '-' + i} className="align-top">
              {r}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonthlyCalendar;
