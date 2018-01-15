'use strict';

const WelcomeController = require('./behaviours/welcome');

module.exports = {
  name: 'registration',
  baseUrl: '/',
  steps: {
    '/welcome': {
      next: '/egar/home',
      behaviours: WelcomeController
    }
  }
};
