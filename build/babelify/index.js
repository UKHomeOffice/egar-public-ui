'use strict';

/**
 * hof-build doesn't expose settings for browserify to allow babelify transform
 * to be introduced, so this lib replicates the work done there and adds babelify
 */
const browserify = require('browserify');
const fs = require('fs');
const path = require('path');
const minify = require('./compress');

const mkdirp = require('mkdirp');

const mkdir = (file) => {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(file);
        mkdirp(dir, err => {
            return err ? reject(err) : resolve();
        });
    });
};

module.exports = config => {

    const out = path.resolve(process.cwd(), config.browserify.out);

    return mkdir(out)
        .then(() => {
            return new Promise((resolve, reject) => {
                const bundler = browserify(config.browserify.src);
                if (config.theme) {
                    bundler.transform(require('aliasify'), {
                        aliases: {
                            '$$theme': `hof-theme-${config.theme}`
                        }
                    }).transform('babelify', { presets: ['env'] });
                }
                let stream = bundler.bundle();
                if (config.browserify.compress || config.production) {
                    stream = stream.pipe(minify());
                }
                stream = stream.pipe(fs.createWriteStream(out));

                stream.on('finish', resolve).on('error', reject);
            });
        });
};
