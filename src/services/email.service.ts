import nodemailer from 'nodemailer';
import { emailQueue } from '../config/queue.config';
import { User } from '../models/User';
import { EmailTemplates } from '../utils/EmailTemplates';

// Email service setup
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE != 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  // debug: true, // Enable debug logs
  // logger: true, // Enable logger
});

// Test the connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP connection failed:', error);
  } else {
    console.log('✅ SMTP server ready', success);
  }
});
export class EmailService {
  static async sendVerificationEmail(
    user: User,
    token: string,
    defaultPassword?: string,
    invited: boolean = false,

    useQueue = true
  ) {
    const { subject, html, text } = EmailTemplates.getVerificationEmail(
      user,
      token,
      defaultPassword,
      invited
    );
    return this.dispatchEmail(user.email, subject, html, text, useQueue);
  }

  static async sendPasswordResetEmail(
    user: User,
    token: string,
    useQueue = true
  ) {
    const { subject, html, text } = EmailTemplates.getPasswordResetEmail(
      user,
      token
    );
    return this.dispatchEmail(user.email, subject, html, text, useQueue);
  }

  static async sendInvitationEmail(
    email: string,
    companyName: string,
    token: string,
    password: string,
    inviterName?: string,
    useQueue = true
  ) {
    const { subject, html, text } = EmailTemplates.getInvitationEmail(
      email,
      companyName,
      token,
      password,
      inviterName
    );
    return this.dispatchEmail(email, subject, html, text, useQueue);
  }

  static async sendAccountSuspensionEmail(user: User, useQueue = true) {
    const { subject, html, text } = EmailTemplates.getAccountSuspendedEmail(
      user,
      user.company?.name
    );
    return this.dispatchEmail(user.email, subject, html, text, useQueue);
  }

  static async sendAccountActivationEmail(user: User, useQueue = true) {
    const { subject, html, text } = EmailTemplates.getAccountActivatedEmail(
      user,
      user.company?.name
    );
    return this.dispatchEmail(user.email, subject, html, text, useQueue);
  }

  static async sendRoleUpdateEmail(
    user: User,
    previousRoles: string[],
    newRoles: string[],
    useQueue = true
  ) {
    const { subject, html, text } = EmailTemplates.getRoleChangeEmail(
      user,
      user.company?.name,
      newRoles,
      previousRoles
    );
    return this.dispatchEmail(user.email, subject, html, text, useQueue);
  }

  static async sendWelcomeEmail(user: User): Promise<void> {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Welcome to Our Platform!</h2>
        <p>Hi ${user.firstName},</p>
        <p>Your email has been verified successfully! You can now access all features of your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard"
             style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p>If you have any questions, feel free to contact our support team.</p>
      </div>
    `;

    await this.dispatchEmail(
      user.email,
      'Welcome! Your Account is Ready',
      html
    );
  }

  static async dispatchEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
    useQueue = true
  ) {
    if (useQueue) {
      return await emailQueue.add('send-email', { to, subject, html, text });
    }

    return await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER!,
      to,
      subject,
      html,
      text,
    });
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    try {
      await transporter.sendMail({
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        ...options,
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(user: User, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Welcome to Our Platform!</h2>
        <p>Hi ${user.firstName},</p>
        <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          If you didn't create an account, please ignore this email.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      html,
      text: `Welcome! Please verify your email by visiting: ${verificationUrl}`,
    });
  }

  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${user.firstName},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          If you didn't request this, please ignore this email. Your password won't be changed.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html,
      text: `Reset your password by visiting: ${resetUrl}`,
    });
  }

  async sendWelcomeEmail(user: User): Promise<void> {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Welcome to Our Platform!</h2>
        <p>Hi ${user.firstName},</p>
        <p>Your email has been verified successfully! You can now access all features of your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard"
             style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p>If you have any questions, feel free to contact our support team.</p>
      </div>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'Welcome! Your Account is Ready',
      html,
    });
  }

  async sendLoginNotification(
    user: User,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">New Login Detected</h2>
        <p>Hi ${user.firstName},</p>
        <p>We detected a new login to your account:</p>
        <ul>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
          <li><strong>IP Address:</strong> ${ipAddress}</li>
          <li><strong>Device:</strong> ${userAgent}</li>
        </ul>
        <p>If this was you, no action is needed.</p>
        <p>If you don't recognize this login, please change your password immediately and contact support.</p>
      </div>
    `;

    await this.sendEmail({
      to: user.email,
      subject: 'New Login to Your Account',
      html,
    });
  }
}
