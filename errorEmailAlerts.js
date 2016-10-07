'use strict';

const mailJet = require('node-mailjet');

const {logger} = require('./utilities/logger');

const {
  MAILJET_KEY, MAILJET_SECRET, ALERT_FROM_EMAIL, ALERT_FROM_NAME,
  ALERT_TO_EMAIL} = process.env;

// we log some errors if these env vars aren't set
if (!(
  MAILJET_KEY && MAILJET_SECRET && ALERT_FROM_EMAIL && ALERT_FROM_NAME &&
  ALERT_TO_EMAIL)) {
  logger.error('Missing required config var in `.env`');
}

// send an alert email with subject and body to recipients.
// This function takes `MAILJET_KEY` and `MAILJET_SECRET` from
// enclosing scope.
const sendAlertEmail = (subject, body, recipientEmails) => {
  // https://github.com/mailjet/mailjet-apiv3-nodejs#have-fun-
  const mailer = mailJet.connect(MAILJET_KEY, MAILJET_SECRET);
  const data = {
    'FromName': ALERT_FROM_NAME,
    'FromEmail': ALERT_FROM_EMAIL,
    'Subject': subject,
    'Text-part': body,
    'Recipients': recipientEmails.map(email => ({'Email': email}))
  };
  
  mailer
    .post('send')
    .request(data)
    .then(() => logger.info(
      `SUCCESS: \`sendAlertEmail\` sent email to ${recipientEmails.join(', ')}`))
    .catch((e) => logger.error(`FAILURE: problem sending email. ${e.message}`));
};

// this is a closure that creates a middleware function bound to `errorTypes`,
// which is an array of error objects
const makeEmailAlertMiddleware = (errorTypes) => (err, req, res, next) => {
  // if the `err` is one of the `errorTypes` we specified,
  // send an alert email
  if ((errorTypes).find(eType => err instanceof eType) !== undefined) {
    logger.info(`Attempting to send error alert email to ${ALERT_TO_EMAIL}`);
    const subject = `SERVICE ALERT: ${err.name}`;
    const body = `Something went wrong. Here's what we know: \n\n${err.message}`;
    sendAlertEmail(subject, body, [ALERT_TO_EMAIL]);
  }
  // this causes the error to be passed to additional middleware functions
  next(err);
};

module.exports = {makeEmailAlertMiddleware};
