const Mailgun = require('mailgun.js').default;
const FormData = require('form-data');

// Your Mailgun API credentials
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const DOMAIN = 'sandbox4104537bb7e6480a99f650fedb08fcae.mailgun.org';

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({ username: 'api', key: MAILGUN_API_KEY });
console.log('Mailgun API Key:', MAILGUN_API_KEY);
console.log('Mailgun Domain:', DOMAIN);

module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { raiseEmail, raiseIssue, raiseName, raiseUrgent } = req.body;

      if (!raiseEmail || !raiseIssue || !raiseName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const subject = `Support Ticket [${requestId}] - ${raiseIssue}`;

      const emailBody = `
Hello ${raiseName},

Your support ticket has been raised with the following details:

- Request ID: ${requestId}
- Issue: ${raiseIssue}
- Urgency: ${raiseUrgent || 'Not specified'}

We’ll be reviewing your issue shortly and get back to you as soon as possible.

Thank you for contacting us!

Best regards,  
Support Team
`;

      const messageData = {
        from: 'Mailgun Sandbox <postmaster@sandbox4104537bb7e6480a99f650fedb08fcae.mailgun.org>',
        to: raiseEmail,
        subject: subject,
        text: emailBody,
      };

      const data = await mg.messages.create(DOMAIN, messageData);
      res.status(200).json({ message: 'Email sent successfully', data });
    } catch (error) {
      console.error('Mailgun Error:', error);
      res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};
