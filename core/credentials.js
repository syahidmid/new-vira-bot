/**
 * =============================================================================
 * credential.js
 * =============================================================================
 * WordPress credentials manager (multi-site)
 * Uses Script Properties
 * =============================================================================
 */

/**
 * Get raw Script Property
 */
function getProperty(key) {
    return PropertiesService
        .getScriptProperties()
        .getProperty(key);
}

/**
 * Get default siteKey (optional)
 */
function getDefaultSiteKey() {
    return getProperty('WP_DEFAULT_SITE') || '';
}

/**
 * Get WordPress credentials by siteKey
 * @param {string} siteKey
 */
function getWordPressCredentials(siteKey) {
    const finalSiteKey = siteKey || getDefaultSiteKey();

    if (!finalSiteKey) {
        throw new Error('❌ siteKey is required');
    }

    const prefix = 'WP_' + finalSiteKey.toUpperCase() + '_';

    const baseUrl = getProperty(prefix + 'URL') || '';
    const username = getProperty(prefix + 'USER') || '';
    const appPassword = getProperty(prefix + 'PASS') || '';

    if (!baseUrl || !username || !appPassword) {
        throw new Error(`❌ Incomplete credentials for site: ${finalSiteKey}`);
    }

    return {
        siteKey: finalSiteKey,
        baseUrl,
        username,
        appPassword
    };
}
