import React from 'react';

const CalendarGrid = ({
  isDarkMode,
  days,
  hours,
  weekDates,
  hourHeight,
  showHalfHourLines,
  renderTimeGrid,
  calendarRef
}) => {
  return (
    <div className="flex-1 overflow-auto" ref={calendarRef}>
      <div className="flex min-h-full">
        <div className={`w-16 flex-shrink-0 border-r ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}>
          <div className="h-12" />
          {hours.map((hour) => (
            <div key={hour}>
              <div
                className={`border-t text-xs pr-2 text-right ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-600'}`}
                style={{ height: `${hourHeight / 2}px`, paddingTop: '2px' }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div style={{ height: `${hourHeight / 2}px` }} />
            </div>
          ))}
        </div>

        <div className="flex-1 flex">
          {days.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col min-w-[120px]">
              <div className={`h-12 border-b flex flex-col items-center justify-center sticky top-0 z-10 ${isDarkMode ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-300 bg-gray-50'}`}>
                <div className="font-semibold text-sm">{day}</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{weekDates[idx]}</div>
              </div>
              {renderTimeGrid(day, idx, showHalfHourLines, hourHeight)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
