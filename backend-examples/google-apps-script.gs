/**
 * Google Sheets receiver for the date invitation.
 *
 * Setup (5 minutes):
 * 1. Create a new Google Sheet.
 * 2. Extensions → Apps Script. Delete the sample code and paste this file.
 * 3. (Optional) put your email in NOTIFY_EMAIL to get an email too.
 * 4. Deploy → New deployment → type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 *    Click Deploy, approve the permissions, and copy the Web app URL (ends in /exec).
 * 5. In script.js set:
 *      backend: { method: "googleSheets", endpoint: "PASTE_THE_/exec_URL_HERE" }
 *    (This is an alternative to Formspree; the Formspree version does not need this file.)
 *
 * If you edit this script later, use Deploy → Manage deployments → Edit → New version,
 * otherwise the old code keeps running.
 */

const SHEET_NAME = "Responses";
const NOTIFY_EMAIL = ""; // e.g. "you@gmail.com" — leave empty for no email

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    const cols = ["Accepted", "Selected date", "Selected time", "Date (YYYY-MM-DD)", "Time (24h)", "No-button attempts", "Submitted at", "Submitted at (UTC)"];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Received"].concat(cols));
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([new Date()].concat(cols.map((c) => safe(data[c]))));

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        "It’s a date! ❤️",
        `Selected: ${safe(data["Selected date"])} at ${safe(data["Selected time"])}\n` +
        `No-button attempts: ${safe(data["No-button attempts"])}`
      );
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Keep values short and stop anything that looks like a spreadsheet formula
function safe(v) {
  const s = String(v == null ? "" : v).slice(0, 300);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
