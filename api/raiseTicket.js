import Mailgun from 'mailgun.js';  // Correct import
import FormData from 'form-data';
// Your Mailgun API credentials
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY; // Ensure your Mailgun API key is set in your environment variables
const DOMAIN = 'sandbox4104537bb7e6480a99f650fedb08fcae.mailgun.org'; // Replace with your actual Mailgun domain

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({ username: 'api', key: MAILGUN_API_KEY });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Extract data from the request body sent by Watsonx Assistant
      const { raiseEmail, raiseName, raiseIssue, raiseUrgent } = req.body;

      // Check if all required fields are present
      if (!raiseEmail || !raiseName || !raiseIssue) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Generate a unique request ID using UUID
      const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      // Set the email subject based on the issue and include the Request ID
      const subject = `Support Ticket [${requestId}] - ${raiseIssue}`;

      // Compose the email body
      let emailBody = `
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

      // Compose the message
      const messageData = {
        from: 'Support <postmaster@sandbox4104537bb7e6480a99f650fedb08fcae.mailgun.org>', // Use a verified sender email from Mailgun
        to: raiseEmail,  // The recipient email (user's email)
        subject: subject,  // Dynamic subject with Request ID
        text: emailBody,  // Email body including the Request ID
      };

      // Send the email via Mailgun
      const data = await mg.messages.create(DOMAIN, messageData);

      // Respond back with success
      res.status(200).json({ message: 'Email sent successfully', data });
    } catch (error) {
      // Handle any errors that occur during email sending
      console.error(error);
      res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
  } else {
    // If the method is not POST, return a Method Not Allowed error
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
