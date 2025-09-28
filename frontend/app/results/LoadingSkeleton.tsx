"use client";

export default function LoadingSkeleton() {
  return (
    <div className="loading-skeleton">
      {/* Header skeleton */}
      <div className="header-skeleton">
        <div className="back-button-skeleton"></div>
        <div className="title-skeleton"></div>
        <div className="summary-skeleton">
          <div className="summary-item-skeleton"></div>
          <div className="summary-item-skeleton"></div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="content-skeleton">
        {/* Sidebar skeleton */}
        <div className="sidebar-skeleton">
          <div className="sidebar-header-skeleton">
            <div className="sidebar-title-skeleton"></div>
            <div className="sort-select-skeleton"></div>
          </div>
          <div className="listings-skeleton">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="listing-card-skeleton">
                <div className="listing-header-skeleton">
                  <div className="listing-address-skeleton"></div>
                  <div className="listing-meta-skeleton"></div>
                </div>
                <div className="listing-reason-skeleton"></div>
                <div className="hobby-chips-skeleton">
                  <div className="hobby-chip-skeleton"></div>
                  <div className="hobby-chip-skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map skeleton */}
        <div className="map-skeleton">
          <div className="map-loading-text">Loading your personalized results...</div>
        </div>
      </div>

      <style jsx>{`
        .loading-skeleton {
          min-height: 100vh;
          width: 100%;
          position: relative;
          background: #000;
          display: flex;
          flex-direction: column;
          padding-top: 80px;
        }

        .header-skeleton {
          padding: 1rem 2rem;
          margin-bottom: 1rem;
        }

        .back-button-skeleton {
          width: 80px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          margin-bottom: 1rem;
          animation: pulse 2s infinite;
        }

        .title-skeleton {
          width: 300px;
          height: 36px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          margin-bottom: 16px;
          animation: pulse 2s infinite;
        }

        .summary-skeleton {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }

        .summary-item-skeleton {
          width: 250px;
          height: 60px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          animation: pulse 2s infinite;
        }

        .content-skeleton {
          flex: 1;
          display: flex;
          overflow: hidden;
          margin: 0 2rem 2rem 2rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(6px);
        }

        .sidebar-skeleton {
          width: 400px;
          background: rgba(255, 255, 255, 0.1);
          border-right: 1px solid rgba(255, 255, 255, 0.18);
          display: flex;
          flex-direction: column;
        }

        .sidebar-header-skeleton {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.18);
        }

        .sidebar-title-skeleton {
          width: 180px;
          height: 24px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          margin-bottom: 1rem;
          animation: pulse 2s infinite;
        }

        .sort-select-skeleton {
          width: 100%;
          height: 44px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          animation: pulse 2s infinite;
        }

        .listings-skeleton {
          flex: 1;
          padding: 0.5rem;
        }

        .listing-card-skeleton {
          margin: 0.5rem;
          padding: 1.25rem;
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          min-height: 140px;
        }

        .listing-header-skeleton {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .listing-address-skeleton {
          width: 200px;
          height: 22px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          animation: pulse 2s infinite;
        }

        .listing-meta-skeleton {
          width: 100px;
          height: 36px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          animation: pulse 2s infinite;
        }

        .listing-reason-skeleton {
          width: 90%;
          height: 18px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          margin-bottom: 0.75rem;
          animation: pulse 2s infinite;
        }

        .hobby-chips-skeleton {
          display: flex;
          gap: 6px;
        }

        .hobby-chip-skeleton {
          width: 60px;
          height: 24px;
          background: rgba(147, 197, 253, 0.2);
          border-radius: 12px;
          animation: pulse 2s infinite;
        }

        .map-skeleton {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0 16px 16px 0;
        }

        .map-loading-text {
          font-family: "Geist", Arial, sans-serif;
          font-size: 18px;
          color: rgb(200, 200, 200);
          text-align: center;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.9;
          }
        }

        @media (max-width: 768px) {
          .sidebar-skeleton {
            width: 300px;
          }

          .content-skeleton {
            margin: 0 1rem 1rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}