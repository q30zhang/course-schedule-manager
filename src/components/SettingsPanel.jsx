import React from 'react';

const SettingsPanel = ({ isDarkMode, userSettings, onChange }) => {
  return (
    <div className={`border-b p-4 ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-blue-50 border-blue-200'}`}>
      <h3 className="font-semibold mb-2">User Settings</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Branch</label>
          <select
            value={userSettings.branch}
            onChange={(e) => onChange({ ...userSettings, branch: e.target.value })}
            className={`w-full px-2 py-1 border rounded ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
          >
            <option value="Branch A">Branch A</option>
            <option value="Branch B">Branch B</option>
            <option value="Branch C">Branch C</option>
          </select>
        </div>
        <div>
          <label className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Timezone</label>
          <select
            value={userSettings.timezone}
            onChange={(e) => onChange({ ...userSettings, timezone: e.target.value })}
            className={`w-full px-2 py-1 border rounded ${isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : ''}`}
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
  );
};

export default SettingsPanel;
