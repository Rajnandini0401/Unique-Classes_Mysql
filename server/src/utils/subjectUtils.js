// Canonical subject definitions by standard
export const JUNIOR_SUBJECTS = ['Mathematics', 'Science', 'English'];
export const SENIOR_SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Mathematics'];
export const CANONICAL_SUBJECTS = ['Mathematics', 'Science', 'English', 'Physics', 'Chemistry', 'Biology'];
export const TEACHER_SUBJECTS = ['Mathematics', 'Science', 'English', 'Physics', 'Chemistry', 'Biology'];

/**
 * Checks if a standard is Senior-Secondary (11th or 12th)
 */
export const isSeniorStandard = (standard) => {
  if (!standard || typeof standard !== 'string') return false;
  const s = standard.trim();
  return s === '11th' || s === '12th';
};

/**
 * Centralized subject normalization function
 * All math variants ('math', 'maths', 'mathematics') map strictly to 'Mathematics'.
 */
export const normalizeSubject = (subject, standard = '') => {
  if (!subject || typeof subject !== 'string') return '';
  const trimmed = subject.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'math' || lower === 'maths' || lower === 'mathematics') return 'Mathematics';

  const isSenior = isSeniorStandard(standard);

  if (isSenior) {
    if (lower === 'physics') return 'Physics';
    if (lower === 'chemistry') return 'Chemistry';
    if (lower === 'biology') return 'Biology';
    return trimmed;
  }

  // Junior (5th to 10th) or default
  if (lower === 'science') return 'Science';
  if (lower === 'english') return 'English';
  if (lower === 'pcm') return 'PCM';
  if (lower === 'pcb') return 'PCB';
  if (lower === 'pcmb') return 'PCMB';

  return trimmed;
};

/**
 * Resolves a student's actual registered academic subjects based on class & registration/stream.
 * Converts streams (PCM, PCB, PCMB) into actual academic subjects.
 * Strictly respects student's class (5th-10th -> Mathematics, Science, English; 11th-12th -> Physics, Chemistry, Biology, Mathematics).
 */
export const getStudentAcademicSubjects = (student) => {
  if (!student) return [...JUNIOR_SUBJECTS];
  const standard = student?.standard || '';
  const isSenior = isSeniorStandard(standard);
  const allowedPool = isSenior ? SENIOR_SUBJECTS : JUNIOR_SUBJECTS;

  if (!isSenior) {
    return [...JUNIOR_SUBJECTS];
  }

  const rawSubjects = Array.isArray(student.subjects)
    ? student.subjects
    : (student.subjects ? [student.subjects] : []);
  const stream = student.courseStream ? String(student.courseStream).trim().toUpperCase() : '';

  const expandedRaw = [...rawSubjects];
  if (stream) {
    expandedRaw.push(stream);
  }

  const resultSet = new Set();

  expandedRaw.forEach(item => {
    if (!item || typeof item !== 'string') return;
    const upper = item.trim().toUpperCase();

    if (upper === 'PCM') {
      resultSet.add('Physics');
      resultSet.add('Chemistry');
      resultSet.add('Mathematics');
    } else if (upper === 'PCB') {
      resultSet.add('Physics');
      resultSet.add('Chemistry');
      resultSet.add('Biology');
    } else if (upper === 'PCMB') {
      resultSet.add('Physics');
      resultSet.add('Chemistry');
      resultSet.add('Mathematics');
      resultSet.add('Biology');
    } else {
      const norm = normalizeSubject(item, standard);
      if (allowedPool.includes(norm)) {
        resultSet.add(norm);
      }
    }
  });

  if (resultSet.size === 0) {
    return [...SENIOR_SUBJECTS];
  }

  return allowedPool.filter(sub => resultSet.has(sub));
};
