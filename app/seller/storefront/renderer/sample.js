// Placeholder products/categories shown until the seller has real ones to display.
export const SAMPLE_PRODUCTS = [
  { id: 's1', title: 'Ceramic Pour-over Set', price: 1999, discount: 1499 },
  { id: 's2', title: 'Linen Throw Blanket', price: 2499, discount: 1799 },
  { id: 's3', title: 'Walnut Wood Organiser', price: 1299, discount: 1299 },
  { id: 's4', title: 'Aroma Soy Candle Trio', price: 999, discount: 699 },
  { id: 's5', title: 'Minimal Desk Lamp', price: 3499, discount: 2799 },
  { id: 's6', title: 'Cotton Bath Towel Pair', price: 1599, discount: 1199 },
  { id: 's7', title: 'Brass Wall Mirror', price: 4299, discount: 3299 },
  { id: 's8', title: 'Stoneware Dinner Plates', price: 2299, discount: 1699 },
  { id: 's9', title: 'Woven Storage Basket', price: 899, discount: 899 },
  { id: 's10', title: 'Glass Water Carafe', price: 799, discount: 599 },
  { id: 's11', title: 'Bamboo Serving Tray', price: 1099, discount: 849 },
  { id: 's12', title: 'Terracotta Planter Set', price: 1399, discount: 999 },
].map((p) => ({ ...p, image: '', isAvailable: true, sample: true }));

export const SAMPLE_CATEGORIES = ['New arrivals', 'Best sellers', 'Offers', 'Gifting', 'Home', 'Decor'].map((name, i) => ({
  id: `sc${i}`, name, slug: name.toLowerCase().replace(/\s+/g, '-'),
  emoji: ['✨', '🔥', '🏷️', '🎁', '🏠', '🪴'][i], image: '', visible: true, productIds: [], sample: true,
}));
