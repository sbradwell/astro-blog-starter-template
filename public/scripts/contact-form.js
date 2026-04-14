const dialog = document.querySelector('#contact-modal');
const form = document.querySelector('#contact-form');
const status = document.querySelector('#contact-status');
const submitButton = document.querySelector('#contact-submit');
const nameField = document.querySelector('#contact-name');
const emailField = document.querySelector('#contact-email');
const companyField = document.querySelector('#contact-company');
const messageField = document.querySelector('#contact-message');
const openButtons = document.querySelectorAll('[data-open-contact]');
const closeButtons = document.querySelectorAll('[data-close-contact]');

const trackContactEvent = (eventName) => {
	if (typeof window.gtag !== 'function') return;

	window.gtag('event', eventName, {
		event_category: 'engagement',
		event_label: 'contact_form',
	});
};

if (
	dialog instanceof HTMLDialogElement &&
	form instanceof HTMLFormElement &&
	status instanceof HTMLElement &&
	submitButton instanceof HTMLButtonElement &&
	nameField instanceof HTMLInputElement &&
	emailField instanceof HTMLInputElement &&
	companyField instanceof HTMLInputElement &&
	messageField instanceof HTMLTextAreaElement
) {
	const setStatus = (message, tone) => {
		status.textContent = message;
		status.dataset.state = tone;
	};

	const openDialog = () => {
		dialog.showModal();
		trackContactEvent('contact_open');
		document.body.classList.add('modal-open');
		setStatus('', '');
		window.requestAnimationFrame(() => {
			const firstField = form.querySelector('input');
			if (firstField instanceof HTMLInputElement) firstField.focus();
		});
	};

	const closeDialog = () => {
		dialog.close();
		document.body.classList.remove('modal-open');
	};

	openButtons.forEach((button) => {
		button.addEventListener('click', openDialog);
	});

	closeButtons.forEach((button) => {
		button.addEventListener('click', closeDialog);
	});

	dialog.addEventListener('click', (event) => {
		const bounds = dialog.getBoundingClientRect();
		const clickedOutside =
			event.clientX < bounds.left ||
			event.clientX > bounds.right ||
			event.clientY < bounds.top ||
			event.clientY > bounds.bottom;

		if (clickedOutside) closeDialog();
	});

	dialog.addEventListener('close', () => {
		document.body.classList.remove('modal-open');
	});

	form.addEventListener('submit', async (event) => {
		event.preventDefault();

		if (!form.reportValidity()) return;

		if (messageField.value.trim().length < 20) {
			setStatus('Add a short note so we have context.', 'error');
			messageField.focus();
			return;
		}

		submitButton.disabled = true;
		setStatus('Sending...', 'pending');

		try {
			const payload = {
				name: nameField.value.trim(),
				email: emailField.value.trim(),
				company: companyField.value.trim(),
				message: messageField.value.trim(),
			};

			console.log('[contact-form] submitting payload', payload);

			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			const result = await response.json();

			console.log('[contact-form] response', {
				status: response.status,
				ok: response.ok,
				result,
			});

			if (!response.ok) {
				throw new Error(result.error || 'Message could not be sent.');
			}

			form.reset();
			setStatus('Message sent. NorthLine will respond shortly.', 'success');
			trackContactEvent('contact_submit');
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Message could not be sent.';
			setStatus(message, 'error');
		} finally {
			submitButton.disabled = false;
		}
	});
}
