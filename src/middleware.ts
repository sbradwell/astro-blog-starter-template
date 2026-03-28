import { defineMiddleware } from 'astro:middleware';

const isLocalHostname = (hostname: string) =>
	hostname === 'localhost' ||
	hostname === '127.0.0.1' ||
	hostname === '[::1]' ||
	hostname.endsWith('.localhost');

const buildContentSecurityPolicy = (shouldUpgradeInsecureRequests: boolean) => {
	const directives = [
		"default-src 'self'",
		"base-uri 'self'",
		"connect-src 'self'",
		"font-src 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		"img-src 'self' data:",
		"object-src 'none'",
		"script-src 'self'",
		"style-src 'self'",
	];

	if (shouldUpgradeInsecureRequests) {
		directives.push('upgrade-insecure-requests');
	}

	return directives.join('; ');
};

export const onRequest = defineMiddleware(async ({ url }, next) => {
	if (url.protocol === 'http:' && !isLocalHostname(url.hostname)) {
		const redirectUrl = new URL(url);
		redirectUrl.protocol = 'https:';

		return Response.redirect(redirectUrl, 308);
	}

	const response = await next();
	const headers = new Headers(response.headers);
	const isSecureRequest = url.protocol === 'https:';
	const shouldUpgradeInsecureRequests = !isLocalHostname(url.hostname);

	headers.set(
		'Content-Security-Policy',
		buildContentSecurityPolicy(shouldUpgradeInsecureRequests),
	);
	headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('X-Frame-Options', 'DENY');
	headers.set(
		'Permissions-Policy',
		'accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), geolocation=(), gyroscope=(), hid=(), microphone=(), midi=(), payment=(), usb=(), web-share=(), xr-spatial-tracking=()',
	);

	if (isSecureRequest) {
		headers.set('Strict-Transport-Security', 'max-age=31536000');
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
});
