import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import HeaderBar from './components/HeaderBar';
import NoticeBar from './components/NoticeBar';
import Toolbar from './components/Toolbar';
import CalendarGrid from './components/CalendarGrid';
import EventCard from './components/EventCard';
import ContextMenu from './components/ContextMenu';
import SettingsPanel from './components/SettingsPanel';
import EventModal from './components/modals/EventModal';
import ConflictModal from './components/modals/ConflictModal';
import useDarkMode from './hooks/useDarkMode';
import useGoogleAuth from './hooks/useGoogleAuth';
import useCalendarMath from './hooks/useCalendarMath';
import useContextMenu from './hooks/useContextMenu';
import useSchedulerState from './hooks/useSchedulerState';

const CourseScheduler = () => {
  // const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_ID = '207856180548-51eogdoqo4shuj1ko7n0qstr2q9fhkdg.apps.googleusercontent.com'; // DEV

  const [indexSpreadsheet, setIndexSpreadsheet] = useState(null);
  const [showIndexNotice, setShowIndexNotice] = useState(true);

  const { isDarkMode, toggleDarkMode } = useDarkMode(false);

  const {
    accessToken,
    authError,
    setAuthError,
    showAuthError,
    setShowAuthError,
    signIn,
    signOut
  } = useGoogleAuth({
    clientId: GOOGLE_CLIENT_ID,
    onSignedOut: () => {
      setIndexSpreadsheet(null);
      setShowIndexNotice(true);
    }
  });

  const {
    events,
    teacherList,
    studentList,
    roomList,
    branchList,
    sortedTeachers,
    sortedStudents,
    viewMode,
    setViewMode,
    selectedTeacher,
    setSelectedTeacher,
    selectedStudent,
    setSelectedStudent,
    selectedBranch,
    setSelectedBranch,
    currentWeek,
    setCurrentWeek,
    selectedEvents,
    showEventModal,
    setShowEventModal,
    editingEvent,
    setEditingEvent,
    showSettings,
    setShowSettings,
    showHalfHourLines,
    setShowHalfHourLines,
    copyMode,
    conflictWarning,
    setConflictWarning,
    userSettings,
    setUserSettings,
    getFilteredEvents,
    getEventColor,
    handleEventClick,
    handleEventContextMenuSelect,
    handleDragStart,
    handleDrop,
    createNewEvent,
    openNewEventModal,
    deleteEvents,
    saveEvent,
    startCopyFromEvent,
    pasteEvent,
    copyToNextWeek
  } = useSchedulerState();

  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const { days, hours, hourHeight, weekDates, timeToPixels, pixelsToTime } = useCalendarMath({ currentWeek });

  const calendarRef = useRef(null);

  const iconBtnClass = isDarkMode
    ? 'p-2 rounded bg-transparent hover:bg-gray-800 text-gray-100 border border-gray-700'
    : 'p-2 rounded bg-transparent hover:bg-gray-100 text-gray-800 border border-transparent';

  const pillBtnBase = 'px-3 py-2 rounded border';
  const pillBtnInactive = isDarkMode
    ? 'bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700'
    : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-100';

  const noticeOkBtnRed = isDarkMode
    ? 'px-3 py-1 bg-red-900/40 text-red-100 rounded hover:bg-red-900/60 shrink-0 border border-red-800'
    : 'px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 shrink-0';

  const noticeOkBtnGreen = isDarkMode
    ? 'px-3 py-1 bg-green-900/40 text-green-100 rounded hover:bg-green-900/60 shrink-0 border border-green-800'
    : 'px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 shrink-0';

  const btnBase = 'rounded font-semibold border transition-colors';

  const btnPrimary = isDarkMode
    ? `${btnBase} bg-blue-500 hover:bg-blue-400 text-white border-blue-300 shadow-sm`
    : `${btnBase} bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-sm`;

  const btnSecondary = isDarkMode
    ? `${btnBase} bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-700`
    : `${btnBase} bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300`;

  const btnDanger = isDarkMode
    ? `${btnBase} bg-red-900/40 hover:bg-red-900/60 text-red-100 border-red-800`
    : `${btnBase} bg-red-100 hover:bg-red-200 text-red-700 border-red-200`;

  const btnLinkBlue = isDarkMode
    ? `${btnBase} bg-blue-900/40 hover:bg-blue-900/60 text-blue-100 border-blue-800 text-sm`
    : `${btnBase} bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200 text-sm`;

  useEffect(() => {
    if (calendarRef.current) {
      const scrollTo = 10 * hourHeight;
      calendarRef.current.scrollTop = scrollTo;
    }
  }, [hourHeight]);

  const googleFetch = async (url, init = {}) => {
    if (!accessToken) throw new Error('Not signed in');
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (!res.ok) {
      let details = '';
      try {
        details = await res.text();
      } catch {
        // ignore
      }
      throw new Error(`Google API error ${res.status}: ${details || res.statusText}`);
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  };

  const createIndexSpreadsheetInMyDrive = async () => {
    setAuthError('');
    try {
      const created = await googleFetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties: { title: 'Course Schedule Manager - Index (DEV)' },
          sheets: [{ properties: { title: 'campus_week_index' } }]
        })
      });

      const spreadsheetId = created.spreadsheetId;
      const spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            { addSheet: { properties: { title: 'teachers' } } },
            { addSheet: { properties: { title: 'students' } } },
            { addSheet: { properties: { title: 'course_status' } } },
            { addSheet: { properties: { title: 'audit_log' } } }
          ]
        })
      });

      await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate?valueInputOption=RAW`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [
            {
              range: 'campus_week_index!A1:H1',
              majorDimension: 'ROWS',
              values: [[
                'campus_id',
                'week_start_date',
                'spreadsheet_id',
                'sheet_name',
                'status',
                'last_updated_at',
                'last_updated_by',
                'notes'
              ]]
            },
            {
              range: 'teachers!A1:E1',
              majorDimension: 'ROWS',
              values: [[ 'teacher_id', 'name', 'email', 'campus_ids', 'active' ]]
            },
            {
              range: 'students!A1:E1',
              majorDimension: 'ROWS',
              values: [[ 'student_id', 'name', 'email', 'campus_id', 'active' ]]
            },
            {
              range: 'course_status!A1:D1',
              majorDimension: 'ROWS',
              values: [[ 'status_code', 'label', 'color', 'active' ]]
            },
            {
              range: 'audit_log!A1:F1',
              majorDimension: 'ROWS',
              values: [[ 'timestamp', 'user', 'action', 'campus_id', 'week_start_date', 'details' ]]
            }
          ]
        })
      });

      setShowIndexNotice(true);
      setIndexSpreadsheet({ spreadsheetId, spreadsheetUrl });
    } catch (err) {
      setShowAuthError(true);
      setAuthError(err?.message || String(err));
    }
  };

  const handleEventContextMenu = (e, event) => {
    e.preventDefault();
    e.stopPropagation();
    handleEventContextMenuSelect(event);
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'event',
      event: event
    });
  };

  const handleEmptyContextMenu = (e, day, hour, minute) => {
    e.preventDefault();

    if (copyMode) {
      pasteEvent(day, hour, minute);
      return;
    }

    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'empty',
      day,
      hour,
      minute
    });
  };

  const renderTimeGrid = (day, dayIndex) => {
    const dayEvents = getFilteredEvents().filter((e) => e.startTime.day === dayIndex);

    return (
      <div
        key={dayIndex}
        className="flex-1 border-r border-gray-300 relative min-w-[120px]"
        onDrop={(e) => handleDrop(e, dayIndex, pixelsToTime)}
        onDragOver={(e) => e.preventDefault()}
        onContextMenu={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const { hour, minute } = pixelsToTime(y);
          handleEmptyContextMenu(e, dayIndex, hour, minute);
        }}
        onClick={(e) => {
          if (copyMode) {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const { hour, minute } = pixelsToTime(y);
            pasteEvent(dayIndex, hour, minute);
          }
        }}
      >
        {hours.map((hour) => (
          <div key={hour}>
            <div
              className="border-t border-gray-300"
              style={{ height: showHalfHourLines ? `${hourHeight / 2}px` : `${hourHeight}px` }}
            />
            {showHalfHourLines && (
              <div
                className="border-t border-gray-200"
                style={{ height: `${hourHeight / 2}px` }}
              />
            )}
          </div>
        ))}

        {dayEvents.map((event) => {
          const top = timeToPixels(event.startTime.hour, event.startTime.minute);
          const duration = (event.endTime.hour * 60 + event.endTime.minute) -
                          (event.startTime.hour * 60 + event.startTime.minute);
          const height = (duration / 60) * hourHeight;
          const isSelected = selectedEvents.has(event.id);

          return (
            <EventCard
              key={event.id}
              event={event}
              top={top}
              height={height}
              color={getEventColor(event)}
              isSelected={isSelected}
              onDragStart={(e) => handleDragStart(e, event)}
              onClick={(e) => handleEventClick(e, event.id)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingEvent(event);
                setShowEventModal(true);
              }}
              onContextMenu={(e) => handleEventContextMenu(e, event)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50'}`}>
      <HeaderBar
        isDarkMode={isDarkMode}
        iconBtnClass={iconBtnClass}
        btnPrimary={btnPrimary}
        btnSecondary={btnSecondary}
        accessToken={accessToken}
        onSignIn={signIn}
        onSignOut={signOut}
        onCreateIndex={createIndexSpreadsheetInMyDrive}
        showHalfHourLines={showHalfHourLines}
        onToggleHalfHourLines={setShowHalfHourLines}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onToggleDarkMode={toggleDarkMode}
        onSync={() => console.log('TODO: load/save schedule using Sheets API')}
      >
        <NoticeBar
          showAuthError={showAuthError}
          authError={authError}
          showIndexNotice={showIndexNotice}
          indexSpreadsheet={indexSpreadsheet}
          onDismissAuthError={() => setShowAuthError(false)}
          onDismissIndexNotice={() => setShowIndexNotice(false)}
          noticeOkBtnRed={noticeOkBtnRed}
          noticeOkBtnGreen={noticeOkBtnGreen}
        />

        <Toolbar
          isDarkMode={isDarkMode}
          btnPrimary={btnPrimary}
          pillBtnBase={pillBtnBase}
          pillBtnInactive={pillBtnInactive}
          viewMode={viewMode}
          onViewMode={setViewMode}
          selectedTeacher={selectedTeacher}
          selectedStudent={selectedStudent}
          selectedBranch={selectedBranch}
          onSelectTeacher={setSelectedTeacher}
          onSelectStudent={setSelectedStudent}
          onSelectBranch={setSelectedBranch}
          teacherList={sortedTeachers}
          studentList={sortedStudents}
          branchList={branchList}
          currentWeek={currentWeek}
          onSetCurrentWeek={setCurrentWeek}
          onAddEvent={openNewEventModal}
          copyMode={copyMode}
        />
      </HeaderBar>

      {showSettings && (
        <SettingsPanel
          isDarkMode={isDarkMode}
          userSettings={userSettings}
          onChange={setUserSettings}
        />
      )}

      <CalendarGrid
        isDarkMode={isDarkMode}
        days={days}
        hours={hours}
        weekDates={weekDates}
        hourHeight={hourHeight}
        showHalfHourLines={showHalfHourLines}
        renderTimeGrid={renderTimeGrid}
        calendarRef={calendarRef}
      />

      <ContextMenu
        contextMenu={contextMenu}
        isDarkMode={isDarkMode}
        onEdit={() => {
          setEditingEvent(contextMenu.event);
          setShowEventModal(true);
          closeContextMenu();
        }}
        onCopyTo={() => {
          startCopyFromEvent(contextMenu.event);
          closeContextMenu();
        }}
        onCopyToNextWeek={() => {
          copyToNextWeek(contextMenu.event);
          closeContextMenu();
        }}
        onDelete={() => {
          deleteEvents();
          closeContextMenu();
        }}
        onCreateEvent={() => {
          createNewEvent(contextMenu.day, contextMenu.hour, contextMenu.minute);
          closeContextMenu();
        }}
        selectedEventsSize={selectedEvents.size}
        currentWeek={currentWeek}
      />

      <ConflictModal
        conflictWarning={conflictWarning}
        isDarkMode={isDarkMode}
        btnPrimary={btnPrimary}
      />

      <EventModal
        isOpen={showEventModal}
        editingEvent={editingEvent}
        events={events}
        teacherList={teacherList}
        studentList={studentList}
        roomList={roomList}
        isDarkMode={isDarkMode}
        btnPrimary={btnPrimary}
        btnSecondary={btnSecondary}
        btnDanger={btnDanger}
        btnLinkBlue={btnLinkBlue}
        onSave={saveEvent}
        onCancel={() => {
          setShowEventModal(false);
          setEditingEvent(null);
        }}
        onChangeEvent={setEditingEvent}
      />
    </div>
  );
};

export default CourseScheduler;
