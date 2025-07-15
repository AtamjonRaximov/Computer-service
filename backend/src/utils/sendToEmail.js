import nodemailer from 'nodemailer';


export const sendToEmail = async (email, subject, text) => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'raximovatam999@gmail.com',
          pass: 'awpxvfotznwfftye', 
        },
      });
  
      const mailOptions = {
        from: 'raximovatam999@gmail.com',
        to: email,
        subject: subject,
        text:text,
      };
  
      const info = await transporter.sendMail(mailOptions);
      console.log('Xabar yuborildi:', info.response);
    } catch (error) {
      console.error('Xatolik:', error);
    }
  };
  