export const MAIL = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  from: process.env.SMTP_FROM_EMAIL,
};
