#!/usr/bin/env node
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var program = _interopDefault(require('commander'));
var fs = require('fs');
var path = require('path');

var version = JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json"), "utf-8")).version;
program
    .version(version)
    .command("import [open-api-file]", "generate restful-react type-safe components from OpenAPI specs")
    .parse(process.argv);
