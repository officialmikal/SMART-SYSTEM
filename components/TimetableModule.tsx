
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Printer, Filter, BookOpen } from 'lucide-react';
import { TimetableEntry, KENYAN_CLASSES, SCHOOL_STREAMS } from '../types';
import { schoolService } from '../services/schoolService';
import { Language, translations } from '../services/localizationService';

export const TimetableModule: React.FC<{ lang: Language }> = ({ lang }) => {
  const t = translations[lang];
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [selectedClass, setSelectedClass] = useState('Grade 7');
  const [selectedStream, setSelectedStream] = useState('Eagle');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [isLoading, setIsLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['08:00', '08:40', '09:20', '10:00', '10:30', '11:10', '11:50', '12:30', '13:30', '14:10', '14:50'];

  useEffect(() => {
    setIsLoading(true);
    schoolService.getTimetable(`${selectedClass} ${selectedStream}`)
      .then(data => {
        setEntries(data);
        setIsLoading(false);
      });
  }, [selectedClass, selectedStream]);

  const getEntry = (day: string, time: string) => {
    return entries.find(e => e.day === day && e.time === time);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'STEM': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Languages': return 'bg-green-50 text-green-700 border-green-100';
      case 'Arts': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Technical': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Social': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Break': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">School Timetable (TT)</h1>
          <p className="text-gray-500 font-medium">Weekly learning area allocation for {selectedClass} {selectedStream}.</p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <select 
            value={selectedClass} 
            onChange={e => setSelectedClass(e.target.value)}
            className="p-2.5 border rounded-xl text-xs font-black uppercase bg-white shadow-sm"
          >
            {KENYAN_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
          </select>
          <select 
            value={selectedStream} 
            onChange={e => setSelectedStream(e.target.value)}
            className="p-2.5 border rounded-xl text-xs font-black uppercase bg-white shadow-sm"
          >
            {SCHOOL_STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button 
            onClick={() => window.print()}
            className="flex items-center space-x-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-black transition shadow-lg font-bold"
          >
            <Printer className="w-4 h-4" />
            <span className="text-sm">Print TT</span>
          </button>
        </div>
      </div>

      {/* Mobile Day Selector */}
      <div className="md:hidden flex space-x-2 overflow-x-auto pb-2 no-print">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${selectedDay === day ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-500 border'}`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Desktop Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 border-r w-32 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Time Slot</th>
                {days.map(day => (
                  <th key={day} className={`p-4 border-r min-w-[160px] text-[10px] font-black uppercase tracking-widest text-center transition-colors md:table-cell ${selectedDay === day ? 'bg-blue-50 text-blue-700' : 'text-gray-400 hidden'}`}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, timeIdx) => (
                <tr key={time} className="border-b group">
                  <td className="p-4 border-r text-center font-black text-gray-800 flex flex-col items-center justify-center">
                    <Clock className="w-3 h-3 mb-1 text-gray-300" />
                    <span className="text-xs">{time}</span>
                  </td>
                  {days.map(day => {
                    const entry = getEntry(day, time);
                    const isBreak = entry?.category === 'Break';
                    return (
                      <td 
                        key={`${day}-${time}`} 
                        className={`p-2 border-r transition-all md:table-cell ${selectedDay === day ? 'table-cell' : 'hidden'} ${isBreak ? 'bg-gray-50/50' : ''}`}
                      >
                        {entry ? (
                          <div className={`h-full p-3 rounded-xl border-2 transition-all ${getCategoryColor(entry.category)} ${!isBreak ? 'shadow-sm hover:shadow-md' : ''}`}>
                            <div className="font-black text-[11px] uppercase tracking-tight mb-1">{entry.subject}</div>
                            {!isBreak && (
                              <div className="flex items-center gap-1.5 opacity-70">
                                <User className="w-3 h-3" />
                                <span className="text-[9px] font-bold uppercase">{entry.teacher}</span>
                              </div>
                            )}
                            {isBreak && <div className="text-[9px] font-bold uppercase text-center py-2 italic opacity-50 tracking-[0.2em]">RECESS</div>}
                          </div>
                        ) : (
                          <div className="h-full border-2 border-dashed border-gray-100 rounded-xl min-h-[60px]"></div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 no-print">
        {[
          { label: 'STEM', color: 'bg-blue-50 text-blue-700' },
          { label: 'Languages', color: 'bg-green-50 text-green-700' },
          { label: 'Arts', color: 'bg-purple-50 text-purple-700' },
          { label: 'Technical', color: 'bg-amber-50 text-amber-700' },
          { label: 'Humanities', color: 'bg-rose-50 text-rose-700' }
        ].map(legend => (
          <div key={legend.label} className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase text-center border shadow-sm ${legend.color}`}>
            {legend.label}
          </div>
        ))}
      </div>
    </div>
  );
};
