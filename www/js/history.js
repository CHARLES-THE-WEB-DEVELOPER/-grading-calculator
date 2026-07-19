const HISTORY_KEY = 'ghana-university-gpa-history';
const MAX_ENTRIES = 20;

export function loadHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse history', error);
    localStorage.removeItem(HISTORY_KEY);
    return [];
  }
}

export function saveHistory(entry) {
  const history = [entry, ...loadHistory()].slice(0, MAX_ENTRIES);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  return [];
}

export function historyToCSV(history) {
  const header = ['Timestamp', 'University', 'GPA', 'CWA', 'Credits', 'Classification', 'Status', 'Courses'];
  const rows = history.map((item) => {
    const courses = item.courseResults
      .map((row) => `${row.courseCode} (${row.score} / ${row.credits}cr / ${row.grade})`)
      .join(' | ');

    return [
      item.timestamp,
      item.university,
      item.gpa.toFixed(2),
      item.cwa.toFixed(2),
      item.totalCredits,
      item.classification,
      item.status,
      courses,
    ];
  });

  return [header, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
