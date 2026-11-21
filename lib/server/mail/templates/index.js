/**
 * E-mail templates. EVERY dynamic value goes through `esc()` (HTML-escaped),
 * so user-controlled names / mess names cannot inject markup into mails.
 * Visual structure and wording are unchanged from the original mails.
 */
import { escapeHtml as esc, safeUrl } from "../../security/escapeHtml.js";
import { getEnv } from "../../config/env.js";

const wrap = (inner, { maxWidth = "", border = false } = {}) => `
<div style="font-family: Arial, sans-serif; padding: 22px; background: #f5f5f5;">
  <div style="${maxWidth ? `max-width: ${maxWidth}; margin: 0 auto; ` : ""}background: white; padding: 20px; border-radius: 8px;${border ? " border: 1px solid #e5e5e5;" : ""}">
    ${inner}
  </div>
</div>`;

const signature = `<p>Best regards,<br/>MessMate Support</p>`;
const teamSignature = `<p style="margin-top: 20px;">Regards,<br/><b>MessMate Support Team</b></p>`;

export const appBaseUrl = () => getEnv().baseUrl || "";

export function passwordResetMail({ name, link }) {
  const url = safeUrl(link);
  return {
    subject: "Password Reset Request - MessMate",
    html: wrap(`
      <h2>Password Reset</h2>
      <p>Hello <b>${esc(name || "User")}</b>,</p>
      <p>Click the button below to reset your password:</p>
      <a href="${esc(url)}" style="background: #0d6efd; color: white; padding: 10px 20px; display: inline-block; border-radius: 5px; text-decoration: none;">Reset Password</a>
      <p>If the button doesn't work, use the link below:</p>
      <p>${esc(url)}</p>
      <p>This link is valid for <b>1 hour</b>.</p>
      <p>If you did not request this, you can safely ignore this e-mail.</p>`),
  };
}

export function accountBlockedMail({ name }) {
  return {
    subject: "Blocking Account  - MessMate",
    html: wrap(`
      <h2>Account Access Restricted</h2>
      <p>Hello <b>${esc(name || "User")}</b>,</p>
      <p>This is to inform you that your <b>MessMate</b> account has been temporarily <b>blocked</b> due to activity that does not align with our usage policies.</p>
      <p>During this period, you will not be able to access certain features or perform actions that are reserved for compliant users of the platform.</p>
      <p>We kindly request you to review our terms of use and ensure that any future activity strictly follows the guidelines and appropriate use of MessMate.</p>
      <p style="margin-top: 20px;">If you believe this action was taken in error or would like to request a review of your account status, please contact our support team with the necessary details.</p>
      <p>We appreciate your understanding and cooperation.</p>
      ${signature}`),
  };
}

export function warningMail({ name }) {
  return {
    subject: "Warninng Message - MessMate",
    html: wrap(`
      <h2>Important Notice</h2>
      <p>Hello <b>${esc(name || "User")}</b>,</p>
      <p>We have detected activity on your account that may not align with our usage policies. We kindly request you to stop any form of malpractice, misuse of features, or actions that you are not permitted to perform on MessMate.</p>
      <p>Please make sure that you use the platform only for its intended purpose and follow all guidelines mentioned in our terms of use.</p>
      <p>Continued violation of these guidelines may result in temporary or permanent restrictions on your account.</p>
      <p style="margin-top: 20px;">If you believe this message was sent in error or have any questions, please contact our support team for clarification.</p>
      ${signature}`),
  };
}

export function verificationReceivedMail({ ownerName }) {
  return {
    subject: "Mess Verification Request Received - MessMate",
    html: `
      <h3>Hello ${esc(ownerName || "User")},</h3>
      <p>Your mess verification request has been received.</p>
      <p>Our team will verify your documents within 24 hours.</p>
      <p>We will notify you once verification is complete.</p>
      <br />
      <p>Regards,<br>MessMate Team</p>`,
  };
}

export function messVerifiedMail({ ownerName, messName, dashboardLink }) {
  return {
    subject: "Verification Done - MessMate",
    html: wrap(`
      <h2>Mess Verification Approved</h2>
      <p>Hello <b>${esc(ownerName || "User")}</b>,</p>
      <p>We’re happy to inform you that your mess verification request has been <b>approved</b>.</p>
      <p>Your mess <b>${esc(messName)}</b> has been successfully added to <b>MessMate</b>. You can now manage your mess details, view registrations, and use all available features from your dashboard.</p>
      <p style="margin-top: 20px;">
        <a href="${esc(safeUrl(dashboardLink))}" style="display: inline-block; padding: 10px 18px; border-radius: 4px; background: #4caf50; color: #ffffff; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
      </p>
      <p style="margin-top: 20px;">If you did not make this request or believe this was a mistake, please contact our support team immediately.</p>
      ${signature}`),
  };
}

export function messDeniedMail({ ownerName }) {
  return {
    subject: "Verification Denied - MessMate",
    html: wrap(
      `
      <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px;">Mess Verification Request - Denied</h2>
      <p style="margin: 0 0 12px 0;">Hello <b>${esc(ownerName || "User")}</b>,</p>
      <p style="margin: 0 0 12px 0;">Thank you for submitting your mess registration request on <b>MessMate</b>. After reviewing the information provided, we are unable to approve your request at this time.</p>
      <p style="margin: 0 0 12px 0;">The request has been denied because one or more <b>mandatory details</b> were missing or incomplete. This includes, but may not be limited to:</p>
      <ul style="margin: 0 0 12px 18px; padding: 0;">
        <li>Mess name</li><li>UPI ID / payment details</li><li>Registered email address</li><li>Verification certificate</li><li>Banner image / mess photo</li>
      </ul>
      <p style="margin: 0 0 12px 0;">To proceed further, please ensure that all required information and documents are correctly provided and clearly visible, and then submit a fresh verification request.</p>
      <p style="margin: 0 0 12px 0;">If you believe this decision was made in error, or if you need guidance on the required details, you may contact our support team with the relevant information and we will be happy to assist you.</p>
      <p style="margin: 16px 0 0 0;">Regards,<br/><b>MessMate Support Team</b></p>`,
      { maxWidth: "600px", border: true },
    ),
  };
}

export function registrationApprovedMail({ name, messName }) {
  return {
    subject: "Mess Registration Approved - MessMate",
    html: wrap(
      `
      <h2 style="margin-bottom: 15px;">Your Monthly Mess Registration Has Been Approved</h2>
      <p>Hello <b>${esc(name || "User")}</b>,</p>
      <p>We are pleased to inform you that your request to join the <b>${esc(messName)}</b> Monthly Mess has been <b>approved</b> by the mess owner. Your registration is now active and you can begin using all Monthly Mess services according to the plan you selected.</p>
      <p>This approval confirms that your details have been reviewed and verified by the mess owner. You are now officially added to their Monthly Mess customer list.</p>
      <p style="margin-top: 15px;">If you have any questions regarding schedules, meal timings, holidays, or billing, please feel free to reach out to the mess owner directly through the MessMate platform.</p>
      ${teamSignature}`,
      { maxWidth: "600px" },
    ),
  };
}

export function registrationDisabledMail({ name, messName }) {
  return {
    subject: "Mess Registration Updated - MessMate",
    html: wrap(
      `
      <h2>Your Monthly Mess Access Has Been Updated</h2>
      <p>Hello <b>${esc(name || "User")}</b>,</p>
      <p>This message is to notify you that your access to the <b>${esc(messName)}</b> Monthly Mess has been <b>temporarily disabled</b> by the mess owner.</p>
      <p>This action may have been taken due to incomplete payments, incorrect information, rule violations, or other eligibility-related reasons defined by the mess owner.</p>
      <p>If you believe this update was made in error or require clarification, we recommend contacting the mess owner directly through MessMate for further assistance.</p>
      ${teamSignature}`,
      { maxWidth: "600px" },
    ),
  };
}

export function registrationExtendedMail({ name, messName, days }) {
  return {
    subject: "Mess Duration Extended - MessMate",
    html: wrap(
      `
      <h2>Your Monthly Mess Service Has Been Extended</h2>
      <p>Hello <b>${esc(name || "User")}</b>,</p>
      <p>Good news! The mess owner at <b>${esc(messName)}</b> has added <b>${esc(days)} additional day(s)</b> to your Monthly Mess subscription.</p>
      <p>Your validity period has now been updated accordingly. You will continue receiving your daily meal services without interruption based on your selected plan.</p>
      <p>This extension is usually granted in situations such as bonus days, adjustment of missed days, or extension requests approved by the mess owner.</p>
      ${teamSignature}`,
      { maxWidth: "600px" },
    ),
  };
}

export function registrationRemovedMail({ name, messName }) {
  return {
    subject: "Mess Registration Removed - MessMate",
    html: wrap(
      `
      <h2>Your Monthly Mess Registration Has Been Removed</h2>
      <p>Hello <b>${esc(name || "User")}</b>,</p>
      <p>This is to inform you that your registration for the <b>${esc(messName)}</b> Monthly Mess has been removed by the mess owner.</p>
      <p>This means you will no longer receive meals or services under the Monthly Mess plan. Mess owners may remove registrations due to plan expiry, non-payment, or administrative updates.</p>
      <p>If you believe this action was taken incorrectly or wish to reapply, you may contact the mess owner directly through MessMate or submit a new request.</p>
      ${teamSignature}`,
      { maxWidth: "600px" },
    ),
  };
}

export function monthlyRequestMail({ name, messName }) {
  return {
    subject: "Request For Monthly Mess - MessMate",
    html: wrap(
      `
      <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px;">Your Mess Application Has Been Submitted Successfully</h2>
      <p>Hello <b>${esc(name || "User")}</b>,</p>
      <p>Your application for the <b>Daily Mess</b> at <b>${esc(messName)}</b> has been submitted successfully.</p>
      <p>If you have applied for a <b>Monthly Mess plan</b>, please allow up to <b>24 hours</b> for the mess owner to review and approve your request.</p>
      <p>You will receive an email update as soon as the owner takes action. Thank you for choosing MessMate.</p>
      <p>Regards,<br/><b>MessMate Support Team</b></p>`,
      { maxWidth: "600px", border: true },
    ),
  };
}

export function paymentSuccessMail({ name, messName, paymentId, orderId, amount, duration }) {
  return {
    subject: "Payment Successful - Monthly Mess Registration",
    html: wrap(
      `
      <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; color: #10b981;">✅ Payment Successful - Registration Confirmed</h2>
      <p>Hello <b>${esc(name || "User")}</b>,</p>
      <p>Your payment for the <b>Monthly Mess</b> at <b>${esc(messName)}</b> has been successfully received and verified.</p>
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px;">Payment Invoice</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #6b7280;">Transaction ID:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${esc(paymentId)}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Order ID:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${esc(orderId)}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Amount Paid:</td><td style="padding: 8px 0; font-weight: bold; text-align: right; color: #10b981;">₹${esc(amount ?? 0)}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Duration:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${esc(duration)}</td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Payment Date:</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${esc(new Date().toLocaleDateString())}</td></tr>
        </table>
      </div>
      <p>Your mess registration is now complete. Please allow up to <b>24 hours</b> for the mess owner to review and approve your request.</p>
      <p>You can access your payment invoice anytime from your dashboard.</p>
      <p>Thank you for choosing MessMate!</p>
      <p>Regards,<br/><b>MessMate Support Team</b></p>`,
      { maxWidth: "600px", border: true },
    ),
  };
}
