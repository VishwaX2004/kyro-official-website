"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

export default function ContactForm() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? ""),
    };
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "Unable to send your message.");
        return;
      }
      toast.success("Message sent! We'll reply within 24 hours.");
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="contact-success">
        <div className="success-icon">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>
        </div>

        <span className="success-eyebrow">MESSAGE SENT</span>

        <h3>Thank you.</h3>

        <p>
          Your message has been received. One of our scent specialists will
          get back to you within 24 hours.
        </p>

        <button
          type="button"
          onClick={() => setSent(false)}
          className="success-button"
        >
          SEND ANOTHER MESSAGE
          <span>↗</span>
        </button>

        <style dangerouslySetInnerHTML={{__html: `
          .contact-success {
            min-height: 390px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            animation: successIn 0.5s ease both;
          }

          .success-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 62px;
            height: 62px;
            margin-bottom: 24px;
            border-radius: 50%;
            background: #171717;
            color: #fff;
          }

          .success-eyebrow {
            color: #b08d50;
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.24em;
          }

          .contact-success h3 {
            margin: 12px 0 10px;
            font-size: 38px;
            font-weight: 500;
            letter-spacing: -0.04em;
          }

          .contact-success p {
            max-width: 390px;
            margin: 0;
            color: rgba(0, 0, 0, 0.5);
            font-size: 13px;
            line-height: 1.8;
          }

          .success-button {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 28px;
            padding: 13px 18px;
            border: 0;
            border-radius: 999px;
            background: #171717;
            color: #fff;
            cursor: pointer;
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.16em;
            transition: all 0.3s ease;
          }

          .success-button:hover {
            background: #b08d50;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(176, 141, 80, 0.2);
          }

          @keyframes successIn {
            from {
              opacity: 0;
              transform: scale(0.97) translateY(10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}} />
      </div>
    );
  }

  return (
    <form className="kyro-contact-form" onSubmit={handleSubmit}>
      {/* NAME + EMAIL */}
      <div className="form-row">
        <div className="field">
          <label htmlFor="contact-name">YOUR NAME</label>

          <input
            id="contact-name"
            type="text"
            name="name"
            placeholder="John Doe"
            autoComplete="name"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="contact-email">EMAIL ADDRESS</label>

          <input
            id="contact-email"
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
      </div>

      {/* SUBJECT */}
      <div className="field">
        <label htmlFor="contact-subject">SUBJECT</label>

        <div className="select-wrapper">
          <select id="contact-subject" name="subject" defaultValue="">
            <option value="" disabled>
              What can we help with?
            </option>
            <option value="order">Order enquiry</option>
            <option value="fragrance">Fragrance recommendation</option>
            <option value="product">Product question</option>
            <option value="shipping">Shipping & delivery</option>
            <option value="other">Something else</option>
          </select>

          <span>⌄</span>
        </div>
      </div>

      {/* MESSAGE */}
      <div className="field">
        <label htmlFor="contact-message">YOUR MESSAGE</label>

        <textarea
          id="contact-message"
          name="message"
          placeholder="Tell us a little about what you need..."
          rows={6}
          required
        />
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={sending}
        className={`submit-contact ${sending ? "sending" : ""}`}
      >
        <span>{sending ? "SENDING..." : "SEND MESSAGE"}</span>

        {!sending && (
          <span className="submit-arrow">
            ↗
          </span>
        )}

        {sending && <span className="loader" />}
      </button>

      <p className="form-note">
        By sending this message, you agree to be contacted by Kyro Parfums.
      </p>

      <style dangerouslySetInnerHTML={{__html: `
        .kyro-contact-form {
          display: flex;
          flex-direction: column;
          gap: 27px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .field label {
          color: rgba(0, 0, 0, 0.42);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.2em;
        }

        .field input,
        .field textarea,
        .field select {
          width: 100%;
          border: 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 0;
          background: transparent;
          color: #171717;
          outline: none;
          font-family: inherit;
          font-size: 13px;
          transition:
            border-color 0.25s ease,
            padding 0.25s ease;
        }

        .field input,
        .field select {
          height: 42px;
          padding: 0 2px;
        }

        .field textarea {
          min-height: 120px;
          padding: 10px 2px;
          resize: vertical;
          line-height: 1.7;
        }

        .field input::placeholder,
        .field textarea::placeholder {
          color: rgba(0, 0, 0, 0.27);
        }

        .field input:focus,
        .field textarea:focus,
        .field select:focus {
          border-color: #b08d50;
        }

        .select-wrapper {
          position: relative;
        }

        .select-wrapper select {
          appearance: none;
          cursor: pointer;
          padding-right: 25px;
        }

        .select-wrapper span {
          position: absolute;
          right: 3px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(0, 0, 0, 0.35);
          pointer-events: none;
          font-size: 16px;
        }

        .submit-contact {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          min-height: 52px;
          margin-top: 4px;
          overflow: hidden;
          border: 0;
          border-radius: 999px;
          background: #171717;
          color: #fff;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          transition:
            transform 0.3s ease,
            background 0.3s ease,
            box-shadow 0.3s ease;
        }

        .submit-contact::before {
          content: "";
          position: absolute;
          left: -100%;
          top: 0;
          width: 60%;
          height: 100%;
          transform: skewX(-20deg);
          background: rgba(255, 255, 255, 0.12);
          transition: left 0.6s ease;
        }

        .submit-contact:hover::before {
          left: 130%;
        }

        .submit-contact:hover {
          background: #b08d50;
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(176, 141, 80, 0.2);
        }

        .submit-contact:active {
          transform: translateY(0) scale(0.99);
        }

        .submit-contact:disabled {
          cursor: wait;
          opacity: 0.75;
          transform: none;
        }

        .submit-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 23px;
          height: 23px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          font-size: 12px;
          transition: transform 0.3s ease;
        }

        .submit-contact:hover .submit-arrow {
          transform: translateX(4px);
        }

        .loader {
          width: 15px;
          height: 15px;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .form-note {
          margin: -10px 0 0;
          color: rgba(0, 0, 0, 0.3);
          text-align: center;
          font-size: 9px;
          line-height: 1.5;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 27px;
          }
        }
      `}} />
    </form>
  );
}