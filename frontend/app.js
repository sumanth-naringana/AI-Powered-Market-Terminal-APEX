/* ═══════════════════════════════════════════════════════════════
   APEX — app.js
   ═══════════════════════════════════════════════════════════════ */

const API = "http://127.0.0.1:8000";

/* ── State ─────────────────────────────────────────────────────── */
let watchlist       = JSON.parse(localStorage.getItem("watchlist")) || [];
let newsCache       = {};
let currentSymbol   = null;
let currentInterval = "1h";

/* ═══════════════════════════════════════════════════════════════
   CHARTS — created once, resized & re-themed dynamically
   ═══════════════════════════════════════════════════════════════ */

/* Helper: pick the right theme options from index.html's APEX_THEME */
function chartOpts() {
  const base = window.APEX_THEME?.isDark !== false
    ? (window.APEX_THEME?.dark  || {})
    : (window.APEX_THEME?.light || {});
  return base;
}

/* ── Main price chart ──────────────────────────────────────────── */
const chartEl = document.getElementById("chart");
const chart   = LightweightCharts.createChart(chartEl, {
  ...chartOpts(),
  width:  chartEl.clientWidth,
  height: chartEl.clientHeight || 400,
  handleScroll: true,
  handleScale:  true,
});

const candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
  upColor:          "#4ade80",
  downColor:        "#f87171",
  borderUpColor:    "#4ade80",
  borderDownColor:  "#f87171",
  wickUpColor:      "#4ade80",
  wickDownColor:    "#f87171",
});

const ma50Series = chart.addSeries(LightweightCharts.LineSeries, {
  color:     "#38bdf8",
  lineWidth: 2,
  title:     "MA50",
});

const ma200Series = chart.addSeries(LightweightCharts.LineSeries, {
  color:     "#f87171",
  lineWidth: 2,
  title:     "MA200",
});

/* ── RSI chart ─────────────────────────────────────────────────── */
const rsiEl    = document.getElementById("rsiChart");
const rsiChart = LightweightCharts.createChart(rsiEl, {
  ...chartOpts(),
  width:  rsiEl.clientWidth,
  height: rsiEl.clientHeight || 140,
  handleScroll: false,
  handleScale:  false,
});

const rsiSeries = rsiChart.addSeries(LightweightCharts.LineSeries, {
  color:     "#a78bfa",
  lineWidth: 2,
  title:     "RSI",
});

/* Register charts so index.html's theme toggle can re-theme them */
window.apexCharts = [chart, rsiChart];

/* ── Resize observer: keep charts fitted to their containers ───── */
const ro = new ResizeObserver(() => {
  chart.resize(chartEl.clientWidth, chartEl.clientHeight || 400);
  rsiChart.resize(rsiEl.clientWidth, rsiEl.clientHeight || 140);
});
ro.observe(chartEl);
ro.observe(rsiEl);

/* Sync time scales on crosshair move */
chart.subscribeCrosshairMove(param => {
  if (param?.time) rsiChart.timeScale().scrollToPosition(
    chart.timeScale().scrollPosition(), false
  );
});

/* ═══════════════════════════════════════════════════════════════
   WATCHLIST
   ═══════════════════════════════════════════════════════════════ */

function addStock() {
  const input  = document.getElementById("symbol");
  const symbol = input.value.trim().toUpperCase();
  if (!symbol) return;

  if (watchlist.includes(symbol)) {
    flashInput(input, "already added");
    return;
  }

  watchlist.push(symbol);
  saveWatchlist();
  renderWatchlist();
  loadWatch(symbol);   // auto-load the newly added stock
  input.value = "";
}

function removeStock(symbol) {
  watchlist = watchlist.filter(s => s !== symbol);
  saveWatchlist();
  renderWatchlist();

  /* If we removed the active stock, clear the view */
  if (currentSymbol === symbol) {
    currentSymbol = null;
    document.getElementById("tickerLabel").textContent = "—";
    document.getElementById("tickerPrice").textContent = "";
    document.getElementById("tickerChange").textContent = "";
    document.getElementById("tickerChange").className = "ticker-change";
    candleSeries.setData([]);
    ma50Series.setData([]);
    ma200Series.setData([]);
    rsiSeries.setData([]);
    document.getElementById("newsList").innerHTML = emptyState("📰", "Select a stock to load news");
    document.getElementById("signalResult").innerHTML = emptyState("🤖", "Awaiting analysis");
  }
}

function clearWatchlist() {
  watchlist = [];
  saveWatchlist();
  renderWatchlist();
}

function saveWatchlist() {
  localStorage.setItem("watchlist", JSON.stringify(watchlist));
}

function loadWatch(symbol) {
  document.getElementById("symbol").value = symbol;
  currentSymbol   = symbol.toUpperCase();
  currentInterval = document.getElementById("interval").value || "1h";

  /* Update topbar ticker label */
  document.getElementById("tickerLabel").textContent = currentSymbol;

  /* Highlight active watchlist button */
  document.querySelectorAll(".watchBtn").forEach(b => {
    b.classList.toggle("active", b.textContent.trim() === currentSymbol);
  });

  updateChart();
  loadNews(currentSymbol);
  loadSignal(currentSymbol);
}

function renderWatchlist() {
  const container = document.getElementById("watchlistItems");
  container.innerHTML = "";

  if (watchlist.length === 0) {
    container.innerHTML = `<div style="color:var(--muted);font-size:11px;text-align:center;padding:20px 0;letter-spacing:0.08em;">No stocks added yet</div>`;
    return;
  }

  watchlist.forEach(symbol => {
    const row = document.createElement("div");
    row.className = "watchRow";

    const btn = document.createElement("button");
    btn.className = "watchBtn" + (symbol === currentSymbol ? " active" : "");
    btn.textContent = symbol;
    btn.onclick = () => loadWatch(symbol);

    const remove = document.createElement("button");
    remove.className = "removeBtn";
    remove.textContent = "×";
    remove.title = `Remove ${symbol}`;
    remove.onclick = () => removeStock(symbol);

    row.appendChild(btn);
    row.appendChild(remove);
    container.appendChild(row);
  });
}

/* ═══════════════════════════════════════════════════════════════
   CHART DATA
   ═══════════════════════════════════════════════════════════════ */

async function updateChart() {
  if (!currentSymbol) return;

  try {
    const res = await fetch(
      `${API}/stock/${currentSymbol}?interval=${currentInterval}`
    );
    if (!res.ok) { console.error("Chart API error", res.status); return; }

    const result = await res.json();

    candleSeries.setData(result.candles || []);
    ma50Series.setData((result.ma50  || []).filter(d => d.value !== null));
    ma200Series.setData((result.ma200 || []).filter(d => d.value !== null));
    rsiSeries.setData((result.rsi   || []).filter(d => d.value !== null));

    /* Update topbar price / change from last candle */
    const candles = result.candles || [];
    if (candles.length >= 2) {
      const last = candles[candles.length - 1];
      const prev = candles[candles.length - 2];
      const pct  = ((last.close - prev.close) / prev.close * 100);
      const sign = pct >= 0 ? "+" : "";

      document.getElementById("tickerPrice").textContent =
        last.close.toLocaleString("en-IN", { minimumFractionDigits: 2 });

      const chEl = document.getElementById("tickerChange");
      chEl.textContent = `${sign}${pct.toFixed(2)}%`;
      chEl.className   = "ticker-change " + (pct >= 0 ? "up" : "down");
    }

    /* Update indicator strip if RSI data available */
    const rsiVals = (result.rsi || []).filter(d => d.value !== null);
    if (rsiVals.length) {
      document.getElementById("indRsi").textContent =
        " " + rsiVals[rsiVals.length - 1].value.toFixed(1);
    }

    /* MA50 last value */
    const ma50Vals = (result.ma50 || []).filter(d => d.value !== null);
    if (ma50Vals.length) {
      document.getElementById("indMa").textContent =
        " " + ma50Vals[ma50Vals.length - 1].value.toFixed(2);
    }

    chart.timeScale().fitContent();

  } catch (err) {
    console.error("updateChart error:", err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   NEWS
   ═══════════════════════════════════════════════════════════════ */

async function loadNews(symbol) {
  const newsList = document.getElementById("newsList");
  newsList.innerHTML = loadingState("Loading news…");

  try {
    const res = await fetch(`${API}/news/${symbol}`);
    if (!res.ok) { newsList.innerHTML = emptyState("⚠️", "News unavailable"); return; }

    const result = await res.json();
    newsList.innerHTML = "";

    if (!result.news?.length) {
      newsList.innerHTML = emptyState("📭", "No news found");
      return;
    }

    result.news.forEach((n, i) => {
      const sentMap = {
        bullish:  ["bull", "▲ Bullish"],
        bearish:  ["bear", "▼ Bearish"],
        positive: ["bull", "▲ Bullish"],
        negative: ["bear", "▼ Bearish"],
      };
      const key       = (n.sentiment || "").toLowerCase();
      const [cls, lbl] = sentMap[key] || ["neut", "● Neutral"];

      const item = document.createElement("div");
      item.className = "newsItem";
      item.style.animationDelay = `${i * 40}ms`;

      const time = n.published
        ? new Date(n.published).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
        : "";

      item.innerHTML = `
        <a href="${n.link || "#"}" target="_blank" rel="noopener">${n.title}</a>
        <div class="news-meta">
          <span class="news-source">${n.source || "News"}</span>
          <span class="news-time">${time}</span>
          <span class="news-sentiment ${cls}">${lbl}</span>
        </div>
        ${n.reason ? `<div style="font-size:10px;color:var(--muted);margin-top:4px;line-height:1.5;">${n.reason}</div>` : ""}
      `;

      newsList.appendChild(item);
    });

  } catch (err) {
    console.error("loadNews error:", err);
    newsList.innerHTML = emptyState("⚠️", "Failed to load news");
  }
}

/* ── Breaking news checker ──────────────────────────────────────── */
async function checkBreakingNews() {
  for (const symbol of watchlist) {
    try {
      const res    = await fetch(`${API}/news/${symbol}`);
      const result = await res.json();
      if (!result.news?.length) continue;

      const latest = result.news[0].title;

      if (newsCache[symbol] && newsCache[symbol] !== latest) {
        markBreaking(symbol);
      }
      newsCache[symbol] = latest;

    } catch (e) { /* silently skip */ }
  }
}

function markBreaking(symbol) {
  document.querySelectorAll(".watchBtn").forEach(btn => {
    if (btn.textContent.trim() === symbol) {
      btn.style.background    = "rgba(248,113,113,0.2)";
      btn.style.borderColor   = "#f87171";
      btn.style.color         = "#f87171";
      btn.title               = "⚡ Breaking news!";
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   AI SIGNAL
   ═══════════════════════════════════════════════════════════════ */

async function loadSignal(symbol) {
  const panel = document.getElementById("signalResult");
  panel.innerHTML = `<div class="signal-loading"><div class="spin"></div> Analysing ${symbol}…</div>`;

  try {
    const res = await fetch(`${API}/signal/${symbol}`);
    if (!res.ok) { panel.innerHTML = emptyState("⚠️", "Signal unavailable"); return; }

    let result = await res.json();

    /* ── Unwrap: handle cases where the whole payload is nested or
           the reason field contains a raw JSON string from the LLM ── */
    result = unwrapSignal(result);

    const type = (result.signal || "hold").toLowerCase();

    /* Use the enhanced renderer from index.html */
    if (typeof window.renderSignal === "function") {
      window.renderSignal(
        type,
        `<b>Confidence:</b> ${result.confidence ?? "N/A"}%<br>${result.reason || ""}`
      );
    } else {
      /* Fallback */
      const colors = { buy: "#4ade80", sell: "#f87171", hold: "#fbbf24" };
      panel.innerHTML = `
        <div style="padding:12px;border-radius:8px;background:var(--surface2);border-left:4px solid ${colors[type] || colors.hold}">
          <b style="font-size:16px;color:${colors[type] || colors.hold}">${result.signal}</b><br>
          <span style="color:var(--muted);font-size:11px">Confidence: ${result.confidence ?? "N/A"}%</span><br>
          <span style="font-size:11px;color:var(--muted)">${result.reason || ""}</span>
        </div>`;
    }

    /* Update MACD / Vol indicator chips if provided */
    if (result.macd !== undefined)
      document.getElementById("indMacd").textContent = " " + result.macd;
    if (result.volume !== undefined)
      document.getElementById("indVol").textContent = " " + formatVolume(result.volume);

  } catch (err) {
    console.error("loadSignal error:", err);
    panel.innerHTML = emptyState("⚠️", "Signal error");
  }
}

/* ═══════════════════════════════════════════════════════════════
   INTERVAL CHANGE  (triggered by index.html's button group)
   ═══════════════════════════════════════════════════════════════ */

document.getElementById("interval").addEventListener("change", function () {
  currentInterval = this.value;
  if (currentSymbol) updateChart();
});

/* ═══════════════════════════════════════════════════════════════
   SIGNAL PARSER — handles LLM returning JSON inside a string field
   ═══════════════════════════════════════════════════════════════ */

function unwrapSignal(raw) {
  /* Case 1: already a proper object with a signal field */
  if (raw && typeof raw.signal === "string" &&
      /^(BUY|SELL|HOLD)$/i.test(raw.signal.trim())) {
    /* Still check if `reason` itself is a JSON string from the LLM */
    if (typeof raw.reason === "string") {
      const embedded = tryParseJSON(raw.reason);
      if (embedded?.signal) return embedded;   // reason was the real payload
    }
    return raw;
  }

  /* Case 2: the entire response is a stringified JSON blob */
  if (typeof raw === "string") {
    const parsed = tryParseJSON(raw);
    if (parsed) return unwrapSignal(parsed);
  }

  /* Case 3: signal is missing but reason contains the full JSON string
     e.g. { signal: "UNKNOWN", reason: '{"signal":"BUY",...}' }        */
  if (raw?.reason) {
    const embedded = tryParseJSON(raw.reason);
    if (embedded?.signal) return embedded;

    /* Case 4: reason is a plain string that CONTAINS a JSON block
       e.g.  'Here is the result: {"signal":"BUY",...}'                */
    const match = String(raw.reason).match(/\{[\s\S]*"signal"[\s\S]*\}/);
    if (match) {
      const extracted = tryParseJSON(match[0]);
      if (extracted?.signal) return extracted;
    }
  }

  /* Case 5: top-level object has a nested key (e.g. { data: {...} }) */
  for (const key of Object.keys(raw || {})) {
    const val = raw[key];
    if (val && typeof val === "object" && val.signal) return val;
    if (typeof val === "string") {
      const p = tryParseJSON(val);
      if (p?.signal) return p;
    }
  }

  /* Fallback: return whatever we have */
  return raw || {};
}

function tryParseJSON(str) {
  try {
    /* Strip markdown code fences the LLM sometimes wraps around JSON */
    const cleaned = String(str)
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    return JSON.parse(cleaned);
  } catch { return null; }
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function emptyState(icon, msg) {
  return `<div class="empty-state"><div class="icon">${icon}</div><p>${msg}</p></div>`;
}

function loadingState(msg) {
  return `<div class="signal-loading" style="padding:20px 0"><div class="spin"></div>${msg}</div>`;
}

function formatVolume(v) {
  if (v >= 1e7) return (v / 1e7).toFixed(1) + "Cr";
  if (v >= 1e5) return (v / 1e5).toFixed(1) + "L";
  return v.toLocaleString();
}

function flashInput(input, msg) {
  input.style.borderColor = "var(--red)";
  input.placeholder = msg;
  setTimeout(() => {
    input.style.borderColor = "";
    input.placeholder = "Ticker symbol…";
  }, 1800);
}

/* ═══════════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════════ */

renderWatchlist();

/* Auto-load first watchlist item if any */
if (watchlist.length > 0) loadWatch(watchlist[0]);

/* Polling */
setInterval(updateChart,       5_000);
setInterval(checkBreakingNews, 60_000);