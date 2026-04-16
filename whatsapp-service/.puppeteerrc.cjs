module.exports = {
    cacheDirectory: process.env.PUPPETEER_CACHE_DIR || require('path').join(require('os').homedir(), '.cache', 'puppeteer'),
};
