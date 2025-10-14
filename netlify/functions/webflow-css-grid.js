/**
 * Webflow CSS Grid Fix
 * 
 * This provides the CORRECT CSS to fix the gallery layout based on the actual Webflow structure.
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

  // CORRECT CSS for Webflow gallery grid - targets actual Webflow classes
  const css = `
/* WEBFLOW GALLERY GRID FIX */

/* Target the actual collection list wrapper */
[data-w-id] .w-dyn-list,
.collection-list-wrapper,
.w-dyn-list {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
  gap: 24px !important;
  padding: 24px !important;
  width: 100% !important;
  max-width: 1200px !important;
  margin: 0 auto !important;
}

/* Target collection items */
.w-dyn-item,
.collection-item,
[data-w-id] .w-dyn-item {
  display: block !important;
  background: white !important;
  border-radius: 8px !important;
  overflow: hidden !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
  width: 100% !important;
  height: auto !important;
}

.w-dyn-item:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
}

/* Fix the images - this is the key part */
.w-dyn-item img,
.collection-item img,
.w-dyn-item .w-dyn-bind-empty img,
[data-w-id] img {
  width: 100% !important;
  height: 200px !important;
  object-fit: cover !important;
  object-position: center !important;
  display: block !important;
  margin: 0 !important;
}

/* Content area */
.w-dyn-item > div,
.collection-item > div {
  padding: 16px !important;
}

/* Text elements */
.w-dyn-item h1, .w-dyn-item h2, .w-dyn-item h3,
.w-dyn-item h4, .w-dyn-item h5, .w-dyn-item h6 {
  font-size: 16px !important;
  font-weight: 600 !important;
  margin: 0 0 8px 0 !important;
  color: #333 !important;
  line-height: 1.3 !important;
}

.w-dyn-item p, .w-dyn-item span, .w-dyn-item div {
  font-size: 14px !important;
  color: #666 !important;
  margin: 4px 0 !important;
  line-height: 1.4 !important;
}

/* Force override any existing flex or other layouts */
.w-dyn-list * {
  box-sizing: border-box !important;
}

/* Responsive */
@media (max-width: 768px) {
  .w-dyn-list {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
    gap: 16px !important;
    padding: 16px !important;
  }
  
  .w-dyn-item img {
    height: 180px !important;
  }
}

@media (max-width: 480px) {
  .w-dyn-list {
    grid-template-columns: 1fr 1fr !important;
    gap: 12px !important;
    padding: 12px !important;
  }
  
  .w-dyn-item img {
    height: 160px !important;
  }
}

/* Nuclear option - if nothing else works */
.w-dyn-list {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 20px !important;
}

.w-dyn-item {
  width: 100% !important;
  aspect-ratio: 1 !important;
}

.w-dyn-item img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}
`;

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: css
  };
};