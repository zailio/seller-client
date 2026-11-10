import config from './config';

// POST to a business-dashboard endpoint. The server reads the account role from the
// session; nothing role-related is ever sent from here.
// Resolves with `data` on success, throws an Error with the server message otherwise.
export async function bizPost(path, { auth, session }, body = {}) {
    const res = await fetch(`${config.SERVER_URL}/seller/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth}` },
        body: JSON.stringify({ session_id: session, ...body }),
    });
    let json = null;
    try {
        json = await res.json();
    } catch (e) {
        throw new Error(`Server error (${res.status})`);
    }
    if (!json || !json.status || json.data?.status === false) {
        const error = new Error(json?.data?.message || `Request failed (${res.status})`);
        error.code = json?.data?.code;
        throw error;
    }
    return json.data;
}

// Saves text as a file in the browser (CSV export).
export function downloadText(text, fileName, type = 'text/csv;charset=utf-8') {
    const blob = new Blob(['﻿', text], { type }); // BOM so Excel reads ₹ / Unicode correctly
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
