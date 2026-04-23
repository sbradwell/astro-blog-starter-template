const nav = document.querySelector('[data-mobile-nav]');
const toggle = nav?.querySelector('[data-nav-toggle]');
const links = nav?.querySelectorAll('.nav-links a');
const subnavs = nav ? Array.from(nav.querySelectorAll('[data-subnav]')) : [];

const closeSubnav = (subnav) => {
	const subnavToggle = subnav.querySelector('[data-subnav-toggle]');
	const subnavMenu = subnav.querySelector('.nav-subnav-menu');

	subnav.dataset.open = 'false';
	subnavToggle?.setAttribute('aria-expanded', 'false');
	if (subnavMenu) {
		subnavMenu.hidden = true;
	}
};

if (nav && toggle) {
	toggle.addEventListener('click', () => {
		const isOpen = nav.dataset.open === 'true';
		nav.dataset.open = isOpen ? 'false' : 'true';
		toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
		if (isOpen) {
			subnavs.forEach(closeSubnav);
		}
	});

	links?.forEach((link) => {
		link.addEventListener('click', () => {
			nav.dataset.open = 'false';
			toggle.setAttribute('aria-expanded', 'false');
			subnavs.forEach(closeSubnav);
		});
	});
}

subnavs.forEach((subnav) => {
	const subnavToggle = subnav.querySelector('[data-subnav-toggle]');
	const subnavMenu = subnav.querySelector('.nav-subnav-menu');

	if (!subnavToggle || !subnavMenu) {
		return;
	}

	closeSubnav(subnav);

	subnavToggle.addEventListener('click', (event) => {
		event.stopPropagation();
		const isOpen = subnav.dataset.open === 'true';

		subnavs.forEach((item) => {
			if (item !== subnav) {
				closeSubnav(item);
			}
		});

		subnav.dataset.open = isOpen ? 'false' : 'true';
		subnavToggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
		subnavMenu.hidden = isOpen;
	});
});

if (subnavs.length > 0) {
	document.addEventListener('click', (event) => {
		subnavs.forEach((subnav) => {
			if (!subnav.contains(event.target)) {
				closeSubnav(subnav);
			}
		});
	});
}
