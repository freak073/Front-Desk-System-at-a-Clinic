import React, { useEffect, useState } from 'react';
import { Doctor } from '../../types';

interface DoctorScheduleFormProps {
  doctor: Doctor;
  onSave: (schedule: Record<string,{start:string;end:string;}>) => Promise<void> | void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}

const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const DoctorScheduleForm: React.FC<DoctorScheduleFormProps> = ({ doctor, onSave, onCancel, onDirtyChange }) => {
  const initial = doctor.availabilitySchedule || {};
  const [schedule, setSchedule] = useState<Record<string,{start:string;end:string;}>>(()=> ({...initial}));
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(schedule) !== JSON.stringify(initial);
  useEffect(()=> { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);

  const updateDay = (day: string, field: 'start'|'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { start: field==='start'? value : (prev[day]?.start||''), end: field==='end'? value : (prev[day]?.end||'') }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(schedule);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e)=> { e.preventDefault(); handleSave(); }} aria-label="Doctor schedule form">
      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2">
        {days.map(day => {
          const val = schedule[day] || { start:'', end:'' };
          return (
            <div key={day} className="flex items-center gap-2 text-sm">
              <div className="w-24 font-medium">{day}</div>
              <input
                type="time"
                aria-label={`${day} start`}
                value={val.start}
                onChange={e=> updateDay(day,'start', e.target.value)}
                className="border rounded px-2 py-1 text-xs"
              />
              <span className="text-gray-500">to</span>
              <input
                type="time"
                aria-label={`${day} end`}
                value={val.end}
                onChange={e=> updateDay(day,'end', e.target.value)}
                className="border rounded px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={()=> setSchedule(prev => {
                  const next = { ...prev }; delete next[day]; return next;
                })}
                aria-label={`Clear ${day}`}
                className="ml-2 text-xs text-gray-500 hover:text-gray-800"
              >Clear</button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
        <button disabled={!dirty || saving} type="submit" className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded disabled:opacity-50">{saving? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
};

export default DoctorScheduleForm;
