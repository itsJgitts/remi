// Use Web Crypto so service-account signing also works with the older Pages bundler.
export async function getGoogleAccessToken(email: string, privateKey: string) {
	const encode = (bytes: Uint8Array) =>
		btoa(String.fromCharCode(...bytes))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
	const encodeJson = (value: object) => encode(new TextEncoder().encode(JSON.stringify(value)));
	const now = Math.floor(Date.now() / 1000);
	const unsigned = `${encodeJson({ alg: 'RS256', typ: 'JWT' })}.${encodeJson({
		iss: email,
		scope: 'https://www.googleapis.com/auth/spreadsheets',
		aud: 'https://oauth2.googleapis.com/token',
		iat: now,
		exp: now + 3600
	})}`;
	const pem = privateKey
		.replace('-----BEGIN PRIVATE KEY-----', '')
		.replace('-----END PRIVATE KEY-----', '')
		.replace(/\s/g, '');
	const key = await crypto.subtle.importKey(
		'pkcs8',
		Uint8Array.from(atob(pem), (char) => char.charCodeAt(0)),
		{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign(
		'RSASSA-PKCS1-v1_5',
		key,
		new TextEncoder().encode(unsigned)
	);
	const response = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
			assertion: `${unsigned}.${encode(new Uint8Array(signature))}`
		})
	});
	if (!response.ok) {
		throw new Error(`Google service-account authentication failed (HTTP ${response.status})`);
	}
	const token = (await response.json()) as { access_token?: string; expires_in?: number };
	if (!token.access_token || !token.expires_in) {
		throw new Error('Google returned an invalid access token response');
	}
	return { access_token: token.access_token, expiry_date: Date.now() + token.expires_in * 1000 };
}
