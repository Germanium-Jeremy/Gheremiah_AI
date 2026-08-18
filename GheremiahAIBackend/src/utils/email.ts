import { Resend } from 'resend';

export async function sendVerificationEmail(email: string, token: string) {
    // Initialize Resend client within the function to ensure env vars are loaded
    const resend = new Resend(process.env.RESEND_API_KEY || '');

    const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/auth/verify-email?token=${token}`;

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.SMTP_FROM || 'noreply@gheremiah.ai',
            to: [email],
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
        });

        if (error) {
            console.error('Resend API Error:', error);
            throw new Error(error.message);
        }

        console.log(`Verification email sent to ${email} via Resend. ID: ${data?.id}`);
    } catch (error) {
        console.error('Error sending verification email via Resend:', error);
        throw error;
    }
}
