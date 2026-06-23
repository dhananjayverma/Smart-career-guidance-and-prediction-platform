const careers = require('../data/careers.json');

const baseRoadmaps = {
  'B.Tech Engineering': [
    { title: 'Choose PCM Foundation', duration: 'Class 11-12', tasks: ['Choose Science PCM', 'Build Maths basics', 'Study Physics daily', 'Start JEE/state entrance basics'] },
    { title: 'Entrance and Branch Selection', duration: 'Year 1-2', tasks: ['Prepare JEE/state CET', 'Give mock tests weekly', 'Research branches: CSE, ECE, Mechanical, Civil', 'Shortlist colleges by fees and placement'] },
    { title: 'Engineering Career Build', duration: 'B.Tech Year 1-4', tasks: ['Keep CGPA stable', 'Build projects/internships', 'Learn branch-specific tools', 'Prepare for placements or higher studies'] }
  ],
  'Software Developer': [
    { title: 'Programming Foundation', duration: 'Month 1-2', tasks: ['Pick JavaScript or Python', 'Learn Git/GitHub', 'Build 2 small projects', 'Solve 50 beginner problems'] },
    { title: 'Web + Database Skills', duration: 'Month 3-4', tasks: ['HTML/CSS/React basics', 'Node.js or Django basics', 'SQL fundamentals', 'Deploy one full-stack project'] },
    { title: 'Job Readiness', duration: 'Month 5-6', tasks: ['DSA practice 5 days/week', 'Resume + LinkedIn', 'Mock interviews', 'Apply to internships and junior roles'] },
  ],
  'Data Scientist': [
    { title: 'Math + Python', duration: 'Month 1-2', tasks: ['Python, NumPy, Pandas', 'Statistics basics', 'Data cleaning notebooks', 'Visualization practice'] },
    { title: 'Machine Learning', duration: 'Month 3-5', tasks: ['Regression/classification', 'Model evaluation', '3 Kaggle-style projects', 'SQL + dashboard project'] },
    { title: 'Portfolio', duration: 'Month 6', tasks: ['Publish notebooks', 'Make case studies', 'Prepare ML interview basics', 'Apply for internships'] },
  ],
  'UPSC Civil Services': [
    { title: 'Foundation', duration: 'Month 1-3', tasks: ['Read NCERT 6-12', 'Daily newspaper notes', 'Understand syllabus', 'Start answer writing'] },
    { title: 'Core Preparation', duration: 'Month 4-9', tasks: ['GS papers', 'Optional subject', 'Monthly revision', 'Prelims MCQ practice'] },
    { title: 'Exam Mode', duration: 'Month 10-12', tasks: ['Full mock tests', 'Essay practice', 'Current affairs revision', 'Interview awareness'] },
  ],
};

function createRoadmap(careerName = 'Software Developer') {
  const matched = careers.find((career) => career.title.toLowerCase() === careerName.toLowerCase());
  const title = matched?.title || careerName;
  const milestones = baseRoadmaps[title] || [
    { title: 'Explore', duration: 'Month 1', tasks: ['Understand role', 'Talk to 2 seniors', 'List required skills', 'Choose learning resources'] },
    { title: 'Build Skills', duration: 'Month 2-4', tasks: ['Study daily', 'Complete projects', 'Take feedback', 'Track progress weekly'] },
    { title: 'Apply', duration: 'Month 5-6', tasks: ['Prepare resume', 'Practice interviews', 'Apply consistently', 'Improve from feedback'] },
  ];

  return {
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title,
    totalDuration: matched?.roadmapDuration || '6 months',
    skills: matched?.skills || [],
    milestones: milestones.map((milestone, milestoneIndex) => ({
      id: `m${milestoneIndex + 1}`,
      title: milestone.title,
      duration: milestone.duration,
      tasks: milestone.tasks.map((task, taskIndex) => ({
        id: `m${milestoneIndex + 1}-t${taskIndex + 1}`,
        title: task,
        completed: false,
      })),
    })),
  };
}

function getRoadmapTemplates() {
  return Object.keys(baseRoadmaps).map(createRoadmap);
}

module.exports = { createRoadmap, getRoadmapTemplates };
