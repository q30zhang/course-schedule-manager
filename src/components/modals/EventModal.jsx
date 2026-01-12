import React from 'react';
import { X } from 'lucide-react';

const EventModal = ({
  isOpen,
  editingEvent,
  events,
  teacherList,
  studentList,
  roomList,
  isDarkMode,
  btnPrimary,
  btnSecondary,
  btnDanger,
  btnLinkBlue,
  onSave,
  onCancel,
  onChangeEvent
}) => {
  if (!isOpen || !editingEvent) return null;

  const isEditing = events.find((e) => e.id === editingEvent.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200'}`}>
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? 'Edit Event' : 'New Event'}
        </h2>
        <div>
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            value={editingEvent.dateIso || ''}
            onChange={(e) => {
              const newIso = e.target.value;
              onChangeEvent({ ...editingEvent, dateIso: newIso });
            }}
            className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
          />
          <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
            If you change the date to a different week, the event must be migrated to that week’s spreadsheet (to be implemented).
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Subject</label>
            <input
              type="text"
              value={editingEvent.subject}
              onChange={(e) => onChangeEvent({ ...editingEvent, subject: e.target.value })}
              className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
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
                      onChangeEvent({ ...editingEvent, teachers: newTeachers });
                    }}
                    className={`flex-1 px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
                  >
                    <option value="">Select Teacher</option>
                    {teacherList.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const newTeachers = editingEvent.teachers.filter((_, i) => i !== idx);
                      onChangeEvent({ ...editingEvent, teachers: newTeachers });
                    }}
                    className={`${btnDanger} px-3 py-2`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => onChangeEvent({ ...editingEvent, teachers: [...editingEvent.teachers, ''] })}
                className={`${btnLinkBlue} px-3 py-2`}
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
                      onChangeEvent({ ...editingEvent, students: newStudents });
                    }}
                    className={`flex-1 px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
                  >
                    <option value="">Select Student</option>
                    {studentList.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const newStudents = editingEvent.students.filter((_, i) => i !== idx);
                      onChangeEvent({ ...editingEvent, students: newStudents });
                    }}
                    className={`${btnDanger} px-3 py-2`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => onChangeEvent({ ...editingEvent, students: [...editingEvent.students, ''] })}
                className={`${btnLinkBlue} px-3 py-2`}
              >
                + Add Student
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Branch</label>
            <select
              value={editingEvent.branch}
              onChange={(e) => onChangeEvent({ ...editingEvent, branch: e.target.value })}
              className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
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
              onChange={(e) => onChangeEvent({ ...editingEvent, room: e.target.value })}
              className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
            >
              <option value="">Select Room</option>
              {roomList.map((r) => (
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
                  onChangeEvent({
                    ...editingEvent,
                    startTime: { ...editingEvent.startTime, hour, minute: roundedMinute }
                  });
                }}
                className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
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
                  onChangeEvent({
                    ...editingEvent,
                    endTime: { ...editingEvent.endTime, hour, minute: roundedMinute }
                  });
                }}
                className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onSave}
            className={`${btnPrimary} flex-1 px-4 py-2`}
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className={`${btnSecondary} flex-1 px-4 py-2`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
