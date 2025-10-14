# Webflow Gallery Grid - Easy Setup

I've created a CSS injection system that will automatically style your Webflow gallery into a perfect grid. Here's how to implement it:

## Method 1: Auto-Inject CSS (Recommended)

### Step 1: Add CSS Link to Webflow
1. **Go to Webflow Project Settings**
2. **Click "Custom Code"**
3. **In the "Head Code" section, add:**

```html
<link rel="stylesheet" href="https://eclectic-caramel-34e317.netlify.app/.netlify/functions/webflow-css-grid">
```

### Step 2: That's it!
The CSS will automatically:
- ✅ Create a responsive grid layout
- ✅ Make all images the same size (220px height)
- ✅ Add hover effects
- ✅ Remove white spaces
- ✅ Work on mobile devices

## Method 2: Copy/Paste CSS (Alternative)

If you prefer to add the CSS directly:

1. **Go to Webflow Project Settings > Custom Code**
2. **In "Head Code", add:**

```html
<style>
/* Media Assets Gallery Grid */
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

.w-dyn-item img {
  width: 100% !important;
  height: 220px !important;
  object-fit: cover !important;
  object-position: center !important;
  display: block !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.w-dyn-item .w-dyn-bind-empty,
.w-dyn-item div:not(:first-child) {
  padding: 16px !important;
}

.w-dyn-item h1, .w-dyn-item h2, .w-dyn-item h3, 
.w-dyn-item h4, .w-dyn-item h5, .w-dyn-item h6 {
  font-size: 16px !important;
  font-weight: 600 !important;
  margin: 0 0 8px 0 !important;
  color: #1a1a1a !important;
  line-height: 1.4 !important;
}

.w-dyn-item p, .w-dyn-item span {
  font-size: 14px !important;
  color: #666 !important;
  margin: 4px 0 !important;
  line-height: 1.3 !important;
}

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
</style>
```

## What This Does:

### ✅ Perfect Grid Layout
- **Responsive columns**: Auto-adjusts from 1-4 columns based on screen size
- **Consistent spacing**: 20px gaps between items
- **No white space**: All images same height (220px)

### ✅ Beautiful Styling
- **Rounded corners**: Modern 12px border radius
- **Subtle shadows**: Professional depth effect
- **Hover animations**: Items lift up on hover
- **Clean borders**: Subtle separation

### ✅ Mobile Responsive
- **Tablet**: 2-3 columns with smaller gaps
- **Mobile**: Single column layout
- **Touch-friendly**: Proper spacing for mobile

### ✅ Works Automatically
- **No Designer changes needed**: Uses existing Webflow classes
- **Overrides default styling**: Uses `!important` to ensure it works
- **Future-proof**: Works with new items automatically

## Testing:

After adding the CSS:
1. **Publish your Webflow site**
2. **Check the gallery page**
3. **Should see perfect grid layout immediately**
4. **Test on mobile devices**

## Customization:

Want to adjust the layout? Change these values:

```css
/* Number of columns */
grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))
                                              ↑
                                        Change 300px to:
                                        - 250px = more columns
                                        - 350px = fewer columns

/* Image height */
height: 220px !important;
        ↑
   Change to your preference

/* Spacing */
gap: 20px !important;
     ↑
Change gap between items
```

The grid will be live immediately after you add the CSS to Webflow!