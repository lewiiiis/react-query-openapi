
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./restful-react.cjs.production.min.js')
} else {
  module.exports = require('./restful-react.cjs.development.js')
}
