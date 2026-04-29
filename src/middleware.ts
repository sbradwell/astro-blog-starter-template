import { defineMiddleware } from 'astro:middleware';

const isLocalHostname = (hostname: string) =>
	hostname === 'localhost' ||
	hostname === '127.0.0.1' ||
	hostname === '[::1]' ||
	hostname.endsWith('.localhost');

const buildContentSecurityPolicy = (isLocalRequest: boolean, shouldUpgradeInsecureRequests: boolean) => {
	const directives = [
		"default-src 'self'",
		"base-uri 'self'",
		"connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com",
		"font-src 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		"img-src 'self' data: https://www.google-analytics.com",
		"object-src 'none'",
		`script-src 'self' https://www.googletagmanager.com${isLocalRequest ? " 'unsafe-inline'" : ''}`,
		`style-src 'self'${isLocalRequest ? " 'unsafe-inline'" : ''}`,
	];

	if (shouldUpgradeInsecureRequests) {
		directives.push('upgrade-insecure-requests');
	}

	return directives.join('; ');
};

export const onRequest = defineMiddleware(async ({ url }, next) => {
	const response = await next();
	const headers = new Headers(response.headers);
	const isSecureRequest = url.protocol === 'https:';
	const isLocalRequest = isLocalHostname(url.hostname);
	const shouldUpgradeInsecureRequests = !isLocalRequest;

	headers.set(
		'Content-Security-Policy',
		buildContentSecurityPolicy(isLocalRequest, shouldUpgradeInsecureRequests),
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
