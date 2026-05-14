const STORAGE_KEY = "jira-sprint-assignment-tracker";

const reportElements = {
  issueCount: document.querySelector("#reportIssueCount"),
  totalPoints: document.querySelector("#reportTotalPoints"),
  blockedCount: document.querySelector("#reportBlockedCount"),
  personBars: document.querySelector("#personBars"),
  sprintBars: document.querySelector("#sprintBars"),
  statusDonut: document.querySelector("#statusDonut"),
  statusLegend: document.querySelector("#statusLegend"),
  priorityMix: document.querySelector("#priorityMix"),
  blockedItems: document.querySelector("#blockedItems"),
  sprintFilter: document.querySelector("#reportSprintFilter")
};

const issues = loadIssues();
reportElements.sprintFilter.addEventListener("change", renderFilteredCharts);
renderReports(issues);

function renderReports(items) {
  const totalPoints = items.reduce((total, issue) => total + points(issue.devPoints) + points(issue.qaePoints), 0);
  const blockedItems = items.filter((issue) => clean(issue.status).toLowerCase() === "blocked");

  reportElements.issueCount.textContent = items.length;
  reportElements.totalPoints.textContent = formatPoints(totalPoints);
  reportElements.blockedCount.textContent = blockedItems.length;

  renderSprintFilter(items);
  renderFilteredCharts();
  renderSprintBars(items);
  renderPriorityMix(items);
  renderBlockedItems(blockedItems);
}

function renderSprintFilter(items) {
  const current = reportElements.sprintFilter.value || "all";
  const sprints = [...new Set(items.map((issue) => clean(issue.sprint)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  reportElements.sprintFilter.innerHTML = "";
  reportElements.sprintFilter.append(new Option("All sprints", "all"));
  sprints.forEach((sprint) => reportElements.sprintFilter.append(new Option(sprint, sprint)));
  reportElements.sprintFilter.value = sprints.includes(current) ? current : "all";
}

function renderFilteredCharts() {
  const selectedSprint = reportElements.sprintFilter.value;
  const filtered = selectedSprint === "all" ? issues : issues.filter((issue) => clean(issue.sprint) === selectedSprint);
  renderPersonBars(filtered);
  renderStatusBreakdown(filtered);
}

function renderPersonBars(items) {
  const totals = new Map();

  items.forEach((issue) => {
    addPoints(totals, issue.developer, points(issue.devPoints), 0);
    addPoints(totals, issue.qae, 0, points(issue.qaePoints));
  });

  const rows = [...totals.entries()]
    .map(([name, total]) => ({ name, ...total, combined: total.dev + total.qae }))
    .filter((row) => row.name)
    .sort((a, b) => b.combined - a.combined || a.name.localeCompare(b.name));

  renderStackedBars(reportElements.personBars, rows, {
    empty: "No people to chart yet.",
    label: (row) => row.name,
    detail: (row) => `${formatPoints(row.dev)} Dev SP + ${formatPoints(row.qae)} QAE SP`,
    total: (row) => row.combined
  });
}

function renderSprintBars(items) {
  const totals = new Map();

  items.forEach((issue) => {
    addPoints(totals, issue.sprint, points(issue.devPoints), points(issue.qaePoints));
  });

  const rows = [...totals.entries()]
    .map(([name, total]) => ({ name, ...total, combined: total.dev + total.qae }))
    .filter((row) => row.name)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

  renderStackedBars(reportElements.sprintBars, rows, {
    empty: "No sprints to chart yet.",
    label: (row) => row.name,
    detail: (row) => `${formatPoints(row.dev)} Dev SP + ${formatPoints(row.qae)} QAE SP`,
    total: (row) => row.combined
  });
}

function renderStackedBars(container, rows, options) {
  container.innerHTML = "";

  if (rows.length === 0) {
    container.innerHTML = `<p class="chart-empty">${options.empty}</p>`;
    return;
  }

  const max = Math.max(...rows.map((row) => row.combined), 1);
  container.innerHTML = rows
    .map((row) => {
      const devWidth = Math.max((row.dev / max) * 100, row.dev ? 3 : 0);
      const qaeWidth = Math.max((row.qae / max) * 100, row.qae ? 3 : 0);
      return `
        <div class="bar-row">
          <div class="bar-row-label">
            <strong>${escapeHtml(options.label(row))}</strong>
            <span>${escapeHtml(options.detail(row))}</span>
          </div>
          <div class="stacked-track" aria-hidden="true">
            <span class="dev-segment" style="width: ${devWidth}%"></span>
            <span class="qae-segment" style="width: ${qaeWidth}%"></span>
          </div>
          <strong class="bar-total">${formatPoints(options.total(row))}</strong>
        </div>
      `;
    })
    .join("");
}

function renderStatusBreakdown(items) {
  const counts = countBy(items, "status", "No Status");
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  renderDonut(rows, reportElements.statusDonut, reportElements.statusLegend, "No status data yet.");
}

function renderPriorityMix(items) {
  const counts = countBy(items, "priority", "No Priority");
  const rows = [...counts.entries()].sort((a, b) => priorityRank(a[0]) - priorityRank(b[0]) || b[1] - a[1]);

  if (rows.length === 0) {
    reportElements.priorityMix.innerHTML = `<p class="chart-empty">No priority data yet.</p>`;
    return;
  }

  reportElements.priorityMix.innerHTML = rows
    .map(([priority, count], index) => `
      <article class="priority-card">
        <span class="legend-swatch color-${index % 8}"></span>
        <strong>${escapeHtml(priority)}</strong>
        <span>${count} ${count === 1 ? "card" : "cards"}</span>
      </article>
    `)
    .join("");
}

function renderBlockedItems(items) {
  if (items.length === 0) {
    reportElements.blockedItems.innerHTML = `<p class="chart-empty">No blocked cards right now.</p>`;
    return;
  }

  reportElements.blockedItems.innerHTML = items
    .sort((a, b) => clean(a.sprint).localeCompare(clean(b.sprint), undefined, { numeric: true, sensitivity: "base" }))
    .map((issue) => {
      const total = points(issue.devPoints) + points(issue.qaePoints);
      return `
        <article class="blocked-card">
          <div>
            <strong>${escapeHtml(issue.issueNumber)}: ${escapeHtml(issue.title || issue.summary)}</strong>
            <span>${escapeHtml(issue.sprint)} · ${escapeHtml(issue.developer)} / ${escapeHtml(issue.qae)}</span>
          </div>
          <span class="blocked-points">${formatPoints(total)} SP</span>
        </article>
      `;
    })
    .join("");
}

function renderDonut(rows, donut, legend, emptyText) {
  const total = rows.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) {
    donut.style.background = "var(--surface-muted)";
    legend.innerHTML = `<p class="chart-empty">${emptyText}</p>`;
    return;
  }

  let cursor = 0;
  const stops = rows.map(([, count], index) => {
    const start = cursor;
    const end = cursor + (count / total) * 100;
    cursor = end;
    return `var(--chart-${index % 8}) ${start}% ${end}%`;
  });

  donut.style.background = `conic-gradient(${stops.join(", ")})`;
  donut.dataset.total = total;
  legend.innerHTML = rows
    .map(([label, count], index) => `
      <div class="legend-item">
        <span class="legend-swatch color-${index % 8}"></span>
        <strong>${escapeHtml(label)}</strong>
        <span>${count}</span>
      </div>
    `)
    .join("");
}

function addPoints(map, name, dev, qae) {
  const key = clean(name);
  if (!key) return;
  const current = map.get(key) || { dev: 0, qae: 0 };
  current.dev += dev;
  current.qae += qae;
  map.set(key, current);
}

function countBy(items, key, fallback) {
  return items.reduce((counts, issue) => {
    const value = clean(issue[key]) || fallback;
    counts.set(value, (counts.get(value) || 0) + 1);
    return counts;
  }, new Map());
}

function priorityRank(priority) {
  const ranks = { critical: 1, high: 2, medium: 3, low: 4, "no priority": 5 };
  return ranks[clean(priority).toLowerCase()] || 6;
}

function loadIssues() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function points(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clean(value) {
  return String(value || "").trim();
}

function formatPoints(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
