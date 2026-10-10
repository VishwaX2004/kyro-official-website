"use client";

import { useEffect, useState } from "react";

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
          {/* Official WhatsApp SVG Logo */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a6.963 6.963 0 00-6.963 6.963c0 1.364.329 2.682.961 3.853L2.05 21.979l3.329-1.073c1.146.647 2.45.99 3.85.99h.004a6.963 6.963 0 006.963-6.963c0-1.861-.714-3.616-2.012-4.914-1.298-1.298-3.053-2.012-4.914-2.012" />
          </svg>
        </div>
        <span className="whatsapp-button-text">Chat with Seller</span>
      </a>
    </div>
  );
}
