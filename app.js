const express = require('express')
const path = require('path')
const logger = require('morgan')
const bodyParser = require('body-parser')
const cors = require('cors')
const expressValidator = require('express-validator')
const mongoose = require('mongoose')

const routes = require('./routes/index')
const users = require('./routes/users')

const app = express()

// Db Setup
if (process.env.NODE_ENV === 'development') {
  mongoose.connect('mongodb://127.0.0.1:voting/voting')
  console.log('connecting to local development mongo')
} else {
  // this is link to the mongolab addon from heroku
  mongoose.connect(process.env.MONGODB_URI)
}

mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.')
  process.exit(1)
})

// allow the promise use of mongoose
mongoose.Promise = global.Promise

app.use(logger('dev'))
// allow cross origin domain
app.use(cors({ exposedHeaders: ['access-token', 'expiry', 'uid'] }))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(expressValidator())

app.use('/', routes)
app.use('/users', users)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500)
    res.send({
      error: err,
      message: err.message
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500)
  res.send({
    message: err.message
  })
})


module.exports = app
