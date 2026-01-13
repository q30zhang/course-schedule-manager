import React from 'react';

const ConflictModal = ({ conflictWarning, isDarkMode, btnPrimary, onClose }) => {
  if (!conflictWarning) return null;

  // Backward/forward compatibility:
  // - new/expected: { message: string, onConfirm?: fn }
  // - legacy/accidental: string
  const message =
    typeof conflictWarning === 'string'
      ? conflictWarning
      : (conflictWarning.message || 'Scheduling conflict');

  const handleOk = () => {
    // Prefer the provided onConfirm, but always close.
    try {
      if (typeof conflictWarning === 'object' && typeof conflictWarning.onConfirm === 'function') {
        conflictWarning.onConfirm();
      }
    } finally {
      if (typeof onClose === 'function') onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`rounded-lg p-6 w-full max-w-md border ${
          isDarkMode
            ? 'bg-gray-900 border-gray-700 text-gray-100'
            : 'bg-white border-gray-200'
        }`}
      >
        <h2
          className={`text-xl font-bold mb-4 ${
            isDarkMode ? 'text-red-300' : 'text-red-600'
          }`}
        >
          Scheduling Conflict
        </h2>
        <p className="whitespace-pre-line mb-4">{message}</p>
        <button onClick={handleOk} className={`${btnPrimary} w-full px-4 py-2`}>
          OK
        </button>
      </div>
    </div>
  );
};

export default ConflictModal;
