/**
 * Utility functions for handling ID formats consistently across the system
 */

/**
 * Ensures the sourceId has the 'source:' prefix
 * @param {string} sourceId - The source ID with or without prefix
 * @returns {string} The source ID with 'source:' prefix
 */
function ensureSourceId(sourceId) {
    if (!sourceId) return sourceId;
    return sourceId.startsWith('source:') ? sourceId : `source:${sourceId}`;
}

/**
 * Ensures the accountId has the 'account:' prefix
 * @param {string} accountId - The account ID with or without prefix
 * @returns {string} The account ID with 'account:' prefix
 */
function ensureAccountId(accountId) {
    if (!accountId) return accountId;
    return accountId.startsWith('account:') ? accountId : `account:${accountId}`;
}

/**
 * Ensures the userId has the 'user:' prefix
 * @param {string} userId - The user ID with or without prefix
 * @returns {string} The user ID with 'user:' prefix
 */
function ensureUserId(userId) {
    if (!userId) return userId;
    return userId.startsWith('user:') ? userId : `user:${userId}`;
}

/**
 * Ensures the jobId has the 'job:' prefix
 * @param {string} jobId - The job ID with or without prefix
 * @returns {string} The job ID with 'job:' prefix
 */
function ensureJobId(jobId) {
    if (!jobId) return jobId;
    return jobId.startsWith('job:') ? jobId : `job:${jobId}`;
}

/**
 * Extracts the UUID part from a prefixed ID
 * @param {string} prefixedId - The ID with prefix (e.g., 'source:uuid')
 * @returns {string} The UUID without prefix
 */
function extractUuid(prefixedId) {
    if (!prefixedId) return prefixedId;
    const parts = prefixedId.split(':');
    return parts.length > 1 ? parts[1] : prefixedId;
}

module.exports = {
    ensureSourceId,
    ensureAccountId,
    ensureUserId,
    ensureJobId,
    extractUuid
};