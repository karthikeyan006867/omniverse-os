'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const today = new Date();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const calendarDays = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="p-2"></div>);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

    calendarDays.push(
      <button
        key={day}
        onClick={() => setSelectedDate(date)}
        className={`p-2 rounded-lg transition-colors ${
          isToday ? 'bg-blue-600 text-white font-bold' : 
          isSelected ? 'bg-purple-600 text-white' :
          'hover:bg-gray-700'
        }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="h-full bg-gray-900 text-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-gray-400 font-semibold p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 flex-1">
        {calendarDays}
      </div>

      {/* Selected date info */}
      {selectedDate && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">Selected Date</p>
          <p className="text-lg font-bold">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      )}

      {/* Today button */}
      <button
        onClick={() => {
          setCurrentDate(new Date());
          setSelectedDate(new Date());
        }}
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
      >
        Today
      </button>
    </div>
  );
}
