import { Product } from '../types';

/**
 * Determines whether a product qualifies as a Top Seller (Meilleure Vente).
 * Products with high stock or marked explicitly as top sellers are flagged.
 */
export function isProductTopSeller(product: Product): boolean {
  if (product.isTopSeller === true) return true;
  if (product.isTopSeller === false) return false;

  // Extrait: stock in grams (high stock >= 1500g)
  if (product.family === 'Extrait') {
    return product.stock >= 1500;
  }

  // Flacon: stock in bottle units (high stock >= 100 units)
  if (product.family === 'Flacon') {
    return product.stock >= 100;
  }

  // Accessoire: stock in accessory units (high stock >= 50 units)
  if (product.family === 'Accessoire') {
    return product.stock >= 50;
  }

  return product.stock >= 500;
}
