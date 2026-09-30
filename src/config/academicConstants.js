import { normalizeSubject as normalizeSubjectUtil, isSeniorStandard, getStudentAcademicSubjects } from '../utils/subjectUtils.js';

export const SUPPORTED_CLASSES = [
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '11th',
  '12th'
];

export const SUPPORTED_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Physics',
  'Chemistry',
  'Biology'
];

export const normalizeSubject = (subject, standard = '') => {
  return normalizeSubjectUtil(subject, standard);
};

export { isSeniorStandard, getStudentAcademicSubjects };
