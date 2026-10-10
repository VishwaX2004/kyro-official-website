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

    // Customer Email HTML
    const customerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #171717; margin: 0; padding: 0; background: #f8f6f0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #aa8953;">
            <h1 style="margin: 0; font-size: 32px; color: #aa8953; font-weight: 600;">Kyro Fragrances</h1>
            <p style="margin: 8px 0 0; color: #777268; font-size: 13px;">Luxury Perfume Decants</p>
          </div>

          <!-- Greeting -->
          <div style="margin-bottom: 30px;">
            <h2 style="margin: 0 0 12px; font-size: 24px; color: #171717;">Order Confirmed ✓</h2>
            <p style="margin: 0; color: #777268; font-size: 14px;">Thank you for choosing Kyro. Your order has been received and is being processed.</p>
          </div>

          <!-- Order Summary Card -->
          <div style="background: #fffefa; border: 1px solid rgba(170, 137, 83, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
              <div>
                <p style="margin: 0; font-size: 11px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Order ID</p>
                <p style="margin: 5px 0 0; font-size: 16px; color: #171717; font-weight: 600;">${order.displayOrderId}</p>
              </div>
              <div>
                <p style="margin: 0; font-size: 11px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Order Date</p>
                <p style="margin: 5px 0 0; font-size: 16px; color: #171717; font-weight: 600;">${orderDate}</p>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px; font-size: 14px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #aa8953;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 700; color: #171717;">Product</th>
                  <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 700; color: #171717;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 700; color: #171717;">Price</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 700; color: #171717;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTableHtml}
              </tbody>
            </table>
          </div>

          <!-- Total -->
          <div style="text-align: right; margin-bottom: 30px; padding: 20px; background: rgba(170, 137, 83, 0.05); border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #777268;">Total Amount</p>
            <p style="margin: 8px 0 0; font-size: 28px; color: #aa8953; font-weight: 700;">Rs ${order.total.toLocaleString("en-LK")}</p>
          </div>

          <!-- Delivery Address -->
          ${
            order.delivery_address
              ? `
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 12px; font-size: 14px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Delivery Address</h3>
            <div style="background: #fbfaf7; border: 1px solid rgba(170, 137, 83, 0.15); border-radius: 8px; padding: 15px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #171717;"><strong>${order.delivery_address.name}</strong></p>
              <p style="margin: 0 0 6px; font-size: 12px; color: #777268;">${order.delivery_address.street}</p>
              <p style="margin: 0 0 6px; font-size: 12px; color: #777268;">${order.delivery_address.city}, ${order.delivery_address.postalCode}</p>
              <p style="margin: 0 0 6px; font-size: 12px; color: #777268;">${order.delivery_address.country}</p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #777268;">Phone: ${order.delivery_address.phone}</p>
            </div>
          </div>
          `
              : ""
          }

          <!-- Bank Details -->
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 12px; font-size: 14px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Bank Transfer Details</h3>
            <div style="background: #fbfaf7; border: 1px solid rgba(170, 137, 83, 0.15); border-radius: 8px; padding: 15px; font-family: 'Courier New', monospace; font-size: 12px;">
              <p style="margin: 0 0 8px;"><strong>Bank:</strong> People's Bank</p>
              <p style="margin: 0 0 8px;"><strong>Account Name:</strong> Kyro Fragrances</p>
              <p style="margin: 0 0 8px;"><strong>Account Number:</strong> 212-1-002-3-0030826</p>
              <p style="margin: 0 0 8px;"><strong>Branch:</strong> Kiribathgoda</p>
              <p style="margin: 0;"><strong>Swift/BIC:</strong> PSBKLKLX</p>
            </div>
          </div>

          <!-- Closing -->
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(170, 137, 83, 0.15);">
            <p style="margin: 0; color: #777268; font-size: 12px;">Thank you for choosing Kyro Fragrances.</p>
            <p style="margin: 8px 0 0; color: #777268; font-size: 11px;">If you have any questions, please contact us.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Admin Email HTML
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #171717; margin: 0; padding: 0; background: #f8f6f0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #aa8953;">
            <h1 style="margin: 0; font-size: 32px; color: #aa8953; font-weight: 600;">Kyro Admin</h1>
            <p style="margin: 8px 0 0; color: #777268; font-size: 13px;">New Order Notification</p>
          </div>

          <!-- Alert -->
          <div style="background: rgba(170, 137, 83, 0.1); border-left: 4px solid #aa8953; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #171717;"><strong>New order received</strong> — Payment verification required</p>
          </div>

          <!-- Order Summary Card -->
          <div style="background: #fffefa; border: 1px solid rgba(170, 137, 83, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
              <div>
                <p style="margin: 0; font-size: 11px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Order ID</p>
                <p style="margin: 5px 0 0; font-size: 16px; color: #171717; font-weight: 600;">${order.displayOrderId}</p>
              </div>
              <div>
                <p style="margin: 0; font-size: 11px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Total</p>
                <p style="margin: 5px 0 0; font-size: 16px; color: #aa8953; font-weight: 600;">Rs ${order.total.toLocaleString("en-LK")}</p>
              </div>
            </div>
          </div>

          <!-- Customer Info -->
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 12px; font-size: 14px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Customer Information</h3>
            <div style="background: #fbfaf7; border: 1px solid rgba(170, 137, 83, 0.15); border-radius: 8px; padding: 15px;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #171717;"><strong>${order.delivery_address?.name || "N/A"}</strong></p>
              <p style="margin: 0 0 6px; font-size: 12px; color: #777268;">Email: ${customerEmail}</p>
              <p style="margin: 0; font-size: 12px; color: #777268;">Phone: ${order.delivery_address?.phone || "N/A"}</p>
            </div>
          </div>

          <!-- Items Table -->
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px; font-size: 14px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #aa8953;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 700; color: #171717;">Product</th>
                  <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 700; color: #171717;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 700; color: #171717;">Price</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 700; color: #171717;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTableHtml}
              </tbody>
            </table>
          </div>

          <!-- Delivery Address -->
          ${
            order.delivery_address
              ? `
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 12px; font-size: 14px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Delivery Address</h3>
            <div style="background: #fbfaf7; border: 1px solid rgba(170, 137, 83, 0.15); border-radius: 8px; padding: 15px; font-size: 12px;">
              <p style="margin: 0 0 8px;">${order.delivery_address.street}</p>
              <p style="margin: 0 0 8px;">${order.delivery_address.city}, ${order.delivery_address.postalCode}</p>
              <p style="margin: 0;">${order.delivery_address.country}</p>
            </div>
          </div>
          `
              : ""
          }

          <!-- Action Required -->
          <div style="background: rgba(220, 38, 38, 0.05); border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 8px; padding: 15px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #8b2e2e;"><strong>Action Required:</strong> Verify payment slip and confirm order</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send customer email
    await transporter.sendMail({
      from: GMAIL_USER,
      to: customerEmail,
      subject: `Your Kyro Order ${order.displayOrderId} is confirmed`,
      html: customerEmailHtml,
      attachments,
    });
    console.log("[EMAIL POST] ✓ Customer email sent");

    // Send admin email
    await transporter.sendMail({
      from: GMAIL_USER,
      to: "kyrofragrance@gmail.com",
      subject: `New Order ${order.displayOrderId} — Payment Verification Required`,
      html: adminEmailHtml,
      attachments,
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
