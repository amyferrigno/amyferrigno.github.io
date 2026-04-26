'use strict';

/* ── Mock data: 7 days ending today ─────────────────────── */
const TODAY = new Date();

function dateStr(offset = 0) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function shortDay(offset = 0) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function isoStr(offset = 0) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

let DATA = [
  {
    isoDate: isoStr(-6), date: dateStr(-6), day: shortDay(-6),
    readiness: 72, sleep: 68, activity: 80,
    hr: 58, hrv: 42, temp: -0.1, spo2: 97, resp: 15.2,
    sleepDuration: 6.8, rem: 1.4, deep: 0.9, light: 3.8, awake: 0.7,
    bedtime: '10:42 PM', wakeup: '5:37 AM', efficiency: 91,
    steps: 9200, calories: 410, activeMin: 48, met: 1.4, distance: '4.1 mi', highActivity: '22 min',
    inactivityAlerts: 2,
  },
  {
    isoDate: isoStr(-5), date: dateStr(-5), day: shortDay(-5),
    readiness: 78, sleep: 80, activity: 65,
    hr: 55, hrv: 51, temp: +0.2, spo2: 98, resp: 14.8,
    sleepDuration: 7.5, rem: 1.8, deep: 1.3, light: 3.9, awake: 0.5,
    bedtime: '10:15 PM', wakeup: '5:42 AM', efficiency: 94,
    steps: 7100, calories: 320, activeMin: 35, met: 1.2, distance: '3.1 mi', highActivity: '12 min',
    inactivityAlerts: 4,
  },
  {
    isoDate: isoStr(-4), date: dateStr(-4), day: shortDay(-4),
    readiness: 84, sleep: 85, activity: 72,
    hr: 54, hrv: 58, temp: +0.0, spo2: 98, resp: 14.5,
    sleepDuration: 7.9, rem: 2.0, deep: 1.5, light: 3.8, awake: 0.6,
    bedtime: '9:58 PM', wakeup: '5:54 AM', efficiency: 93,
    steps: 8300, calories: 380, activeMin: 42, met: 1.3, distance: '3.7 mi', highActivity: '18 min',
    inactivityAlerts: 3,
  },
  {
    isoDate: isoStr(-3), date: dateStr(-3), day: shortDay(-3),
    readiness: 65, sleep: 60, activity: 88,
    hr: 62, hrv: 35, temp: +0.5, spo2: 96, resp: 15.8,
    sleepDuration: 6.1, rem: 1.1, deep: 0.7, light: 3.6, awake: 0.7,
    bedtime: '11:22 PM', wakeup: '5:30 AM', efficiency: 88,
    steps: 12400, calories: 620, activeMin: 72, met: 1.7, distance: '5.5 mi', highActivity: '38 min',
    inactivityAlerts: 1,
  },
  {
    isoDate: isoStr(-2), date: dateStr(-2), day: shortDay(-2),
    readiness: 70, sleep: 74, activity: 60,
    hr: 59, hrv: 44, temp: +0.3, spo2: 97, resp: 15.0,
    sleepDuration: 7.0, rem: 1.5, deep: 1.1, light: 3.7, awake: 0.7,
    bedtime: '10:50 PM', wakeup: '5:50 AM', efficiency: 90,
    steps: 6800, calories: 290, activeMin: 30, met: 1.2, distance: '3.0 mi', highActivity: '9 min',
    inactivityAlerts: 5,
  },
  {
    isoDate: isoStr(-1), date: dateStr(-1), day: shortDay(-1),
    readiness: 82, sleep: 88, activity: 75,
    hr: 53, hrv: 60, temp: -0.1, spo2: 98, resp: 14.3,
    sleepDuration: 8.1, rem: 2.1, deep: 1.6, light: 3.8, awake: 0.6,
    bedtime: '9:45 PM', wakeup: '5:51 AM', efficiency: 95,
    steps: 9800, calories: 450, activeMin: 55, met: 1.5, distance: '4.4 mi', highActivity: '27 min',
    inactivityAlerts: 2,
  },
  {
    isoDate: isoStr(0), date: dateStr(0), day: 'Today',
    readiness: 87, sleep: 91, activity: 69,
    hr: 52, hrv: 65, temp: -0.2, spo2: 99, resp: 14.1,
    sleepDuration: 8.3, rem: 2.2, deep: 1.8, light: 3.7, awake: 0.6,
    bedtime: '9:38 PM', wakeup: '5:58 AM', efficiency: 96,
    steps: 7640, calories: 352, activeMin: 41, met: 1.4, distance: '3.4 mi', highActivity: '15 min',
    inactivityAlerts: 3,
  },
];

/* ══════════════════════════════════════════════════════════
   CSV ENGINE  ─  parse, detect, map, merge Oura exports
   ══════════════════════════════════════════════════════════ */

/* ── Generic CSV text parser — auto-detects ; vs , ──────── */
function parseCSVText(raw) {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const delim = lines[0].split(';').length > lines[0].split(',').length ? ';' : ',';
  const headers = splitCSVLine(lines[0], delim).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = splitCSVLine(line, delim);
    const row = {};
    headers.forEach((h, idx) => { row[h] = (vals[idx] ?? '').trim(); });
    rows.push(row);
  }
  return { headers, rows };
}

function splitCSVLine(line, delim = ',') {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === delim && !inQ) { result.push(cur); cur = ''; }
    else cur += c;
  }
  result.push(cur);
  return result;
}

/* ── First non-empty value matching candidate column names ─ */
function col(row, ...names) {
  for (const n of names) {
    const v = row[n];
    if (v !== undefined && v !== '') return typeof v === 'string' ? v.trim() : v;
  }
  return '';
}

/* ── Unit helpers ────────────────────────────────────────── */
const s2h   = v => parseFloat(v) / 3600 || 0;
const s2m   = v => Math.round(parseFloat(v) / 60) || 0;
const toNum = v => parseFloat(v) || 0;
const toInt = v => parseInt(v)   || 0;

/* ── ISO datetime → "10:38 PM" ──────────────────────────── */
function fmtISO(iso) {
  if (!iso) return '--';
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return '--';
  let h = parseInt(m[1]);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ampm}`;
}

/* ── ISO date string → display labels ───────────────────── */
function dateLabels(iso) {
  const d = new Date(iso + 'T12:00:00');
  return {
    date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    day:  d.toLocaleDateString('en-US', { weekday: 'short' }),
  };
}

/* ── Parse a JSON-encoded field value safely ─────────────── */
function parseJsonField(raw) {
  if (!raw) return {};
  try { return JSON.parse(raw.replace(/""/g, '"')); } catch { return {}; }
}

/* ── Detect Oura CSV type from header columns ────────────── */
function detectType(headers) {
  const h = headers.join(' ');
  // sleepmodel.csv — has stage durations + bedtime
  if (/deep_sleep_duration/.test(h) && /bedtime_start/.test(h)) return 'sleep_model';
  // dailyreadiness.csv — has temperature_deviation
  if (/temperature_deviation/.test(h)) return 'readiness';
  // dailysleep.csv — has score + contributors but no stage columns
  if (/score/.test(h) && /contributors/.test(h) && !/deep_sleep_duration/.test(h) && !/steps/.test(h)) return 'sleep_score';
  // dailyactivity.csv — has steps + active_calories
  if (/active_calories/.test(h) && /steps/.test(h)) return 'activity';
  // dailyspo2.csv — has spo2_percentage
  if (/spo2_percentage/.test(h)) return 'spo2';
  // generic/legacy fallbacks
  if (/resting_heart_rate|hrv_balance|recovery_index/.test(h)) return 'readiness';
  if (/rem_sleep_duration|sleep_efficiency/.test(h)) return 'sleep_model';
  if (/inactivity_alerts|average_met/.test(h)) return 'activity';
  if (/spo2|blood_oxygen/.test(h)) return 'spo2';
  return 'unknown';
}

/* ── dailyreadiness.csv → readiness score + temperature ──── */
function mapReadiness(rows) {
  const out = {};
  for (const r of rows) {
    const date = col(r, 'day', 'date'); if (!date) continue;
    out[date] = {
      readiness: toInt(col(r, 'score', 'readiness_score_daily', 'readiness')),
      temp:      toNum(col(r, 'temperature_deviation', 'temperature_trend_deviation')),
    };
  }
  return out;
}

/* ── dailysleep.csv → sleep score only ──────────────────── */
function mapDailySleep(rows) {
  const out = {};
  for (const r of rows) {
    const date = col(r, 'day', 'date'); if (!date) continue;
    out[date] = { sleep: toInt(col(r, 'score', 'sleep')) };
  }
  return out;
}

/* ── sleepmodel.csv → stage data, vitals, bedtime/wakeup ── */
function mapSleepModel(rows) {
  const out = {};
  for (const r of rows) {
    const date = col(r, 'day', 'date'); if (!date) continue;
    const type = col(r, 'type');
    // skip naps — only keep the main long_sleep session
    if (type && type !== 'long_sleep') continue;
    // keep the longest if multiple long_sleep rows exist for same date
    const totalSec = toNum(col(r, 'total_sleep_duration'));
    if (out[date] && out[date].sleepDuration > s2h(totalSec)) continue;
    out[date] = {
      sleepDuration: s2h(totalSec),
      rem:           s2h(toNum(col(r, 'rem_sleep_duration'))),
      deep:          s2h(toNum(col(r, 'deep_sleep_duration'))),
      light:         s2h(toNum(col(r, 'light_sleep_duration'))),
      awake:         s2h(toNum(col(r, 'awake_time'))),
      bedtime:       fmtISO(col(r, 'bedtime_start')),
      wakeup:        fmtISO(col(r, 'bedtime_end')),
      efficiency:    toInt(col(r, 'efficiency')),
      hr:            toInt(col(r, 'lowest_heart_rate', 'average_heart_rate')),
      hrv:           toInt(col(r, 'average_hrv')),
      resp:          toNum(col(r, 'average_breath', 'respiratory_rate')),
    };
  }
  return out;
}

/* ── dailyactivity.csv → steps, calories, active time ──── */
function mapActivity(rows) {
  const out = {};
  for (const r of rows) {
    const date = col(r, 'day', 'date'); if (!date) continue;
    const highSec = toNum(col(r, 'high_activity_time'));
    const medSec  = toNum(col(r, 'medium_activity_time'));
    // equivalent_walking_distance is in meters
    const distM   = toNum(col(r, 'equivalent_walking_distance', 'distance'));
    // average_met_minutes is MET·min; divide by 60 for average MET
    const metRaw  = toNum(col(r, 'average_met_minutes', 'average_met', 'met'));
    out[date] = {
      activity:         toInt(col(r, 'score', 'activity_score')),
      steps:            toInt(col(r, 'steps')),
      calories:         toInt(col(r, 'active_calories')),
      activeMin:        s2m(highSec + medSec),
      met:              metRaw > 100 ? +(metRaw / 60).toFixed(1) : +metRaw.toFixed(1),
      distance:         distM ? (distM / 1609).toFixed(1) + ' mi' : '--',
      highActivity:     s2m(highSec) + ' min',
      inactivityAlerts: toInt(col(r, 'inactivity_alerts')),
    };
  }
  return out;
}

/* ── dailyspo2.csv → average SpO2 % ─────────────────────── */
function mapSpo2(rows) {
  const out = {};
  for (const r of rows) {
    const date = col(r, 'day', 'date'); if (!date) continue;
    // spo2_percentage is stored as JSON: {"average": 96.4}
    const raw = col(r, 'spo2_percentage', 'spo2', 'blood_oxygen_percentage');
    const val = raw.startsWith('{') ? (parseJsonField(raw).average || 0) : toNum(raw);
    if (val) out[date] = { spo2: +val.toFixed(1) };
  }
  return out;
}

/* ── Merge partial maps by date → full DATA array ────────── */
function buildDataset(partials) {
  const dateSet = new Set();
  partials.forEach(p => Object.keys(p).forEach(d => dateSet.add(d)));
  return [...dateSet].sort().map(iso => {
    const merged = {};
    partials.forEach(p => { if (p[iso]) Object.assign(merged, p[iso]); });
    const lb = dateLabels(iso);
    return {
      isoDate: iso,
      date: lb.date, day: lb.day,
      readiness:        merged.readiness        ?? 0,
      sleep:            merged.sleep            ?? 0,
      activity:         merged.activity         ?? 0,
      hr:               merged.hr               ?? 0,
      hrv:              merged.hrv              ?? 0,
      temp:             merged.temp             ?? 0,
      spo2:             merged.spo2             ?? 0,
      resp:             merged.resp             ?? 0,
      sleepDuration:    merged.sleepDuration    ?? 0,
      rem:              merged.rem              ?? 0,
      deep:             merged.deep             ?? 0,
      light:            merged.light            ?? 0,
      awake:            merged.awake            ?? 0,
      bedtime:          merged.bedtime          || '--',
      wakeup:           merged.wakeup           || '--',
      efficiency:       merged.efficiency       ?? 0,
      steps:            merged.steps            ?? 0,
      calories:         merged.calories         ?? 0,
      activeMin:        merged.activeMin        ?? 0,
      met:              merged.met              ?? 0,
      distance:         merged.distance         || '--',
      highActivity:     merged.highActivity     || '--',
      inactivityAlerts: merged.inactivityAlerts ?? 0,
    };
  });
}

/* ══════════════════════════════════════════════════════════
   WEEKLY AGGREGATION
   ══════════════════════════════════════════════════════════ */

/* ── ISO Monday of the week containing isoDate ──────────── */
function isoWeekStart(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  const dow = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d.toISOString().slice(0, 10);
}

/* ── Group daily DATA by calendar week, return summaries ─── */
function aggregateByWeek(days) {
  const groups = {};
  for (const d of days) {
    if (!d.isoDate) continue;
    const wk = isoWeekStart(d.isoDate);
    (groups[wk] = groups[wk] || []).push(d);
  }

  return Object.keys(groups).sort().map(wk => {
    const entries = groups[wk];
    const n = entries.length;

    const avg  = f => Math.round(entries.reduce((s, d) => s + (d[f] || 0), 0) / n);
    const avgF = f => +(entries.reduce((s, d) => s + (d[f] || 0), 0) / n).toFixed(1);
    const sum  = f => entries.reduce((s, d) => s + (d[f] || 0), 0);
    const distSum = entries.reduce((s, d) => s + (parseFloat(d.distance) || 0), 0);

    const weekMon = new Date(wk + 'T12:00:00');
    const weekSun = new Date(wk + 'T12:00:00');
    weekSun.setDate(weekSun.getDate() + 6);
    const fmtMD = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      isoDate:      wk,
      date:         `${fmtMD(weekMon)} – ${fmtMD(weekSun)}`,
      day:          `${n}d`,
      daysTracked:  n,
      // scores — average
      readiness:    avg('readiness'),
      sleep:        avg('sleep'),
      activity:     avg('activity'),
      // vitals — average
      hr:           avg('hr'),
      hrv:          avg('hrv'),
      temp:         avgF('temp'),
      spo2:         avgF('spo2'),
      resp:         avgF('resp'),
      // sleep — average per night
      sleepDuration: avgF('sleepDuration'),
      rem:           avgF('rem'),
      deep:          avgF('deep'),
      light:         avgF('light'),
      awake:         avgF('awake'),
      bedtime:       entries.find(d => d.bedtime && d.bedtime !== '--')?.bedtime || '--',
      wakeup:        entries.find(d => d.wakeup  && d.wakeup  !== '--')?.wakeup  || '--',
      efficiency:    avg('efficiency'),
      // activity — weekly totals
      steps:             sum('steps'),
      calories:          sum('calories'),
      activeMin:         sum('activeMin'),
      inactivityAlerts:  sum('inactivityAlerts'),
      // activity — average / display
      met:          avgF('met'),
      distance:     distSum ? distSum.toFixed(1) + ' mi' : '--',
      highActivity: sum('activeMin') + ' min',
    };
  });
}

/* ── Compute (or recompute) week data from current DATA ──── */
function computeWeekData() {
  weekData = aggregateByWeek(DATA);
  currentWeekIndex = weekData.length - 1;
}

/* ── Load a FileList of CSV files ────────────────────────── */
async function loadCSVFiles(fileList) {
  const files = [...fileList].filter(f => f.name.toLowerCase().endsWith('.csv'));
  if (!files.length) return;

  const partials = [];
  const loaded = [], skipped = [];

  for (const file of files) {
    const text = await file.text();
    const { headers, rows } = parseCSVText(text);
    const type = detectType(headers);
    if      (type === 'readiness')   { partials.push(mapReadiness(rows));   loaded.push('Readiness'); }
    else if (type === 'sleep_score') { partials.push(mapDailySleep(rows));  loaded.push('Sleep score'); }
    else if (type === 'sleep_model') { partials.push(mapSleepModel(rows));  loaded.push('Sleep detail'); }
    else if (type === 'activity')    { partials.push(mapActivity(rows));    loaded.push('Activity'); }
    else if (type === 'spo2')        { partials.push(mapSpo2(rows));        loaded.push('SpO₂'); }
    else skipped.push(file.name);
  }

  if (!partials.length) {
    alert('No recognized Oura CSV files found.\n\nSee data/README.md for supported column formats.');
    return;
  }

  const newData = buildDataset(partials);
  if (!newData.length) return;

  DATA = newData;
  currentIndex = DATA.length - 1;
  computeWeekData();

  const badge = document.getElementById('data-badge');
  if (badge) { badge.textContent = `CSV · ${DATA.length}d`; badge.classList.add('live'); }

  const banner = document.getElementById('demo-banner');
  if (banner) banner.style.display = 'none';

  if (skipped.length) console.warn('Unrecognized CSVs (skipped):', skipped.join(', '));

  animateRender();
}

/* ── File input + drag-and-drop wiring ───────────────────── */
function setupFileHandlers() {
  const input   = document.getElementById('csv-input');
  const overlay = document.getElementById('drop-overlay');
  const close   = document.getElementById('demo-close');
  let dragCount = 0;

  if (input) {
    input.addEventListener('change', () => {
      if (input.files.length) loadCSVFiles(input.files);
      input.value = '';
    });
  }

  if (close) {
    close.addEventListener('click', () => {
      const banner = document.getElementById('demo-banner');
      if (banner) banner.style.display = 'none';
    });
  }

  window.addEventListener('dragenter', e => {
    if ([...e.dataTransfer.types].includes('Files')) {
      dragCount++;
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
    }
  });

  window.addEventListener('dragleave', () => {
    if (--dragCount <= 0) {
      dragCount = 0;
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    }
  });

  window.addEventListener('dragover', e => e.preventDefault());

  window.addEventListener('drop', e => {
    e.preventDefault();
    dragCount = 0;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    if (e.dataTransfer.files.length) loadCSVFiles(e.dataTransfer.files);
  });
}

/* ── State ───────────────────────────────────────────────── */
let currentIndex = DATA.length - 1;
let activeTrendMetric = 'readiness';
let viewMode = 'day';    // 'day' | 'week'
let weekData = [];
let currentWeekIndex = 0;

/* initialise week data from mock DATA on first load */
computeWeekData();

/* ── Score status labels ─────────────────────────────────── */
function scoreStatus(score) {
  if (score >= 85) return { label: 'Optimal',  cls: 'status-optimal' };
  if (score >= 70) return { label: 'Good',     cls: 'status-good'    };
  if (score >= 60) return { label: 'Fair',     cls: 'status-fair'    };
  return                  { label: 'Poor',     cls: 'status-poor'    };
}

/* ── Score colors ────────────────────────────────────────── */
const SCORE_COLOR = { readiness: '#6ec8a9', sleep: '#6e9ec8', activity: '#c86e6e' };

/* ── Contributor sets ────────────────────────────────────── */
function readinessContribs(d) {
  return [
    { name: 'HRV balance',     val: Math.round(d.hrv * 0.9),  color: '#6ec8a9' },
    { name: 'Resting HR',      val: Math.round(100 - d.hr),    color: '#6ec8a9' },
    { name: 'Sleep score',     val: d.sleep,                   color: '#6e9ec8' },
    { name: 'Recovery index',  val: Math.round(d.readiness * 0.95), color: '#a07cf0' },
  ];
}

function sleepContribs(d) {
  return [
    { name: 'Total sleep',   val: Math.round((d.sleepDuration / 9) * 100), color: '#6e9ec8' },
    { name: 'REM sleep',     val: Math.round((d.rem / 2.5) * 100),         color: '#4a90d9' },
    { name: 'Deep sleep',    val: Math.round((d.deep / 2) * 100),          color: '#2e5fa3' },
    { name: 'Efficiency',    val: d.efficiency,                             color: '#7eb8f7' },
  ];
}

function activityContribs(d) {
  return [
    { name: 'Steps goal',    val: Math.min(100, Math.round((d.steps / 10000) * 100)), color: '#c86e6e' },
    { name: 'Active mins',   val: Math.min(100, Math.round((d.activeMin / 60) * 100)), color: '#e8935a' },
    { name: 'Calories',      val: Math.min(100, Math.round((d.calories / 500) * 100)), color: '#a07cf0' },
    { name: 'Inact. time',   val: Math.max(0, 100 - d.inactivityAlerts * 15),         color: '#6ec8a9' },
  ];
}

/* ── Render ring ─────────────────────────────────────────── */
function renderRing(id, score) {
  const circumference = 314;
  const offset = circumference - (score / 100) * circumference;
  const el = document.getElementById(id);
  if (el) el.style.strokeDashoffset = offset;
}

/* ── Render score card ───────────────────────────────────── */
function renderScoreCard(type, score, contribs) {
  const valEl    = document.getElementById(`val-${type}`);
  const statusEl = document.getElementById(`status-${type}`);
  const contEl   = document.getElementById(`contrib-${type}`);

  const st = scoreStatus(score);
  valEl.textContent = score;
  valEl.style.color = SCORE_COLOR[type];

  statusEl.textContent = st.label;
  statusEl.className   = `score-status ${st.cls}`;

  contEl.innerHTML = contribs.map(c => `
    <div class="contrib-item">
      <span class="contrib-name">${c.name}</span>
      <div class="contrib-bar-wrap">
        <div class="contrib-bar" style="width:${c.val}%; background:${c.color}"></div>
      </div>
      <span class="contrib-val">${c.val}</span>
    </div>
  `).join('');
}

/* ── Render vitals ───────────────────────────────────────── */
function renderVitals(d) {
  document.getElementById('vital-hr').textContent   = d.hr   || '--';
  document.getElementById('vital-hrv').textContent  = d.hrv  || '--';
  document.getElementById('vital-temp').textContent = d.temp != null
    ? (d.temp >= 0 ? '+' : '') + d.temp.toFixed(2)
    : '--';
  document.getElementById('vital-spo2').textContent = d.spo2 || '--';
  document.getElementById('vital-resp').textContent = d.resp ? d.resp.toFixed(1) : '--';

  /* color temperature */
  const tempEl = document.getElementById('vital-temp');
  tempEl.style.color = d.temp > 0.3 ? 'var(--coral)' : d.temp < -0.1 ? 'var(--blue)' : 'var(--text)';

  /* sparklines */
  const sparkSrc = viewMode === 'week' ? weekData : DATA;
  const sparkIdx = viewMode === 'week' ? currentWeekIndex : currentIndex;
  drawSparkline('trend-hr',   sparkSrc.map(x => x.hr),   '#c86e6e', sparkIdx);
  drawSparkline('trend-hrv',  sparkSrc.map(x => x.hrv),  '#6ec8a9', sparkIdx);
  drawSparkline('trend-temp', sparkSrc.map(x => x.temp), '#6e9ec8', sparkIdx);
  drawSparkline('trend-spo2', sparkSrc.map(x => x.spo2), '#a07cf0', sparkIdx);
  drawSparkline('trend-resp', sparkSrc.map(x => x.resp), '#e8935a', sparkIdx);
}

/* ── Sparkline canvas ────────────────────────────────────── */
function drawSparkline(containerId, values, color, highlightIdx) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  const canvas  = document.createElement('canvas');
  canvas.className = 'sparkline';
  const W = container.offsetWidth || 100;
  const H = 30;
  canvas.width  = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const min  = Math.min(...values);
  const max  = Math.max(...values);
  const range = max - min || 1;
  const pad  = 4;

  const pts = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / range) * (H - pad * 2),
  }));

  /* gradient fill */
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, color + '55');
  grad.addColorStop(1, color + '00');

  ctx.beginPath();
  ctx.moveTo(pts[0].x, H);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  /* line */
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1.5;
  ctx.lineJoin    = 'round';
  ctx.stroke();

  /* highlight dot */
  const hp = pts[highlightIdx];
  if (hp) {
    ctx.beginPath();
    ctx.arc(hp.x, hp.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#111118';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

/* ── Sleep breakdown ─────────────────────────────────────── */
function renderSleep(d) {
  const total = d.sleepDuration;
  const tl = document.getElementById('sleep-timeline');

  /* no sleep data for this day */
  if (!total || (!d.rem && !d.deep && !d.light)) {
    document.getElementById('sleep-duration-label').textContent = '';
    document.getElementById('stage-rem').textContent   = '--';
    document.getElementById('stage-deep').textContent  = '--';
    document.getElementById('stage-light').textContent = '--';
    document.getElementById('stage-awake').textContent = '--';
    document.getElementById('sleep-bedtime').textContent    = d.bedtime !== '--' ? d.bedtime : '--';
    document.getElementById('sleep-wakeup').textContent     = d.wakeup  !== '--' ? d.wakeup  : '--';
    document.getElementById('sleep-efficiency').textContent = d.efficiency ? d.efficiency + '%' : '--';
    tl.innerHTML = '<div style="width:100%;height:100%;background:#1e1e2e;border-radius:4px;display:flex;align-items:center;justify-content:center;color:rgba(112,112,160,0.5);font-size:12px">No sleep data</div>';
    return;
  }

  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  document.getElementById('sleep-duration-label').textContent = `${h}h ${m}m`;

  document.getElementById('stage-rem').textContent   = fmtHM(d.rem);
  document.getElementById('stage-deep').textContent  = fmtHM(d.deep);
  document.getElementById('stage-light').textContent = fmtHM(d.light);
  document.getElementById('stage-awake').textContent = fmtHM(d.awake);

  document.getElementById('sleep-bedtime').textContent   = d.bedtime;
  document.getElementById('sleep-wakeup').textContent    = d.wakeup;
  document.getElementById('sleep-efficiency').textContent = d.efficiency + '%';

  /* timeline bar — interleave realistically: light → deep → rem → light → awake */
  const ordered = [
    { dur: d.light * 0.4, color: '#7eb8f7' },
    { dur: d.deep  * 0.5, color: '#2e5fa3' },
    { dur: d.rem   * 0.4, color: '#4a90d9' },
    { dur: d.light * 0.3, color: '#7eb8f7' },
    { dur: d.deep  * 0.5, color: '#2e5fa3' },
    { dur: d.rem   * 0.6, color: '#4a90d9' },
    { dur: d.light * 0.3, color: '#7eb8f7' },
    { dur: d.awake,        color: '#3a3a50' },
  ];
  const seg_total = ordered.reduce((s, x) => s + x.dur, 0);
  if (!seg_total) { tl.innerHTML = ''; return; }
  tl.innerHTML = ordered.map(s => {
    const pct = (s.dur / seg_total * 100).toFixed(1);
    return `<div class="sleep-seg" style="flex:0 0 ${pct}%;background:${s.color}"></div>`;
  }).join('');
}

function fmtHM(hrs) {
  const h = Math.floor(hrs);
  const m = Math.round((hrs - h) * 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/* ── Activity panel ──────────────────────────────────────── */
function renderActivity(d) {
  document.getElementById('val-steps').textContent      = d.steps.toLocaleString();
  document.getElementById('val-calories').textContent   = d.calories;
  document.getElementById('val-active-min').textContent = d.activeMin + 'm';
  document.getElementById('val-met').textContent        = d.met.toFixed(1);
  document.getElementById('val-distance').textContent   = d.distance;
  document.getElementById('val-high').textContent       = d.highActivity;

  const isWeek = viewMode === 'week';
  const stepsGoal  = isWeek ? 70000 : 10000;
  const calGoal    = isWeek ? 3500  : 500;
  const activeGoal = isWeek ? 420   : 60;

  document.getElementById('goal-steps').textContent     = isWeek ? '/ 70,000 wk' : '/ 10,000';
  document.getElementById('goal-calories').textContent  = isWeek ? '/ 3,500 wk'  : '/ 500';
  document.getElementById('goal-active-min').textContent = isWeek ? '/ 420 min wk' : '/ 60 min';

  setActivityRing('steps-ring',  d.steps / stepsGoal,  201);
  setActivityRing('cal-ring',    d.calories / calGoal,  201);
  setActivityRing('active-ring', d.activeMin / activeGoal, 201);

  const inactPct = Math.min(100, (d.inactivityAlerts / 6) * 100);
  document.getElementById('inactivity-fill').style.width = inactPct + '%';
  document.getElementById('inactivity-val').textContent  = d.inactivityAlerts;
}

function setActivityRing(id, fraction, circumference) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = circumference - Math.min(1, fraction) * circumference;
  el.style.strokeDashoffset = offset;
  el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
}

/* ── Trend chart ─────────────────────────────────────────── */
function drawTrendChart(metric) {
  const canvas = document.getElementById('trend-chart');
  if (!canvas) return;

  const DPR = window.devicePixelRatio || 1;
  const W   = canvas.parentElement.clientWidth - 48;
  const H   = 200;
  canvas.width  = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);
  ctx.clearRect(0, 0, W, H);

  const metricColors = {
    readiness: '#6ec8a9',
    sleep:     '#6e9ec8',
    activity:  '#c86e6e',
    hrv:       '#a07cf0',
  };

  const color    = metricColors[metric];
  const trendSrc = viewMode === 'week' ? weekData : DATA;
  const trendIdx = viewMode === 'week' ? currentWeekIndex : currentIndex;
  const values = trendSrc.map(d => d[metric]);
  const labels = trendSrc.map(d =>
    viewMode === 'week' ? d.date.slice(0, 6) : d.day   // "Jan 6" vs "Mon"
  );

  const padL = 40, padR = 16, padT = 20, padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const minV  = Math.min(...values) * 0.9;
  const maxV  = Math.max(...values) * 1.05;
  const range = maxV - minV || 1;

  const toX = i => padL + (i / (values.length - 1)) * chartW;
  const toY = v => padT + chartH - ((v - minV) / range) * chartH;

  /* grid lines */
  const ticks = 4;
  ctx.strokeStyle = 'rgba(36,36,58,0.8)';
  ctx.lineWidth   = 1;
  for (let i = 0; i <= ticks; i++) {
    const y = padT + (i / ticks) * chartH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();

    const val = maxV - (i / ticks) * range;
    ctx.fillStyle = 'rgba(112,112,160,0.7)';
    ctx.font      = `${11 * DPR / DPR}px system-ui`;
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(val), padL - 6, y + 4);
  }

  const pts = values.map((v, i) => ({ x: toX(i), y: toY(v) }));

  /* gradient fill */
  const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
  grad.addColorStop(0, color + '44');
  grad.addColorStop(1, color + '00');

  ctx.beginPath();
  ctx.moveTo(pts[0].x, H - padB);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, H - padB);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  /* smooth line using bezier */
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const cp1x = (pts[i - 1].x + pts[i].x) / 2;
    ctx.bezierCurveTo(cp1x, pts[i - 1].y, cp1x, pts[i].y, pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2.5;
  ctx.lineJoin    = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur  = 6;
  ctx.stroke();
  ctx.shadowBlur  = 0;

  /* dots */
  pts.forEach((p, i) => {
    const isActive = i === trendIdx;
    ctx.beginPath();
    ctx.arc(p.x, p.y, isActive ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? color : 'var(--surface2)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth   = isActive ? 2 : 1.5;
    ctx.stroke();
  });

  /* active value tooltip above dot */
  const ap = pts[trendIdx];
  const activeVal = values[trendIdx];
  if (ap && activeVal != null && !isNaN(activeVal)) {
    ctx.fillStyle = color;
    ctx.font      = `bold 13px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(activeVal), ap.x, ap.y - 12);
  }

  /* x labels */
  ctx.fillStyle = 'rgba(112,112,160,0.8)';
  ctx.font      = `11px system-ui`;
  pts.forEach((p, i) => {
    ctx.textAlign = i === 0 ? 'left' : i === pts.length - 1 ? 'right' : 'center';
    ctx.fillText(labels[i], p.x, H - 8);
  });
}

/* ── Header date ─────────────────────────────────────────── */
function renderHeader(d) {
  if (viewMode === 'week') {
    document.getElementById('day-label').textContent = 'Week';
    document.getElementById('current-date').textContent =
      d.date + `  ·  ${d.daysTracked} day${d.daysTracked !== 1 ? 's' : ''} tracked`;
  } else {
    document.getElementById('day-label').textContent = d.day === 'Today' ? 'Today' : d.day;
    document.getElementById('current-date').textContent = d.date;
  }
}

/* ── Full render ─────────────────────────────────────────── */
function render() {
  const d = viewMode === 'week' ? weekData[currentWeekIndex] : DATA[currentIndex];
  if (!d) return;

  renderHeader(d);

  /* rings */
  renderRing('ring-readiness', d.readiness);
  renderRing('ring-sleep',     d.sleep);
  renderRing('ring-activity',  d.activity);

  /* score cards */
  renderScoreCard('readiness', d.readiness, readinessContribs(d));
  renderScoreCard('sleep',     d.sleep,     sleepContribs(d));
  renderScoreCard('activity',  d.activity,  activityContribs(d));

  renderVitals(d);
  renderSleep(d);
  renderActivity(d);
  drawTrendChart(activeTrendMetric);
}

/* ── Navigation ──────────────────────────────────────────── */
document.getElementById('prev-day').addEventListener('click', () => {
  if (viewMode === 'day') {
    if (currentIndex > 0) { currentIndex--; animateRender(); }
  } else {
    if (currentWeekIndex > 0) { currentWeekIndex--; animateRender(); }
  }
});

document.getElementById('next-day').addEventListener('click', () => {
  if (viewMode === 'day') {
    if (currentIndex < DATA.length - 1) { currentIndex++; animateRender(); }
  } else {
    if (currentWeekIndex < weekData.length - 1) { currentWeekIndex++; animateRender(); }
  }
});

function animateRender() {
  /* quick flash on cards */
  document.querySelectorAll('.score-card, .vital-card, .panel').forEach(el => {
    el.style.opacity = '0.4';
    el.style.transition = 'opacity 0.15s';
    setTimeout(() => { el.style.opacity = ''; el.style.transition = ''; }, 150);
  });
  setTimeout(render, 80);
}

/* ── Trend tabs ──────────────────────────────────────────── */
document.querySelectorAll('.trend-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.trend-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTrendMetric = btn.dataset.metric;
    drawTrendChart(activeTrendMetric);
  });
});

/* ── Day / Week toggle ───────────────────────────────────── */
document.getElementById('btn-day').addEventListener('click', () => {
  if (viewMode === 'day') return;
  viewMode = 'day';
  document.getElementById('btn-day').classList.add('active');
  document.getElementById('btn-week').classList.remove('active');
  animateRender();
});

document.getElementById('btn-week').addEventListener('click', () => {
  if (viewMode === 'week') return;
  viewMode = 'week';
  document.getElementById('btn-week').classList.add('active');
  document.getElementById('btn-day').classList.remove('active');
  animateRender();
});

/* ── Init ────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  setupFileHandlers();
  render();
  /* re-draw chart on resize */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const rSrc = viewMode === 'week' ? weekData : DATA;
      const rIdx = viewMode === 'week' ? currentWeekIndex : currentIndex;
      drawSparkline('trend-hr',   rSrc.map(x => x.hr),   '#c86e6e', rIdx);
      drawSparkline('trend-hrv',  rSrc.map(x => x.hrv),  '#6ec8a9', rIdx);
      drawSparkline('trend-temp', rSrc.map(x => x.temp), '#6e9ec8', rIdx);
      drawSparkline('trend-spo2', rSrc.map(x => x.spo2), '#a07cf0', rIdx);
      drawSparkline('trend-resp', rSrc.map(x => x.resp), '#e8935a', rIdx);
      drawTrendChart(activeTrendMetric);
    }, 120);
  });
});
