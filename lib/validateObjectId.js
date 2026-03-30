import mongoose from "mongoose";

/**
 * Validate if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid MongoDB ObjectId format
 */
export function isValidObjectId(id) {
  if (!id || typeof id !== "string") return false;
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Safely parse and validate MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {object} { isValid: boolean, id: string|null, error: string|null }
 */
export function validateObjectId(id) {
  if (!id) {
    return {
      isValid: false,
      id: null,
      error: "ID is required",
    };
  }

  if (typeof id !== "string") {
    return {
      isValid: false,
      id: null,
      error: `Invalid ID type: expected string, got ${typeof id}`,
    };
  }

  if (id.length !== 24) {
    return {
      isValid: false,
      id,
      error: `Invalid ID format: expected 24 characters, got ${id.length}`,
    };
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return {
      isValid: false,
      id,
      error: "Invalid MongoDB ObjectId format",
    };
  }

  return {
    isValid: true,
    id,
    error: null,
  };
}

/**
 * Log when an ID validation fails (useful for debugging)
 * @param {string} context - Where this is being called from
 * @param {string} id - The ID that failed
 * @param {object} validation - Result from validateObjectId()
 */
export function logValidationError(context, id, validation) {
  console.warn(`[${context}] ID Validation Failed:`, {
    receivedId: id,
    ...validation,
  });
}
