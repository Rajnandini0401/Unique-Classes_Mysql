// ==================================================
// TEACHER CONFIGURATION
// Temporary identification for development & testing
// (Until authentication is implemented)
// ==================================================

/**
 * Existing Teacher _id from MongoDB for development/testing:
 * Kishor Mane (_id: "6a95372b01c3466e881065b4")
 */
export const DEV_TEACHER_ID = '6a95372b01c3466e881065b4';

/**
 * Helper function to retrieve current active teacher ID.
 * When authentication is implemented later, this will return authenticatedTeacherId
 * without requiring changes to business logic or component files.
 */
export const getActiveTeacherId = () => {
  return null;
};
