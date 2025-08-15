import { User } from '../models/User';

export class EmailTemplates {
  static getVerificationEmail(
    user: User,
    token: string,
    password?: string,
    invited: boolean = false
  ) {
    const companyName = user.company?.name;
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const subject = `Verify Your Email Address - ${companyName}`;
    console.log('Invited:', invited, 'Password:', password);

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Welcome to Our Platform! -${companyName}</h2>
        <p>Hi ${user.firstName},</p>
        <p>Thank you for registering!</p>
        <p>
  ${
    invited
      ? `The default password set is <strong>${password}</strong>.<br>It is recommended to change it after logging in.`
      : ''
  }
</p>
<p>

        Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}"
             style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
      
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${url}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
          If you didn't create an account, please ignore this email.
        </p>
      </div>
    `;
    const text = `Hi ${user.firstName}, verify your email: ${url}`;
    return { subject, html, text };
  }

  static getPasswordResetEmail(user: User, token: string) {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const subject = 'Password Reset Request';
    const html = `<p>Hi ${user.firstName},</p><p>Reset your password <a href="${url}">here</a>.</p>`;
    const text = `Hi ${user.firstName}, reset your password here: ${url}`;
    return { subject, html, text };
  }

  static getInvitationEmail(
    email: string,
    companyName: string,
    token: string,
    password: string,
    inviterName?: string
  ) {
    // const url = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const subject = `You're invited to join ${companyName}`;

    const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
      <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0; font-size: 28px;">You're Invited!</h1>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Join your team at ${companyName}</p>
        </div>

        <!-- Main Content -->
        <div style="margin-bottom: 30px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Hello,
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            ${inviterName ? `${inviterName} has invited you` : 'You have been invited'} to join <strong>${companyName}</strong> on our platform.
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            NOTE: Your default password is <strong>${password}</strong>. Please change it after logging in.
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Click the button below to accept your invitation and set up your account:
          </p>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${url}"
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 8px;
                    display: inline-block;
                    font-size: 16px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                    transition: all 0.3s ease;">
            Accept Invitation
          </a>
        </div>

        <!-- Alternative Link -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 30px 0;">
          <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; color: #007bff; font-size: 14px; margin: 0;">
            ${url}
          </p>
        </div>

        <!-- Important Info -->
        <div style="border-left: 4px solid #ffc107; padding: 15px; background: #fff3cd; margin: 20px 0;">
          <p style="color: #856404; margin: 0; font-size: 14px;">
            <strong>Important:</strong> This invitation will expire in 72 hours. Please accept it as soon as possible.
          </p>
        </div>

        <!-- What's Next -->
        <div style="margin: 30px 0;">
          <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">What happens next?</h3>
          <ul style="color: #666; font-size: 14px; line-height: 1.6; padding-left: 20px;">
            <li>Click the invitation link above</li>
            <li>Fill in your personal details</li>
            <li>Create a secure password</li>
            <li>Start collaborating with your team!</li>
          </ul>
        </div>

        <!-- Footer -->
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;">
        <div style="text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This invitation was sent to <strong>${email}</strong>
          </p>
          <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </div>
    </div>
  `;

    const text = `
You're invited to join ${companyName}!

${inviterName ? `${inviterName} has invited you` : 'You have been invited'} to join ${companyName} on our platform.

Accept your invitation: ${url}

This invitation will expire in 72 hours.

What's next?
1. Click the invitation link
2. Fill in your personal details
3. Create a secure password
4. Start collaborating with your team!

This invitation was sent to ${email}. If you didn't expect this invitation, you can safely ignore this email.
  `;

    return { subject, html, text };
  }

  static getAccountActivatedEmail(
    user: User,
    companyName: string,
    activatedBy?: string
  ) {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const subject = `Your account has been activated - ${companyName}`;

    const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
      <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #28a745; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px;">✓</span>
          </div>
          <h1 style="color: #333; margin: 0; font-size: 24px;">Account Activated!</h1>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">${companyName}</p>
        </div>

        <!-- Main Content -->
        <div style="margin-bottom: 30px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Hi ${user.firstName},
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Great news! Your account with <strong>${companyName}</strong> has been activated${activatedBy ? ` by ${activatedBy}` : ''}.
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            You can now access all platform features and start collaborating with your team.
          </p>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${loginUrl}"
             style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 8px;
                    display: inline-block;
                    font-size: 16px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
            Login to Your Account
          </a>
        </div>

        <!-- Footer -->
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;">
        <div style="text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            Welcome to the team! If you have any questions, contact your administrator.
          </p>
        </div>
      </div>
    </div>
  `;

    const text = `
Account Activated - ${companyName}

Hi ${user.firstName},

Your account with ${companyName} has been activated${activatedBy ? ` by ${activatedBy}` : ''}. You can now access all platform features.

Login here: ${loginUrl}

Welcome to the team!
  `;

    return { subject, html, text };
  }

  static getAccountSuspendedEmail(
    user: User,
    companyName: string,
    reason?: string,
    suspendedBy?: string
  ) {
    const contactUrl = `${process.env.FRONTEND_URL}/contact`;
    const subject = `Account suspended - ${companyName}`;

    const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
      <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #dc3545; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px;">⚠</span>
          </div>
          <h1 style="color: #333; margin: 0; font-size: 24px;">Account Suspended</h1>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">${companyName}</p>
        </div>

        <!-- Main Content -->
        <div style="margin-bottom: 30px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Hi ${user.firstName},
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Your account with <strong>${companyName}</strong> has been temporarily suspended${suspendedBy ? ` by ${suspendedBy}` : ''}.
          </p>
          ${
            reason
              ? `
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #721c24; margin: 0; font-size: 14px;">
              <strong>Reason:</strong> ${reason}
            </p>
          </div>
          `
              : ''
          }
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            During this time, you will not be able to access your account or platform features.
          </p>
        </div>

        <!-- Contact Info -->
        <div style="background: #e2e3e5; padding: 20px; border-radius: 5px; margin: 30px 0;">
          <h3 style="color: #333; font-size: 16px; margin: 0 0 10px 0;">Need to discuss this suspension?</h3>
          <p style="color: #666; font-size: 14px; margin: 0 0 15px 0;">
            If you believe this suspension was made in error or would like to discuss reinstatement, please contact your administrator.
          </p>
          <a href="${contactUrl}"
             style="background: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 14px;">
            Contact Support
          </a>
        </div>

        <!-- Footer -->
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;">
        <div style="text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            This notification was sent to <strong>${user.email}</strong>
          </p>
        </div>
      </div>
    </div>
  `;

    const text = `
Account Suspended - ${companyName}

Hi ${user.firstName},

Your account with ${companyName} has been temporarily suspended${suspendedBy ? ` by ${suspendedBy}` : ''}.

${reason ? `Reason: ${reason}` : ''}

During this time, you will not be able to access your account or platform features.

If you believe this suspension was made in error, please contact your administrator.

Contact support: ${contactUrl}
  `;

    return { subject, html, text };
  }

  static getRoleChangeEmail(
    user: User,
    companyName: string,
    newRoles: string[],
    previousRoles: string[],
    changedBy?: string
  ) {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const subject = `Your roles have been updated - ${companyName}`;

    const addedRoles = newRoles.filter((role) => !previousRoles.includes(role));
    const removedRoles = previousRoles.filter(
      (role) => !newRoles.includes(role)
    );
    const hasChanges = addedRoles.length > 0 || removedRoles.length > 0;

    const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
      <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #17a2b8; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px;">👤</span>
          </div>
          <h1 style="color: #333; margin: 0; font-size: 24px;">Roles Updated</h1>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">${companyName}</p>
        </div>

        <!-- Main Content -->
        <div style="margin-bottom: 30px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Hi ${user.firstName},
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Your roles within <strong>${companyName}</strong> have been updated${changedBy ? ` by ${changedBy}` : ''}.
          </p>
        </div>

        ${
          hasChanges
            ? `
        <!-- Role Changes -->
        <div style="margin: 30px 0;">
          ${
            addedRoles.length > 0
              ? `
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <h3 style="color: #155724; margin: 0 0 10px 0; font-size: 16px;">✅ Roles Added:</h3>
            <ul style="color: #155724; margin: 0; padding-left: 20px;">
              ${addedRoles.map((role) => `<li>${role}</li>`).join('')}
            </ul>
          </div>
          `
              : ''
          }

          ${
            removedRoles.length > 0
              ? `
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <h3 style="color: #721c24; margin: 0 0 10px 0; font-size: 16px;">❌ Roles Removed:</h3>
            <ul style="color: #721c24; margin: 0; padding-left: 20px;">
              ${removedRoles.map((role) => `<li>${role}</li>`).join('')}
            </ul>
          </div>
          `
              : ''
          }
        </div>
        `
            : ''
        }

        <!-- Current Roles -->
        <div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #004085; margin: 0 0 15px 0; font-size: 16px;">Your Current Roles:</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${newRoles
              .map(
                (role) => `
              <span style="background: #007bff; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                ${role}
              </span>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 40px 0;">
          <a href="${loginUrl}"
             style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
                    color: white;
                    padding: 16px 32px;
                    text-decoration: none;
                    border-radius: 8px;
                    display: inline-block;
                    font-size: 16px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);">
            Access Your Account
          </a>
        </div>

        <!-- Footer -->
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #eee;">
        <div style="text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            If you have questions about your new roles, contact your administrator.
          </p>
        </div>
      </div>
    </div>
  `;

    const text = `
Roles Updated - ${companyName}

Hi ${user.firstName},

Your roles within ${companyName} have been updated${changedBy ? ` by ${changedBy}` : ''}.

${
  addedRoles.length > 0
    ? `
Roles Added:
${addedRoles.map((role) => `- ${role}`).join('\n')}
`
    : ''
}

${
  removedRoles.length > 0
    ? `
Roles Removed:
${removedRoles.map((role) => `- ${role}`).join('\n')}
`
    : ''
}

Your Current Roles:
${newRoles.map((role) => `- ${role}`).join('\n')}

Login to your account: ${loginUrl}

If you have questions about your new roles, contact your administrator.
  `;

    return { subject, html, text };
  }
}
