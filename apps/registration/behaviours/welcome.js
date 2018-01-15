'use strict';

module.exports = WelcomeController => class extends WelcomeController {
    constructor(options) {
        super(options);
        this.$className = 'WelcomeController';
    }

    /**
     * Performs configuration before the request is processed
     * @param {http.IncomingMessage} req The incoming request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     * @param {Function} next The function to call after configure
     */
    configure(req, res, next) {
        if (req.query && req.query.s === '1') {
            // s=1 means the user has been redirected from signout, clear the session
            req.session.destroy();
            res.clearCookie('hof-wizard-sc');
            res.clearCookie('egar-public-ui.hof.sid');
            this.log.debug(`Old Session ID: ${req.signedCookies['egar-public-ui.hof.sid']}`);
            res.redirect(303, '/welcome?n=1');
        } else if (req.query && req.query.n === '1') {
            // n=1 means the user has been redirected after the previous session was cleared
            // redirect a final time to strip the query string from the browser
            req.sessionModel.set('signedOut', true);
            res.redirect(303, '/welcome');
        } else {
            this.log.debug(`New Session ID: ${req.signedCookies['egar-public-ui.hof.sid']}`);
            next();
        }
    }

    /**
     * Sets locals before render
     * @param {http.IncomingMessage} req The GET request
     * @param {http.ServerResponse} res The response that will be sent to the browser
     */
    locals(req, res) {
        const locals = super.locals(req, res);

        if (req.sessionModel.get('signedOut')) {
            // Assign signedOut state to locals so that a signed out banner can be displayed
            req.sessionModel.set('signedOut', false);
            locals.signedOut = true;
        }

        return locals;
    }
};
