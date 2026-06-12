require('dotenv').config();
const { createTransport } = require('nodemailer');

const requiredKeys = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
const missingKeys = requiredKeys.filter((key) => !process.env[key]);

if (missingKeys.length > 0) {
  console.error(`Missing email environment keys: ${missingKeys.join(', ')}`);
  process.exit(1);
}

const transporter = createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const to = process.env.EMAIL_TEST_TO || process.env.EMAIL_USER;
const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

async function main() {
  await transporter.verify();
  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Sohojogi backend email check',
    text: 'Backend email functionality is working.',
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
        messageId: info.messageId,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        code: error.code,
        responseCode: error.responseCode,
        command: error.command,
        response: error.response,
        message: error.message,
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
