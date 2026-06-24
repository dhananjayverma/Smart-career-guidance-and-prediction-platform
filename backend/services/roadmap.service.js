const careers = require('../data/careers.json');

const baseRoadmaps = {
  'B.Tech Engineering': [
    { title: 'Choose PCM Foundation', duration: 'Class 11-12', tasks: ['Choose Science PCM', 'Build Maths basics', 'Study Physics daily', 'Start JEE/state entrance basics'] },
    { title: 'Entrance and Branch Selection', duration: 'Year 1-2', tasks: ['Prepare JEE/state CET', 'Give mock tests weekly', 'Compare CSE, ECE, Mechanical, Civil, Electrical, AI/ML, Data Science, Chemical, Aerospace, Biotech', 'Shortlist colleges by fees and placement'] },
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

const supplementalCareers = [
  {
    id: 'frontend-developer',
    title: 'Frontend Developer',
    category: 'IT/Technology',
    educationLevels: ['12th', 'graduation', 'unknown'],
    duration: '6-12 months',
    salary: 'Rs 3-14 LPA',
    difficulty: 'Medium',
    growth: 'High',
    growthScore: 4,
    skills: ['HTML/CSS', 'JavaScript', 'React', 'UI Integration'],
    roadmapDuration: '6-9 months',
  },
  {
    id: 'backend-developer',
    title: 'Backend Developer',
    category: 'IT/Technology',
    educationLevels: ['12th', 'graduation', 'unknown'],
    duration: '6-12 months',
    salary: 'Rs 4-16 LPA',
    difficulty: 'Hard',
    growth: 'High',
    growthScore: 4,
    skills: ['Node.js/Java/Python', 'APIs', 'Databases', 'System Design'],
    roadmapDuration: '6-12 months',
  },
  {
    id: 'full-stack-developer',
    title: 'Full Stack Developer',
    category: 'IT/Technology',
    educationLevels: ['12th', 'graduation', 'unknown'],
    duration: '9-15 months',
    salary: 'Rs 4-18 LPA',
    difficulty: 'Hard',
    growth: 'Very High',
    growthScore: 5,
    skills: ['React', 'Backend APIs', 'Databases', 'Deployment'],
    roadmapDuration: '9-12 months',
  },
  {
    id: 'mobile-app-developer',
    title: 'Mobile App Developer',
    category: 'IT/Technology',
    educationLevels: ['12th', 'graduation', 'unknown'],
    duration: '6-12 months',
    salary: 'Rs 3-16 LPA',
    difficulty: 'Medium',
    growth: 'High',
    growthScore: 4,
    skills: ['Android/Flutter', 'APIs', 'App UI', 'Play Store'],
    roadmapDuration: '6-10 months',
  },
  {
    id: 'qa-automation-engineer',
    title: 'QA Automation Engineer',
    category: 'IT/Technology',
    educationLevels: ['12th', 'graduation', 'unknown'],
    duration: '4-8 months',
    salary: 'Rs 3-12 LPA',
    difficulty: 'Medium',
    growth: 'Good',
    growthScore: 3,
    skills: ['Manual Testing', 'Automation', 'Selenium/Cypress', 'Bug Reports'],
    roadmapDuration: '4-8 months',
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    category: 'IT/Technology',
    educationLevels: ['12th', 'graduation', 'unknown'],
    duration: '4-9 months',
    salary: 'Rs 3-12 LPA',
    difficulty: 'Medium',
    growth: 'High',
    growthScore: 4,
    skills: ['Excel', 'SQL', 'Python', 'Dashboards'],
    roadmapDuration: '4-8 months',
  },
  {
    id: 'database-administrator',
    title: 'Database Administrator',
    category: 'IT/Technology',
    educationLevels: ['12th', 'graduation', 'unknown'],
    duration: '6-12 months',
    salary: 'Rs 4-15 LPA',
    difficulty: 'Hard',
    growth: 'Good',
    growthScore: 3,
    skills: ['SQL', 'Backups', 'Performance', 'Security'],
    roadmapDuration: '6-12 months',
  },
  {
    id: 'network-engineer',
    title: 'Network Engineer',
    category: 'IT/Technology',
    educationLevels: ['10th', '12th', 'graduation', 'unknown'],
    duration: '6-12 months',
    salary: 'Rs 3-12 LPA',
    difficulty: 'Medium',
    growth: 'Good',
    growthScore: 3,
    skills: ['Networking', 'Routing', 'Switching', 'Troubleshooting'],
    roadmapDuration: '6-9 months',
  },
  {
    id: 'embedded-systems-engineer',
    title: 'Embedded Systems Engineer',
    category: 'Engineering',
    educationLevels: ['12th', 'graduation', 'unknown'],
    duration: '9-18 months',
    salary: 'Rs 4-16 LPA',
    difficulty: 'Hard',
    growth: 'High',
    growthScore: 4,
    skills: ['C/C++', 'Microcontrollers', 'Electronics', 'IoT'],
    roadmapDuration: '9-15 months',
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    category: 'Management',
    educationLevels: ['graduation', 'unknown'],
    duration: '1-3 years',
    salary: 'Rs 8-30 LPA',
    difficulty: 'Hard',
    growth: 'Very High',
    growthScore: 5,
    skills: ['User Research', 'Analytics', 'Strategy', 'Communication'],
    roadmapDuration: '12-18 months',
  },
  {
    id: 'game-developer',
    title: 'Game Developer',
    category: 'IT/Technology',
    educationLevels: ['12th', 'graduation', 'unknown'],
    duration: '9-18 months',
    salary: 'Rs 3-14 LPA',
    difficulty: 'Hard',
    growth: 'Good',
    growthScore: 3,
    skills: ['Unity/Unreal', 'C# or C++', 'Game Physics', 'Portfolio'],
    roadmapDuration: '9-15 months',
  },
  {
    id: 'blockchain-developer',
    title: 'Blockchain Developer',
    category: 'IT/Technology',
    educationLevels: ['12th', 'graduation', 'unknown'],
    duration: '9-18 months',
    salary: 'Rs 5-22 LPA',
    difficulty: 'Hard',
    growth: 'High',
    growthScore: 4,
    skills: ['Solidity', 'Smart Contracts', 'Web3', 'Security'],
    roadmapDuration: '9-15 months',
  },
];

const allCareers = [...careers, ...supplementalCareers];

const branchTasks = {
  Engineering: ['Compare diploma, B.Tech, lateral entry, and branch options', 'Check core branches, computer branches, government roles, and private jobs'],
  'IT/Technology': ['Pick coding, data, cloud, security, or product track', 'Build GitHub projects and internship proof'],
  'Design/Creative': ['Explore UI/UX, graphic design, branding, and product design portfolios', 'Publish case studies on Behance, Dribbble, or a personal site'],
  Finance: ['Choose CA, finance analyst, banking, taxation, or investment route', 'Build Excel, accounting, and market research proof'],
  Government: ['Compare UPSC, SSC, banking, railway, defence, and state exams', 'Map eligibility, age limit, syllabus, and backup exams'],
  Medical: ['Compare MBBS, nursing, pharmacy, allied health, and specialization routes', 'Track NEET or course eligibility with biology foundation'],
  Business: ['Explore startup, family business, sales, ecommerce, and local service paths', 'Validate one idea with real customers'],
};

const streamLabels = {
  '10th': 'After 10th',
  '12th': 'After 12th',
  graduation: 'After Graduation',
  unknown: 'Open Path',
};

function getGenericMilestones(career) {
  const branchTask = branchTasks[career.category] || ['Compare degree, diploma, certification, internship, and self-learning routes', 'Talk to seniors and shortlist 2-3 realistic paths'];
  const skills = career.skills?.length ? career.skills : ['Core Skills', 'Communication', 'Portfolio'];

  return [
    {
      title: 'Explore Stream, Field and Eligibility',
      duration: 'Step 1',
      tasks: [
        `Check entry route: ${(career.educationLevels || []).map((level) => streamLabels[level] || level).join(', ') || 'Open Path'}`,
        ...branchTask,
        `Understand duration, salary range, and difficulty for ${career.title}`,
      ],
    },
    {
      title: 'Build Core Skills',
      duration: 'Step 2',
      tasks: [
        `Learn ${skills[0]}`,
        `Practice ${skills[1] || skills[0]}`,
        `Create proof using ${skills[2] || 'projects, notes, or practical work'}`,
        'Follow a weekly study and revision schedule',
      ],
    },
    {
      title: 'Projects, Exams or Practical Exposure',
      duration: 'Step 3',
      tasks: [
        'Complete 2 practical projects, mock tests, case studies, or field assignments',
        'Find internships, apprenticeships, volunteering, coaching, or mentor feedback',
        'Compare colleges, institutes, local opportunities, and online resources',
      ],
    },
    {
      title: 'Apply and Grow',
      duration: 'Step 4',
      tasks: [
        'Prepare resume, portfolio, documents, or exam forms',
        'Apply consistently to colleges, internships, jobs, clients, or exams',
        'Review progress every month and choose a backup path if needed',
      ],
    },
  ];
}

function createRoadmap(careerName = 'Software Developer') {
  const matched = allCareers.find((career) => career.title.toLowerCase() === careerName.toLowerCase());
  const title = matched?.title || careerName;
  const milestones = baseRoadmaps[title] || (matched ? getGenericMilestones(matched) : [
    { title: 'Explore', duration: 'Month 1', tasks: ['Understand role', 'Talk to 2 seniors', 'List required skills', 'Choose learning resources'] },
    { title: 'Build Skills', duration: 'Month 2-4', tasks: ['Study daily', 'Complete projects', 'Take feedback', 'Track progress weekly'] },
    { title: 'Apply', duration: 'Month 5-6', tasks: ['Prepare resume', 'Practice interviews', 'Apply consistently', 'Improve from feedback'] },
  ]);

  return {
    id: matched?.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title,
    category: matched?.category || 'Career',
    educationLevels: matched?.educationLevels || [],
    duration: matched?.duration || matched?.roadmapDuration || '6 months',
    salary: matched?.salary || '',
    difficulty: matched?.difficulty || '',
    growth: matched?.growth || '',
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
  return allCareers.map((career) => createRoadmap(career.title));
}

module.exports = { createRoadmap, getRoadmapTemplates };
