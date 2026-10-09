export default function ShopLoading() {
  const skeletons = Array.from({ length: 8 });

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes kyroLoadingPulse {
              0%, 100% {
                opacity: .55;
              }

              50% {
                opacity: 1;
              }
            }

            @keyframes kyroLoadingShimmer {
              0% {
                background-position: -500px 0;
              }

              100% {
                background-position: 500px 0;
              }
            }

            .kyro-loading {
              min-height: 100vh;
              background:
                radial-gradient(
                  circle at 85% 0%,
                  rgba(176,141,60,.07),
                  transparent 28%
                ),
                linear-gradient(
                  180deg,
                  #f8f6f0,
                  #faf8f3
                );
              padding: 24px 0 80px;
            }

            .kyro-loading-inner {
              width: min(
                1380px,
                calc(100% - 32px)
              );
              margin: 0 auto;
            }

            .kyro-loading-block {
              background:
                linear-gradient(
                  90deg,
                  #e9e5dc 25%,
                  #f3f0e9 50%,
                  #e9e5dc 75%
                );
              background-size: 1000px 100%;
              animation:
                kyroLoadingShimmer 1.8s
                linear infinite;
            }

            .kyro-loading-header {
              padding: 18px 0 20px;
            }

            .kyro-loading-eyebrow {
              width: 130px;
              height: 9px;
              border-radius: 20px;
              margin-bottom: 12px;
            }

            .kyro-loading-title {
              width: 290px;
              height: 42px;
              border-radius: 8px;
              margin-bottom: 10px;
            }

            .kyro-loading-description {
              width: 390px;
              max-width: 80%;
              height: 14px;
              border-radius: 20px;
            }

            .kyro-loading-filter {
              height: 92px;
              margin-bottom: 22px;
              border: 1px solid rgba(23,23,23,.06);
              border-radius: 22px;
              padding: 13px;
            }

            .kyro-loading-filter-top {
              width: 130px;
              height: 9px;
              margin-bottom: 14px;
              border-radius: 20px;
            }

            .kyro-loading-filter-row {
              display: grid;
              grid-template-columns:
                2fr
                1fr
                1fr
                1fr;
              gap: 9px;
            }

            .kyro-loading-filter-item {
              height: 40px;
              border-radius: 999px;
            }

            .kyro-loading-results {
              width: 210px;
              height: 11px;
              margin-bottom: 14px;
              border-radius: 20px;
            }

            .kyro-loading-grid {
              display: grid;
              grid-template-columns:
                repeat(4, minmax(0, 1fr));
              gap: 18px;
            }

            .kyro-loading-card {
              overflow: hidden;
              border: 1px solid rgba(23,23,23,.06);
              border-radius: 20px;
              background: rgba(255,254,250,.7);
            }

            .kyro-loading-image {
              aspect-ratio: .91;
            }

            .kyro-loading-content {
              padding: 18px;
            }

            .kyro-loading-brand {
              width: 65px;
              height: 8px;
              margin-bottom: 10px;
              border-radius: 20px;
            }

            .kyro-loading-name {
              width: 80%;
              height: 16px;
              margin-bottom: 9px;
              border-radius: 6px;
            }

            .kyro-loading-price {
              width: 65px;
              height: 14px;
              margin-bottom: 16px;
              border-radius: 6px;
            }

            .kyro-loading-text {
              width: 100%;
              height: 38px;
              margin-bottom: 16px;
              border-radius: 8px;
            }

            .kyro-loading-button {
              height: 43px;
              border-radius: 999px;
            }

            @media (max-width: 1180px) {
              .kyro-loading-grid {
                grid-template-columns:
                  repeat(3, minmax(0, 1fr));
              }
            }

            @media (max-width: 850px) {
              .kyro-loading-inner {
                width: min(
                  100% - 24px,
                  700px
                );
              }

              .kyro-loading-filter {
                height: 140px;
              }

              .kyro-loading-filter-row {
                grid-template-columns:
                  1fr 1fr;
              }

              .kyro-loading-grid {
                grid-template-columns:
                  repeat(2, minmax(0, 1fr));
                gap: 13px;
              }
            }

            @media (max-width: 520px) {
              .kyro-loading-inner {
                width: calc(100% - 20px);
              }

              .kyro-loading-title {
                width: 230px;
                height: 36px;
              }

              .kyro-loading-filter {
                height: 185px;
              }

              .kyro-loading-filter-row {
                grid-template-columns: 1fr;
              }

              .kyro-loading-grid {
                grid-template-columns: 1fr;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .kyro-loading-block {
                animation: kyroLoadingPulse 1.5s
                  ease-in-out infinite;
              }
            }
          `,
        }}
      />

      <main className="kyro-loading">
        <div className="kyro-loading-inner">

          {/* HEADER */}

          <div className="kyro-loading-header">
            <div className="kyro-loading-block kyro-loading-eyebrow" />

            <div className="kyro-loading-block kyro-loading-title" />

            <div className="kyro-loading-block kyro-loading-description" />
          </div>

          {/* FILTERS */}

          <div className="kyro-loading-filter">
            <div className="kyro-loading-block kyro-loading-filter-top" />

            <div className="kyro-loading-filter-row">
              <div className="kyro-loading-block kyro-loading-filter-item" />
              <div className="kyro-loading-block kyro-loading-filter-item" />
              <div className="kyro-loading-block kyro-loading-filter-item" />
              <div className="kyro-loading-block kyro-loading-filter-item" />
            </div>
          </div>

          {/* RESULTS */}

          <div className="kyro-loading-block kyro-loading-results" />

          {/* PRODUCT SKELETONS */}

          <div className="kyro-loading-grid">
            {skeletons.map((_, index) => (
              <div
                key={index}
                className="kyro-loading-card"
              >
                <div className="kyro-loading-block kyro-loading-image" />

                <div className="kyro-loading-content">
                  <div className="kyro-loading-block kyro-loading-brand" />

                  <div className="kyro-loading-block kyro-loading-name" />

                  <div className="kyro-loading-block kyro-loading-price" />

                  <div className="kyro-loading-block kyro-loading-text" />

                  <div className="kyro-loading-block kyro-loading-button" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}