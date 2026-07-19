const UNIVERSITY_DATA_URL = './data/universities.json';

export async function loadUniversities() {
  const response = await fetch(UNIVERSITY_DATA_URL);
  if (!response.ok) {
    throw new Error('Unable to load university grading data.');
  }
  return await response.json();
}
