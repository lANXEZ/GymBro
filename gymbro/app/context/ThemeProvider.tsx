'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ 
    children, 
    ...props 
}: { 
    children: React.ReactNode; 
    [key: string]: any; 
}) {
  // @ts-ignore: NextThemesProvider typing issue with React 19
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
