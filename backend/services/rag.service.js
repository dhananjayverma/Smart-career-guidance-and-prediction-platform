const careers = require('../data/careers.json');
const colleges = require('../data/colleges.json');
const exams = require('../data/exams.json');
const materials = require('../data/materials.json');

class HashEmbeddings {
  constructor(dimensions = 128) {
    this.dimensions = dimensions;
  }

  embedDocuments(texts) {
    return Promise.resolve(texts.map((text) => this.embedText(text)));
  }

  embedQuery(text) {
    return Promise.resolve(this.embedText(text));
  }

  embedText(text = '') {
    const vector = Array.from({ length: this.dimensions }, () => 0);
    String(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).forEach((token) => {
      let hash = 0;
      for (let index = 0; index < token.length; index += 1) {
        hash = ((hash << 5) - hash + token.charCodeAt(index)) | 0;
      }
      vector[Math.abs(hash) % this.dimensions] += 1;
    });
    const norm = Math.hypot(...vector) || 1;
    return vector.map((value) => value / norm);
  }
}

let vectorStorePromise = null;

function buildDocuments() {
  const careerDocs = careers.map((career) => ({
    pageContent: [
      `Career: ${career.title}`,
      `Category: ${career.category}`,
      `Interests: ${career.interests.join(', ')}`,
      `Skills: ${career.skills.join(', ')}`,
      `Duration: ${career.duration}`,
      `Salary: ${career.salary}`,
      `Pros: ${career.pros}`,
      `Cons: ${career.cons}`,
    ].join('\n'),
    metadata: { type: 'career', id: career.id, title: career.title },
  }));

  const collegeDocs = colleges.map((college) => ({
    pageContent: [
      `College: ${college.name}`,
      `Type: ${college.type}`,
      `Location: ${college.location}, ${college.state}`,
      `Courses: ${college.courses.join(', ')}`,
      `Placement: ${college.placement}%`,
      `Fees: ${college.fees}`,
    ].join('\n'),
    metadata: { type: 'college', id: college.id, title: college.name },
  }));

  const examDocs = exams.map((exam) => ({
    pageContent: [
      `Exam: ${exam.name}`,
      `Category: ${exam.category}`,
      `Eligibility: ${exam.eligibility}`,
      `Duration: ${exam.duration}`,
      `Tags: ${exam.tags.join(', ')}`,
    ].join('\n'),
    metadata: { type: 'exam', id: exam.id, title: exam.name },
  }));

  const materialDocs = materials.map((resource) => ({
    pageContent: [
      `Resource: ${resource.title}`,
      `Type: ${resource.type}`,
      `Platform: ${resource.platform}`,
      `Subject: ${resource.subject}`,
      `Difficulty: ${resource.difficulty}`,
      `Free: ${resource.free ? 'yes' : 'no'}`,
    ].join('\n'),
    metadata: { type: 'resource', id: resource.id, title: resource.title },
  }));

  return [...careerDocs, ...collegeDocs, ...examDocs, ...materialDocs];
}

async function getVectorStore() {
  if (vectorStorePromise) return vectorStorePromise;

  vectorStorePromise = (async () => {
    const [{ Document }, { MemoryVectorStore }] = await Promise.all([
      import('@langchain/core/documents'),
      import('langchain/vectorstores/memory'),
    ]);

    const docs = buildDocuments().map((doc) => new Document(doc));
    return MemoryVectorStore.fromDocuments(docs, new HashEmbeddings());
  })();

  return vectorStorePromise;
}

function keywordRetrieve(query, limit = 5) {
  const tokens = String(query).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return buildDocuments()
    .map((doc) => {
      const content = doc.pageContent.toLowerCase();
      const score = tokens.reduce((sum, token) => sum + (content.includes(token) ? 1 : 0), 0);
      return { ...doc, score };
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score, ...doc }) => doc);
}

async function retrieveRelevantContext(query, limit = 5) {
  try {
    const store = await getVectorStore();
    const docs = await store.similaritySearch(query, limit);
    return {
      mode: 'langchain-vector-rag',
      documents: docs.map((doc) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      })),
    };
  } catch (error) {
    return {
      mode: 'keyword-rag-fallback',
      error: error.message,
      documents: keywordRetrieve(query, limit).map((doc) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      })),
    };
  }
}

module.exports = { HashEmbeddings, retrieveRelevantContext };
