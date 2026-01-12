import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, Users, User, GraduationCap, Settings, RefreshCw, Download, Upload, Plus, ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';

const CourseScheduler = () => {
  // --- Google OAuth (GIS) + Sheets/Drive REST helpers ---
  // const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_ID = '207856180548-51eogdoqo4shuj1ko7n0qstr2q9fhkdg.apps.googleusercontent.com'; // DEV

  const [accessToken, setAccessToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [indexSpreadsheet, setIndexSpreadsheet] = useState(null); // { spreadsheetId, spreadsheetUrl }
  const [showAuthError, setShowAuthError] = useState(true);
  const [showIndexNotice, setShowIndexNotice] = useState(true);
  const tokenClientRef = useRef(null);

  const googleScopes = useMemo(() => {
    // Start with Sheets read/write. Include Drive file scope now since you'll likely create/copy/move weekly files.
    // You can remove drive.file until you actually need folder moves / copies.
    return [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ].join(' ');
  }, []);

  const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);

    // If script exists and already loaded, resolve.
    if (existing && existing.dataset.loaded === "true") return resolve();

    const onLoad = () => {
      const s = document.querySelector(`script[src="${src}"]`);
      if (s) s.dataset.loaded = "true";
      resolve();
    };

    const onError = () => {
      try {
        existing?.remove?.();
      } catch {}
      reject(new Error(`Failed to load ${src} (blocked by network/adblock/CSP?)`));
    };

    if (existing) {
      // Script tag exists but not marked loaded: wait for it.
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = onLoad;
    script.onerror = onError;
    document.head.appendChild(script);
  });

  useEffect(() => {
    (async () => {
      try {
        setAuthError('');
        if (!GOOGLE_CLIENT_ID) {
          setShowAuthError(true);
          setAuthError('Missing VITE_GOOGLE_CLIENT_ID. Add it to your .env and restart the dev server.');
          return;
        }

        // Google Identity Services
        await loadScript('https://accounts.google.com/gsi/client');
        await new Promise((r) => setTimeout(r, 0));

        if (!window.google?.accounts?.oauth2) {
          setShowAuthError(true);
          setAuthError(
            `GIS not initialized. window.google=${!!window.google}, ` +
            `accounts=${!!window.google?.accounts}, oauth2=${!!window.google?.accounts?.oauth2}. ` +
            `Check DevTools -> Network for gsi/client, disable adblock, check CSP.`
          );
          return;
        }

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: googleScopes,
          callback: (resp) => {
            if (resp?.error) {
              setShowAuthError(true);
              setAuthError(resp.error);
              setAccessToken('');
              return;
            }
            setAuthError('');
            setAccessToken(resp.access_token || '');
          }
        });
      } catch (err) {
        setShowAuthError(true);
        setAuthError(err?.message || String(err));
      }
    })();
  }, [GOOGLE_CLIENT_ID, googleScopes]);

  const signIn = () => {
    setAuthError('');
    if (!tokenClientRef.current) {
      setShowAuthError(true);
      setAuthError('Token client not ready yet (GIS script not loaded).');
      return;
    }
    // prompt consent the first time; subsequent calls should be silent if possible
    tokenClientRef.current.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
  };

  const signOut = () => {
    try {
      if (accessToken && window.google?.accounts?.oauth2?.revoke) {
        window.google.accounts.oauth2.revoke(accessToken, () => {});
      }
    } catch {
      // ignore
    }
    setAccessToken('');
    setIndexSpreadsheet(null);
    setShowIndexNotice(true);
    setShowAuthError(true);
  };

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
    // Some endpoints return empty body
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  };

  const createIndexSpreadsheetInMyDrive = async () => {
    setAuthError('');
    try {
      // 1) Create the spreadsheet file (Sheets API). This automatically creates a file in your Drive.
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

      // 2) Add additional tabs for meta data.
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

      // 3) Seed header rows.
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
  const [events, setEvents] = useState([
    {
      id: 1,
      teachers: ['Dr. Smith'],
      students: ['John Doe', 'Jane Wilson'],
      startTime: { day: 1, hour: 10, minute: 0 },
      endTime: { day: 1, hour: 11, minute: 30 },
      subject: 'Mathematics',
      branch: 'Branch A',
      room: 'Room 101'
    },
    {
      id: 2,
      teachers: ['Prof. Johnson'],
      students: ['Alice Brown'],
      startTime: { day: 2, hour: 14, minute: 0 },
      endTime: { day: 2, hour: 15, minute: 0 },
      subject: 'Physics',
      branch: 'Branch B',
      room: 'Lab 3'
    }
  ]);

  // Mock teacher/student/room data - would come from database
  const [teacherList] = useState(['Dr. Smith', 'Prof. Johnson', 'Ms. Davis', 'Mr. Wilson']);
  const [studentList] = useState(['John Doe', 'Jane Wilson', 'Alice Brown', 'Bob Smith', 'Carol White']);
  const [roomList] = useState(['Room 101', 'Room 102', 'Room 103', 'Lab 1', 'Lab 2', 'Lab 3', 'Auditorium']);

  const [viewMode, setViewMode] = useState('all'); // 'all', 'teacher', 'student', 'branch'
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [currentWeek, setCurrentWeek] = useState(0); // 0 = current, 1 = next
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHalfHourLines, setShowHalfHourLines] = useState(false);
  const [copyMode, setCopyMode] = useState(false);
  const [eventToCopy, setEventToCopy] = useState(null);
  const [conflictWarning, setConflictWarning] = useState(null);
  
  // User settings
  const [userSettings, setUserSettings] = useState({
    branch: 'Branch A',
    timezone: 'auto'
  });

  const calendarRef = useRef(null);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const hourHeight = 80;
  const minHeight = hourHeight / 4;

  // Branch colors - consistent across views
  const branchColors = {
    'Branch A': 'hsl(210, 70%, 85%)', // Blue
    'Branch B': 'hsl(150, 70%, 85%)', // Green
    'Branch C': 'hsl(30, 70%, 85%)',  // Orange
  };

  // Room colors - for branch view
  const roomColors = {
    'Room 101': 'hsl(0, 70%, 85%)',
    'Room 102': 'hsl(45, 70%, 85%)',
    'Room 103': 'hsl(90, 70%, 85%)',
    'Lab 1': 'hsl(180, 70%, 85%)',
    'Lab 2': 'hsl(225, 70%, 85%)',
    'Lab 3': 'hsl(270, 70%, 85%)',
    'Auditorium': 'hsl(315, 70%, 85%)',
  };

  // Scroll to 10am on mount
  useEffect(() => {
    if (calendarRef.current) {
      const scrollTo = 10 * hourHeight;
      calendarRef.current.scrollTop = scrollTo;
    }
  }, []);

  // Get current week dates
  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to Monday
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (currentWeek * 7));
    
    return days.map((_, idx) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + idx);
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    });
  };

  const weekDates = getWeekDates();

  // Filter events based on view mode
  const getFilteredEvents = () => {
    let filtered = events;
    if (viewMode === 'teacher' && selectedTeacher) {
      filtered = events.filter(e => e.teachers.includes(selectedTeacher));
    } else if (viewMode === 'student' && selectedStudent) {
      filtered = events.filter(e => e.students.includes(selectedStudent));
    } else if (viewMode === 'branch' && selectedBranch) {
      filtered = events.filter(e => e.branch === selectedBranch);
    }
    return filtered;
  };

  const getAllTeachers = () => {
    return teacherList.sort();
  };

  const getAllStudents = () => {
    return studentList.sort();
  };

  const getAllBranches = () => {
    return ['Branch A', 'Branch B', 'Branch C'];
  };

  // Get event color based on view mode
  const getEventColor = (event) => {
    if (viewMode === 'branch') {
      return roomColors[event.room] || 'hsl(0, 0%, 85%)';
    } else {
      return branchColors[event.branch] || 'hsl(0, 0%, 85%)';
    }
  };

  // Check for conflicts
  const checkConflicts = (newEvent, excludeEventId = null) => {
    const conflicts = [];
    const newStart = newEvent.startTime.day * 1440 + newEvent.startTime.hour * 60 + newEvent.startTime.minute;
    const newEnd = newEvent.endTime.day * 1440 + newEvent.endTime.hour * 60 + newEvent.endTime.minute;

    events.forEach(event => {
      if (event.id === excludeEventId) return;
      
      const eventStart = event.startTime.day * 1440 + event.startTime.hour * 60 + event.startTime.minute;
      const eventEnd = event.endTime.day * 1440 + event.endTime.hour * 60 + event.endTime.minute;

      // Check for time overlap
      if (!(newEnd <= eventStart || newStart >= eventEnd)) {
        // Check teacher conflicts
        const teacherOverlap = newEvent.teachers.filter(t => event.teachers.includes(t));
        if (teacherOverlap.length > 0) {
          conflicts.push(`Teacher ${teacherOverlap.join(', ')} already has an event at this time`);
        }

        // Check student conflicts
        const studentOverlap = newEvent.students.filter(s => event.students.includes(s));
        if (studentOverlap.length > 0) {
          conflicts.push(`Student ${studentOverlap.join(', ')} already has an event at this time`);
        }
      }
    });

    return conflicts;
  };

  // Convert time to pixels
  const timeToPixels = (hour, minute) => {
    return (hour * hourHeight) + (minute / 60 * hourHeight);
  };

  // Convert pixels to time (snap to 15min)
  const pixelsToTime = (pixels) => {
    const totalMinutes = Math.round((pixels / hourHeight) * 60 / 15) * 15;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    return { hour: Math.min(hour, 23), minute };
  };

  // Handle left click on event
  const handleEventClick = (e, eventId) => {
    e.stopPropagation();
    
    if (copyMode) {
      // Cancel copy mode on click
      setCopyMode(false);
      setEventToCopy(null);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedEvents(prev => {
        const next = new Set(prev);
        if (next.has(eventId)) {
          next.delete(eventId);
        } else {
          next.add(eventId);
        }
        return next;
      });
    } else {
      setSelectedEvents(new Set([eventId]));
    }
  };

  // Handle right click on event
  const handleEventContextMenu = (e, event) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedEvents.has(event.id) && selectedEvents.size > 0) {
      setSelectedEvents(new Set([event.id]));
    } else if (selectedEvents.size === 0) {
      setSelectedEvents(new Set([event.id]));
    }
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'event',
      event: event
    });
  };

  // Handle right click on empty space
  const handleEmptyContextMenu = (e, day, hour, minute) => {
    e.preventDefault();
    
    if (copyMode) {
      // Paste event at cursor position
      pasteEvent(day, hour, minute);
      return;
    }
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'empty',
      day,
      hour,
      minute
    });
  };

  // Handle drag start
  const handleDragStart = (e, event) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedEvent(event);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Handle drag over calendar
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (e, day) => {
    e.preventDefault();
    if (!draggedEvent) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top - dragOffset.y;
    const { hour, minute } = pixelsToTime(y);
    
    const duration = (draggedEvent.endTime.hour * 60 + draggedEvent.endTime.minute) -
                     (draggedEvent.startTime.hour * 60 + draggedEvent.startTime.minute);
    
    const endTotalMinutes = hour * 60 + minute + duration;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;

    const updatedEvent = {
      ...draggedEvent,
      startTime: { ...draggedEvent.startTime, day, hour, minute },
      endTime: { ...draggedEvent.endTime, day, hour: endHour, minute: endMinute }
    };

    // Check for conflicts
    const conflicts = checkConflicts(updatedEvent, draggedEvent.id);
    if (conflicts.length > 0) {
      setConflictWarning({
        message: conflicts.join('\n'),
        onConfirm: () => setConflictWarning(null)
      });
      setDraggedEvent(null);
      return;
    }

    setEvents(prev => prev.map(ev =>
      ev.id === draggedEvent.id ? updatedEvent : ev
    ));

    setDraggedEvent(null);
    console.log('Event moved - sync with database');
  };

  // Handle copy to
  const handleCopyTo = () => {
    const event = contextMenu.event;
    setEventToCopy(event);
    setCopyMode(true);
    setContextMenu(null);
  };

  // Paste event
  const pasteEvent = (day, hour, minute) => {
    if (!eventToCopy) return;

    const duration = (eventToCopy.endTime.hour * 60 + eventToCopy.endTime.minute) -
                     (eventToCopy.startTime.hour * 60 + eventToCopy.startTime.minute);
    
    const endTotalMinutes = hour * 60 + minute + duration;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;

    const newEvent = {
      ...eventToCopy,
      id: Date.now(),
      startTime: { day, hour, minute },
      endTime: { day, hour: endHour, minute: endMinute }
    };

    // Check for conflicts
    const conflicts = checkConflicts(newEvent);
    if (conflicts.length > 0) {
      setConflictWarning({
        message: conflicts.join('\n'),
        onConfirm: () => setConflictWarning(null)
      });
      setCopyMode(false);
      setEventToCopy(null);
      return;
    }

    setEvents(prev => [...prev, newEvent]);
    setCopyMode(false);
    setEventToCopy(null);
    console.log('Event copied - sync with database');
  };

  // Copy to next week
  const copyToNextWeek = () => {
    const event = contextMenu.event;
    const newEvent = {
      ...event,
      id: Date.now()
    };

    // Check for conflicts
    const conflicts = checkConflicts(newEvent);
    if (conflicts.length > 0) {
      setConflictWarning({
        message: conflicts.join('\n'),
        onConfirm: () => setConflictWarning(null)
      });
      setContextMenu(null);
      return;
    }

    setEvents(prev => [...prev, newEvent]);
    setContextMenu(null);
    console.log('Event copied to next week - sync with database');
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && copyMode) {
        setCopyMode(false);
        setEventToCopy(null);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [copyMode]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Create new event
  const createNewEvent = (day, hour, minute) => {
    const newEvent = {
      id: Date.now(),
      teachers: [],
      students: [],
      startTime: { day, hour, minute },
      endTime: { day, hour: hour + 1, minute },
      subject: '',
      branch: userSettings.branch,
      room: ''
    };
    setEditingEvent(newEvent);
    setShowEventModal(true);
  };

  // Delete event(s)
  const deleteEvents = () => {
    setEvents(prev => prev.filter(e => !selectedEvents.has(e.id)));
    setSelectedEvents(new Set());
    console.log('Events deleted - sync with database');
  };

  // Save event from modal
  const saveEvent = () => {
    // Check for conflicts
    const conflicts = checkConflicts(editingEvent, editingEvent.id);
    if (conflicts.length > 0) {
      setConflictWarning({
        message: conflicts.join('\n'),
        onConfirm: () => setConflictWarning(null)
      });
      return;
    }

    if (editingEvent.id && events.find(e => e.id === editingEvent.id)) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? editingEvent : e));
    } else {
      setEvents(prev => [...prev, editingEvent]);
    }
    setShowEventModal(false);
    setEditingEvent(null);
    console.log('Event saved - sync with database');
  };

  // Render time grid
  const renderTimeGrid = (day, dayIndex) => {
    const dayEvents = getFilteredEvents().filter(e => e.startTime.day === dayIndex);
    
    return (
      <div 
        key={dayIndex}
        className="flex-1 border-r border-gray-300 relative min-w-[120px]"
        onDrop={(e) => handleDrop(e, dayIndex)}
        onDragOver={handleDragOver}
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
        {/* Hour lines */}
        {hours.map(hour => (
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
        
        {/* Events */}
        {dayEvents.map(event => {
          const top = timeToPixels(event.startTime.hour, event.startTime.minute);
          const duration = (event.endTime.hour * 60 + event.endTime.minute) -
                          (event.startTime.hour * 60 + event.startTime.minute);
          const height = (duration / 60) * hourHeight;
          const isSelected = selectedEvents.has(event.id);
          
          return (
            <div
              key={event.id}
              draggable
              onDragStart={(e) => handleDragStart(e, event)}
              onClick={(e) => handleEventClick(e, event.id)}
              onContextMenu={(e) => handleEventContextMenu(e, event)}
              className={`absolute left-1 right-1 rounded p-2 cursor-move text-xs overflow-hidden ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{
                top: `${top}px`,
                height: `${height}px`,
                backgroundColor: getEventColor(event)
              }}
            >
              <div className="font-semibold truncate">{event.subject}</div>
              <div className="text-gray-700 truncate">{event.teachers.join(', ')}</div>
              <div className="text-gray-600 truncate text-[10px]">{event.branch}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-300 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Course Scheduler</h1>
          <div className="flex gap-2">
            {!accessToken ? (
              <button
                onClick={signIn}
                className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 text-sm"
                title="Sign in with Google"
              >
                Sign in
              </button>
            ) : (
              <>
                <button
                  onClick={signOut}
                  className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                  title="Sign out"
                >
                  Sign out
                </button>
                <button
                  onClick={createIndexSpreadsheetInMyDrive}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  title="Create the Index spreadsheet in your Drive"
                >
                  Create Index Sheet
                </button>
              </>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showHalfHourLines}
                onChange={(e) => setShowHalfHourLines(e.target.checked)}
              />
              Half-hour lines
            </label>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={() => console.log('TODO: load/save schedule using Sheets API')}
              className="p-2 hover:bg-gray-100 rounded"
              title="Sync"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
        
        {((showAuthError && authError) || (showIndexNotice && indexSpreadsheet)) && (
          <div className="mt-2 text-sm">
            {showAuthError && authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 flex items-start justify-between gap-3">
                <div className="min-w-0">{authError}</div>
                <button
                  onClick={() => setShowAuthError(false)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 shrink-0"
                >
                  OK
                </button>
              </div>
            )}
            {showIndexNotice && indexSpreadsheet && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded p-2 mt-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  Index spreadsheet created: {' '}
                  <a
                    className="underline"
                    href={indexSpreadsheet.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Google Sheets
                  </a>
                  <span className="ml-2 text-xs text-green-700">({indexSpreadsheet.spreadsheetId})</span>
                </div>
                <button
                  onClick={() => setShowIndexNotice(false)}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 shrink-0"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => {
              setEditingEvent({
                id: Date.now(),
                teachers: [],
                students: [],
                startTime: { day: 0, hour: 10, minute: 0 },
                endTime: { day: 0, hour: 11, minute: 0 },
                subject: '',
                branch: userSettings.branch,
                room: ''
              });
              setShowEventModal(true);
            }}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus size={16} />
            Add Event
          </button>

          <div className="flex gap-1 border-l pl-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-2 rounded ${viewMode === 'all' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('teacher')}
              className={`px-3 py-2 rounded flex items-center gap-1 ${viewMode === 'teacher' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              <User size={16} />
              Teacher
            </button>
            <button
              onClick={() => setViewMode('student')}
              className={`px-3 py-2 rounded flex items-center gap-1 ${viewMode === 'student' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              <GraduationCap size={16} />
              Student
            </button>
            <button
              onClick={() => setViewMode('branch')}
              className={`px-3 py-2 rounded flex items-center gap-1 ${viewMode === 'branch' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
            >
              <MapPin size={16} />
              Branch
            </button>
          </div>

          {viewMode === 'teacher' && (
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="">Select Teacher</option>
              {getAllTeachers().map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}

          {viewMode === 'student' && (
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="">Select Student</option>
              {getAllStudents().map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          {viewMode === 'branch' && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="">Select Branch</option>
              {getAllBranches().map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}

          <div className="flex gap-1 border-l pl-2">
            <button
              onClick={() => setCurrentWeek(0)}
              className={`px-3 py-2 rounded ${currentWeek === 0 ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'}`}
            >
              This Week
            </button>
            <button
              onClick={() => setCurrentWeek(1)}
              className={`px-3 py-2 rounded ${currentWeek === 1 ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'}`}
            >
              Next Week
            </button>
          </div>
        </div>

        {copyMode && (
          <div className="mt-2 bg-yellow-100 border border-yellow-300 rounded p-2 text-sm">
            Copy mode active - Click on a time slot to paste, or press ESC to cancel
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <h3 className="font-semibold mb-2">User Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Branch</label>
              <select
                value={userSettings.branch}
                onChange={(e) => setUserSettings({...userSettings, branch: e.target.value})}
                className="w-full px-2 py-1 border rounded"
              >
                <option value="Branch A">Branch A</option>
                <option value="Branch B">Branch B</option>
                <option value="Branch C">Branch C</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Timezone</label>
              <select
                value={userSettings.timezone}
                onChange={(e) => setUserSettings({...userSettings, timezone: e.target.value})}
                className="w-full px-2 py-1 border rounded"
              >
                <option value="auto">Auto-detected</option>
                <option value="America/Los_Angeles">US West (PST/PDT)</option>
                <option value="America/New_York">US East (EST/EDT)</option>
                <option value="UTC+8">UTC+8</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="flex-1 overflow-auto" ref={calendarRef}>
        <div className="flex min-h-full">
          {/* Time labels */}
          <div className="w-16 flex-shrink-0 border-r border-gray-300 bg-gray-50">
            <div className="h-12" /> {/* Header spacer */}
            {hours.map(hour => (
              <div key={hour}>
                <div
                  className="border-t border-gray-300 text-xs text-gray-600 pr-2 text-right"
                  style={{ height: `${hourHeight / 2}px`, paddingTop: '2px' }}
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div style={{ height: `${hourHeight / 2}px` }} />
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="flex-1 flex">
            {days.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col min-w-[120px]">
                <div className="h-12 border-b border-gray-300 bg-gray-50 flex flex-col items-center justify-center sticky top-0 z-10">
                  <div className="font-semibold text-sm">{day}</div>
                  <div className="text-xs text-gray-500">{weekDates[idx]}</div>
                </div>
                {renderTimeGrid(day, idx)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-300 rounded shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'event' ? (
            <>
              <button
                onClick={() => {
                  setEditingEvent(contextMenu.event);
                  setShowEventModal(true);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  handleCopyTo();
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                Copy to...
              </button>
              {currentWeek === 0 && (
                <button
                  onClick={() => {
                    copyToNextWeek();
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100"
                >
                  Copy to next week
                </button>
              )}
              <button
                onClick={() => {
                  deleteEvents();
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
              >
                Delete {selectedEvents.size > 1 ? `(${selectedEvents.size})` : ''}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                createNewEvent(contextMenu.day, contextMenu.hour, contextMenu.minute);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              Create Event
            </button>
          )}
        </div>
      )}

      {/* Conflict Warning Modal */}
      {conflictWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Scheduling Conflict</h2>
            <p className="whitespace-pre-line mb-4">{conflictWarning.message}</p>
            <button
              onClick={conflictWarning.onConfirm}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {events.find(e => e.id === editingEvent.id) ? 'Edit Event' : 'New Event'}
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Subject</label>
                <input
                  type="text"
                  value={editingEvent.subject}
                  onChange={(e) => setEditingEvent({...editingEvent, subject: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Teachers</label>
                <div className="space-y-2">
                  {editingEvent.teachers.map((teacher, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select
                        value={teacher}
                        onChange={(e) => {
                          const newTeachers = [...editingEvent.teachers];
                          newTeachers[idx] = e.target.value;
                          setEditingEvent({...editingEvent, teachers: newTeachers});
                        }}
                        className="flex-1 px-3 py-2 border rounded"
                      >
                        <option value="">Select Teacher</option>
                        {teacherList.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const newTeachers = editingEvent.teachers.filter((_, i) => i !== idx);
                          setEditingEvent({...editingEvent, teachers: newTeachers});
                        }}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setEditingEvent({...editingEvent, teachers: [...editingEvent.teachers, '']})}
                    className="px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-sm"
                  >
                    + Add Teacher
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Students</label>
                <div className="space-y-2">
                  {editingEvent.students.map((student, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select
                        value={student}
                        onChange={(e) => {
                          const newStudents = [...editingEvent.students];
                          newStudents[idx] = e.target.value;
                          setEditingEvent({...editingEvent, students: newStudents});
                        }}
                        className="flex-1 px-3 py-2 border rounded"
                      >
                        <option value="">Select Student</option>
                        {studentList.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const newStudents = editingEvent.students.filter((_, i) => i !== idx);
                          setEditingEvent({...editingEvent, students: newStudents});
                        }}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setEditingEvent({...editingEvent, students: [...editingEvent.students, '']})}
                    className="px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-sm"
                  >
                    + Add Student
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Branch</label>
                <select
                  value={editingEvent.branch}
                  onChange={(e) => setEditingEvent({...editingEvent, branch: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="Branch A">Branch A</option>
                  <option value="Branch B">Branch B</option>
                  <option value="Branch C">Branch C</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Room</label>
                <select
                  value={editingEvent.room}
                  onChange={(e) => setEditingEvent({...editingEvent, room: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select Room</option>
                  {roomList.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <input
                    type="time"
                    step="900"
                    value={`${editingEvent.startTime.hour.toString().padStart(2, '0')}:${editingEvent.startTime.minute.toString().padStart(2, '0')}`}
                    onChange={(e) => {
                      const [hour, minute] = e.target.value.split(':').map(Number);
                      const roundedMinute = Math.round(minute / 15) * 15;
                      setEditingEvent({
                        ...editingEvent,
                        startTime: {...editingEvent.startTime, hour, minute: roundedMinute}
                      });
                    }}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <input
                    type="time"
                    step="900"
                    value={`${editingEvent.endTime.hour.toString().padStart(2, '0')}:${editingEvent.endTime.minute.toString().padStart(2, '0')}`}
                    onChange={(e) => {
                      const [hour, minute] = e.target.value.split(':').map(Number);
                      const roundedMinute = Math.round(minute / 15) * 15;
                      setEditingEvent({
                        ...editingEvent,
                        endTime: {...editingEvent.endTime, hour, minute: roundedMinute}
                      });
                    }}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={saveEvent}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseScheduler;