import { loadUniversities } from './js/data.js';
import { createCourseRow, renderGradeLegend, updateSummary, renderHistory, showMessage } from './js/ui.js';
import { loadHistory, saveHistory, clearHistory, historyToCSV } from './js/history.js';
import { calculateCourseResult, calculateSummary } from './js/calculator.js';

const coursesContainer = document.getElementById('courses-container');
const form = document.getElementById('calc-form');
const addBtn = document.getElementById('add-course');
const clearBtn = document.getElementById('clear-all');
const saveBtn = document.getElementById('save-result');
const exportBtn = document.getElementById('export-history');
const downloadPdfBtn = document.getElementById('download-pdf');
const clearHistoryBtn = document.getElementById('clear-history');
const startBtn = document.getElementById('start-btn');
const networkStatus = document.getElementById('network-status');

let universities = [];
let currentUniversity = null;
let latestCourseResults = [];

function updateNetworkStatus() {
  const online = navigator.onLine;
  networkStatus.textContent = online ? 'Online' : 'Offline';
  networkStatus.className = `status-pill ${online ? 'status-online' : 'status-offline'}`;
}

function addCourseRow(data = {}) {
  if (coursesContainer.children.length >= 50) {
    showMessage('Maximum of 50 courses allowed.', 'error');
    return;
  }

  const row = createCourseRow(data);
  coursesContainer.appendChild(row);
  return row;
}

function getCourseInputs() {
  const rows = Array.from(coursesContainer.querySelectorAll('.course-row'));
  if (rows.length === 0) {
    showMessage('Add at least one course before calculating.', 'error');
    return null;
  }

  const courses = rows.map((row) => {
    const courseCode = row.querySelector('input[name="courseCode"]').value.trim();
    const score = row.querySelector('input[name="score"]').value;
    const credits = row.querySelector('input[name="credits"]').value;
    return { courseCode, score, credits };
  });

  for (const course of courses) {
    const score = Number(course.score);
    const credits = Number(course.credits);

    if (!Number.isFinite(score) || score < 0 || score > 100) {
      showMessage('Score must be between 0 and 100 for every course.', 'error');
      return null;
    }

    if (!Number.isFinite(credits) || credits <= 0) {
      showMessage('Credits must be a positive number for every course.', 'error');
      return null;
    }
  }

  return courses;
}

function recalculateSummary() {
  const courses = getCourseInputs();
  if (!courses) {
    updateSummary([]);
    latestCourseResults = [];
    return;
  }

  latestCourseResults = courses.map((course) => calculateCourseResult(course, currentUniversity.gradingScale));
  updateSummary(latestCourseResults);
}

function handleCalculate(event) {
  event.preventDefault();
  const courses = getCourseInputs();
  if (!courses) return;

  latestCourseResults = courses.map((course) => calculateCourseResult(course, currentUniversity.gradingScale));
  updateSummary(latestCourseResults);
  showMessage('GPA and CWA updated. Save your result to preserve it locally.', 'success');
}

function handleSaveResult() {
  if (!latestCourseResults.length) {
    showMessage('Calculate first before saving your result.', 'error');
    return;
  }

  const summary = calculateSummary(latestCourseResults);
  const historyEntry = {
    timestamp: new Date().toLocaleString(),
    university: currentUniversity.name,
    ...summary,
    courseResults: latestCourseResults,
  };

  saveHistory(historyEntry);
  renderHistory(loadHistory());
  showMessage('Calculation saved to local history.', 'success');
}

function handleExportHistory() {
  const history = loadHistory();
  if (!history.length) {
    showMessage('No history available to export.', 'error');
    return;
  }

  const csv = historyToCSV(history);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ghana-university-gpa-history.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showMessage('History exported as CSV.', 'success');
}

function handleGeneratePdf() {
  if (!latestCourseResults.length) {
    showMessage('Calculate first before downloading your report.', 'error');
    return;
  }

  const summary = calculateSummary(latestCourseResults);
  const generatedAt = new Date().toLocaleString();
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>GPA & CWA Report</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color: #102a43; margin: 32px; }
      h1, h2 { margin-bottom: 0.5rem; }
      .header { margin-bottom: 1.5rem; }
      .summary, .courses { margin-bottom: 1.25rem; }
      .summary span { display: block; margin: 0.25rem 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
      th, td { padding: 0.75rem 0.5rem; border: 1px solid #dfe4ee; }
      th { background: #f4f7fb; text-align: left; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>KNUST GPA & CWA Report</h1>
      <span>University: ${currentUniversity?.name || 'KNUST (Kwame Nkrumah University of Science & Technology)'}</span>
      <span>Generated: ${generatedAt}</span>
    </div>
    <div class="summary">
      <h2>Summary</h2>
      <span>GPA: ${summary.gpa.toFixed(2)}</span>
      <span>CWA: ${summary.cwa.toFixed(2)}</span>
      <span>Total Credits: ${summary.totalCredits}</span>
      <span>Classification: ${summary.classification}</span>
      <span>Status: ${summary.status}</span>
    </div>
    <div class="courses">
      <h2>Course Breakdown</h2>
      <table>
        <thead>
          <tr><th>Course</th><th>Score</th><th>Credits</th><th>Grade</th><th>GP</th><th>Points</th></tr>
        </thead>
        <tbody>
          ${latestCourseResults
            .map(
              (row) => `
              <tr>
                <td>${row.courseCode}</td>
                <td>${row.score.toFixed(2)}</td>
                <td>${row.credits.toFixed(1)}</td>
                <td>${row.grade}</td>
                <td>${row.gp.toFixed(1)}</td>
                <td>${row.points.toFixed(2)}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </body>
</html>`;

  const reportWindow = window.open('', '_blank');
  reportWindow.document.write(html);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
}

function handleClearHistory() {
  clearHistory();
  renderHistory([]);
  showMessage('Saved history cleared.', 'info');
}

function clearAllInputs() {
  coursesContainer.innerHTML = '';
  latestCourseResults = [];
  updateSummary([]);
  addCourseRow();
  showMessage('Course entries have been cleared.', 'info');
}

function initHistory() {
  renderHistory(loadHistory());
}

async function initializeApp() {
  updateNetworkStatus();
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  try {
    universities = await loadUniversities();
  } catch (error) {
    showMessage('Unable to load university data. Using default KNUST grading scale.', 'error');
    universities = [
      {
        id: 'knust',
        name: 'KNUST (Kwame Nkrumah University of Science & Technology)',
        gradingScale: [
          { min: 70, max: 100, grade: 'A', gp: 4.0, class: 'First Class' },
          { min: 60, max: 69, grade: 'B', gp: 3.0, class: 'Second Class (Upper)' },
          { min: 50, max: 59, grade: 'C', gp: 2.0, class: 'Second Class (Lower)' },
          { min: 45, max: 49, grade: 'D', gp: 1.0, class: 'Pass' },
          { min: 40, max: 44, grade: 'E', gp: 0.7, class: 'Pass' },
          { min: 0, max: 39, grade: 'F', gp: 0.0, class: 'Fail' },
        ],
      },
    ];
  }

  currentUniversity = universities[0];
  window.ghUniversityCurrentScale = currentUniversity.gradingScale;
  renderGradeLegend(currentUniversity.gradingScale);
  addCourseRow();
  initHistory();
}

startBtn?.addEventListener('click', () => {
  document.getElementById('splash-screen').classList.add('splash-hidden');
});
addBtn.addEventListener('click', () => addCourseRow());
clearBtn.addEventListener('click', clearAllInputs);
form.addEventListener('submit', handleCalculate);
saveBtn.addEventListener('click', handleSaveResult);
exportBtn.addEventListener('click', handleExportHistory);
downloadPdfBtn?.addEventListener('click', handleGeneratePdf);
clearHistoryBtn.addEventListener('click', handleClearHistory);

initializeApp();

