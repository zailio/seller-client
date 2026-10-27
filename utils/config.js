export default {
    filters: {
        myp: {
            "newest": "Newest",
            "low-to-high": "Low to High",
            "high-to-low": "High to Low",
            "oldest": "Oldest"
        }
    },
    date_option: {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    },
    time_option: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    },
    time_and_date: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true // or false for 24-hour time
    },
    google_client_id: '1056886157027-1rtdbomgd8nsjk96p9rsl447ibo3mmpu.apps.googleusercontent.com',
    WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://theoretical-calypso-inrl-bot-68dd3a69.koyeb.app/ws',
    SERVER_URL: 'https://theoretical-calypso-inrl-bot-68dd3a69.koyeb.app',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:8000',
    NEXT_SERVER_URL: 'https://theoretical-calypso-inrl-bot-68dd3a69.koyeb.app',
    client_url: process.env.NEXT_PUBLIC_CLIENT_URL || 'https://uniyel.com',
    demo: process.env.NEXT_PUBLIC_DEMO === '1',
    android_link: 'https://play.google.com/store/apps/details?id=com.inrloverinfra.zailio',
    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || 'uniyel.com',
    DEFAULT_OG_IMAGE: 'https://uniyel.com/og-image.png'
};
