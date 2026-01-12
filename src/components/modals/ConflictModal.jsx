import React from 'react';

const ConflictModal = ({ conflictWarning, isDarkMode, btnPrimary }) => {
  if (!conflictWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 w-full max-w-md border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200'}`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>Scheduling Conflict</h2>
        <p className="whitespace-pre-line mb-4">{conflictWarning.message}</p>
        <button
          onClick={conflictWarning.onConfirm}
          className={`${btnPrimary} w-full px-4 py-2`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default ConflictModal;
