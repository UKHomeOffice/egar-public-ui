'use strict';

module.exports = key => ({
  [`${key}-hour`]: {
    label: 'Hour'
  },
  [`${key}-minute`]: {
    label: 'Minute'
  },
  [`${key}-second`]: {
    label: 'Second'
  }
});
