import { type NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import {header, footer} from '../../../../public/template/emailTemplate'
import {MAIL} from '@/config/mail'

export async function POST(request: NextRequest) {
    const {name, realtorEmail, info, fileUpload, fileName, userEmail} = await request.json();
    const transport = nodemailer.createTransport({
        ...MAIL,
      });
  

  const mailOptions: Mail.Options = {
    to: 'saziamakkar19@gmail.com',
    cc : [`${userEmail}`],
    subject: `Message from (${userEmail})`,
    html: `
    <body style="font-family: 'Arial', sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
      ${header} 
      <div class="review-info" style="padding: 20px; margin: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #fff;">
        ${info} 
        <hr style="border: 1px solid #ddd; margin-bottom: 20px;">
        <p style="font-size: 14px; color: #777;">This is an automated email. Please do not reply to this message.</p>
      </div>
      ${footer}
    </body>`,
  };

  if(fileUpload) {
    let attachments: any [] = []
    for(let i = 0; i < fileUpload.length; i++) {
      const content = fileUpload[i].split("base64,")[1]
      const name = fileName[i]
      attachments.push({
        filename: name,
        content: content,
        encoding: "base64",
      })   
    }

    mailOptions.attachments = attachments;
  }
  const sendMailPromise = () =>
    new Promise<string>((resolve, reject) => {
      transport.sendMail(mailOptions, function (err) {
        if (!err) {
          resolve('Email sent');
        } else {
          reject(err.message);
        }
      });
    });

  try {
    await sendMailPromise();
    return NextResponse.json({ message: 'Email sent' });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}