'use strict';
/* globals window, document, fetch */

/**
 * Provides progressive enhancement of input elements,
 * allowing the autocomplete mixin to gracefully degrade to a text input
 * (it only supports degrading to a select element out-of-the-box)
 * @param {Object} configurationOptions See https://github.com/alphagov/accessible-autocomplete for config options
 */
const enhanceInputElement = function enhanceInputElement(configurationOptions) {
    if (!configurationOptions.element) {
        throw new Error('element is not defined');
    }

    const enhancedElement = configurationOptions.element;

    // Set defaults.
    if (configurationOptions.name === undefined) {
        configurationOptions.name = '';
    }
    if (configurationOptions.id === undefined) {
        if (configurationOptions.element.id === undefined) {
            configurationOptions.id = '';
        } else {
            configurationOptions.id = configurationOptions.element.id;
        }
    }
    if (configurationOptions.autoselect === undefined) {
        configurationOptions.autoselect = true;
    }

    if (enhancedElement.value || configurationOptions.defaultValue === undefined) {
        configurationOptions.defaultValue = enhancedElement.value;
    }

    const element = document.createElement('span');

    enhancedElement.parentNode.insertBefore(element, configurationOptions.element);
    configurationOptions.element = element;

    window.HOF.accessibleAutocomplete(configurationOptions);

    enhancedElement.style.display = 'none';
    enhancedElement.id += '-input';
};

/**
 * Required by the autocomplete mixin. Called to enhance an element to make it an autocomplete box.
 * @param {string} id The id of the element to enhance.
 * @param {boolean} fallbackSelect true if the fallback is a select element, else false.
 * @param {number} minLength The number of characters that need to be entered before searching for options.
 * @param {string} searchUri The uri under /search that the component will make a REST request to for options
 *                           if none have been provided.
 * @param {boolean} showAllValues true if the control should act like a dropdown, else false
 * @param {Array} options (Optional) a fixed set of options for the control.
 */
/* eslint-disable max-params */
const enhance = function enhance(id, fallbackSelect, minLength, searchUri, showAllValues, options) {
    var accessibleAutocomplete = window.HOF.accessibleAutocomplete;
    var enhanceElement = accessibleAutocomplete &&
        (fallbackSelect ? accessibleAutocomplete.enhanceSelectElement : accessibleAutocomplete.enhanceInputElement);

    if (enhanceElement) {
        var config = {
            selectElement: document.querySelector('#' + id),
            element: document.querySelector('#' + id),
            name: `${id}-autocomplete`,
            minLength: minLength,
            showAllValues: showAllValues,
            source: searchUri ? function getOptions(search, cb) {
                fetch('/search/' + searchUri + '?code=' + search)
                    .then(function gotResponse(response) {
                        return response.json();
                    })
                    .then(function decodedResponse(json) {
                        if (json && json.options) {
                            cb(json.options);
                        }
                    });
            } : options
        };

        enhanceElement(config);
    }
};
/* eslint-enable max-params */

module.exports = window => {
    window.HOF = {
        accessibleAutocomplete: require('accessible-autocomplete')
    };
    window.HOF.accessibleAutocomplete.enhanceInputElement = enhanceInputElement;
    window.HOF.accessibleAutocomplete.enhance = enhance;
};
