'use strict';

const express = require('express');
const morgan = require('morgan');

const {logger} = require('./utilities/logger');
// these are custom errors we've created
const {FooError, BarError, BizzError} = require('./errors');
const {makeEmailAlertMiddleware} = require('./errorEmailAlerts');

const app = express();

// this route handler randomly throws one of `FooError`,
// `BarError`, or `BizzError`
const russianRoulette = (req, res) => {
  const errors = [FooError, BarError, BizzError];
  throw new errors[
    Math.floor(Math.random() * errors.length)]('It blew up!');
};


// note that `makeEmailAlertMiddleware` is a closure -- it returns a 
// middleware function
const emailAlertMiddleware = makeEmailAlertMiddleware([FooError, BarError]);

app.use(morgan('common', {stream: logger.stream}));

// for any GET request, we'll run our `russianRoulette` function
app.get('*', russianRoulette);

app.use(emailAlertMiddleware);
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({error: 'Something went wrong'});
});

app.listen(process.env.PORT || 8080, () => logger.info(
  `Your app is listening on port ${process.env.PORT || 8080}`));
