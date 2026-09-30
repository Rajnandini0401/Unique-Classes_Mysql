/**
 * Photo & Image Utilities for Unique Classes Application.
 * Standardizes photo URL construction and fallback handling across Header & Profile pages.
 */

export const DEFAULT_TEACHER_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';
export const DEFAULT_STUDENT_AVATAR = '';

/**
 * Returns a fully-qualified image URL for any relative or absolute upload path.
 * @param {string} photo - The raw photo string from MongoDB.
 * @param {string} [fallback=''] - Optional fallback URL when photo is empty.
 * @returns {string} Fully qualified image URL or fallback.
 */
export const getPhotoUrl = (photo, fallback = '') => {
  if (!photo || typeof photo !== 'string' || !photo.trim()) {
    return fallback;
  }

  const clean = photo.trim();

  // If already absolute URL or Data URL (base64)
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image')) {
    return clean;
  }

  // If relative upload path (e.g., /uploads/students/filename.jpg)
  const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:5000/api';
  const backendOrigin = apiBase.replace(/\/api\/?$/, '');
  const pathPrefix = clean.startsWith('/') ? '' : '/';

  return `${backendOrigin}${pathPrefix}${clean}`;
};

/**
 * Returns a fully-qualified image URL for a given teacher photo field.
 * @param {string} photo - The raw photo string from MongoDB (base64, relative URL, or absolute URL).
 * @returns {string} Fully qualified image URL or fallback.
 */
export const getTeacherPhotoUrl = (photo) => {
  return getPhotoUrl(photo, DEFAULT_TEACHER_AVATAR);
};

/**
 * Returns a fully-qualified image URL for a given student photo field.
 * @param {string} photo - The raw photo string from MongoDB.
 * @returns {string} Fully qualified image URL or empty string.
 */
export const getStudentPhotoUrl = (photo) => {
  return getPhotoUrl(photo, '');
};

/**
 * Handles image load errors gracefully by switching to fallback avatar or calling custom handler.
 * @param {Event} event - The img onError event.
 * @param {string} [customFallback=''] - Optional custom fallback URL.
 */
export const handleImageError = (event, customFallback = '') => {
  if (event && event.target) {
    const src = event.target.src;
    console.warn(`[Photo Load Warning] Image load failed for: ${src.slice(0, 80)}...`);
    event.target.onerror = null; // Prevent infinite fallback loops
    if (customFallback) {
      event.target.src = customFallback;
      event.target.style.display = 'block';
    } else if (DEFAULT_TEACHER_AVATAR && src !== DEFAULT_TEACHER_AVATAR) {
      event.target.src = DEFAULT_TEACHER_AVATAR;
      event.target.style.display = 'block';
    } else {
      event.target.style.display = 'none';
      if (event.target.parentElement) {
        const fallbackContainer = event.target.parentElement.querySelector('.photo-fallback');
        if (fallbackContainer) {
          fallbackContainer.style.display = 'flex';
        }
      }
    }
  }
};

