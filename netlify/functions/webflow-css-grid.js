/**
 * CORRECT CSS FIX for Webflow Gallery
 * Based on actual page structure analysis
 */

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'text/css'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  // CSS based on actual Webflow structure from scraping
  const css = `
/* WEBFLOW COLLECTION LIST GRID FIX */

/* Target the collection list container */
.w-dyn-list {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
  gap: 24px !important;
  padding: 24px !important;
  width: 100% !important;
  max-width: 1200px !important;
  margin: 0 auto !important;
  list-style: none !important;
}

/* Collection items */
.w-dyn-item {
  background: white !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: 1px solid rgba(0,0,0,0.04) !important;
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
}

.w-dyn-item:hover {
  transform: translateY(-8px) !important;
  box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important;
}

/* Images - the key fix */
.w-dyn-item img {
  width: 100% !important;
  height: 240px !important;
  object-fit: cover !important;
  object-position: center !important;
  display: block !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  flex-shrink: 0 !important;
}

/* Content area */
.w-dyn-item > div:not(:first-child),
.w-dyn-item .w-dyn-bind-empty {
  padding: 20px !important;
  flex-grow: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
}

/* Title styling */
.w-dyn-item h1, .w-dyn-item h2, .w-dyn-item h3,
.w-dyn-item h4, .w-dyn-item h5, .w-dyn-item h6 {
  font-size: 18px !important;
  font-weight: 700 !important;
  margin: 0 0 12px 0 !important;
  color: #1a1a1a !important;
  line-height: 1.3 !important;
  text-align: left !important;
}

/* Meta text */
.w-dyn-item p, .w-dyn-item span {
  font-size: 14px !important;
  color: #6b7280 !important;
  margin: 4px 0 !important;
  line-height: 1.4 !important;
}

/* Responsive breakpoints */
@media (max-width: 1024px) {
  .w-dyn-list {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
    gap: 20px !important;
    padding: 20px !important;
  }
}

@media (max-width: 768px) {
  .w-dyn-list {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
    gap: 16px !important;
    padding: 16px !important;
  }
  
  .w-dyn-item img {
    height: 200px !important;
  }
  
  .w-dyn-item > div:not(:first-child) {
    padding: 16px !important;
  }
}

@media (max-width: 480px) {
  .w-dyn-list {
    grid-template-columns: 1fr 1fr !important;
    gap: 12px !important;
    padding: 12px !important;
  }
  
  .w-dyn-item img {
    height: 180px !important;
  }
  
  .w-dyn-item h1, .w-dyn-item h2, .w-dyn-item h3,
  .w-dyn-item h4, .w-dyn-item h5, .w-dyn-item h6 {
    font-size: 16px !important;
  }
}

/* Loading states */
.w-dyn-list.w-dyn-processing {
  opacity: 0.7 !important;
}

.w-dyn-empty {
  grid-column: 1 / -1 !important;
  text-align: center !important;
  padding: 60px 20px !important;
  color: #9ca3af !important;
  font-size: 16px !important;
}
`;

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: css
  };
};