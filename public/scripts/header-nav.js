const nav = document.querySelector('[data-mobile-nav]');
const toggle = nav?.querySelector('[data-nav-toggle]');
const links = nav?.querySelectorAll('.nav-links a');
const subnav = nav?.querySelector('[data-subnav]');
const subnavToggle = subnav?.querySelector('[data-subnav-toggle]');
const subnavMenu = subnav?.querySelector('.nav-subnav-menu');

if (nav && toggle) {
	toggle.addEventListener('click', () => {
		const isOpen = nav.dataset.open === 'true';
		nav.dataset.open = isOpen ? 'false' : 'true';
		toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
	});

	links?.forEach((link) => {
		link.addEventListener('click', () => {
			nav.dataset.open = 'false';
			toggle.setAttribute('aria-expanded', 'false');
			if (subnav && subnavToggle && subnavMenu) {
				subnav.dataset.open = 'false';
				subnavToggle.setAttribute('aria-expanded', 'false');
				subnavMenu.hidden = true;
			}
		});
	});
}

if (subnav && subnavToggle && subnavMenu) {
	subnav.dataset.open = 'false';
	subnavMenu.hidden = true;

	subnavToggle.addEventListener('click', (event) => {
		event.stopPropagation();
		const isOpen = subnav.dataset.open === 'true';
		subnav.dataset.open = isOpen ? 'false' : 'true';
		subnavToggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
		subnavMenu.hidden = isOpen;
	});

	document.addEventListener('click', (event) => {
		if (!subnav.contains(event.target)) {
			subnav.dataset.open = 'false';
			subnavToggle.setAttribute('aria-expanded', 'false');
			subnavMenu.hidden = true;
		}
	});
}
