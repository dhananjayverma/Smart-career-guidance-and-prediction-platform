const careers = require('../data/careers.json');
const colleges = require('../data/colleges.json');
const exams = require('../data/exams.json');

function normalizeQuery(query = '') {
  return String(query)
    .toLowerCase()
    .replace(/enginner|enginr|engneer|enigneer/g, 'engineer')
    .replace(/kru/g, 'karu');
}

function includesAny(values = [], query = '') {
  const text = normalizeQuery(query);
  const tokens = text.split(/[^a-z0-9]+/).filter(Boolean);

  return values.some((value) => {
    const normalizedValue = normalizeQuery(value);
    return text.includes(normalizedValue) || tokens.includes(normalizedValue);
  });
}

function getCareerData({ education = '', interest = '', category = '' } = {}) {
  return careers.filter((career) => {
    const educationMatch = !education || education === 'unknown' || career.educationLevels.includes(education);
    const interestMatch = !interest || includesAny([career.category, ...career.interests, ...career.skills], interest);
    const categoryMatch = !category || category === 'All' || career.category === category;
    return educationMatch && interestMatch && categoryMatch;
  });
}

function getAllCareers() {
  return careers;
}

function getExamData(type = '') {
  if (!type) return exams;
  return exams.filter((exam) => includesAny([exam.name, exam.category, ...exam.tags], type));
}

function getCollegeData({ location = '', type = '', state = '', search = '' } = {}) {
  return colleges.filter((college) => {
    const haystack = `${college.name} ${college.location} ${college.state} ${college.type} ${college.courses.join(' ')}`.toLowerCase();
    const searchMatch = !search || haystack.includes(search.toLowerCase());
    const locationMatch = !location || haystack.includes(location.toLowerCase());
    const typeMatch = !type || type === 'All' || college.type === type;
    const stateMatch = !state || state === 'All' || college.state === state;
    return searchMatch && locationMatch && typeMatch && stateMatch;
  });
}

module.exports = {
  getAllCareers,
  getCareerData,
  getCollegeData,
  getExamData,
};
