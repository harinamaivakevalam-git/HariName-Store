const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter object using SMTP transport
let transporter = null;

function getTransporter() {
  const user = (process.env.SMTP_USER || process.env.EMAIL_FROM || '').trim();
  const pass = (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').toLowerCase().trim();

  if (!user || !pass || pass.includes('placeholder') || pass.includes('your_')) {
    return null;
  }

  if (!transporter) {
    if (host.includes('gmail') || user.endsWith('@gmail.com')) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass
        },
        pool: true,
        maxConnections: 3,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });
    } else {
      const port = parseInt(process.env.SMTP_PORT, 10) || 465;
      const secure = process.env.SMTP_SECURE === 'false' ? false : (port === 465);
      transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 10000
      });
    }
  }

  return transporter;
}

/**
 * Send Professional Devotional Order Confirmation Email
 * @param {Object} order - Full order object with items, shipping_address, totals
 */
async function sendOrderConfirmationEmail(order) {
  try {
    if (!order) return { success: false, message: 'Order data missing.' };

    const customerEmail = order.shipping_address?.email || order.guest_email || order.email;
    if (!customerEmail || !customerEmail.includes('@') || customerEmail.includes('guest@harinama.com')) {
      console.log(`[Email Service] Skipping email for order ${order.order_number}: No valid recipient email.`);
      return { success: false, message: 'No valid recipient email.' };
    }

    const mailer = getTransporter();
    if (!mailer) {
      console.warn(`[Email Service] SMTP credentials not configured. Order email for ${order.order_number} skipped.`);
      return { success: false, message: 'SMTP not configured.' };
    }

    const customerName = order.shipping_address?.name || order.guest_name || 'Devotee';
    const orderNumber = order.order_number || order.id;

    // Use live website domain for customer-facing email templates
    let clientUrl = process.env.CLIENT_URL || 'https://www.harinamastore.com';
    if (clientUrl.includes('localhost') || clientUrl.includes('127.0.0.1')) {
      clientUrl = 'https://www.harinamastore.com';
    }
    clientUrl = clientUrl.replace(/\/$/, '');

    const trackingUrl = `${clientUrl}/order-tracking.html?order=${encodeURIComponent(orderNumber)}`;
    const invoiceUrl = `${clientUrl}/invoice.html?order=${encodeURIComponent(orderNumber)}&print=true`;

    const items = Array.isArray(order.items) ? order.items : [];
    const itemsHtml = items.map(item => {
      const name = item.product_name || item.name || 'Sacred Devotional Item';
      const qty = item.quantity || item.qty || 1;
      const price = parseFloat(item.price) || 0;
      const total = price * qty;
      let img = item.product_image || item.image || `${clientUrl}/assets/images/krishna-logo.jpg`;
      if (img.startsWith('/')) {
        img = `${clientUrl}${img}`;
      } else if (!img.startsWith('http')) {
        img = `${clientUrl}/${img}`;
      }

      return `
        <tr style="border-bottom: 1px solid #EFE8DE;">
          <td style="padding: 12px 8px; vertical-align: middle;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width: 50px; vertical-align: middle;">
                  <img src="${img}" alt="${name}" width="46" height="46" style="border-radius: 8px; object-fit: cover; border: 1px solid #E5D5BA; display: block;" onerror="this.style.display='none'" />
                </td>
                <td style="padding-left: 12px; vertical-align: middle;">
                  <div style="font-weight: 600; font-size: 14px; color: #0F1E36; line-height: 1.3;">${name}</div>
                  <div style="font-size: 12px; color: #7A583B; margin-top: 2px;">Qty: ${qty} &times; ₹${price.toFixed(2)}</div>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 12px 8px; text-align: right; vertical-align: middle; font-weight: 700; font-size: 14px; color: #0F1E36;">
            ₹${total.toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');

    const subtotal = parseFloat(order.subtotal) || 0;
    const discount = parseFloat(order.discount) || 0;
    const shippingFee = parseFloat(order.shipping_fee) || 0;
    const grandTotal = parseFloat(order.total) || (subtotal - discount + shippingFee);
    const paymentMethod = String(order.payment_method || '').toUpperCase();
    const isCod = paymentMethod === 'COD';

    const shipAddr = order.shipping_address || {};
    const fullAddress = [
      shipAddr.address_line_1 || shipAddr.address,
      shipAddr.address_line_2,
      shipAddr.village,
      shipAddr.city,
      shipAddr.state,
      shipAddr.postal_code || shipAddr.pin || shipAddr.pincode
    ].filter(Boolean).join(', ');

    const fromName = process.env.SMTP_FROM_NAME || process.env.EMAIL_FROM_NAME || 'HariNama Store';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: customerEmail,
      subject: `🌸 Order Confirmed: #${orderNumber} | HariNama Store`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation - HariNama Store</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #F8F5F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2C2010;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8F5F0; padding: 24px 12px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(15, 30, 54, 0.08); border: 1px solid #EFE8DE;">
                  
                  <!-- Header Strip -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0F1E36 0%, #1A365D 100%); padding: 28px 24px; text-align: center;">
                      <div style="font-size: 26px; font-weight: 800; color: #DFB75A; letter-spacing: 0.05em; text-transform: uppercase;">
                        HariNama Store
                      </div>
                      <div style="font-size: 13px; color: #E2E8F0; margin-top: 4px; letter-spacing: 0.12em; text-transform: uppercase;">
                        Authentic Devotional & Sacred Essentials
                      </div>
                    </td>
                  </tr>

                  <!-- Hero Blessing Message -->
                  <tr>
                    <td style="padding: 28px 24px 16px 24px; text-align: center;">
                      <div style="font-size: 20px; font-weight: 700; color: #0F1E36; margin-bottom: 6px;">
                        Hare Krishna, ${customerName}! 🌸
                      </div>
                      <div style="font-size: 14px; color: #5C4A3A; line-height: 1.5;">
                        Thank you for your sacred order. We have received your request and our Vrindavan dispatch team is preparing your package with utmost devotion and care.
                      </div>
                    </td>
                  </tr>

                  <!-- Order Overview Card -->
                  <tr>
                    <td style="padding: 0 24px 20px 24px;">
                      <div style="background-color: #FAF6F0; border: 1px solid #EFE8DE; border-radius: 12px; padding: 16px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td>
                              <div style="font-size: 12px; color: #7A583B; text-transform: uppercase; font-weight: 600;">Order Number</div>
                              <div style="font-size: 16px; font-weight: 800; color: #0F1E36; margin-top: 2px;">#${orderNumber}</div>
                            </td>
                            <td style="text-align: right;">
                              <div style="font-size: 12px; color: #7A583B; text-transform: uppercase; font-weight: 600;">Payment Mode</div>
                              <div style="font-size: 14px; font-weight: 700; color: ${isCod ? '#B45309' : '#15803D'}; margin-top: 2px;">
                                ${isCod ? 'Cash on Delivery (COD)' : 'Prepaid (Paid Online)'}
                              </div>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>

                  <!-- Order Items Table -->
                  <tr>
                    <td style="padding: 0 24px 16px 24px;">
                      <div style="font-size: 15px; font-weight: 700; color: #0F1E36; margin-bottom: 12px; border-bottom: 2px solid #DFB75A; padding-bottom: 6px;">
                        Items in Your Package
                      </div>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        ${itemsHtml}
                      </table>
                    </td>
                  </tr>

                  <!-- Price Breakdown -->
                  <tr>
                    <td style="padding: 0 24px 20px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #5C4A3A;">
                        <tr>
                          <td style="padding: 4px 0;">Subtotal:</td>
                          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0F1E36;">₹${subtotal.toFixed(2)}</td>
                        </tr>
                        ${discount > 0 ? `
                        <tr>
                          <td style="padding: 4px 0; color: #15803D;">Coupon Discount:</td>
                          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #15803D;">-₹${discount.toFixed(2)}</td>
                        </tr>` : ''}
                        <tr>
                          <td style="padding: 4px 0;">Shipping Fee:</td>
                          <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #0F1E36;">${shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}</td>
                        </tr>
                        <tr style="border-top: 1.5px dashed #DFB75A;">
                          <td style="padding: 10px 0 0 0; font-size: 16px; font-weight: 800; color: #0F1E36;">Grand Total:</td>
                          <td style="padding: 10px 0 0 0; text-align: right; font-size: 18px; font-weight: 800; color: #0F1E36;">₹${grandTotal.toFixed(2)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Delivery Address -->
                  <tr>
                    <td style="padding: 0 24px 24px 24px;">
                      <div style="background-color: #FAF6F0; border-radius: 12px; padding: 14px; border: 1px solid #EFE8DE;">
                        <div style="font-size: 12px; font-weight: 700; color: #7A583B; text-transform: uppercase; margin-bottom: 4px;">
                          🚚 Delivery Destination
                        </div>
                        <div style="font-size: 13px; font-weight: 600; color: #0F1E36;">${customerName} (${shipAddr.phone || ''})</div>
                        <div style="font-size: 13px; color: #5C4A3A; margin-top: 2px; line-height: 1.4;">${fullAddress}</div>
                      </div>
                    </td>
                  </tr>

                  <!-- CTA Action Buttons -->
                  <tr>
                    <td style="padding: 0 24px 28px 24px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding-bottom: 10px;">
                            <a href="${trackingUrl}" target="_blank" style="background: linear-gradient(135deg, #0F1E36 0%, #1A365D 100%); color: #DFB75A; padding: 12px 28px; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 50px; display: inline-block; box-shadow: 0 4px 12px rgba(15, 30, 54, 0.2);">
                              Track Live Package Status 📦
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <a href="${invoiceUrl}" target="_blank" style="color: #7A583B; font-size: 12px; text-decoration: underline; display: inline-block;">
                              Download Tax Invoice (PDF) 📄
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #F8F5F0; padding: 20px 24px; text-align: center; border-top: 1px solid #EFE8DE;">
                      <div style="font-size: 12px; color: #7A583B; line-height: 1.5;">
                        Questions about your order? Reply directly to this email or visit <a href="${clientUrl}" style="color: #0F1E36; font-weight: 600; text-decoration: none;">harinamastore.com</a>
                      </div>
                      <div style="font-size: 11px; color: #A08266; margin-top: 8px;">
                        © ${new Date().getFullYear()} HariNama Store. All rights reserved. Blessed from Vrindavan Dham. 🌸
                      </div>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    console.log(`[Email Service] Sending order confirmation email to ${customerEmail} for #${orderNumber}...`);
    const info = await mailer.sendMail(mailOptions);
    console.log(`[Email Service] Confirmation email sent successfully! MessageId: ${info.messageId}`);

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Service Error] Failed to send email for order ${order?.order_number}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  getTransporter
};
