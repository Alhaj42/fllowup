import React, { useState, useEffect } from 'react';
import TimelineService from '../services/timelineService';
import { api } from '../services/api';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  resourceType: 'PROJECT' | 'PHASE' | 'TASK';
}

interface CalendarViewProps {
  year?: number;
  month?: number;
}

export default function CalendarView({ year, month }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [view, setView] = useState<'month' | 'week'>('month');

  // Initialize to current month if not provided
  useEffect(() => {
    if (year && month) {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  }, [year, month]);

  useEffect(() => {
    loadEvents();
  }, [currentDate, view]);

  const loadEvents = async () => {
    setLoading(true);
    setError('');

    try {
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      if (view === 'month') {
        const response = await api.get(`/timeline/calendar/${currentYear}/${currentMonth}`);
        setEvents(response.data || []);
      } else {
        // Load events for the whole month for week view
        const response = await api.get(`/timeline/calendar/${currentYear}/${currentMonth}`);
        setEvents(response.data || []);
      }

      setLoading(false);
    } catch (err: any) {
      setError('Failed to load calendar events. Please try again.');
      setLoading(false);
    }
  };

  const navigateMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const navigateYear = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + delta);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date: Date): number => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    return daysInMonth;
  };

  const getDaysInWeek = (date: Date): Date[] => {
    const week = [];
    const dayOfWeek = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      week.push(d);
    }

    return week;
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return date >= eventStart && date <= eventEnd;
    });
  };

  const getWeekNumber = (date: Date): number => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDay.getDay();
    return Math.ceil((dayOfWeek + date.getDate() - 1) / 7);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="ml-4 text-lg text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h8m-4-4v4m0 4H4m6 16h.01M12 2a2 2 0 110-2 2.003 2.003 2.003 2.003 2.003 2.003 2.003 2.003H5a2 2 0 002 2.003 2.003 2.003 2.003 2.003 2.003 2.003 2.003 2.003z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a2 2 0 01-2.003 2.003 2.003 2.003 2.003 2.003 2.003 2.003 2.003 2.003 2.003 2.003H13a2 2 0 002 2.003 2.003 2.003 2.003 2.003 2.003 2.003 2.003 2.003 2.003 2.003z"></path>
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Calendar</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={loadEvents}
            className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentDate);

  // Generate blank days for the first week of the month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const blankDays = Array(firstDayOfWeek).fill(null);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h1>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 text-sm font-medium rounded-l ${
                view === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 text-sm font-medium rounded-r ${
                view === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Week
            </button>
          </div>

          {/* Navigation */}
          <button
            onClick={() => navigateYear(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Previous year"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 20 20" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.19 8.91a.75.75 1.414l-1.414-1.414L6 6.36V15.5a2.25 2.25 0 0 1.414 0 001 2.25 2.25 2.25l1.414 1.414-1.414 1.414L15.5a2.25 2.25 0 011 2.25 2.25 2.25 2.25 2.25 2.25z" />
            </svg>
          </button>

          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 20 20" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.19 8.91a.75.75 1.414l-1.414-1.414L6 6.36V15.5a2.25 2.25 0 0 1.414 0.001 2.25 2.25 2.25 1.414 1.414 1.414 1.414 1.414L15.5a2.25 2.25 0 011 2.25 2.25 2.25 2.25 2.25 2.25z" />
            </svg>
          </button>

          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Next month"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 20 20" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.7 3.91a.75.75 1.414l1.414 1.414L13.36 6.36V15.5a2.25 2.25 0 0 1.414-.001 2.25-.001 2.25-.001 2.25l-1.414 1.414 1.414 1.414 1.414 1.414L15.5a2.25 2.25 0 011 2.25 2.25-.001 2.25-.001 2.25-.001 2.25-.001 2.25z" />
            </svg>
          </button>

          <button
            onClick={() => navigateYear(1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Next year"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 20 20" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.3 14.09a.75.75 1.414l2.06-2.06L6.18 6.36V15.5a2.25 2.25 0 0 2.06 1.414-.001 2.25-.001 2.25-.001 2.25l-2.06 1.414-1.414 1.414 1.414 1.414L15.5a2.25 2.25 0 011 2.25 2.25-.001 2.25-.001 2.25-.001 2.25z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Day Names Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {dayNames.map((day, idx) => (
            <div key={idx} className="px-2 py-2 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {blankDays.map((_, idx) => (
            <div key={idx} className="min-h-24 border-b border-gray-100 bg-gray-50">
              <div className="h-24" />
            </div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
            const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayIndex + 1);
            const dayEvents = getEventsForDate(dayDate);

            return (
              <div
                key={dayIndex}
                className={`min-h-24 border-b border-gray-200 p-1 hover:bg-gray-50 transition-colors ${
                  isToday(dayDate) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${
                    isToday(dayDate) ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {dayDate.getDate()}
                  </span>
                  <span className="text-xs text-gray-500">
                    Week {getWeekNumber(dayDate)}
                  </span>
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event, idx) => (
                    <div
                      key={idx}
                      className={`text-xs p-1 rounded border-l-2 ${
                        event.resourceType === 'PROJECT' ? 'border-blue-300 bg-blue-50' :
                        event.resourceType === 'PHASE' ? 'border-green-300 bg-green-50' :
                        'border-orange-300 bg-orange-50'
                      }`}
                    >
                      <div className="font-medium text-gray-800 truncate">
                        {event.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.resourceType}
                      </div>
                    </div>
                  ))}

                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Legend */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Event Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded border-2 border-blue-300 bg-blue-50 mr-2"></div>
            <span className="text-sm text-gray-700">Project</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded border-2 border-green-300 bg-green-50 mr-2"></div>
            <span className="text-sm text-gray-700">Phase</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded border-2 border-orange-300 bg-orange-50 mr-2"></div>
            <span className="text-sm text-gray-700">Task</span>
          </div>
        </div>
      </div>

      {/* Today Button */}
      <div className="mt-4">
        <button
          onClick={() => setCurrentDate(new Date())}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Today
        </button>
      </div>

      {/* Jump to Date */}
      <div className="mt-2 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Jump to Date</h3>
        <div className="flex gap-2">
          <input
            type="date"
            value={currentDate.toISOString().split('T')[0]}
            onChange={(e) => setCurrentDate(new Date(e.target.value))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
