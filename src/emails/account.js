const sgMail = require('@sendgrid/mail');


const myEmail = 'pelegadiv5@gmail.com';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (name, email) => {
   sgMail.send({
       to: email,
       from: myEmail,
       subject: 'Thanks for joining us!',
       text: `Welcome to the app, ${name}. We hope you will enjoy it!`
   })
};

const sendCancelationEmail = (name, email) => {
    sgMail.send({
        to: email,
        from: myEmail,
        subject: "It's a shame that you left :(",
        text: `We will miss you, ${name}. We hope to see you again soon!`
    })
 };



module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}