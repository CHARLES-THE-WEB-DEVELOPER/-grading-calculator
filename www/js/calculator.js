export function findScaleEntry(score, scale) {
  return scale.find((rule) => score >= rule.min && score <= rule.max) || scale[scale.length - 1];
}

export function calculateCourseResult(course, scale) {
  const score = Math.min(100, Math.max(0, Number(course.score) || 0));
  const credits = Math.max(0, Number(course.credits) || 0);
  const entry = findScaleEntry(score, scale);
  const points = Number((entry.gp * credits).toFixed(2));

  return {
    courseCode: course.courseCode?.trim() || 'UNTITLED',
    score,
    credits,
    grade: entry.grade,
    gp: entry.gp,
    className: entry.class,
    points,
  };
}

export function calculateSummary(courseResults) {
  const totalCredits = courseResults.reduce((sum, item) => sum + item.credits, 0);
  const totalPoints = courseResults.reduce((sum, item) => sum + item.points, 0);
  const weightedScoreTotal = courseResults.reduce((sum, item) => sum + item.score * item.credits, 0);

  const gpa = totalCredits ? totalPoints / totalCredits : 0;
  const cwa = totalCredits ? weightedScoreTotal / totalCredits : 0;
  const classification = classifyGPA(gpa);
  const status = gpa >= 1.0 ? 'Pass' : 'Fail';

  return {
    totalCredits,
    totalPoints: Number(totalPoints.toFixed(2)),
    gpa: Number(gpa.toFixed(2)),
    cwa: Number(cwa.toFixed(2)),
    classification,
    status,
  };
}

export function classifyGPA(gpa) {
  if (gpa >= 3.5) return 'First Class';
  if (gpa >= 3.0) return 'Second Class (Upper)';
  if (gpa >= 2.0) return 'Second Class (Lower)';
  if (gpa >= 1.0) return 'Pass';
  return 'Fail';
}
