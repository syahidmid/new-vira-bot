/**
 * =============================================================================
 * getpost.js
 * =============================================================================
 * WordPress REST API - Get Posts
 * =============================================================================
 */

/**
 * Get posts from WordPress
 * @param {string} siteKey
 * @param {object} options
 */

function getPostsUI() {
    getPosts('INFOJATENGPOS', { per_page: 3 });
}


function getPosts(siteKey, options) {
    const site = getWordPressCredentials(siteKey);

    const params = Object.assign({
        per_page: 5,
        status: 'publish'
    }, options || {});

    const queryString = Object.keys(params)
        .map(k => `${k}=${encodeURIComponent(params[k])}`)
        .join('&');

    const url = site.baseUrl + '/wp-json/wp/v2/posts?' + queryString;

    const headers = {
        Authorization: 'Basic ' +
            Utilities.base64Encode(site.username + ':' + site.appPassword),
        Accept: 'application/json'
    };

    const res = UrlFetchApp.fetch(url, {
        method: 'get',
        headers,
        muteHttpExceptions: true
    });

    const status = res.getResponseCode();
    const body = res.getContentText();

    if (status !== 200) {
        Logger.log(body);
        throw new Error(`❌ WP API error ${status} (${site.siteKey})`);
    }

    const posts = JSON.parse(body);

    Logger.log(`✅ [${site.siteKey}] ${posts.length} posts retrieved`);

    posts.forEach((p, i) => {
        Logger.log(`${i + 1}. ${p.title.rendered} (${p.slug})`);
    });

    return posts;
}
