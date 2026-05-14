import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/AngelaRoberta/Documents/Codex/2026-05-13/i-would-like-to-build-an/outputs/jira_sprint_template";
const outputPath = `${outputDir}/jira_sprint_assignment_template.xlsx`;

await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const report = workbook.worksheets.add("Report");
const summary = workbook.worksheets.add("Summary");
const instructions = workbook.worksheets.add("Instructions");

const headers = [
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

const sampleRows = [
  [
    "Sprint 18",
    "PAY-1201",
    "Saved card checkout validation",
    "Story",
    "High",
    "In Progress",
    "2026.05",
    "Riley Morgan",
    "Add saved-card validation to checkout",
    "Avery Chen",
    5,
    "Maya Patel",
    2
  ],
  [
    "Sprint 18",
    "PAY-1207",
    "Refund audit trail",
    "Story",
    "Medium",
    "Ready for QA",
    "2026.05",
    "Casey Ward",
    "Refund event audit trail",
    "Jordan Lee",
    8,
    "Priya Raman",
    3
  ],
  [
    "Sprint 19",
    "PAY-1214",
    "Retry status banner",
    "Bug",
    "Critical",
    "Blocked",
    "2026.06",
    "Riley Morgan",
    "Payment retry status banner",
    "Avery Chen",
    3,
    "Maya Patel",
    1
  ],
  [
    "Sprint 19",
    "MOB-884",
    "Receipt image upload",
    "Story",
    "Medium",
    "To Do",
    "2026.06",
    "Taylor Kim",
    "Mobile receipt image upload",
    "Sam Rivera",
    5,
    "Priya Raman",
    2
  ],
  [
    "Sprint 20",
    "OPS-442",
    "Dashboard health checks",
    "Task",
    "Low",
    "Done",
    "2026.06",
    "Morgan Blake",
    "Release dashboard health checks",
    "Jordan Lee",
    3,
    "Noah Brooks",
    2
  ]
];

report.getRange("A1:M1").values = [headers];
report.getRange("A2:M6").values = sampleRows;
report.tables.add("A1:M101", true, "JiraIssues");
report.freezePanes.freezeRows(1);
report.showGridLines = false;

report.getRange("A1:M1").format = {
  fill: "#174F49",
  font: { bold: true, color: "#FFFFFF" },
  wrapText: true
};
report.getRange("A2:M101").format = {
  fill: "#FFFFFF",
  wrapText: true
};
report.getRange("K2:K101").format.numberFormat = "0.0";
report.getRange("M2:M101").format.numberFormat = "0.0";

const widths = [96, 112, 220, 92, 86, 112, 100, 130, 250, 150, 96, 132, 92];
widths.forEach((width, index) => {
  report.getRangeByIndexes(0, index, 101, 1).format.columnWidthPx = width;
});
report.getRange("A1:M101").format.rowHeightPx = 34;

report.getRange("D2:D101").dataValidation = { rule: { type: "list", values: ["Story", "Bug", "Task", "Spike"] } };
report.getRange("E2:E101").dataValidation = { rule: { type: "list", values: ["Critical", "High", "Medium", "Low"] } };
report.getRange("F2:F101").dataValidation = {
  rule: { type: "list", values: ["To Do", "In Progress", "Blocked", "Ready for QA", "Done"] }
};
report.getRange("K2:K101").dataValidation = { rule: { type: "decimal", operator: "greaterThanOrEqualTo", formula1: 0 } };
report.getRange("M2:M101").dataValidation = { rule: { type: "decimal", operator: "greaterThanOrEqualTo", formula1: 0 } };

summary.showGridLines = false;
summary.getRange("A1:F1").merge();
summary.getRange("A1").values = [["Jira Sprint Assignment Report"]];
summary.getRange("A1").format = {
  fill: "#174F49",
  font: { bold: true, color: "#FFFFFF", size: 18 }
};
summary.getRange("A3:C3").values = [["Total Issues", "Developer SP", "QAE SP"]];
summary.getRange("A4:C4").formulas = [
  ["=COUNTA(Report!B2:B101)", "=SUM(Report!K2:K101)", "=SUM(Report!M2:M101)"]
];
summary.getRange("A3:C3").format = {
  fill: "#DCEEEA",
  font: { bold: true, color: "#17201D" }
};
summary.getRange("A4:C4").format = {
  fill: "#FFFFFF",
  font: { bold: true, size: 16 },
  numberFormat: "0.0"
};

summary.getRange("A7:D7").values = [["Person", "Developer SP", "QAE SP", "Total SP"]];
summary.getRange("A8:A13").values = [
  ["Avery Chen"],
  ["Jordan Lee"],
  ["Sam Rivera"],
  ["Maya Patel"],
  ["Priya Raman"],
  ["Noah Brooks"]
];
summary.getRange("B8:D8").formulas = [
  ["=SUMIF(Report!J$2:J$101,A8,Report!K$2:K$101)", "=SUMIF(Report!L$2:L$101,A8,Report!M$2:M$101)", "=B8+C8"]
];
summary.getRange("B8:D13").fillDown();
summary.getRange("A7:D7").format = {
  fill: "#174F49",
  font: { bold: true, color: "#FFFFFF" }
};
summary.getRange("A8:D13").format = {
  fill: "#FFFFFF",
  numberFormat: "0.0"
};
summary.getRange("A1:F20").format.columnWidthPx = 128;
summary.getRange("A7:D13").format.rowHeightPx = 26;

const chart = summary.charts.add("bar", summary.getRange("A7:D13"));
chart.title = "Story Points by Person";
chart.hasLegend = true;
chart.xAxis = { axisType: "textAxis" };
chart.yAxis = { numberFormatCode: "0.0" };
chart.setPosition("F3", "M18");

instructions.showGridLines = false;
instructions.getRange("A1:E1").merge();
instructions.getRange("A1").values = [["How to use this template"]];
instructions.getRange("A1").format = {
  fill: "#174F49",
  font: { bold: true, color: "#FFFFFF", size: 16 }
};
instructions.getRange("A3:B9").values = [
  ["Step", "Action"],
  ["1", "Enter or paste Jira cards on the Report sheet."],
  ["2", "Keep the header names unchanged so the app can import/export the same fields."],
  ["3", "Use Issue Number, Sprint, Summary, Assigned Developer, Developer Story Points, Assigned QAE, and QAE Story Points for every row."],
  ["4", "Optional fields include Title, Issue Type, Priority, Status, Fix Version, and Reporter."],
  ["5", "Save as .xlsx for analysis or export/save as .csv when importing into the local web app."],
  ["6", "The Summary sheet formulas update automatically as rows are added."]
];
instructions.getRange("A3:B3").format = {
  fill: "#DCEEEA",
  font: { bold: true }
};
instructions.getRange("A4:B9").format = {
  fill: "#FFFFFF",
  wrapText: true
};
instructions.getRange("A:A").format.columnWidthPx = 72;
instructions.getRange("B:B").format.columnWidthPx = 620;
instructions.getRange("A3:B9").format.rowHeightPx = 36;

const summaryInspect = await workbook.inspect({
  kind: "table",
  range: "Summary!A1:D13",
  include: "values,formulas",
  tableMaxRows: 14,
  tableMaxCols: 4
});
console.log(summaryInspect.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan"
});
console.log(errors.ndjson);

for (const sheetName of ["Report", "Summary", "Instructions"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${outputDir}/${sheetName.toLowerCase()}_preview.png`, new Uint8Array(await preview.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(outputPath);
