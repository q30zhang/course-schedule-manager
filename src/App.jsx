import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import HeaderBar from './components/HeaderBar';
import NoticeBar from './components/NoticeBar';
import Toolbar from './components/Toolbar';
import CalendarGrid from './components/CalendarGrid';
import ContextMenu from './components/ContextMenu';
import SettingsPanel from './components/SettingsPanel';
import EventModal from './components/modals/EventModal';
import ConflictModal from './components/modals/ConflictModal';
import useDarkMode from './hooks/useDarkMode';
import useGoogleAuth from './hooks/useGoogleAuth';
import useCalendarMath from './hooks/useCalendarMath';
import useContextMenu from './hooks/useContextMenu';
import useSchedulerState from './hooks/useSchedulerState';
import createGoogleFetch from './services/googleFetch';
import { createIndexSpreadsheetInMyDrive, loadWeekSchedule } from './services/sheetsApi';

const CourseScheduler = () => {
  // const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_ID = '207856180548-51eogdoqo4shuj1ko7n0qstr2q9fhkdg.apps.googleusercontent.com'; // DEV
  const TEST_WEEK_SPREADSHEET_ID = '1y9xfIkJ0moJ2AxZGt_oGtGo8DJlJsR0ajFftjmWKLRY';

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
    setEvents,
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

  useEffect(() => {
    if (calendarRef.current) {
      const scrollTo = 10 * hourHeight;
      calendarRef.current.scrollTop = scrollTo;
    }
  }, [hourHeight]);

  const googleFetch = createGoogleFetch(accessToken);

  const handleSyncTestWeek = async () => {
    setAuthError('');
    try {
      if (!accessToken) throw new Error('Please sign in first.');

      const result = await loadWeekSchedule(googleFetch, TEST_WEEK_SPREADSHEET_ID, {
        campusId: 'TEST_CAMPUS'
      });

      console.log('loadWeekSchedule result:', result);
      console.log('events sample (first 5):', result.events.slice(0, 5));

      // Map sheets events into the UI event model expected by Calendar/EventModal.
      const mapped = (result.events || []).map((ev) => ({
        id: ev.id,
        teachers: ev.teachers || [],
        students: ev.students || [],
        startTime: ev.startTime,
        endTime: ev.endTime,
        subject: ev.subject || '',
        // Use campus as branch for now (you can map campusId -> real branch name later)
        branch: ev.campus || 'Branch A',
        // Use room order (tab order) as a stable label
        room: `Room ${ev.room}`,
        // Keep extra metadata for later write-back/debug
        campus: ev.campus,
        spreadsheetId: ev.spreadsheetId,
        roomSheetTitle: ev.roomSheetTitle,
        date: ev.date
      }));

      setEvents(mapped);
    } catch (err) {
      setShowAuthError(true);
      setAuthError(err?.message || String(err));
    }
  };

  const handleCreateIndexSpreadsheet = async () => {
    setAuthError('');
    try {
      const { spreadsheetId, spreadsheetUrl } = await createIndexSpreadsheetInMyDrive(googleFetch, {
        title: 'Course Schedule Manager - Index (DEV)'
      });
      setShowIndexNotice(true);
      setIndexSpreadsheet({ spreadsheetId, spreadsheetUrl });
    } catch (err) {
      setShowAuthError(true);
      setAuthError(err?.message || String(err));
    }
  };

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
        onCreateIndex={handleCreateIndexSpreadsheet}
        showHalfHourLines={showHalfHourLines}
        onToggleHalfHourLines={setShowHalfHourLines}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onToggleDarkMode={toggleDarkMode}
        onSync={handleSyncTestWeek}
        // onSync={() => console.log('TODO: load/save schedule using Sheets API')}
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
        calendarRef={calendarRef}

        // data
        getFilteredEvents={getFilteredEvents}
        selectedEvents={selectedEvents}
        getEventColor={getEventColor}

        // math
        timeToPixels={timeToPixels}
        pixelsToTime={pixelsToTime}

        // DnD + selection
        onDrop={handleDrop}
        onDragStart={handleDragStart}
        onEventClick={handleEventClick}
        onEventDoubleClick={(e, event) => {
          e.stopPropagation();
          setEditingEvent(event);
          setShowEventModal(true);
        }}

        // copy + context menu
        copyMode={copyMode}
        onPasteEvent={pasteEvent}
        onOpenEmptyContextMenu={(e, day, hour, minute) => {
          e.preventDefault();
          openContextMenu({
            x: e.clientX,
            y: e.clientY,
            type: 'empty',
            day,
            hour,
            minute
          });
        }}
        onOpenEventContextMenu={(e, event) => {
          e.preventDefault();
          e.stopPropagation();
          handleEventContextMenuSelect(event);
          openContextMenu({
            x: e.clientX,
            y: e.clientY,
            type: 'event',
            event
          });
        }}
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
        onClose={() => setConflictWarning(null)}
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
