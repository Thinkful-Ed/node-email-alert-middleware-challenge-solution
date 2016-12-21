const express = require('express');
const morgan = require('morgan');
// this will load our .env file if we're
// running locally. On Gomix, .env files
// are automatically loaded.
require('dotenv').config();

const {ALERT_FROM_EMAIL, ALERT_FROM_NAME, ALERT_TO_EMAIL} = process.env;
const {logger} = require('./utilities/logger');
const {sendEmail} = require('./emailer');

// these are custom errors we've created
const {FooError, BarError, BizzError} = require('./errors');

const app = express();

// this route handler randomly throws one of `FooError`,
// `BarError`, or `BizzError`
const russianRoulette = (req, res) => {
  const errors = [FooError, BarError, BizzError];
  throw new errors[
    Math.floor(Math.random() * errors.length)]('It blew up!');
};


app.use(morgan('common', {stream: logger.stream}));

// for any GET request, we'll run our `russianRoulette` function
app.get('*', russianRoulette);


const doErrorEmailAlerts = (err, req, res, next) => {
  // if it's an error we care about send a message
  if (err instanceof FooError || err instanceof BarError) {
    logger.info(`Attempting to send error alert email to ${ALERT_TO_EMAIL}`);

    const emailData = {
      from: ALERT_FROM_EMAIL,
      to: ALERT_TO_EMAIL,
      subject: `SERVICE ALERT: ${err.name}`,
      text: `Something went wrong. Here's what we know:\n\n${err.stack}`
    };
    sendEmail(emailData);
  }
  // always want to call next to pass control to next
  // middleware function
  next();
}

app.use(doErrorEmailAlerts);

// log error and send 500 to client
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({error: 'Something went wrong'}).end();
});

const port = process.env.PORT || 8080;

const listener = app.listen(port, function () {
  logger.info(`Your app is listening on port ${port}`);
});
