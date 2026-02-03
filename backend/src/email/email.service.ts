import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private readonly fromEmail: string;

    constructor() {
        const gmailUser = process.env.GMAIL_USER;
        const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

        this.fromEmail = gmailUser || 'noreply@skillora.app';

        if (gmailUser && gmailAppPassword) {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: gmailUser,
                    pass: gmailAppPassword,
                },
            });
            console.log('✅ Email service configured with Gmail SMTP');
        } else {
            console.log('⚠️ Email service running in dev mode (no GMAIL_USER/GMAIL_APP_PASSWORD)');
            console.log('   Verification codes will be logged to console');
        }
    }

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

        return this.sendEmail(email, subject, html, code);
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

        return this.sendEmail(email, subject, html, code);
    }

    private async sendEmail(to: string, subject: string, html: string, code?: string): Promise<boolean> {
        // If no transporter configured, log to console (development mode)
        if (!this.transporter) {
            console.log('');
            console.log('╔════════════════════════════════════════════════════════════╗');
            console.log('║  📧 EMAIL (dev mode - Gmail not configured)                ║');
            console.log('╠════════════════════════════════════════════════════════════╣');
            console.log(`║  To: ${to.padEnd(52)}║`);
            console.log(`║  Subject: ${subject.padEnd(48)}║`);
            if (code) {
                console.log('╠════════════════════════════════════════════════════════════╣');
                console.log(`║  🔑 VERIFICATION CODE: ${code}                              ║`);
            }
            console.log('╚════════════════════════════════════════════════════════════╝');
            console.log('');
            return true;
        }

        try {
            await this.transporter.sendMail({
                from: `Skillora <${this.fromEmail}>`,
                to,
                subject,
                html,
            });
            console.log(`✅ Email sent to ${to}`);
            return true;
        } catch (error) {
            console.error('❌ Email send error:', error);
            return false;
        }
    }

    generateCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}
