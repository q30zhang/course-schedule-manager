import React from 'react';
import { Settings, RefreshCw, Moon, Sun } from 'lucide-react';

const HeaderBar = ({
  isDarkMode,
  iconBtnClass,
  btnPrimary,
  btnSecondary,
  accessToken,
  onSignIn,
  onSignOut,
  onCreateIndex,
  showHalfHourLines,
  onToggleHalfHourLines,
  onToggleSettings,
  onToggleDarkMode,
  onSync,
  children
}) => {
  return (
    <div className={`border-b p-4 shadow-sm ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
      <div className="flex items-center justify-between mb-4">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Course Scheduler</h1>
        <div className="flex gap-2">
          {!accessToken ? (
            <button
              onClick={onSignIn}
              className={`${btnSecondary} px-3 py-2 text-sm`}
              title="Sign in with Google"
            >
              Sign in
            </button>
          ) : (
            <>
              <button
                onClick={onSignOut}
                className={`${btnSecondary} px-3 py-2 text-sm`}
                title="Sign out"
              >
                Sign out
              </button>
              <button
                onClick={onCreateIndex}
                className={`${btnPrimary} px-3 py-2 text-sm`}
                title="Create the Index spreadsheet in your Drive"
              >
                Create Index Sheet
              </button>
            </>
          )}
          <label className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-100' : ''}`}>
            <input
              type="checkbox"
              checked={showHalfHourLines}
              onChange={(e) => onToggleHalfHourLines(e.target.checked)}
            />
            Half-hour lines
          </label>
          <button
            onClick={onToggleSettings}
            className={iconBtnClass}
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={onToggleDarkMode}
            className={iconBtnClass}
            title={isDarkMode ? 'Switch to Day view' : 'Switch to Night view'}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={onSync}
            className={iconBtnClass}
            title="Sync"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
};

export default HeaderBar;
