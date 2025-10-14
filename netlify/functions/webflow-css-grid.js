/**
 * Webflow CSS Grid Injection
 * 
 * This function provides the CSS needed for a consistent gallery grid layout.
 * It can be embedded directly in Webflow or used as a reference.
 */

exports.handler = async (event) => {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'text/css'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: 'Method Not Allowed'
    };
  }

  // CSS for consistent gallery grid
  const css = `
/* Media Assets Gallery Grid - Auto-injected CSS */
.w-dyn-list {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
  gap: 20px !important;
  padding: 20px !important;
  list-style: none !important;
}

.w-dyn-item {
  background: white !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  transition: all 0.3s ease !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.w-dyn-item:hover {
  transform: translateY(-8px) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

/* Image styling for consistent grid */
.w-dyn-item img {
  width: 100% !important;
  height: 220px !important;
  object-fit: cover !important;
  object-position: center !important;
  display: block !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}

/* Content area styling */
.w-dyn-item .w-dyn-bind-empty,
.w-dyn-item div:not(:first-child) {
  padding: 16px !important;
}

/* Title styling */
.w-dyn-item h1,
.w-dyn-item h2,
.w-dyn-item h3,
.w-dyn-item h4,
.w-dyn-item h5,
.w-dyn-item h6 {
  font-size: 16px !important;
  font-weight: 600 !important;
  margin: 0 0 8px 0 !important;
  color: #1a1a1a !important;
  line-height: 1.4 !important;
}

/* Meta text styling */
.w-dyn-item p,
.w-dyn-item span {
  font-size: 14px !important;
  color: #666 !important;
  margin: 4px 0 !important;
  line-height: 1.3 !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .w-dyn-list {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)) !important;
    gap: 16px !important;
    padding: 16px !important;
  }
  
  .w-dyn-item img {
    height: 180px !important;
  }
}

@media (max-width: 480px) {
  .w-dyn-list {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
    padding: 12px !important;
  }
  
  .w-dyn-item img {
    height: 200px !important;
  }
}

/* Loading state */
.w-dyn-list.w-dyn-processing {
  opacity: 0.7;
}

/* Empty state */
.w-dyn-empty {
  grid-column: 1 / -1 !important;
  text-align: center !important;
  padding: 40px !important;
  color: #999 !important;
}

/* Ensure images load properly */
.w-dyn-item img[src=""] {
  background: #f5f5f5 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.w-dyn-item img[src=""]:after {
  content: "Loading..." !important;
  color: #999 !important;
  font-size: 14px !important;
}
`;

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: css
  };
};