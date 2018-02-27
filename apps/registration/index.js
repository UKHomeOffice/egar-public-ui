'use strict';

const SignOutController = require('./behaviours/sign-out');

module.exports = {
  name: 'registration',
  baseUrl: '/',
  steps: {
    '/welcome': {
      next: '/egar/home'
    },
    '/sign-out': {
      backLink: './welcome',
      next: '/egar/home',
      behaviours: SignOutController
    }
  }
};
