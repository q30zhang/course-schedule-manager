import React from 'react';
import EventCard from './EventCard';

const CalendarGrid = ({
  isDarkMode,
  days,
  hours,
  weekDates,
  hourHeight,
  showHalfHourLines,
  calendarRef,

  // data
  getFilteredEvents,
  selectedEvents,
  getEventColor,
  viewMode,

  // math
  timeToPixels,
  pixelsToTime,

  // DnD + selection
  onDrop,
  onDragStart,
  onEventClick,
  onEventDoubleClick,

  // context menu + copy
  copyMode,
  onPasteEvent,
  onOpenEmptyContextMenu,
  onOpenEventContextMenu
}) => {
  const renderTimeGrid = (dayIndex) => {
    const dayEvents = getFilteredEvents().filter((e) => e.startTime.day === dayIndex);

    return (
      <div
        key={dayIndex}
        className={`flex-1 border-r relative min-w-[120px] ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
        onDrop={(e) => onDrop(e, dayIndex, pixelsToTime)}
        onDragOver={(e) => e.preventDefault()}
        onContextMenu={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const { hour, minute } = pixelsToTime(y);

          if (copyMode) {
            onPasteEvent(dayIndex, hour, minute);
            return;
          }
          onOpenEmptyContextMenu(e, dayIndex, hour, minute);
        }}
        onClick={(e) => {
          if (!copyMode) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const { hour, minute } = pixelsToTime(y);
          onPasteEvent(dayIndex, hour, minute);
        }}
      >
        {hours.map((hour) => (
          <div key={hour}>
            <div
              className={`${isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-300'}`}
              style={{ height: showHalfHourLines ? `${hourHeight / 2}px` : `${hourHeight}px` }}
            />
            {showHalfHourLines && (
              <div
                className={`${isDarkMode ? 'border-t border-gray-800' : 'border-t border-gray-200'}`}
                style={{ height: `${hourHeight / 2}px` }}
              />
            )}
          </div>
        ))}

        {(() => {
          const items = dayEvents
            .map((event) => {
              const startMin = event.startTime.hour * 60 + event.startTime.minute;
              const endMin = event.endTime.hour * 60 + event.endTime.minute;
              return { event, startMin, endMin };
            })
            .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

          const colEnds = [];
          const placed = [];

          for (const it of items) {
            let col = -1;
            for (let c = 0; c < colEnds.length; c++) {
              if (it.startMin >= colEnds[c]) {
                col = c;
                break;
              }
            }
            if (col === -1) {
              col = colEnds.length;
              colEnds.push(it.endMin);
            } else {
              colEnds[col] = it.endMin;
            }
            placed.push({ ...it, col });
          }

          const numCols = Math.max(1, colEnds.length);
          const gutterPct = 2;
          const colWidth = (100 - gutterPct * (numCols - 1)) / numCols;

          return placed.map(({ event, startMin, endMin, col }) => {
            const top = timeToPixels(event.startTime.hour, event.startTime.minute);
            const duration = endMin - startMin;
            const height = (duration / 60) * hourHeight;
            const isSelected = selectedEvents.has(event.id);
            const leftPct = col * (colWidth + gutterPct);

            return (
              <EventCard
                key={event.id}
                event={event}
                viewMode={viewMode}
                top={top}
                height={height}
                leftPct={leftPct}
                widthPct={colWidth}
                color={getEventColor(event)}
                isSelected={isSelected}
                onDragStart={(evt) => onDragStart(evt, event)}
                onClick={(evt) => onEventClick(evt, event.id)}
                onDoubleClick={(evt) => onEventDoubleClick(evt, event)}
                onContextMenu={(evt) => onOpenEventContextMenu(evt, event)}
              />
            );
          });
        })()}
      </div>
    );
  };

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
              {renderTimeGrid(idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;