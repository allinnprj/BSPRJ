const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const header = read('include/google_sheets_service.h');
const sheets = read('src/google_sheets_service.cpp');
const main = read('src/main.cpp');
const version = read('include/project_version.h');
const upload = main.slice(main.indexOf('void uploadPendingGoogleSheetsWindow()'),
  main.indexOf('void updateDayPartStats('));

assert.match(version, /#define PROJECT_VERSION "0\.1\.102-EXP"/);
assert.match(version, /#define PROJECT_BUILD 156\b/);
assert.match(header, /appendWindowAggregate\([^;]*String &httpResult\)/s);
assert.match(sheets, /GOOGLE_SHEETS_HTTP_READ_TIMEOUT_MS = 12000/);
assert.match(sheets, /http\.setTimeout\(GOOGLE_SHEETS_HTTP_READ_TIMEOUT_MS\)/);
assert.ok(sheets.indexOf('http.setTimeout(GOOGLE_SHEETS_HTTP_READ_TIMEOUT_MS)') <
  sheets.indexOf('http.POST(payload)'), 'Read timeout must be configured before POST.');
assert.match(sheets, /httpResult = F\("not_sent"\)/);
assert.match(sheets, /httpResult = F\("begin_failed"\)/);
assert.match(sheets, /httpResult = String\(httpCode\)/);
assert.match(sheets, /if \(httpCode >= 200 && httpCode < 300\) \{\s*httpResult \+= F\(" accepted=2xx"\)/);
assert.match(sheets, /httpResult \+= F\(" accepted=redirect"\)/);
assert.match(sheets, /httpResult \+= F\(" unaccepted"\)/);
assert.match(sheets, /httpResult \+= F\(" error="\);\s*httpResult \+= errorText/);
assert.match(sheets, /http\.errorToString\(httpCode\)/);

assert.match(main, /GOOGLE_SHEETS_RETRY_INTERVAL_MS = 30000UL/);
assert.match(main, /GOOGLE_SHEETS_QUEUE_SIZE = 6/);
assert.match(upload, /appendWindowAggregate\(nextRecord, PROJECT_VERSION, PROJECT_BUILD,\s*httpResult\)/);
assert.match(upload, /details \+= F\(" http="\);\s*details \+= httpResult;\s*logService\.appendDiagnosticEvent\(F\("GS_UPLOAD"\)/);
assert.match(upload, /if \(currentSheetsWindowAttempts == 1\) \{[\s\S]*details \+= F\(" http="\);\s*details \+= httpResult;\s*logService\.appendDiagnosticEvent\(F\("GS_RETRY"\)/);
assert.strictEqual((upload.match(/logService\.appendDiagnosticEvent\(F\("GS_RETRY"\)/g) || []).length, 1,
  'Only the first failed attempt per window should be logged.');

console.log('Google Sheets HTTP diagnostics contract passed');
