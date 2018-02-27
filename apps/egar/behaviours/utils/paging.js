'use strict';

const _ = require('lodash');
const url = require('url');
const util = require('util');
const querystring = require('querystring');

module.exports = {

    /**
     * Gets an object that describes the current paging state of a collection
     * @param {number} numThings The number of items in the collection
     * @param {number} currentPage The current page number
     * @param {number} pageLength The length of a page
     * @param {http.IncomingMessage} req The paging request
     * @returns {Object} A object containing:
     *    @field {string} url The original search URL
     *    @field {boolean} showPreviousPage true if the 'previous' link should be shown, else false
     *    @field {number} previousPage The previous page number
     *    @field {boolean} showNextPage true if the 'next' link should be shown, else false
     *    @field {number} nextPage The next page number
     *    @field {string} pagingText The string of text to display which page is being shown
     *    @field {Array} pages An array of Objects containing:
     *        @field {number} pageNum The 0 based page number
     *        @field {number} displayPageNum The 1 based page number
     *
     */
    getPagingData(numThings, currentPage, pageLength, req) {
        let maxPageNum = Math.floor(numThings / pageLength);
        // if numThings equal pages*page length remove last page as will be empty
        if ((pageLength * maxPageNum) === numThings) {
            maxPageNum--;
        }
        const showPreviousPage = (currentPage === 0) ? true : false;
        const showNextPage = (currentPage === maxPageNum) ? true : false;
        const previousPage = (currentPage === 0) ? 0 : currentPage - 1;
        const nextPage = (currentPage === maxPageNum) ? maxPageNum : currentPage + 1;
        const start = numThings === 0 ? 0 : (currentPage * pageLength) + 1;
        let end = (currentPage * pageLength) + pageLength;
        if (end > numThings) {
            end = numThings;
        }
        const pagingText = util.format(req.translate('pagetext.pagingText'), start, end, numThings);

        let pages = [];
        for (var i = 0; i <= maxPageNum; i++) {
            let page = {
                pageNum: i,
                displayPageNum: i + 1
            };
            pages.push(page);
        }

        const u = url.parse(req.originalUrl).pathname;
        const pagelessQueryString = querystring.stringify(_.omit(req.query, ['p']));

        return {
            url: u,
            queryString: pagelessQueryString ? `${pagelessQueryString}&` : '',
            showPreviousPage: showPreviousPage,
            previousPage: previousPage,
            showNextPage: showNextPage,
            nextPage: nextPage,
            pagingText: pagingText,
            pages: pages
        };
    },

    /**
     * Gets the current page number from the request query string
     * @param {http.IncomingMessage} req The paging request
     * @returns {number} The page from the query string or 0 if the query string doesn't contain a valid page number
     */
    getCurrentPage(req) {
        let currentPage = req.query.p ? req.query.p : 0;
        if (isNaN(currentPage)) {
            currentPage = 0;
        }
        if (!(Number.isInteger(currentPage))) {
            currentPage = Math.floor(currentPage);
        }
        return currentPage;
    },

    /**
     * Gets the current page of data from an array of UUIDs
     * @param {Array} uuids An array of UUIDs to slice
     * @param {number} currentPage The current page number
     * @param {number} pageLength The length of a page
     * @returns {Array} The page of UUIDs
     */
    getUUIDSForCurrentPage(uuids, currentPage, pageLength) {
        const start = currentPage * pageLength;
        const end = start + pageLength;

        let pageUuids = _.slice(uuids, start, end);

        return pageUuids;
    }

};
