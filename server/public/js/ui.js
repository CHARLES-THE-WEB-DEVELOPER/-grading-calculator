import { calculateCourseResult, calculateSummary } from './calculator.js';

const dom = {
  coursesContainer: document.getElementById('courses-container'),
  gradeLegend: document.getElementById('grade-legend'),
  summaryCards: {
    gpa: document.getElementById('gpa-value'),
    cwa: document.getElementById('cwa-value'),
    credits: document.getElementById('credits-value'),
    classification: document.getElementById('classification-value'),
    status: document.getElementById('status-value'),
  },
  breakdownBody: document.getElementById('breakdown-body'),
  historyList: document.getElementById('history-list'),
  messageBar: document.getElementById('result-message'),
  splash: document.getElementById('splash-screen'),
};

export function createCourseRow(data = {}) {
  const row = document.createElement('div');
  row.className = 'course-row';
  row.innerHTML = `
    <div class="row-left">
      <label>
        <span>Course Code</span>
        <input type="text" name="courseCode" placeholder="e.g. MTH101" value="${data.courseCode || ''}" />
      </label>
    </div>
    <div class="row-mid">
      <label>
        <span>Score</span>
        <input type="number" name="score" min="0" max="100" step="0.01" placeholder="0 - 100" value="${data.score ?? ''}" />
      </label>
    </div>
    <div class="row-mid">
      <label>
        <span>Credits</span>
        <input type="number" name="credits" min="0" max="20" step="0.5" placeholder="Credits" value="${data.credits ?? ''}" />
      </label>
    </div>
    <div class="row-right">
      <span class="grade-chip">-</span>
      <button type="button" class="btn-remove" aria-label="Remove course row">✕</button>
    </div>
  `;

  const scoreInput = row.querySelector('input[name="score"]');
  const creditsInput = row.querySelector('input[name="credits"]');
  const removeBtn = row.querySelector('.btn-remove');
  const gradeChip = row.querySelector('.grade-chip');

  removeBtn.addEventListener('click', () => {
    row.remove();
    if (dom.coursesContainer.children.length === 0) {
      dom.coursesContainer.appendChild(createCourseRow());
    }
    updateSummaryFromDom();
  });

  function getValidCourseResults() {
    const rows = Array.from(dom.coursesContainer.querySelectorAll('.course-row'));
    const scale = window.ghUniversityCurrentScale || [];

    return rows
      .map((courseRow) => {
        const course = {
          courseCode: courseRow.querySelector('input[name="courseCode"]').value,
          score: courseRow.querySelector('input[name="score"]').value,
          credits: courseRow.querySelector('input[name="credits"]').value,
        };

        const score = Number(course.score);
        const credits = Number(course.credits);

        if (!Number.isFinite(score) || !Number.isFinite(credits) || score < 0 || score > 100 || credits <= 0) {
          return null;
        }

        return calculateCourseResult(course, scale);
      })
      .filter(Boolean);
  }

  function updateSummaryFromDom() {
    updateSummary(getValidCourseResults());
  }

  function updateRowPreview() {
    const course = {
      courseCode: row.querySelector('input[name="courseCode"]').value,
      score: scoreInput.value,
      credits: creditsInput.value,
    };

    const score = Number(course.score);
    const credits = Number(course.credits);

    if (Number.isFinite(score) && !Number.isNaN(score) && Number.isFinite(credits) && !Number.isNaN(credits) && score >= 0 && score <= 100 && credits > 0) {
      const scale = window.ghUniversityCurrentScale;
      if (scale) {
        const result = calculateCourseResult(course, scale);
        gradeChip.textContent = `${result.grade} • ${result.gp.toFixed(1)}`;
        gradeChip.dataset.variant = result.grade;
      }
    } else {
      gradeChip.textContent = '-';
      gradeChip.removeAttribute('data-variant');
    }

    updateSummaryFromDom();
  }

  scoreInput.addEventListener('input', updateRowPreview);
  creditsInput.addEventListener('input', updateRowPreview);

  return row;
}

export function renderGradeLegend(scale) {
  dom.gradeLegend.innerHTML = scale
    .map((rule) => `
      <div class="legend-row">
        <span>${rule.min}-${rule.max}</span>
        <span>${rule.grade}</span>
        <span>${rule.gp.toFixed(1)}</span>
      </div>
    `)
    .join('');
}

export function updateSummary(courseResults = []) {
  if (!courseResults.length) {
    dom.summaryCards.gpa.textContent = '0.00';
    dom.summaryCards.cwa.textContent = '0.00';
    dom.summaryCards.credits.textContent = '0';
    dom.summaryCards.classification.textContent = '-';
    dom.summaryCards.status.textContent = '-';
    dom.breakdownBody.innerHTML = '<tr><td colspan="6">Add courses to see instant breakdown.</td></tr>';
    return;
  }

  const summary = calculateSummary(courseResults);
  dom.summaryCards.gpa.textContent = summary.gpa.toFixed(2);
  dom.summaryCards.cwa.textContent = summary.cwa.toFixed(2);
  dom.summaryCards.credits.textContent = summary.totalCredits;
  dom.summaryCards.classification.textContent = summary.classification;
  dom.summaryCards.status.textContent = summary.status;
  dom.breakdownBody.innerHTML = courseResults
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.courseCode)}</td>
          <td>${row.score.toFixed(2)}</td>
          <td>${row.credits.toFixed(1)}</td>
          <td>${row.grade}</td>
          <td>${row.gp.toFixed(1)}</td>
          <td>${row.points.toFixed(2)}</td>
        </tr>
      `
    )
    .join('');
}

export function renderHistory(history) {
  if (!history.length) {
    dom.historyList.innerHTML = '<p class="history-empty">No saved calculations yet. Your results are stored locally and will appear here.</p>';
    return;
  }

  dom.historyList.innerHTML = history
    .map(
      (item) => `
        <article class="history-item">
          <div>
            <strong>${item.university}</strong>
            <span>${item.timestamp}</span>
          </div>
          <div class="history-item-summary">
            <span>GPA ${item.gpa.toFixed(2)}</span>
            <span>CWA ${item.cwa.toFixed(2)}</span>
            <span>${item.classification}</span>
          </div>
        </article>
      `
    )
    .join('');
}

export function showMessage(message, type = 'info') {
  dom.messageBar.textContent = message;
  dom.messageBar.className = `result-message ${type}`;
}

export function hideSplash() {
  dom.splash.classList.add('splash-hidden');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
