import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD || "";

if (!GMAIL_USER || !GMAIL_PASSWORD) {
  console.warn("[EMAIL] Missing Gmail credentials - email sending will fail");
}

export async function POST(request: Request) {
  console.log("[EMAIL POST] ========== EMAIL POST START ==========");

  try {
    const body = (await request.json()) as {
      order: {
        displayOrderId: string;
        createdAt: string;
        items: Array<{
          productId: string;
          name: string;
          price: number;
          quantity: number;
          size?: string;
          imageUrl?: string;
        }>;
        delivery_address?: {
          name: string;
          email: string;
          phone: string;
          street: string;
          city: string;
          postalCode: string;
          country: string;
        };
        total: number;
        payment_slip_url?: string;
        payment_slip_filename?: string;
      };
      customerEmail: string;
    };

    const { order, customerEmail } = body;
    console.log("[EMAIL POST] Order ID:", order.displayOrderId);
    console.log("[EMAIL POST] Customer Email:", customerEmail);

    if (!GMAIL_USER || !GMAIL_PASSWORD) {
      console.error("[EMAIL POST] Missing Gmail credentials");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASSWORD,
      },
    });

    console.log("[EMAIL POST] Transporter created");

    // Prepare attachments
    const attachments: any[] = [];

    // Fetch and attach product images
    for (const item of order.items) {
      if (item.imageUrl) {
        try {
          console.log(`[EMAIL POST] Fetching product image: ${item.imageUrl}`);
          const imgResponse = await fetch(item.imageUrl);
          if (imgResponse.ok) {
            const imgBuffer = await imgResponse.arrayBuffer();
            attachments.push({
              filename: `product-${item.productId}.jpg`,
              content: Buffer.from(imgBuffer),
              cid: `item-${item.productId}`,
            });
            console.log(`[EMAIL POST] ✓ Attached product image for ${item.productId}`);
          }
        } catch (err) {
          console.warn(`[EMAIL POST] Failed to fetch image for ${item.productId}:`, err);
        }
      }
    }

    // Fetch and attach payment slip
    if (order.payment_slip_url) {
      try {
        console.log(`[EMAIL POST] Fetching payment slip: ${order.payment_slip_url}`);
        const slipResponse = await fetch(order.payment_slip_url);
        if (slipResponse.ok) {
          const slipBuffer = await slipResponse.arrayBuffer();
          attachments.push({
            filename: order.payment_slip_filename || "payment-slip.jpg",
            content: Buffer.from(slipBuffer),
          });
          console.log("[EMAIL POST] ✓ Attached payment slip");
        }
      } catch (err) {
        console.warn("[EMAIL POST] Failed to fetch payment slip:", err);
      }
    }

    // Format items table HTML
    const itemsTableHtml = order.items
      .map(
        (item) =>
          `
      <tr style="border-bottom: 1px solid rgba(170, 137, 83, 0.2);">
        <td style="padding: 12px; text-align: left;">
          ${item.imageUrl ? `<img src="cid:item-${item.productId}" style="width: 60px; height: 60px; border-radius: 6px; margin-right: 10px;" />` : ""}
          <strong>${item.name}</strong>
          ${item.size ? `<br><small style="color: #777268;">${item.size}</small>` : ""}
        </td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">Rs ${item.price.toLocaleString("en-LK")}</td>
        <td style="padding: 12px; text-align: right;">Rs ${(item.price * item.quantity).toLocaleString("en-LK")}</td>
      </tr>
    `
      )
      .join("");

    const orderDate = new Date(order.createdAt).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Customer Email HTML - Optimized for inbox delivery
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #171717; margin: 0; padding: 0; background: #f8f6f0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f6f0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 20px; text-align: center; border-bottom: 2px solid #aa8953; background: #fffefa;">
                    <h1 style="margin: 0; font-size: 28px; color: #aa8953; font-weight: 600; font-family: Georgia, serif;">Kyro Fragrances</h1>
                    <p style="margin: 8px 0 0; color: #777268; font-size: 12px;">Premium Fragrance Decants</p>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding: 30px 20px; background: #fffefa;">
                    <h2 style="margin: 0 0 12px; font-size: 22px; color: #171717; font-family: Georgia, serif;">Order Confirmed</h2>
                    <p style="margin: 0; color: #777268; font-size: 13px;">Hi ${order.delivery_address?.name?.split(" ")[0] || "Valued Customer"},</p>
                    <p style="margin: 12px 0 0; color: #777268; font-size: 13px;">Thank you for your purchase. We have received your order and will begin processing it shortly.</p>
                  </td>
                </tr>

                <!-- Order Summary Card -->
                <tr>
                  <td style="padding: 0 20px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #fbfaf7; border: 1px solid rgba(170, 137, 83, 0.2); border-radius: 12px; padding: 20px;">
                      <tr>
                        <td width="50%" style="padding: 10px 0;">
                          <p style="margin: 0; font-size: 10px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Order Number</p>
                          <p style="margin: 5px 0 0; font-size: 15px; color: #171717; font-weight: 600;">${order.displayOrderId}</p>
                        </td>
                        <td width="50%" style="padding: 10px 0; text-align: right;">
                          <p style="margin: 0; font-size: 10px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Order Date</p>
                          <p style="margin: 5px 0 0; font-size: 15px; color: #171717; font-weight: 600;">${orderDate}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items Table -->
                <tr>
                  <td style="padding: 0 20px 30px;">
                    <p style="margin: 0 0 15px; font-size: 12px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Your Items</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      <thead>
                        <tr style="border-bottom: 2px solid #aa8953; background: #fbfaf7;">
                          <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 700; color: #171717;">Product</th>
                          <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: 700; color: #171717;">Qty</th>
                          <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: 700; color: #171717;">Price</th>
                          <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: 700; color: #171717;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsTableHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Total -->
                <tr>
                  <td style="padding: 0 20px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(170, 137, 83, 0.05); padding: 20px; border-radius: 8px;">
                      <tr>
                        <td style="text-align: right;">
                          <p style="margin: 0; font-size: 13px; color: #777268;">Order Total</p>
                          <p style="margin: 8px 0 0; font-size: 26px; color: #aa8953; font-weight: 700;">Rs ${order.total.toLocaleString("en-LK")}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Delivery Address -->
                ${
                  order.delivery_address
                    ? `
                <tr>
                  <td style="padding: 0 20px 30px;">
                    <p style="margin: 0 0 12px; font-size: 12px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Delivery Address</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #fbfaf7; border: 1px solid rgba(170, 137, 83, 0.15); border-radius: 8px; padding: 15px;">
                      <tr>
                        <td style="font-size: 13px; color: #171717;">
                          <strong>${order.delivery_address.name}</strong><br>
                          <span style="color: #777268;">${order.delivery_address.street}</span><br>
                          <span style="color: #777268;">${order.delivery_address.city}, ${order.delivery_address.postalCode}</span><br>
                          <span style="color: #777268;">${order.delivery_address.country}</span><br>
                          <span style="color: #777268; margin-top: 8px; display: block;">Phone: ${order.delivery_address.phone}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `
                    : ""
                }

                <!-- Bank Details -->
                <tr>
                  <td style="padding: 0 20px 30px;">
                    <p style="margin: 0 0 12px; font-size: 12px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Payment Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #fbfaf7; border: 1px solid rgba(170, 137, 83, 0.15); border-radius: 8px; padding: 15px; font-family: 'Courier New', monospace; font-size: 12px; color: #171717;">
                      <tr><td><strong>Bank:</strong> People's Bank</td></tr>
                      <tr><td><strong>Account Name:</strong> Kyro Fragrances</td></tr>
                      <tr><td><strong>Account Number:</strong> 212-1-002-3-0030826</td></tr>
                      <tr><td><strong>Branch:</strong> Kiribathgoda</td></tr>
                      <tr><td><strong>SWIFT Code:</strong> PSBKLKLX</td></tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 20px; text-align: center; border-top: 1px solid rgba(170, 137, 83, 0.15); background: #fbfaf7; color: #777268; font-size: 11px;">
                    <p style="margin: 0;">Thank you for choosing Kyro Fragrances.</p>
                    <p style="margin: 8px 0 0;">If you have any questions, please contact us at kyrofragrance@gmail.com</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Admin Email HTML - Optimized for inbox delivery
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Notification</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #171717; margin: 0; padding: 0; background: #f8f6f0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f6f0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 20px; text-align: center; border-bottom: 2px solid #aa8953; background: #fffefa;">
                    <h1 style="margin: 0; font-size: 28px; color: #aa8953; font-weight: 600; font-family: Georgia, serif;">Kyro Admin</h1>
                    <p style="margin: 8px 0 0; color: #777268; font-size: 12px;">New Order Received</p>
                  </td>
                </tr>

                <!-- Alert -->
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(170, 137, 83, 0.08); border-left: 4px solid #aa8953; padding: 15px; border-radius: 4px;">
                      <tr>
                        <td style="font-size: 13px; color: #171717;">
                          <strong>New Order Available</strong><br>
                          <span style="color: #777268; font-size: 12px;">Please review and verify payment</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Order Summary Card -->
                <tr>
                  <td style="padding: 0 20px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #fbfaf7; border: 1px solid rgba(170, 137, 83, 0.2); border-radius: 12px; padding: 20px;">
                      <tr>
                        <td width="50%" style="padding: 10px 0;">
                          <p style="margin: 0; font-size: 10px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Order Number</p>
                          <p style="margin: 5px 0 0; font-size: 15px; color: #171717; font-weight: 600;">${order.displayOrderId}</p>
                        </td>
                        <td width="50%" style="padding: 10px 0; text-align: right;">
                          <p style="margin: 0; font-size: 10px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Total Amount</p>
                          <p style="margin: 5px 0 0; font-size: 15px; color: #aa8953; font-weight: 600;">Rs ${order.total.toLocaleString("en-LK")}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Customer Info -->
                <tr>
                  <td style="padding: 0 20px 30px;">
                    <p style="margin: 0 0 12px; font-size: 12px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Customer Information</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #fbfaf7; border: 1px solid rgba(170, 137, 83, 0.15); border-radius: 8px; padding: 15px;">
                      <tr>
                        <td style="font-size: 12px; color: #171717;">
                          <strong>${order.delivery_address?.name || "N/A"}</strong><br>
                          <span style="color: #777268;">Email: ${customerEmail}</span><br>
                          <span style="color: #777268;">Phone: ${order.delivery_address?.phone || "N/A"}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Items Table -->
                <tr>
                  <td style="padding: 0 20px 30px;">
                    <p style="margin: 0 0 15px; font-size: 12px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Order Items</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      <thead>
                        <tr style="border-bottom: 2px solid #aa8953; background: #fbfaf7;">
                          <th style="padding: 12px; text-align: left; font-size: 11px; font-weight: 700; color: #171717;">Product</th>
                          <th style="padding: 12px; text-align: center; font-size: 11px; font-weight: 700; color: #171717;">Qty</th>
                          <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: 700; color: #171717;">Price</th>
                          <th style="padding: 12px; text-align: right; font-size: 11px; font-weight: 700; color: #171717;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsTableHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Delivery Address -->
                ${
                  order.delivery_address
                    ? `
                <tr>
                  <td style="padding: 0 20px 30px;">
                    <p style="margin: 0 0 12px; font-size: 12px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Delivery Address</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #fbfaf7; border: 1px solid rgba(170, 137, 83, 0.15); border-radius: 8px; padding: 15px; font-size: 12px;">
                      <tr>
                        <td style="color: #777268;">
                          ${order.delivery_address.street}<br>
                          ${order.delivery_address.city}, ${order.delivery_address.postalCode}<br>
                          ${order.delivery_address.country}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `
                    : ""
                }

                <!-- Action Required -->
                <tr>
                  <td style="padding: 0 20px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(170, 137, 83, 0.1); border: 1px solid rgba(170, 137, 83, 0.2); border-radius: 8px; padding: 15px; text-align: center;">
                      <tr>
                        <td style="font-size: 12px; color: #8b2e2e;">
                          <strong>Action Required:</strong> Verify payment slip and confirm order
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 20px; text-align: center; border-top: 1px solid rgba(170, 137, 83, 0.15); background: #fbfaf7; color: #777268; font-size: 11px;">
                    <p style="margin: 0;">Kyro Admin Notification</p>
                    <p style="margin: 8px 0 0;">This is an automated message. Please do not reply to this email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send customer email
    await transporter.sendMail({
      from: `Kyro Fragrances <${GMAIL_USER}>`,
      to: customerEmail,
      subject: `Your Kyro Order ${order.displayOrderId} is confirmed`,
      html: customerEmailHtml,
      attachments,
      headers: {
        "X-Priority": "3",
        "X-Mailer": "Kyro-Fragrances",
        "List-Unsubscribe": `<mailto:${GMAIL_USER}?subject=unsubscribe>`,
      },
    });
    console.log("[EMAIL POST] ✓ Customer email sent");

    // Send admin email
    await transporter.sendMail({
      from: `Kyro Fragrances <${GMAIL_USER}>`,
      to: "kyrofragrance@gmail.com",
      subject: `New Order ${order.displayOrderId} — Payment Verification Required`,
      html: adminEmailHtml,
      attachments,
      headers: {
        "X-Priority": "1",
        "X-Mailer": "Kyro-Fragrances",
      },
    });
    console.log("[EMAIL POST] ✓ Admin email sent");

    console.log("[EMAIL POST] ========== EMAIL POST SUCCESS ==========");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EMAIL POST] ========== EMAIL POST FAILED ==========");
    console.error("[EMAIL POST] Error:", error);
    return NextResponse.json(
      { error: "Email sending failed" },
      { status: 500 }
    );
  }
}
