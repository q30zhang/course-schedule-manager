import React from 'react';

const NoticeBar = ({
  showAuthError,
  authError,
  showIndexNotice,
  indexSpreadsheet,
  onDismissAuthError,
  onDismissIndexNotice,
  isDarkMode,
  noticeOkBtnRed,
  noticeOkBtnGreen
}) => {
  if ((!showAuthError || !authError) && (!showIndexNotice || !indexSpreadsheet)) {
    return null;
  }

  return (
    <div className="mt-2 text-sm">
      {showAuthError && authError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 flex items-start justify-between gap-3">
          <div className="min-w-0">{authError}</div>
          <button
            onClick={onDismissAuthError}
            className={noticeOkBtnRed}
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
            onClick={onDismissIndexNotice}
            className={noticeOkBtnGreen}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
};

export default NoticeBar;
