import type { APIRoute } from 'astro';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	const env = locals.runtime.env;
	const contentType = request.headers.get('content-type') ?? '';
	let payload: Record<string, unknown> = {};
	let rawBody = '';

	try {
		rawBody = await request.text();
		console.log('[contact] raw body', rawBody);
		const parsed = rawBody ? JSON.parse(rawBody) : {};
		payload =
			typeof parsed === 'string'
				? JSON.parse(parsed)
					: parsed && typeof parsed === 'object'
					? (parsed as Record<string, unknown>)
					: {};
	} catch (error) {
		console.log('[contact] payload parse error', {
			contentType,
			rawBody,
			error,
		});
		return new Response(JSON.stringify({ error: 'Invalid request payload.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	console.log('[contact] request info', {
		contentType,
		payload,
		payloadType: typeof payload,
		keys: Object.keys(payload),
	});

	const name = String(payload.name ?? '').trim();
	const email = String(payload.email ?? '').trim();
	const company = String(payload.company ?? '').trim();
	const message = String(payload.message ?? '').trim();

	console.log('[contact] normalized fields', {
		name,
		email,
		company,
		messageLength: message.length,
	});

	if (!name || !email || !company || !message) {
		console.log('[contact] validation failed: missing required fields');
		return new Response(
			JSON.stringify({
				error: 'All fields are required.',
				debug: {
					contentType,
					rawBody,
					payload,
					keys: Object.keys(payload),
					normalized: {
						name,
						email,
						company,
						messageLength: message.length,
					},
				},
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}

	if (!emailPattern.test(email)) {
		console.log('[contact] validation failed: invalid email');
		return new Response(JSON.stringify({ error: 'Enter a valid email address.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	if (message.length < 20) {
		console.log('[contact] validation failed: message too short');
		return new Response(JSON.stringify({ error: 'Add a short note so we have context.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
		console.log('[contact] validation failed: missing env configuration', {
			hasResendKey: Boolean(env.RESEND_API_KEY),
			hasToEmail: Boolean(env.CONTACT_TO_EMAIL),
			hasFromEmail: Boolean(env.CONTACT_FROM_EMAIL),
		});
		return new Response(JSON.stringify({ error: 'Email service is not configured.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const resendResponse = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from: env.CONTACT_FROM_EMAIL,
			to: [env.CONTACT_TO_EMAIL],
			reply_to: email,
			subject: `NorthLine inquiry: ${name}${company ? ` (${company})` : ''}`,
			text: [
				'New NorthLine inquiry',
				'',
				`Name: ${name}`,
				`Email: ${email}`,
				`Company: ${company}`,
				'',
				'Message:',
				message,
			].join('\n'),
		}),
	});

	if (!resendResponse.ok) {
		const resendError = await resendResponse.text();
		console.log('[contact] resend error', resendError);

		return new Response(
			JSON.stringify({
				error: 'Message could not be sent.',
				details: resendError,
			}),
			{
				status: 502,
				headers: { 'Content-Type': 'application/json' },
			},
		);
	}

	console.log('[contact] message sent successfully');

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
