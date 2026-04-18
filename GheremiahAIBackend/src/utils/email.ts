import nodemailer from 'nodemailer';


export async function sendVerificationEmail(email: string, token: string) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    
    const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/auth/verify-email?token=${token}`;
    
    const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@gheremiah.ai',
        to: email,
        subject: 'Verify your Gheremiah AI account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to Gheremiah AI!</h2>
                <p style="color: #666;">Thank you for registering. Please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
                </div>
                <p style="color: #666;">Or copy and paste this link into your browser:</p>
                <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
}
