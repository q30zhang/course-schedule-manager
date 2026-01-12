import React from 'react';
import { Plus, User, GraduationCap, MapPin } from 'lucide-react';

const Toolbar = ({
  isDarkMode,
  btnPrimary,
  pillBtnBase,
  pillBtnInactive,
  viewMode,
  onViewMode,
  selectedTeacher,
  selectedStudent,
  selectedBranch,
  onSelectTeacher,
  onSelectStudent,
  onSelectBranch,
  teacherList,
  studentList,
  branchList,
  currentWeek,
  onSetCurrentWeek,
  onAddEvent,
  copyMode
}) => {
  return (
    <>
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={onAddEvent}
          className={`${btnPrimary} px-3 py-2 flex items-center gap-2`}
        >
          <Plus size={16} />
          Add Event
        </button>

        <div className="flex gap-1 border-l pl-2">
          <button
            onClick={() => onViewMode('all')}
            className={`${pillBtnBase} ${
              viewMode === 'all'
                ? (isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-700')
                : pillBtnInactive
            }`}
          >
            All
          </button>
          <button
            onClick={() => onViewMode('teacher')}
            className={`${pillBtnBase} flex items-center gap-1 ${
              viewMode === 'teacher'
                ? (isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-700')
                : pillBtnInactive
            }`}
          >
            <User size={16} />
            Teacher
          </button>
          <button
            onClick={() => onViewMode('student')}
            className={`${pillBtnBase} flex items-center gap-1 ${
              viewMode === 'student'
                ? (isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-700')
                : pillBtnInactive
            }`}
          >
            <GraduationCap size={16} />
            Student
          </button>
          <button
            onClick={() => onViewMode('branch')}
            className={`${pillBtnBase} flex items-center gap-1 ${
              viewMode === 'branch'
                ? (isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-700')
                : pillBtnInactive
            }`}
          >
            <MapPin size={16} />
            Branch
          </button>
        </div>

        {viewMode === 'teacher' && (
          <select
            value={selectedTeacher}
            onChange={(e) => onSelectTeacher(e.target.value)}
            className={`px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
          >
            <option value="">Select Teacher</option>
            {teacherList.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}

        {viewMode === 'student' && (
          <select
            value={selectedStudent}
            onChange={(e) => onSelectStudent(e.target.value)}
            className={`px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
          >
            <option value="">Select Student</option>
            {studentList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {viewMode === 'branch' && (
          <select
            value={selectedBranch}
            onChange={(e) => onSelectBranch(e.target.value)}
            className={`px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
          >
            <option value="">Select Branch</option>
            {branchList.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        )}

        <div className="flex gap-1 border-l pl-2">
          <button
            onClick={() => onSetCurrentWeek(0)}
            className={`${pillBtnBase} ${
              currentWeek === 0
                ? (isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-700')
                : pillBtnInactive
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => onSetCurrentWeek(1)}
            className={`${pillBtnBase} ${
              currentWeek === 1
                ? (isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-700')
                : pillBtnInactive
            }`}
          >
            Next Week
          </button>
        </div>
      </div>

      {copyMode && (
        <div className={`mt-2 rounded p-2 text-sm border ${
          isDarkMode
            ? 'bg-yellow-900/30 border-yellow-800 text-yellow-100'
            : 'bg-yellow-100 border-yellow-300'
        }`}>
          Copy mode active - Click on a time slot to paste, or press ESC to cancel
        </div>
      )}
    </>
  );
};

export default Toolbar;
