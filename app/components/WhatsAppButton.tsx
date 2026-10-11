"use client";

import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in on mount
    setIsVisible(true);
  }, []);

  const whatsappNumber = "94768644132";
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <div className="whatsapp-button-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .whatsapp-button-container {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 40;
        }

        .whatsapp-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: auto;
          min-width: 155px;
          height: 52px;
          padding: 0 20px;
          border-radius: 28px;
          background: #25D366;
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(37, 211, 102, 0.35);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: whatsappFadeIn 0.6s ease-out forwards;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
        }

        .whatsapp-button:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 28px rgba(37, 211, 102, 0.45);
        }

        .whatsapp-button:active {
          transform: scale(1.03);
        }

        .whatsapp-button-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 24px;
        }

        .whatsapp-button-text {
          flex: 1;
        }

        @keyframes whatsappFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Tablet adjustments */
        @media (max-width: 768px) {
          .whatsapp-button-container {
            bottom: 20px;
            right: 20px;
          }

          .whatsapp-button {
            min-width: 150px;
            height: 50px;
            font-size: 12px;
            gap: 8px;
            padding: 0 18px;
          }
        }

        /* Mobile adjustments */
        @media (max-width: 480px) {
          .whatsapp-button-container {
            bottom: 16px;
            right: 16px;
          }

          .whatsapp-button {
            width: auto;
            height: 50px;
            font-size: 12px;
            min-width: auto;
            padding: 0 16px;
            gap: 6px;
          }

          .whatsapp-button-logo {
            flex: 0 0 20px;
          }
        }

        /* Extra small screens */
        @media (max-width: 375px) {
          .whatsapp-button-container {
            bottom: 12px;
            right: 12px;
          }

          .whatsapp-button {
            height: 44px;
            font-size: 11px;
            padding: 0 14px;
            min-width: auto;
          }

          .whatsapp-button-text {
            display: none;
          }

          .whatsapp-button-logo {
            flex: 0 0 22px;
          }
        }
      `}} />

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-button"
        aria-label="Chat with Seller on WhatsApp"
      >
        <div className="whatsapp-button-logo">
          <FaWhatsapp size={24} />
        </div>
        <span className="whatsapp-button-text">Chat with Seller</span>
      </a>
    </div>
  );
}
