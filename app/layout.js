import '../styles/globals.css';
import { SharedDataProvider } from '../context/store';
import { WebSocketProvider } from '../context/ws';
import TopLoadingBar from '../components/top_load';

export const metadata = {
  title: { default: 'Zailio Seller Panel', template: '%s | Zailio Seller' },
  description: 'Manage products, orders, delivery and your storefront from one premium seller workspace.',
  robots: 'noindex, nofollow',
  icons: {
    icon: [
      { url: '/icons/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport = { width: 'device-width', initialScale: 1.0, themeColor: '#0f172a' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SharedDataProvider>
          <WebSocketProvider>
            <TopLoadingBar />
            {children}
          </WebSocketProvider>
        </SharedDataProvider>
      </body>
    </html>
  );
}
