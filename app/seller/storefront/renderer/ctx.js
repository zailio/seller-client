'use client';
import { createContext, useContext } from 'react';

export const SfContext = createContext({ config: null, editor: null, linkCtx: {}, products: [] });
export const useSf = () => useContext(SfContext);
