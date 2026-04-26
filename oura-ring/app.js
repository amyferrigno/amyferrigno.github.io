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

const DATA = [
  {
    date: dateStr(-6), day: shortDay(-6),
    readiness: 72, sleep: 68, activity: 80,
    hr: 58, hrv: 42, temp: -0.1, spo2: 97, resp: 15.2,
    sleepDuration: 6.8, rem: 1.4, deep: 0.9, light: 3.8, awake: 0.7,
    bedtime: '10:42 PM', wakeup: '5:37 AM', efficiency: 91,
    steps: 9200, calories: 410, activeMin: 48, met: 1.4, distance: '4.1 mi', highActivity: '22 min',
    inactivityAlerts: 2,
  },
  {
    date: dateStr(-5), day: shortDay(-5),
    readiness: 78, sleep: 80, activity: 65,
    hr: 55, hrv: 51, temp: +0.2, spo2: 98, resp: 14.8,
    sleepDuration: 7.5, rem: 1.8, deep: 1.3, light: 3.9, awake: 0.5,
    bedtime: '10:15 PM', wakeup: '5:42 AM', efficiency: 94,
    steps: 7100, calories: 320, activeMin: 35, met: 1.2, distance: '3.1 mi', highActivity: '12 min',
    inactivityAlerts: 4,
  },
  {
    date: dateStr(-4), day: shortDay(-4),
    readiness: 84, sleep: 85, activity: 72,
    hr: 54, hrv: 58, temp: +0.0, spo2: 98, resp: 14.5,
    sleepDuration: 7.9, rem: 2.0, deep: 1.5, light: 3.8, awake: 0.6,
    bedtime: '9:58 PM', wakeup: '5:54 AM', efficiency: 93,
    steps: 8300, calories: 380, activeMin: 42, met: 1.3, distance: '3.7 mi', highActivity: '18 min',
    inactivityAlerts: 3,
  },
  {
    date: dateStr(-3), day: shortDay(-3),
    readiness: 65, sleep: 60, activity: 88,
    hr: 62, hrv: 35, temp: +0.5, spo2: 96, resp: 15.8,
    sleepDuration: 6.1, rem: 1.1, deep: 0.7, light: 3.6, awake: 0.7,
    bedtime: '11:22 PM', wakeup: '5:30 AM', efficiency: 88,
    steps: 12400, calories: 620, activeMin: 72, met: 1.7, distance: '5.5 mi', highActivity: '38 min',
    inactivityAlerts: 1,
  },
  {
    date: dateStr(-2), day: shortDay(-2),
    readiness: 70, sleep: 74, activity: 60,
    hr: 59, hrv: 44, temp: +0.3, spo2: 97, resp: 15.0,
    sleepDuration: 7.0, rem: 1.5, deep: 1.1, light: 3.7, awake: 0.7,
    bedtime: '10:50 PM', wakeup: '5:50 AM', efficiency: 90,
    steps: 6800, calories: 290, activeMin: 30, met: 1.2, distance: '3.0 mi', highActivity: '9 min',
    inactivityAlerts: 5,
  },
  {
    date: dateStr(-1), day: shortDay(-1),
    readiness: 82, sleep: 88, activity: 75,
    hr: 53, hrv: 60, temp: -0.1, spo2: 98, resp: 14.3,
    sleepDuration: 8.1, rem: 2.1, deep: 1.6, light: 3.8, awake: 0.6,
    bedtime: '9:45 PM', wakeup: '5:51 AM', efficiency: 95,
    steps: 9800, calories: 450, activeMin: 55, met: 1.5, distance: '4.4 mi', highActivity: '27 min',
    inactivityAlerts: 2,
  },
  {
    date: dateStr(0), day: 'Today',
    readiness: 87, sleep: 91, activity: 69,
    hr: 52, hrv: 65, temp: -0.2, spo2: 99, resp: 14.1,
    sleepDuration: 8.3, rem: 2.2, deep: 1.8, light: 3.7, awake: 0.6,
    bedtime: '9:38 PM', wakeup: '5:58 AM', efficiency: 96,
    steps: 7640, calories: 352, activeMin: 41, met: 1.4, distance: '3.4 mi', highActivity: '15 min',
    inactivityAlerts: 3,
  },
];

/* ── State ───────────────────────────────────────────────── */
let currentIndex = DATA.length - 1;
let activeTrendMetric = 'readiness';

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
  document.getElementById('vital-hr').textContent   = d.hr;
  document.getElementById('vital-hrv').textContent  = d.hrv;
  document.getElementById('vital-temp').textContent = (d.temp >= 0 ? '+' : '') + d.temp.toFixed(1);
  document.getElementById('vital-spo2').textContent = d.spo2;
  document.getElementById('vital-resp').textContent = d.resp.toFixed(1);

  /* color temperature */
  const tempEl = document.getElementById('vital-temp');
  tempEl.style.color = d.temp > 0.3 ? 'var(--coral)' : d.temp < -0.1 ? 'var(--blue)' : 'var(--text)';

  /* sparklines */
  drawSparkline('trend-hr',   DATA.map(x => x.hr),   '#c86e6e', currentIndex);
  drawSparkline('trend-hrv',  DATA.map(x => x.hrv),  '#6ec8a9', currentIndex);
  drawSparkline('trend-temp', DATA.map(x => x.temp), '#6e9ec8', currentIndex);
  drawSparkline('trend-spo2', DATA.map(x => x.spo2), '#a07cf0', currentIndex);
  drawSparkline('trend-resp', DATA.map(x => x.resp), '#e8935a', currentIndex);
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

  /* timeline bar */
  const tl = document.getElementById('sleep-timeline');
  const stages = [
    { dur: d.rem,   color: '#4a90d9', label: 'REM'   },
    { dur: d.deep,  color: '#2e5fa3', label: 'Deep'  },
    { dur: d.light, color: '#7eb8f7', label: 'Light' },
    { dur: d.awake, color: '#3a3a50', label: 'Awake' },
  ];
  /* interleave realistically: light → deep → rem → light → awake */
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
  tl.innerHTML = ordered.map(s => {
    const pct = (s.dur / seg_total * 100).toFixed(1);
    return `<div class="sleep-seg" style="flex:0 0 ${pct}%;background:${s.color}" title="${s.color}"></div>`;
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

  const stepsGoal    = 10000;
  const calGoal      = 500;
  const activeGoal   = 60;

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

  const color  = metricColors[metric];
  const values = DATA.map(d => d[metric]);
  const labels = DATA.map(d => d.day);

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
    const isActive = i === currentIndex;
    ctx.beginPath();
    ctx.arc(p.x, p.y, isActive ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? color : 'var(--surface2)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth   = isActive ? 2 : 1.5;
    ctx.stroke();
  });

  /* active value tooltip above dot */
  const ap = pts[currentIndex];
  ctx.fillStyle = color;
  ctx.font      = `bold 13px system-ui`;
  ctx.textAlign = 'center';
  ctx.fillText(values[currentIndex], ap.x, ap.y - 12);

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
  const offset = currentIndex - (DATA.length - 1);
  document.getElementById('day-label').textContent =
    offset === 0  ? 'Today'
    : offset === -1 ? 'Yesterday'
    : d.day;

  /* full date shown in header */
  const full = new Date(TODAY);
  full.setDate(full.getDate() + offset);
  document.getElementById('current-date').textContent = full.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
}

/* ── Full render ─────────────────────────────────────────── */
function render() {
  const d = DATA[currentIndex];

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
  if (currentIndex > 0) {
    currentIndex--;
    animateRender();
  }
});

document.getElementById('next-day').addEventListener('click', () => {
  if (currentIndex < DATA.length - 1) {
    currentIndex++;
    animateRender();
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

/* ── Init ────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  render();
  /* re-draw chart on resize */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      drawSparkline('trend-hr',   DATA.map(x => x.hr),   '#c86e6e', currentIndex);
      drawSparkline('trend-hrv',  DATA.map(x => x.hrv),  '#6ec8a9', currentIndex);
      drawSparkline('trend-temp', DATA.map(x => x.temp), '#6e9ec8', currentIndex);
      drawSparkline('trend-spo2', DATA.map(x => x.spo2), '#a07cf0', currentIndex);
      drawSparkline('trend-resp', DATA.map(x => x.resp), '#e8935a', currentIndex);
      drawTrendChart(activeTrendMetric);
    }, 120);
  });
});
