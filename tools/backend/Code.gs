/**
 * File Manager Toolkit - feedback and usage backend.
 * Lives in a Google Sheet (Extensions > Apps Script), deployed as a web app that anyone can call.
 * The site (assets/backend.js) posts two kinds of rows:
 *   feedback -> sheet "Feedback": what the visitor wrote, optional name and e-mail
 *   usage    -> sheet "Usage": one row per page visit, anonymous
 * Replying: write your answer in the "Your reply" column, then menu Feedback > Send replies.
 * The person gets an e-mail with your reply and their original message.
 */

const SITE = 'https://scorpion30.github.io/file-manager-toolkit/';
const FROM_NAME = 'File Manager Toolkit';

const FEEDBACK = 'Feedback';
const USAGE = 'Usage';
const DASHBOARD = 'Dashboard';
const FEEDBACK_HEADERS = ['Date', 'Type', 'Message', 'Name', 'Email', 'Page', 'Lang', 'Visitor', 'Your reply', 'Replied at', 'Notes'];
const USAGE_HEADERS = ['Date', 'Visitor', 'New visitor', 'Page', 'Lang', 'Seconds', 'Buttons pressed', 'Came from', 'Mobile'];
const COL = { email: 5, name: 4, message: 3, lang: 7, reply: 9, repliedAt: 10 };

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Feedback')
    .addItem('Send replies', 'sendReplies')
    .addSeparator()
    .addItem('Set up sheets', 'setup')
    .addToUi();
}

function doGet() {
  return ContentService.createTextOutput('ok');
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return ContentService.createTextOutput('bad json');
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActive();
    if (data.kind === 'feedback') {
      const message = clip(data.message, 3000);
      if (!message) return ContentService.createTextOutput('empty');
      const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email || '')) ? clip(data.email, 200) : '';
      const row = [new Date(), clip(data.type, 20), message, clip(data.name, 100), email,
        clip(data.page, 100), clip(data.lang, 5), clip(data.visitor, 20), '', '', ''];
      sheet(ss, FEEDBACK, FEEDBACK_HEADERS).appendRow(row.map(safe));
      notifyOwner(row);
    } else if (data.kind === 'usage') {
      const page = clip(data.page, 100);
      const name = pageName(page);
      const buttons = clip(data.actions, 1500).split(/\s+/).filter(Boolean).map((a) => name + ':' + a).join(' ');
      sheet(ss, USAGE, USAGE_HEADERS).appendRow([new Date(), clip(data.visitor, 20), data.isNew ? 'yes' : 'no',
        name, clip(data.lang, 5), Math.min(Number(data.seconds) || 0, 86400), buttons,
        clip(data.referrer, 100), data.mobile ? 'yes' : 'no'].map(safe));
    }
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}

/** Sends every reply typed in "Your reply" that has not gone out yet. */
function sendReplies() {
  const sh = sheet(SpreadsheetApp.getActive(), FEEDBACK, FEEDBACK_HEADERS);
  const rows = sh.getDataRange().getValues();
  let sent = 0;
  let noEmail = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const reply = String(r[COL.reply - 1] || '').trim();
    if (!reply || r[COL.repliedAt - 1]) continue;
    const email = String(r[COL.email - 1] || '').trim();
    if (!email) { noEmail++; continue; }
    const ar = r[COL.lang - 1] === 'ar';
    const name = String(r[COL.name - 1] || '').trim();
    const original = String(r[COL.message - 1] || '');
    const subject = ar ? 'رد على رسالتك - File Manager Toolkit' : 'Reply to your message - File Manager Toolkit';
    const hello = ar ? `أهلاً${name ? ' ' + name : ''}،` : `Hi${name ? ' ' + name : ''},`;
    const thanks = ar ? 'شكراً إنك كتبت لنا. ده ردنا على رسالتك:' : 'Thank you for writing to us. Here is our reply:';
    const yours = ar ? 'رسالتك:' : 'Your message:';
    const more = ar ? 'لو عندك أي سؤال تاني، رد على الإيميل ده.' : 'If you have anything else, just reply to this e-mail.';
    const dir = ar ? 'rtl' : 'ltr';
    const html = `<div dir="${dir}" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#141a2b">
      <p>${esc(hello)}</p><p>${esc(thanks)}</p>
      <div style="border-${ar ? 'right' : 'left'}:4px solid #2f6fde;padding:4px 12px;margin:12px 0">${esc(reply).replace(/\n/g, '<br>')}</div>
      <p style="color:#5d667b;font-size:13px;margin-top:20px">${esc(yours)}</p>
      <div style="color:#5d667b;font-size:13px;border-${ar ? 'right' : 'left'}:3px solid #dfe3ec;padding:2px 10px">${esc(original).replace(/\n/g, '<br>')}</div>
      <p>${esc(more)}</p>
      <p><a href="${SITE}${ar ? 'ar/' : ''}">File Manager Toolkit</a></p></div>`;
    const plain = `${hello}\n\n${thanks}\n\n${reply}\n\n${yours}\n${original}\n\n${more}\n${SITE}${ar ? 'ar/' : ''}`;
    MailApp.sendEmail({ to: email, subject, body: plain, htmlBody: html, name: FROM_NAME });
    sh.getRange(i + 1, COL.repliedAt).setValue(new Date());
    sent++;
  }
  const msg = `Replies sent: ${sent}` + (noEmail ? ` · ${noEmail} reply(s) have no e-mail to send to` : '');
  SpreadsheetApp.getActive().toast(msg, 'Feedback', 8);
}

/** Creates the sheets, headers and the dashboard. Safe to run again. */
function setup() {
  const ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetTimeZone(Session.getScriptTimeZone());
  const fb = sheet(ss, FEEDBACK, FEEDBACK_HEADERS);
  fb.setColumnWidth(3, 380); fb.setColumnWidth(COL.reply, 380);
  fb.getRange('C:C').setWrap(true); fb.getRange('I:I').setWrap(true);
  fb.getRange(1, COL.reply).setBackground('#e6eefc').setNote('Write your answer here, then menu Feedback > Send replies.');
  const us = sheet(ss, USAGE, USAGE_HEADERS);
  us.setColumnWidth(7, 380);

  let d = ss.getSheetByName(DASHBOARD);
  if (!d) d = ss.insertSheet(DASHBOARD, 0);
  d.clear();
  const blocks = [
    ['A1', 'Summary', [
      ['Visits (all time)', '=COUNTA(Usage!A2:A)'],
      ['Visits, last 7 days', '=COUNTIF(Usage!A2:A,">="&(TODAY()-7))'],
      ['Visits, last 30 days', '=COUNTIF(Usage!A2:A,">="&(TODAY()-30))'],
      ['Different visitors', '=COUNTUNIQUE(Usage!B2:B)'],
      ['Visitors who came back', '=IFERROR(ROWS(UNIQUE(FILTER(Usage!B2:B,Usage!C2:C="no"))),0)'],
      ['Arabic visits', '=COUNTIF(Usage!E2:E,"ar")'],
      ['Mobile visits', '=COUNTIF(Usage!I2:I,"yes")'],
      ['Average seconds on a page', '=IFERROR(ROUND(AVERAGE(Usage!F2:F)),0)'],
      ['Feedback messages', '=COUNTA(Feedback!A2:A)'],
      ['Waiting for a reply', '=COUNTIFS(Feedback!E2:E,"<>",Feedback!J2:J,"")'],
    ]],
  ];
  d.getRange('A1').setValue('Summary').setFontWeight('bold').setFontSize(13);
  blocks[0][2].forEach((r, i) => { d.getRange(i + 2, 1).setValue(r[0]); d.getRange(i + 2, 2).setFormula(r[1]); });
  d.getRange('D1').setValue('Visits per page').setFontWeight('bold').setFontSize(13);
  d.getRange('D2').setFormula('=IFERROR(QUERY(Usage!A:I,"select D, count(A) where A is not null group by D order by count(A) desc label D \'Page\', count(A) \'Visits\'",1),"No visits yet")');
  d.getRange('G1').setValue('Buttons pressed most').setFontWeight('bold').setFontSize(13);
  d.getRange('G2').setFormula('=IFERROR(QUERY(FLATTEN(SPLIT(FILTER(Usage!G2:G,Usage!G2:G<>"")," ")),"select Col1, count(Col1) where Col1 <> \'\' group by Col1 order by count(Col1) desc label Col1 \'Page:button\', count(Col1) \'Clicks\'",0),"No clicks yet")');
  d.getRange('J1').setValue('Where visitors came from').setFontWeight('bold').setFontSize(13);
  d.getRange('J2').setFormula('=IFERROR(QUERY(Usage!A:I,"select H, count(A) where A is not null and H <> \'(site)\' group by H order by count(A) desc label H \'Came from\', count(A) \'Visits\'",1),"No visits yet")');
  d.getRange('M1').setValue('Visits per day').setFontWeight('bold').setFontSize(13);
  d.getRange('M2').setFormula('=IFERROR(QUERY(ARRAYFORMULA(IF(Usage!A2:A="",,INT(Usage!A2:A))),"select Col1, count(Col1) where Col1 is not null group by Col1 order by Col1 desc label Col1 \'Day\', count(Col1) \'Visits\'",0),"No visits yet")');
  d.getRange('M:M').setNumberFormat('yyyy-mm-dd');
  d.setColumnWidth(1, 210); d.setColumnWidth(4, 140); d.setColumnWidth(7, 220); d.setColumnWidth(10, 180);
  d.setFrozenRows(1);
  const blank = ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(blank);
  SpreadsheetApp.getActive().toast('Sheets are ready.', 'Feedback', 5);
}

// ---------- helpers ----------

function sheet(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function notifyOwner(row) {
  try {
    const owner = Session.getEffectiveUser().getEmail();
    if (!owner) return;
    const [, type, message, name, email, page, lang] = row;
    MailApp.sendEmail({
      to: owner,
      subject: `New feedback (${type}) - File Manager Toolkit`,
      body: `${message}\n\nFrom: ${name || '-'} ${email ? '<' + email + '>' : '(no e-mail)'}\nPage: ${page} (${lang})\n\n` +
        `Reply in the sheet: ${SpreadsheetApp.getActive().getUrl()}`,
      name: FROM_NAME,
    });
  } catch (err) {
    console.warn('notify failed', err);
  }
}

function pageName(page) {
  const p = String(page || '').replace(/^\/?(ar\/)?/, '').replace(/\.html$/, '');
  return p || 'home';
}

function clip(v, n) {
  return String(v == null ? '' : v).slice(0, n).trim();
}

/** Stops text that starts with = + - @ from running as a formula in the sheet. */
function safe(v) {
  return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
