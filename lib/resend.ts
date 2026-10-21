import { Resend } from 'resend';

export async function sendDoctorApprovalEmail(params: {
  doctorEmail: string;
  doctorName: string;
  licenseNumber: string;
  specialty: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'CLINIC Credentialing <onboarding@resend.dev>';

  if (!apiKey) {
    console.log('[Resend Simulation] No RESEND_API_KEY provided. Approval email simulated for:', params.doctorEmail);
    return { success: true, messageId: 'simulated_' + Date.now() };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: params.doctorEmail,
      subject: '🎉 Congratulations! Your CLINIC Medical Practice is Approved',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background: #0d9488; padding: 32px 24px; text-align: center; color: white; }
            .content { padding: 32px 24px; line-height: 1.6; }
            .badge { display: inline-block; background: #ccfbf1; color: #0f766e; padding: 6px 14px; border-radius: 9999px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
            .cta-button { display: inline-block; background: #0d9488; color: white !important; font-weight: 600; padding: 14px 28px; border-radius: 12px; text-decoration: none; margin: 24px 0; }
            .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 26px; letter-spacing: -0.5px;">CLINIC Health</h1>
              <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Provider Credentialing Committee</p>
            </div>
            <div class="content">
              <span class="badge">✓ Medical License Verified</span>
              <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #0f172a;">Welcome, Dr. ${params.doctorName}!</h2>
              <p>We are delighted to notify you that your clinical credentials and medical council license (<strong>${params.licenseNumber}</strong>) have been officially approved by our administrative committee.</p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Specialty:</strong> ${params.specialty}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> Live & Available for Patient Triage</p>
                <p style="margin: 4px 0;"><strong>Public Directory:</strong> Listed on CLINIC Doctors Directory</p>
              </div>

              <p>Patients with matching symptoms can now connect with you immediately through our AI-assisted consultation chat.</p>

              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/doctor/dashboard" class="cta-button">Open Provider Consultation Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CLINIC Telemedicine Technologies Inc. All rights reserved.</p>
              <p>Confidential medical correspondence intended solely for Dr. ${params.doctorName}.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API returned error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error('Error dispatching Resend approval email:', err);
    return { success: false, error: err.message };
  }
}
