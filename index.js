var eslint = require('eslint');
var through = require('through');
var error = console.error.bind(console);

function lint(file, options) {
    options = options || {};

    var cli = new eslint.CLIEngine(options);
    var formatter = cli.getFormatter(options.formatter || require.resolve('eslint-friendly-formatter'));
    var data = '';

    function write(buf) {
        data += buf;
    }

    function end() {
        var results = cli.executeOnText(data, file).results;

        if (results.length && results.some(function (r) { return r.errorCount || r.warningCount; })) {
            error(formatter(results));
        }

        var errorResults = eslint.CLIEngine.getErrorResults(results);
        if (errorResults.length && !options.continuous) {
            this.emit('error', 'eslintify: linting error(s) detected.');
        }

        this.queue(data);
        this.queue(null);
    }

    if (typeof file !== 'string' || file.lastIndexOf('.') === -1) {
        return through();
    }

    var givenExtension = file.slice(file.lastIndexOf('.') + 1, file.length);
    var supportedExtensions = ['js', 'jsx', 'es6'];

    if (options.extension) { supportedExtensions = supportedExtensions.concat(options.extension); }
    if (options.extensions) { supportedExtensions = supportedExtensions.concat(options.extensions); }

    if (supportedExtensions.indexOf(givenExtension) !== -1) {
        return through(write, end);
    }

    return through();
}

module.exports = lint;
