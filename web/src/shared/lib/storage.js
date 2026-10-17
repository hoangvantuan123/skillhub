/**
 * Safe local storage wrapper for offline attempt answers caching
 */

const STORAGE_PREFIX = 'skillhub_';

export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('Error reading from localStorage', e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Error writing to localStorage', e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (e) {
      console.warn('Error removing from localStorage', e);
    }
  },

  // Save temporary answers for an active attempt
  saveAttemptAnswersDraft(attemptId, answers) {
    this.set(`attempt_${attemptId}_draft`, {
      answers,
      savedAt: new Date().toISOString(),
    });
  },

  getAttemptAnswersDraft(attemptId) {
    return this.get(`attempt_${attemptId}_draft`, null);
  },

  clearAttemptAnswersDraft(attemptId) {
    this.remove(`attempt_${attemptId}_draft`);
  },
};
