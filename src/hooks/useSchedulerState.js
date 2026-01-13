import { useEffect, useMemo, useState } from 'react';

const useSchedulerState = () => {
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

  // Derived lists (update automatically based on loaded events)
  const teacherList = useMemo(() => {
    const set = new Set();
    for (const e of events) (e.teachers || []).forEach((t) => t && set.add(t));
    return Array.from(set);
  }, [events]);

  const studentList = useMemo(() => {
    const set = new Set();
    for (const e of events) (e.students || []).forEach((s) => s && set.add(s));
    return Array.from(set);
  }, [events]);

  const roomList = useMemo(() => {
    const set = new Set();
    for (const e of events) if (e.room) set.add(e.room);
    return Array.from(set);
  }, [events]);

  // Fixed campuses/branches (to be replaced later by reading from the index sheet)
  const branchList = useMemo(() => ['TEST_CAMPUS', 'Campus North', 'Campus South', 'Campus West'], []);

  const sortedTeachers = useMemo(() => [...teacherList].sort(), [teacherList]);
  const sortedStudents = useMemo(() => [...studentList].sort(), [studentList]);

  const [viewMode, setViewMode] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHalfHourLines, setShowHalfHourLines] = useState(false);
  const [copyMode, setCopyMode] = useState(false);
  const [eventToCopy, setEventToCopy] = useState(null);
  const [conflictWarning, setConflictWarning] = useState(null);

  const [userSettings, setUserSettings] = useState({
    branch: branchList[0] || 'TEST_CAMPUS',
    timezone: 'auto'
  });

  // Predefined campus colors (only depends on campus/branch to avoid confusion)
  const branchColors = useMemo(
    () => ({
      TEST_CAMPUS: 'hsl(210, 70%, 85%)',
      'Campus North': 'hsl(150, 70%, 85%)',
      'Campus South': 'hsl(30, 70%, 85%)',
      'Campus West': 'hsl(270, 70%, 85%)'
    }),
    []
  );

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

  const getFilteredEvents = () => {
    let filtered = events;
    if (viewMode === 'teacher' && selectedTeacher) {
      filtered = events.filter((e) => e.teachers.includes(selectedTeacher));
    } else if (viewMode === 'student' && selectedStudent) {
      filtered = events.filter((e) => e.students.includes(selectedStudent));
    } else if (viewMode === 'branch' && selectedBranch) {
      filtered = events.filter((e) => e.branch === selectedBranch);
    }
    return filtered;
  };

  const getEventColor = (event) => {
    return branchColors[event.branch] || 'hsl(210, 10%, 85%)';
  };

  const checkConflicts = (newEvent, excludeEventId = null) => {
    const conflicts = [];
    const newStart = newEvent.startTime.day * 1440 + newEvent.startTime.hour * 60 + newEvent.startTime.minute;
    const newEnd = newEvent.endTime.day * 1440 + newEvent.endTime.hour * 60 + newEvent.endTime.minute;

    events.forEach((event) => {
      if (event.id === excludeEventId) return;

      const eventStart = event.startTime.day * 1440 + event.startTime.hour * 60 + event.startTime.minute;
      const eventEnd = event.endTime.day * 1440 + event.endTime.hour * 60 + event.endTime.minute;

      if (!(newEnd <= eventStart || newStart >= eventEnd)) {
        const teacherOverlap = newEvent.teachers.filter((t) => event.teachers.includes(t));
        if (teacherOverlap.length > 0) {
          conflicts.push(`Teacher ${teacherOverlap.join(', ')} already has an event at this time`);
        }

        const studentOverlap = newEvent.students.filter((s) => event.students.includes(s));
        if (studentOverlap.length > 0) {
          conflicts.push(`Student ${studentOverlap.join(', ')} already has an event at this time`);
        }
      }
    });

    return conflicts;
  };

  const handleEventClick = (e, eventId) => {
    e.stopPropagation();

    if (copyMode) {
      setCopyMode(false);
      setEventToCopy(null);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedEvents((prev) => {
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

  const handleEventContextMenuSelect = (event) => {
    if (!selectedEvents.has(event.id) && selectedEvents.size > 0) {
      setSelectedEvents(new Set([event.id]));
    } else if (selectedEvents.size === 0) {
      setSelectedEvents(new Set([event.id]));
    }
  };

  const handleDragStart = (e, event) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedEvent(event);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleDrop = (e, day, pixelsToTime) => {
    e.preventDefault();
    if (!draggedEvent) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top - dragOffset.y;
    const { hour, minute } = pixelsToTime(y);

    const duration =
      draggedEvent.endTime.hour * 60 +
      draggedEvent.endTime.minute -
      (draggedEvent.startTime.hour * 60 + draggedEvent.startTime.minute);

    const endTotalMinutes = hour * 60 + minute + duration;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMinute = endTotalMinutes % 60;

    const updatedEvent = {
      ...draggedEvent,
      startTime: { ...draggedEvent.startTime, day, hour, minute },
      endTime: { ...draggedEvent.endTime, day, hour: endHour, minute: endMinute }
    };

    const conflicts = checkConflicts(updatedEvent, draggedEvent.id);
    if (conflicts.length > 0) {
      setConflictWarning({
        message: conflicts.join('\n'),
        onConfirm: () => setConflictWarning(null)
      });
      setDraggedEvent(null);
      return;
    }

    setEvents((prev) => prev.map((ev) => (ev.id === draggedEvent.id ? updatedEvent : ev)));

    setDraggedEvent(null);
    console.log('Event moved - sync with database');
  };

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

  const openNewEventModal = () => {
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
  };

  const deleteEvents = () => {
    setEvents((prev) => prev.filter((e) => !selectedEvents.has(e.id)));
    setSelectedEvents(new Set());
    console.log('Events deleted - sync with database');
  };

  const saveEvent = () => {
    const conflicts = checkConflicts(editingEvent, editingEvent.id);
    if (conflicts.length > 0) {
      setConflictWarning({
        message: conflicts.join('\n'),
        onConfirm: () => setConflictWarning(null)
      });
      return;
    }

    if (editingEvent.id && events.find((e) => e.id === editingEvent.id)) {
      setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? editingEvent : e)));
    } else {
      setEvents((prev) => [...prev, editingEvent]);
    }
    setShowEventModal(false);
    setEditingEvent(null);
    console.log('Event saved - sync with database');
  };

  const startCopyFromEvent = (event) => {
    setEventToCopy(event);
    setCopyMode(true);
  };

  const pasteEvent = (day, hour, minute) => {
    if (!eventToCopy) return;

    const duration =
      eventToCopy.endTime.hour * 60 +
      eventToCopy.endTime.minute -
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

    setEvents((prev) => [...prev, newEvent]);
    setCopyMode(false);
    setEventToCopy(null);
    console.log('Event copied - sync with database');
  };

  const copyToNextWeek = (event) => {
    const newEvent = {
      ...event,
      id: Date.now()
    };

    const conflicts = checkConflicts(newEvent);
    if (conflicts.length > 0) {
      setConflictWarning({
        message: conflicts.join('\n'),
        onConfirm: () => setConflictWarning(null)
      });
      return;
    }

    setEvents((prev) => [...prev, newEvent]);
    console.log('Event copied to next week - sync with database');
  };

  return {
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
    setSelectedEvents,
    draggedEvent,
    setDraggedEvent,
    dragOffset,
    setDragOffset,
    showEventModal,
    setShowEventModal,
    editingEvent,
    setEditingEvent,
    showSettings,
    setShowSettings,
    showHalfHourLines,
    setShowHalfHourLines,
    copyMode,
    setCopyMode,
    eventToCopy,
    setEventToCopy,
    conflictWarning,
    setConflictWarning,
    userSettings,
    setUserSettings,
    getFilteredEvents,
    getEventColor,
    checkConflicts,
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
  };
};

export default useSchedulerState;
