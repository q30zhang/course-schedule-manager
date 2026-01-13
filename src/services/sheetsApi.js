// src/services/sheetsApi.js
// A small, scalable wrapper around Google Sheets v4 REST endpoints.
// This module stays framework-agnostic: it expects an authenticated `googleFetch`.

const SHEETS_BASE = 'https://sheets.googleapis.com/v4';

/**
 * Get spreadsheet sheet metadata (title + index) so we can iterate sheets in order.
 * @param {(url: string, init?: RequestInit) => Promise<any>} googleFetch
 * @param {string} spreadsheetId
 * @returns {Promise<Array<{ title: string, index: number }>>}
 */
export async function getSpreadsheetSheets(googleFetch, spreadsheetId) {
  const url = `${SHEETS_BASE}/spreadsheets/${spreadsheetId}?fields=sheets(properties(title,index))`;
  const data = await googleFetch(url);
  const sheets = (data.sheets || []).map((s) => ({
    title: s?.properties?.title,
    index: s?.properties?.index
  })).filter((s) => typeof s.title === 'string' && typeof s.index === 'number');
  sheets.sort((a, b) => a.index - b.index);
  return sheets;
}

/**
 * Batch get values across multiple ranges.
 * @param {(url: string, init?: RequestInit) => Promise<any>} googleFetch
 * @param {string} spreadsheetId
 * @param {string[]} rangesA1
 * @param {{ majorDimension?: 'ROWS'|'COLUMNS', valueRenderOption?: string, dateTimeRenderOption?: string }} [opts]
 */
export async function valuesBatchGet(googleFetch, spreadsheetId, rangesA1, opts = {}) {
  const params = new URLSearchParams();
  for (const r of rangesA1) params.append('ranges', r);
  if (opts.majorDimension) params.set('majorDimension', opts.majorDimension);
  if (opts.valueRenderOption) params.set('valueRenderOption', opts.valueRenderOption);
  if (opts.dateTimeRenderOption) params.set('dateTimeRenderOption', opts.dateTimeRenderOption);
  const url = `${SHEETS_BASE}/spreadsheets/${spreadsheetId}/values:batchGet?${params.toString()}`;
  return googleFetch(url);
}

/**
 * Create a spreadsheet.
 * @param {(url: string, init?: RequestInit) => Promise<any>} googleFetch
 * @param {object} body
 */
export async function createSpreadsheet(googleFetch, body) {
  return googleFetch(`${SHEETS_BASE}/spreadsheets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

/**
 * Batch update spreadsheet structure (addSheet, deleteSheet, formatting, etc.)
 * @param {(url: string, init?: RequestInit) => Promise<any>} googleFetch
 * @param {string} spreadsheetId
 * @param {object} body
 */
export async function batchUpdate(googleFetch, spreadsheetId, body) {
  return googleFetch(`${SHEETS_BASE}/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

/**
 * Read values from a single range.
 * @param {(url: string, init?: RequestInit) => Promise<any>} googleFetch
 * @param {string} spreadsheetId
 * @param {string} rangeA1
 * @param {{ majorDimension?: 'ROWS'|'COLUMNS', valueRenderOption?: string, dateTimeRenderOption?: string }} [opts]
 */
export async function readValues(googleFetch, spreadsheetId, rangeA1, opts = {}) {
  const params = new URLSearchParams();
  if (opts.majorDimension) params.set('majorDimension', opts.majorDimension);
  if (opts.valueRenderOption) params.set('valueRenderOption', opts.valueRenderOption);
  if (opts.dateTimeRenderOption) params.set('dateTimeRenderOption', opts.dateTimeRenderOption);

  const qs = params.toString();
  const url = `${SHEETS_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeA1)}${qs ? `?${qs}` : ''}`;
  return googleFetch(url);
}

/**
 * Update values in a single range.
 * @param {(url: string, init?: RequestInit) => Promise<any>} googleFetch
 * @param {string} spreadsheetId
 * @param {string} rangeA1
 * @param {any[][]} values
 * @param {{ valueInputOption?: 'RAW'|'USER_ENTERED' }} [opts]
 */
export async function writeValues(googleFetch, spreadsheetId, rangeA1, values, opts = {}) {
  const valueInputOption = opts.valueInputOption || 'RAW';
  const url = `${SHEETS_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeA1)}?valueInputOption=${encodeURIComponent(valueInputOption)}`;
  return googleFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ range: rangeA1, majorDimension: 'ROWS', values })
  });
}

/**
 * Batch update values across multiple ranges.
 * @param {(url: string, init?: RequestInit) => Promise<any>} googleFetch
 * @param {string} spreadsheetId
 * @param {{ data: Array<{range: string, majorDimension?: 'ROWS'|'COLUMNS', values: any[][]}>, valueInputOption?: 'RAW'|'USER_ENTERED' }} body
 */
export async function valuesBatchUpdate(googleFetch, spreadsheetId, body) {
  const valueInputOption = body.valueInputOption || 'RAW';
  const url = `${SHEETS_BASE}/spreadsheets/${spreadsheetId}/values:batchUpdate?valueInputOption=${encodeURIComponent(valueInputOption)}`;
  return googleFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: body.data })
  });
}

/**
 * Append values to a range.
 * @param {(url: string, init?: RequestInit) => Promise<any>} googleFetch
 * @param {string} spreadsheetId
 * @param {string} rangeA1
 * @param {any[][]} values
 * @param {{ valueInputOption?: 'RAW'|'USER_ENTERED', insertDataOption?: 'INSERT_ROWS'|'OVERWRITE' }} [opts]
 */
export async function appendValues(googleFetch, spreadsheetId, rangeA1, values, opts = {}) {
  const valueInputOption = opts.valueInputOption || 'RAW';
  const insertDataOption = opts.insertDataOption || 'INSERT_ROWS';
  const url = `${SHEETS_BASE}/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rangeA1)}:append?valueInputOption=${encodeURIComponent(valueInputOption)}&insertDataOption=${encodeURIComponent(insertDataOption)}`;
  return googleFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ range: rangeA1, majorDimension: 'ROWS', values })
  });
}

// ---------------------------
// Week schedule parsing utils
// ---------------------------

const DEFAULT_SCHEDULE_RANGE = 'A1:G13';

function normalizeLines(text) {
  return String(text)
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function parseTimeToken(tok) {
  const s = String(tok).trim();

  // 12-hour format with am/pm: 4pm, 4:15pm, 04:15PM
  const m12 = s.match(/^([0-9]{1,2})(?::([0-9]{2}))?\s*([aApP][mM])$/);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = m12[2] ? parseInt(m12[2], 10) : 0;
    const ampm = m12[3].toLowerCase();
    if (h < 1 || h > 12 || min < 0 || min > 59) return null;
    if (h === 12) h = 0;
    if (ampm === 'pm') h += 12;
    return { hour: h, minute: min, hasMeridiem: true };
  }

  // 24-hour format without am/pm: 16:15, 9:05, 09:05, or whole hour like 16
  const m24 = s.match(/^([0-9]{1,2})(?::([0-9]{2}))?$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const min = m24[2] ? parseInt(m24[2], 10) : 0;
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return { hour: h, minute: min, hasMeridiem: false };
  }

  return null;
}

function fixAmPmMinutes(stMin, etMin) {
  // Port of the spreadsheet FIXAMPM2 idea, but using minutes since midnight.
  // We only apply +/- 12 hours when the duration is clearly wrong.
  const st = stMin / 1440;
  const et = etMin / 1440;

  let fixedST = st;
  let fixedET = et;

  if (et - st > 0.5) {
    // too long (> 12h)
    if (st < 1 / 3 || et < 7 / 8) {
      fixedST = st + 0.5;
      fixedET = et;
    } else if (et >= 23 / 24 || st >= 3 / 8) {
      fixedST = st;
      fixedET = et - 0.5;
    }
  } else if (et < st) {
    // negative duration
    if (st >= 7 / 8 || et >= 11 / 24) {
      fixedST = st - 0.5;
      fixedET = et;
    } else if (et < 3 / 8 || st < 5 / 6) {
      fixedST = st;
      fixedET = et + 0.5;
    }
  }

  // Convert back to minutes, normalized to [0, 1440)
  const norm = (x) => {
    let v = Math.round(x * 1440);
    v = ((v % 1440) + 1440) % 1440;
    return v;
  };

  return { stMin: norm(fixedST), etMin: norm(fixedET) };
}

function parseTimeRange(line) {
  // Example: 4:15pm-6:15pm (dash could have spaces)
  const m = String(line).trim().match(/^(.+?)\s*-\s*(.+?)$/);
  if (!m) return null;

  const start = parseTimeToken(m[1]);
  const end = parseTimeToken(m[2]);
  if (!start || !end) return null;

  let stMin = start.hour * 60 + start.minute;
  let etMin = end.hour * 60 + end.minute;

  // Only attempt AM/PM correction when BOTH tokens explicitly used am/pm.
  // If either side is 24-hour format, we assume it is already unambiguous.
  if (start.hasMeridiem && end.hasMeridiem) {
    const fixed = fixAmPmMinutes(stMin, etMin);
    stMin = fixed.stMin;
    etMin = fixed.etMin;

    // Update the hour/minute values
    start.hour = Math.floor(stMin / 60);
    start.minute = stMin % 60;
    end.hour = Math.floor(etMin / 60);
    end.minute = etMin % 60;
  }

  return {
    start: { hour: start.hour, minute: start.minute },
    end: { hour: end.hour, minute: end.minute }
  };
}

function cleanTeacherName(name) {
  return String(name || '')
    .replace(/\b1v1\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitPeople(str, cleaner = (x) => String(x).trim()) {
  // People could be "A", "A, B", "A & B", "A / B", "A and B"
  return String(str)
    .split(/\s*(?:,|&|\/|\band\b)\s*/i)
    .map((s) => cleaner(s))
    .filter(Boolean);
}

function parseCellText(cellText) {
  const lines = normalizeLines(cellText);
  if (lines.length === 0) return null;

  const time = parseTimeRange(lines[0]);
  if (!time) {
    // If it doesn't start with a time range, treat as invalid/empty cell
    return null;
  }

  // Teacher line is typically the last line like "(Teacher Name)" (fullwidth parens are normalized earlier)
  let teacherLineIdx = -1;
  for (let i = lines.length - 1; i >= 1; i--) {
    if (/^\(.+\)$/.test(lines[i])) {
      teacherLineIdx = i;
      break;
    }
  }

  let teachers = [];
  let studentLines = [];

  if (teacherLineIdx !== -1) {
    const inside = lines[teacherLineIdx].slice(1, -1).trim();
    teachers = splitPeople(inside, cleanTeacherName);
    studentLines = lines.slice(1, teacherLineIdx);
  } else {
    // No teacher line found; everything after time is student block
    studentLines = lines.slice(1);
  }

  // Parse students + subject from "Student Name (Subject)"
  const students = [];
  let subject = '';
  for (const ln of studentLines) {
    // No change needed here, normalization already handled fullwidth parens
    const m = ln.match(/^(.+?)\s*\((.+?)\)\s*$/);
    if (m) {
      const name = m[1].trim();
      const sub = m[2].trim();
      if (name) students.push(name);
      if (!subject) subject = sub;
    } else {
      // fallback: treat whole line as student name
      if (ln.trim()) students.push(ln.trim());
    }
  }

  return {
    startHour: time.start.hour,
    startMinute: time.start.minute,
    endHour: time.end.hour,
    endMinute: time.end.minute,
    students,
    teachers,
    subject
  };
}

function a1RowToDates(rowValues) {
  // Expect Monday..Sunday date strings in yyyy-mm-dd
  // Return array length 7 with strings (may be empty)
  const out = new Array(7).fill('');
  for (let i = 0; i < 7; i++) {
    const v = rowValues?.[i];
    out[i] = v ? String(v).trim() : '';
  }
  return out;
}

/**
 * Load a single campus weekly schedule spreadsheet.
 *
 * Spreadsheet format assumptions (your current system):
 * - Each sheet/tab is a room.
 * - Sheet names can vary; we identify room by sheet order (index).
 * - Range A1:G13 contains the schedule grid.
 * - A2:G2 contains dates (yyyy-mm-dd) Monday..Sunday.
 * - A4:G13 contains event cells.
 *
 * @param {(url: string, init?: RequestInit) => Promise<any>} googleFetch
 * @param {string} spreadsheetId
 * @param {{ campusId?: string, rangeA1?: string }} [opts]
 * @returns {Promise<{ events: any[], rooms: Array<{ roomIndex: number, sheetTitle: string }>, dates: string[] }>}
 */
export async function loadWeekSchedule(googleFetch, spreadsheetId, opts = {}) {
  const campusId = opts.campusId || spreadsheetId;
  const rangeA1 = opts.rangeA1 || DEFAULT_SCHEDULE_RANGE;

  // 1) List sheets in order
  const sheets = await getSpreadsheetSheets(googleFetch, spreadsheetId);

  // 2) Read each room sheet range (use batchGet in chunks to reduce calls)
  const ranges = sheets.map((s) => `${s.title}!${rangeA1}`);

  const valueRanges = [];
  const CHUNK = 30; // safe chunk size
  for (let i = 0; i < ranges.length; i += CHUNK) {
    const chunk = ranges.slice(i, i + CHUNK);
    const res = await valuesBatchGet(googleFetch, spreadsheetId, chunk, { majorDimension: 'ROWS' });
    if (Array.isArray(res?.valueRanges)) valueRanges.push(...res.valueRanges);
  }

  // Map title -> grid (rows)
  const byTitle = new Map();
  for (const vr of valueRanges) {
    const r = vr?.range || '';
    // vr.range is like "Sheet1!A1:G13"; extract sheet title
    const sheetTitle = r.includes('!') ? r.split('!')[0] : r;
    byTitle.set(sheetTitle, vr?.values || []);
  }

  const allEvents = [];
  let dates = null;

  for (const sheetMeta of sheets) {
    const sheetTitle = sheetMeta.title;
    const values = byTitle.get(sheetTitle) || [];

    // Ensure we have at least row 2 (index 1)
    const dateRow = values[1] || []; // A2:G2
    const sheetDates = a1RowToDates(dateRow);
    if (!dates) dates = sheetDates;

    // Room identity by order
    const roomIndex = sheetMeta.index + 1; // 1-based

    // Data rows A4:G13 => indices 3..12
    for (let r = 3; r <= 12; r++) {
      const row = values[r] || [];
      for (let c = 0; c < 7; c++) {
        const cell = row[c];
        if (!cell || String(cell).trim().length === 0) continue;

        const parsed = parseCellText(cell);
        if (!parsed) continue;

        const date = sheetDates[c] || (dates ? dates[c] : '');

        allEvents.push({
          id: `${spreadsheetId}:${sheetTitle}:${r}:${c}:${parsed.startHour}:${parsed.startMinute}`,
          campus: campusId,
          spreadsheetId,
          room: roomIndex,
          roomSheetTitle: sheetTitle,
          date,
          day: c, // 0=Mon ... 6=Sun
          startTime: { day: c, hour: parsed.startHour, minute: parsed.startMinute },
          endTime: { day: c, hour: parsed.endHour, minute: parsed.endMinute },
          subject: parsed.subject,
          students: parsed.students,
          teachers: parsed.teachers
        });
      }
    }
  }

  return {
    events: allEvents,
    rooms: sheets.map((s) => ({ roomIndex: s.index + 1, sheetTitle: s.title })),
    dates: dates || new Array(7).fill('')
  };
}

/**
 * Creates the Index spreadsheet (metadata workbook) in the signed-in user's Drive.
 * Built on top of generic helpers so it's easy to add more flows later.
 *
 * @param {(url: string, init?: RequestInit) => Promise<any>} googleFetch - Authenticated fetch wrapper.
 * @param {{ title?: string }} opts
 * @returns {Promise<{ spreadsheetId: string, spreadsheetUrl: string }>} 
 */
export async function createIndexSpreadsheetInMyDrive(googleFetch, opts = {}) {
  const title = opts.title || 'Course Schedule Manager - Index';

  // 1) Create spreadsheet with the first sheet
  const created = await createSpreadsheet(googleFetch, {
    properties: { title },
    sheets: [{ properties: { title: 'campus_week_index' } }]
  });

  const spreadsheetId = created.spreadsheetId;
  const spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2) Add remaining sheets
  await batchUpdate(googleFetch, spreadsheetId, {
    requests: [
      { addSheet: { properties: { title: 'teachers' } } },
      { addSheet: { properties: { title: 'students' } } },
      { addSheet: { properties: { title: 'course_status' } } },
      { addSheet: { properties: { title: 'audit_log' } } }
    ]
  });

  // 3) Seed headers
  await valuesBatchUpdate(googleFetch, spreadsheetId, {
    valueInputOption: 'RAW',
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
        values: [['teacher_id', 'name', 'email', 'campus_ids', 'active']]
      },
      {
        range: 'students!A1:E1',
        majorDimension: 'ROWS',
        values: [['student_id', 'name', 'email', 'campus_id', 'active']]
      },
      {
        range: 'course_status!A1:D1',
        majorDimension: 'ROWS',
        values: [['status_code', 'label', 'color', 'active']]
      },
      {
        range: 'audit_log!A1:F1',
        majorDimension: 'ROWS',
        values: [['timestamp', 'user', 'action', 'campus_id', 'week_start_date', 'details']]
      }
    ]
  });

  return { spreadsheetId, spreadsheetUrl };
}

