'use client';
import { createContext, useContext } from 'react';

/**
 * Shared Studio services:
 *  uploadImage(file) -> Promise<url>
 *  notify(title, message) · confirm({title, message, confirmText, onConfirm})
 *  pickProducts({ selected, multiple, title, onConfirm(products[]) })
 *  categories : seller-defined categories of the current draft
 *  mode       : 'server' | 'local'
 */
export const StudioContext = createContext(null);
export const useStudio = () => useContext(StudioContext);
