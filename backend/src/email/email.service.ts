import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
    private readonly resendApiKey = process.env.RESEND_API_KEY;
    private readonly fromEmail = process.env.EMAIL_FROM || 'Skillora <noreply@skillora.app>';

    async sendVerificationEmail(email: string, code: string, name?: string): Promise<boolean> {
        const subject = 'Verify your Skillora account';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #3B82F6;">Welcome to Skillora${name ? `, ${name}` : ''}!</h1>
                <p>Thank you for signing up. Please verify your email address by entering this code:</p>
                <div style="background: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1F2937;">${code}</span>
                </div>
                <p style="color: #6B7280;">This code expires in 15 minutes.</p>
                <p style="color: #6B7280;">If you didn't create an account, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                <p style="color: #9CA3AF; font-size: 12px;">Skillora - AI-Powered Resume Analysis</p>
            </div>
        `;

        return this.sendEmail(email, subject, html);
    }

    async sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
        const subject = 'Reset your Skillora password';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #3B82F6;">Password Reset Request</h1>
                <p>We received a request to reset your password. Enter this code to set a new password:</p>
                <div style="background: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1F2937;">${code}</span>
                </div>
                <p style="color: #6B7280;">This code expires in 15 minutes.</p>
                <p style="color: #6B7280;">If you didn't request a password reset, you can safely ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                <p style="color: #9CA3AF; font-size: 12px;">Skillora - AI-Powered Resume Analysis</p>
            </div>
        `;

        return this.sendEmail(email, subject, html);
    }

    private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        // If no API key, log to console (development mode)
        if (!this.resendApiKey) {
            console.log('========================================');
            console.log('EMAIL (dev mode - no RESEND_API_KEY set)');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log('----------------------------------------');
            // Extract code from HTML for easy testing
            const codeMatch = html.match(/letter-spacing: 8px[^>]*>(\d{6})</);
            if (codeMatch) {
                console.log(`VERIFICATION CODE: ${codeMatch[1]}`);
            }
            console.log('========================================');
            return true;
        }

        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.resendApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: this.fromEmail,
                    to: [to],
                    subject,
                    html,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Failed to send email:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Email send error:', error);
            return false;
        }
    }

    generateCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}
