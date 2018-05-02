const functions = require('firebase-functions');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

module.exports.configure = configure;

const _defaultConfig = {
    unless: {},
    infusionsoft: {
        cas: {
            requests_per_minute: 5,
            url: 'https://signin.infusionsoft.com'
        }
    }
};

/**
 * Parse JWT Authorization Bearer tokens `req.user`.
 *
 * @param {express} [app] An express application instance.
 * @param {Object} [config]
 * @return {Function}
 * @public
 */

function configure(app, config) {
    console.log('config', config);

    let firebaseConfig = functions.config();
    console.log('firebaseConfig', firebaseConfig);

    let resolvedConfig = Object.assign(_defaultConfig, config, firebaseConfig);
    console.log('resolvedConfig', resolvedConfig);

    app.use(_jwt(resolvedConfig).unless(resolvedConfig.unless));

    app.use(function (err, req, res, next) {
        if (err.name === 'UnauthorizedError') {
            res.status(401).send({error: 'Invalid Token'});
        }
    });
}

function _jwt(resolvedConfig) {
    let jwksUri = `${resolvedConfig.infusionsoft.cas.url}/jwt/keys`;

    let config = {
        secret: jwksRsa.expressJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: resolvedConfig.infusionsoft.cas.requests_per_minute,
            jwksUri: jwksUri
        }),
        algorithms: ['RS256']
    };

    return jwt(config);
}
