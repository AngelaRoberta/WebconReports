const STORAGE_KEY = "jira-sprint-assignment-tracker";
let exportUrl = "";

const sampleIssues = [
  {
    id: crypto.randomUUID(),
    issueNumber: "PAY-1201",
    sprint: "Sprint 18",
    title: "Saved card checkout validation",
    summary: "Add saved-card validation to checkout",
    issueType: "Story",
    priority: "High",
    status: "In Progress",
    fixVersion: "2026.05",
    reporter: "Riley Morgan",
    developer: "Avery Chen",
    devPoints: 5,
    qae: "Maya Patel",
    qaePoints: 2
  },
  {
    id: crypto.randomUUID(),
    issueNumber: "PAY-1207",
    sprint: "Sprint 18",
    title: "Refund audit trail",
    summary: "Refund event audit trail",
    issueType: "Story",
    priority: "Medium",
    status: "Ready for QA",
    fixVersion: "2026.05",
    reporter: "Casey Ward",
    developer: "Jordan Lee",
    devPoints: 8,
    qae: "Priya Raman",
    qaePoints: 3
  },
  {
    id: crypto.randomUUID(),
    issueNumber: "PAY-1214",
    sprint: "Sprint 19",
    title: "Retry status banner",
    summary: "Payment retry status banner",
    issueType: "Bug",
    priority: "Critical",
    status: "Blocked",
    fixVersion: "2026.06",
    reporter: "Riley Morgan",
    developer: "Avery Chen",
    devPoints: 3,
    qae: "Maya Patel",
    qaePoints: 1
  },
  {
    id: crypto.randomUUID(),
    issueNumber: "MOB-884",
    sprint: "Sprint 19",
    title: "Receipt image upload",
    summary: "Mobile receipt image upload",
    issueType: "Story",
    priority: "Medium",
    status: "To Do",
    fixVersion: "2026.06",
    reporter: "Taylor Kim",
    developer: "Sam Rivera",
    devPoints: 5,
    qae: "Priya Raman",
    qaePoints: 2
  },
  {
    id: crypto.randomUUID(),
    issueNumber: "OPS-442",
    sprint: "Sprint 20",
    title: "Dashboard health checks",
    summary: "Release dashboard health checks",
    issueType: "Task",
    priority: "Low",
    status: "Done",
    fixVersion: "2026.06",
    reporter: "Morgan Blake",
    developer: "Jordan Lee",
    devPoints: 3,
    qae: "Noah Brooks",
    qaePoints: 2
  }
];

let issues = loadIssues();
let sortState = { key: "sprint", direction: "asc" };
let editingIssueId = "";

const elements = {
  loadSample: document.querySelector("#loadSample"),
  clearData: document.querySelector("#clearData"),
  csvImport: document.querySelector("#csvImport"),
  importCsv: document.querySelector("#importCsv"),
  exportCsv: document.querySelector("#exportCsv"),
  exportPanel: document.querySelector("#exportPanel"),
  downloadCsvLink: document.querySelector("#downloadCsvLink"),
  openCsvLink: document.querySelector("#openCsvLink"),
  saveCsv: document.querySelector("#saveCsv"),
  copyCsv: document.querySelector("#copyCsv"),
  csvPreview: document.querySelector("#csvPreview"),
  importStatus: document.querySelector("#importStatus"),
  menuToggle: document.querySelector("#menuToggle"),
  actionMenu: document.querySelector("#actionMenu"),
  sprintFilter: document.querySelector("#sprintFilter"),
  personFilter: document.querySelector("#personFilter"),
  issueSearch: document.querySelector("#issueSearch"),
  rows: document.querySelector("#issueRows"),
  resultCount: document.querySelector("#resultCount"),
  totalIssues: document.querySelector("#totalIssues"),
  developerPoints: document.querySelector("#developerPoints"),
  qaePointsTotal: document.querySelector("#qaePoints"),
  personTotals: document.querySelector("#personTotals"),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate")
};

elements.loadSample.addEventListener("click", loadSampleData);
elements.clearData.addEventListener("click", clearData);
elements.importCsv.addEventListener("click", () => elements.csvImport.click());
elements.csvImport.addEventListener("change", importCsv);
elements.exportCsv.addEventListener("click", exportCsv);
elements.saveCsv.addEventListener("click", saveExportedCsv);
elements.copyCsv.addEventListener("click", copyExportedCsv);
elements.menuToggle.addEventListener("click", toggleMenu);
elements.actionMenu.addEventListener("click", closeMenuAfterAction);
document.addEventListener("click", closeMenuFromOutside);
elements.sprintFilter.addEventListener("change", render);
elements.personFilter.addEventListener("change", render);
elements.issueSearch.addEventListener("input", render);

document.querySelectorAll("[data-sort]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    const key = button.dataset.sort;
    const nextDirection = sortState.key === key && sortState.direction === "asc" ? "desc" : "asc";
    sortState = { key, direction: nextDirection };
    render();
  });
});

render();

function toggleMenu(event) {
  event.stopPropagation();
  setMenuOpen(elements.actionMenu.hidden);
}

function setMenuOpen(isOpen) {
  elements.actionMenu.hidden = !isOpen;
  elements.menuToggle.setAttribute("aria-expanded", String(isOpen));
}

function closeMenuAfterAction(event) {
  const target = event.target;
  if (target.matches("button, a")) {
    setMenuOpen(false);
  }
}

function closeMenuFromOutside(event) {
  if (!event.target.closest(".menu-shell")) {
    setMenuOpen(false);
  }
}

function loadSampleData() {
  issues = [...sampleIssues.map((issue) => ({ ...issue, id: crypto.randomUUID() })), ...issues];
  persist();
  render();
}

function clearData() {
  const confirmed = confirm("Clear all tracked cards?");
  if (!confirmed) return;
  issues = [];
  persist();
  render();
}

function deleteIssue(id) {
  issues = issues.filter((issue) => issue.id !== id);
  if (editingIssueId === id) {
    editingIssueId = "";
  }
  persist();
  render();
}

function editIssue(id) {
  editingIssueId = id;
  render();
}

function cancelEdit() {
  editingIssueId = "";
  render();
}

function saveEditedIssue(id) {
  const row = elements.rows.querySelector(`[data-row-id="${id}"]`);
  if (!row) return;

  const updated = {
    id,
    sprint: getEditValue(row, "sprint"),
    issueNumber: getEditValue(row, "issueNumber").toUpperCase(),
    title: getEditValue(row, "title"),
    issueType: getEditValue(row, "issueType"),
    priority: getEditValue(row, "priority"),
    status: getEditValue(row, "status"),
    fixVersion: getEditValue(row, "fixVersion"),
    reporter: getEditValue(row, "reporter"),
    summary: getEditValue(row, "summary"),
    developer: getEditValue(row, "developer"),
    devPoints: numberOrZero(getEditValue(row, "devPoints")),
    qae: getEditValue(row, "qae"),
    qaePoints: numberOrZero(getEditValue(row, "qaePoints"))
  };

  issues = issues.map((issue) => (issue.id === id ? updated : issue));
  editingIssueId = "";
  persist();
  render();
}

function getEditValue(row, field) {
  const input = row.querySelector(`[data-edit-field="${field}"]`);
  return clean(input?.value);
}

function render() {
  renderFilters();
  const filtered = getFilteredIssues();
  const sorted = sortIssues(filtered);
  renderRows(sorted);
  renderSummary(filtered);
  renderPersonTotals(filtered);
  renderSortButtons();
}

function renderFilters() {
  const currentSprint = elements.sprintFilter.value || "all";
  const currentPerson = elements.personFilter.value || "all";
  const sprints = uniqueValues(issues.map((issue) => issue.sprint));
  const people = uniqueValues(issues.flatMap((issue) => [issue.developer, issue.qae]));

  fillSelect(elements.sprintFilter, "All sprints", sprints, currentSprint);
  fillSelect(elements.personFilter, "All people", people, currentPerson);
}

function fillSelect(select, allLabel, values, selected) {
  select.innerHTML = "";
  select.append(new Option(allLabel, "all"));
  values.forEach((value) => select.append(new Option(value, value)));
  select.value = values.includes(selected) ? selected : "all";
}

function getFilteredIssues() {
  const sprint = elements.sprintFilter.value;
  const person = elements.personFilter.value;
  const query = clean(elements.issueSearch.value).toLowerCase();

  return issues.filter((issue) => {
    const matchesSprint = sprint === "all" || issue.sprint === sprint;
    const matchesPerson = person === "all" || issue.developer === person || issue.qae === person;
    const matchesIssue =
      !query ||
      issue.issueNumber.toLowerCase().includes(query) ||
      clean(issue.title).toLowerCase().includes(query) ||
      issue.summary.toLowerCase().includes(query) ||
      clean(issue.issueType).toLowerCase().includes(query) ||
      clean(issue.priority).toLowerCase().includes(query) ||
      clean(issue.status).toLowerCase().includes(query) ||
      clean(issue.fixVersion).toLowerCase().includes(query) ||
      clean(issue.reporter).toLowerCase().includes(query);

    return matchesSprint && matchesPerson && matchesIssue;
  });
}

function sortIssues(items) {
  return [...items].sort((a, b) => {
    const direction = sortState.direction === "asc" ? 1 : -1;
    const left = a[sortState.key];
    const right = b[sortState.key];

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * direction;
    }

    return clean(left).localeCompare(clean(right), undefined, {
      numeric: true,
      sensitivity: "base"
    }) * direction;
  });
}

function renderRows(rows) {
  elements.rows.innerHTML = "";

  if (rows.length === 0) {
    elements.rows.append(elements.emptyStateTemplate.content.cloneNode(true));
    return;
  }

  rows.forEach((issue) => {
    const row = document.createElement("tr");
    row.dataset.rowId = issue.id;
    row.innerHTML = editingIssueId === issue.id ? renderEditRow(issue) : renderReadRow(issue);
    elements.rows.append(row);
  });

  elements.rows.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => editIssue(button.dataset.edit));
  });
  elements.rows.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteIssue(button.dataset.delete));
  });
  elements.rows.querySelectorAll("[data-save]").forEach((button) => {
    button.addEventListener("click", () => saveEditedIssue(button.dataset.save));
  });
  elements.rows.querySelectorAll("[data-cancel-edit]").forEach((button) => {
    button.addEventListener("click", cancelEdit);
  });
}

function renderReadRow(issue) {
  return `
    <td>${escapeHtml(issue.sprint)}</td>
    <td class="issue">${escapeHtml(issue.issueNumber)}</td>
    <td>${escapeHtml(issue.title)}</td>
    <td>${escapeHtml(issue.issueType)}</td>
    <td>${escapeHtml(issue.priority)}</td>
    <td>${escapeHtml(issue.status)}</td>
    <td>${escapeHtml(issue.fixVersion)}</td>
    <td>${escapeHtml(issue.reporter)}</td>
    <td>${escapeHtml(issue.summary)}</td>
    <td>${escapeHtml(issue.developer)}</td>
    <td class="points">${formatPoints(issue.devPoints)}</td>
    <td>${escapeHtml(issue.qae)}</td>
    <td class="points">${formatPoints(issue.qaePoints)}</td>
    <td>
      <div class="row-actions">
        <button class="icon-row-button" type="button" data-edit="${issue.id}" aria-label="Edit ${escapeHtml(issue.issueNumber)}" title="Edit">✎</button>
        <button class="icon-row-button danger-icon" type="button" data-delete="${issue.id}" aria-label="Delete ${escapeHtml(issue.issueNumber)}" title="Delete">×</button>
      </div>
    </td>
  `;
}

function renderEditRow(issue) {
  return `
    ${renderEditCell("sprint", issue.sprint)}
    ${renderEditCell("issueNumber", issue.issueNumber, "issue")}
    ${renderEditCell("title", issue.title)}
    ${renderEditCell("issueType", issue.issueType)}
    ${renderEditCell("priority", issue.priority)}
    ${renderEditCell("status", issue.status)}
    ${renderEditCell("fixVersion", issue.fixVersion)}
    ${renderEditCell("reporter", issue.reporter)}
    ${renderEditCell("summary", issue.summary)}
    ${renderEditCell("developer", issue.developer)}
    ${renderEditCell("devPoints", issue.devPoints, "points", "number")}
    ${renderEditCell("qae", issue.qae)}
    ${renderEditCell("qaePoints", issue.qaePoints, "points", "number")}
    <td>
      <div class="row-actions edit-actions">
        <button type="button" data-save="${issue.id}">Save</button>
        <button type="button" data-cancel-edit>Cancel</button>
      </div>
    </td>
  `;
}

function renderEditCell(field, value, className = "", type = "text") {
  const numberAttrs = type === "number" ? ' min="0" step="0.5"' : "";
  return `
    <td class="${className}">
      <input class="row-edit-input" data-edit-field="${field}" type="${type}" value="${escapeHtml(value)}"${numberAttrs} />
    </td>
  `;
}

function renderSummary(items) {
  const developerPoints = sum(items, "devPoints");
  const qaePoints = sum(items, "qaePoints");
  elements.totalIssues.textContent = items.length;
  elements.developerPoints.textContent = formatPoints(developerPoints);
  elements.qaePointsTotal.textContent = formatPoints(qaePoints);
  elements.resultCount.textContent = `${items.length} ${items.length === 1 ? "card" : "cards"} shown`;
}

function renderPersonTotals(items) {
  const totals = new Map();

  items.forEach((issue) => {
    addPersonTotal(totals, issue.developer, issue.devPoints, "Developer");
    addPersonTotal(totals, issue.qae, issue.qaePoints, "QAE");
  });

  const cards = [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, total]) => {
      const roleText = [...total.roles].sort().join(" + ");
      return `
        <article class="person-total">
          <strong>${escapeHtml(name)}: ${formatPoints(total.points)} SP</strong>
          <span>${escapeHtml(roleText)} across ${total.cards} ${total.cards === 1 ? "card" : "cards"}</span>
        </article>
      `;
    });

  elements.personTotals.innerHTML = cards.join("");
}

function addPersonTotal(totals, name, points, role) {
  const current = totals.get(name) || { points: 0, cards: 0, roles: new Set() };
  current.points += points;
  current.cards += 1;
  current.roles.add(role);
  totals.set(name, current);
}

function renderSortButtons() {
  document.querySelectorAll("[data-sort]").forEach((button) => {
    const active = button.dataset.sort === sortState.key;
    button.classList.toggle("active", active);
    button.textContent = button.dataset.label;
    if (active) {
      button.textContent += sortState.direction === "asc" ? " ↑" : " ↓";
    }
  });
}

function exportCsv() {
  const rows = getFilteredIssues();
  const csv = buildCsv(rows);
  const dataUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });

  if (exportUrl) {
    URL.revokeObjectURL(exportUrl);
  }

  exportUrl = URL.createObjectURL(blob);
  elements.downloadCsvLink.href = dataUrl;
  elements.openCsvLink.href = dataUrl;
  elements.csvPreview.value = csv;
  elements.exportPanel.hidden = false;
  setImportStatus(
    `Generated CSV for ${rows.length} ${rows.length === 1 ? "issue" : "issues"}. If download is blocked, try Save CSV or Copy CSV.`
  );

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "jira-sprint-assignment-report.csv";
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
}

function buildCsv(rows) {
  const header = [
    "Sprint",
    "Issue Number",
    "Title",
    "Issue Type",
    "Priority",
    "Status",
    "Fix Version",
    "Reporter",
    "Summary",
    "Assigned Developer",
    "Developer Story Points",
    "Assigned QAE",
    "QAE Story Points"
  ];
  const csvRows = [header, ...rows.map((issue) => [
    issue.sprint,
    issue.issueNumber,
    issue.title,
    issue.issueType,
    issue.priority,
    issue.status,
    issue.fixVersion,
    issue.reporter,
    issue.summary,
    issue.developer,
    issue.devPoints,
    issue.qae,
    issue.qaePoints
  ])];
  return csvRows.map((row) => row.map(csvCell).join(",")).join("\n");
}

async function saveExportedCsv() {
  const csv = elements.csvPreview.value;
  if (!csv) return;

  if (!window.showSaveFilePicker) {
    selectCsvPreview("This browser does not expose a save dialog here. CSV is selected; use Command+C to copy it.");
    return;
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: "jira-sprint-assignment-report.csv",
      types: [
        {
          description: "CSV file",
          accept: { "text/csv": [".csv"] }
        }
      ]
    });
    const writable = await handle.createWritable();
    await writable.write(csv);
    await writable.close();
    setImportStatus("Saved CSV report.");
  } catch (error) {
    if (error.name !== "AbortError") {
      selectCsvPreview("Save was blocked here. CSV is selected; use Command+C to copy it.");
    }
  }
}

async function copyExportedCsv() {
  const csv = elements.csvPreview.value;
  if (!csv) return;

  try {
    await navigator.clipboard.writeText(csv);
    setImportStatus("Copied CSV to clipboard.");
  } catch {
    selectCsvPreview("CSV is selected. Use Command+C to copy it.");
  }
}

function selectCsvPreview(message) {
  elements.csvPreview.focus();
  elements.csvPreview.select();
  setImportStatus(message);
}

function importCsv(event) {
  const [file] = event.target.files;
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = parseImportedIssues(String(reader.result || ""));
      if (imported.length === 0) {
        setImportStatus("No valid issue rows were found in that CSV.", true);
        return;
      }

      issues = [...imported, ...issues];
      persist();
      render();
      setImportStatus(`Imported ${imported.length} ${imported.length === 1 ? "issue" : "issues"} from ${file.name}.`);
    } catch (error) {
      setImportStatus(error.message, true);
    } finally {
      elements.csvImport.value = "";
    }
  });
  reader.addEventListener("error", () => {
    setImportStatus("The CSV file could not be read.", true);
    elements.csvImport.value = "";
  });
  reader.readAsText(file);
}

function parseImportedIssues(csvText) {
  const rows = parseCsv(csvText).filter((row) => row.some((cell) => clean(cell)));
  if (rows.length < 2) {
    throw new Error("The CSV needs a header row and at least one issue row.");
  }

  const headers = rows[0].map(normalizeHeader);
  const indexes = {
    issueNumber: findHeader(headers, ["issue number", "issue", "issue key", "key"]),
    sprint: findHeader(headers, ["sprint", "sprint name"]),
    title: findHeader(headers, ["title", "card title"]),
    issueType: findHeader(headers, ["issue type", "type"]),
    priority: findHeader(headers, ["priority"]),
    status: findHeader(headers, ["status", "issue status"]),
    fixVersion: findHeader(headers, ["fix version", "fix versions", "fixversion", "release", "target release"]),
    reporter: findHeader(headers, ["reporter", "reported by"]),
    summary: findHeader(headers, ["summary", "title", "issue summary"]),
    developer: findHeader(headers, ["assigned developer", "developer", "dev", "assignee"]),
    devPoints: findHeader(headers, ["developer story points", "dev story points", "dev sp", "story points"]),
    qae: findHeader(headers, ["assigned qae", "qae", "qa", "tester"]),
    qaePoints: findHeader(headers, ["qae story points", "qa story points", "qae sp", "qa sp"])
  };

  const missing = Object.entries(indexes)
    .filter(
      ([field, index]) =>
        index === -1 && !["title", "issueType", "priority", "status", "fixVersion", "reporter"].includes(field)
    )
    .map(([field]) => field);

  if (missing.length > 0) {
    throw new Error(
      `Missing required CSV columns: ${missing.join(", ")}. Export a CSV first to see the expected headers.`
    );
  }

  return rows.slice(1).reduce((entries, row) => {
    const entry = {
      id: crypto.randomUUID(),
      issueNumber: clean(row[indexes.issueNumber]).toUpperCase(),
      sprint: clean(row[indexes.sprint]),
      title: getOptionalCell(row, indexes.title),
      issueType: getOptionalCell(row, indexes.issueType),
      priority: getOptionalCell(row, indexes.priority),
      status: getOptionalCell(row, indexes.status),
      fixVersion: getOptionalCell(row, indexes.fixVersion),
      reporter: getOptionalCell(row, indexes.reporter),
      summary: clean(row[indexes.summary]),
      developer: clean(row[indexes.developer]),
      devPoints: numberOrZero(row[indexes.devPoints]),
      qae: clean(row[indexes.qae]),
      qaePoints: numberOrZero(row[indexes.qaePoints])
    };

    if (entry.issueNumber && entry.sprint && entry.summary && entry.developer && entry.qae) {
      entries.push(entry);
    }

    return entries;
  }, []);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function normalizeHeader(value) {
  return clean(value).replace(/^\uFEFF/, "").toLowerCase().replaceAll("_", " ");
}

function findHeader(headers, candidates) {
  return headers.findIndex((header) => candidates.includes(header));
}

function numberOrZero(value) {
  const number = Number(clean(value));
  return Number.isFinite(number) ? number : 0;
}

function getOptionalCell(row, index) {
  return index === -1 ? "" : clean(row[index]);
}

function setImportStatus(message, isError = false) {
  elements.importStatus.textContent = message;
  elements.importStatus.classList.toggle("error", isError);
}

function loadIssues() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}

function sum(items, key) {
  return items.reduce((total, item) => total + Number(item[key] || 0), 0);
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

function csvCell(value) {
  const text = clean(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
