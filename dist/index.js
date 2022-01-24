
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./react-query-openapi.cjs.production.min.js')
} else {
  module.exports = require('./react-query-openapi.cjs.development.js')
}
