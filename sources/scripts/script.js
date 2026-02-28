/* ---------- UTILS ---------- */

function copy(text) {
    if (window.confirm(text + "\nCopier dans le presse papier ?")) {
        var elem = document.createElement("textarea");
        document.body.appendChild(elem);
        elem.value = text;
        elem.select();
        navigator.clipboard.writeText(elem.value);
        document.body.removeChild(elem);
    }
}

function humanizeDurationSeconds(nbSeconds, maxUnits = 6) {
    /*
    Convert a duration in seconds to a human-readable format, with a maximum number of units to display
    (default: 6, which means display all units)
    */

    var seconds = nbSeconds % 60;
    var minutes = Math.floor(nbSeconds / 60) % 60;
    var hours = Math.floor(nbSeconds / 60 / 60) % 24;
    var days = Math.floor(nbSeconds / 60 / 60 / 24) % 30;
    var months = Math.floor(nbSeconds / 60 / 60 / 24 / 30) % 12;
    var years = Math.floor(nbSeconds / 60 / 60 / 24 / 30 / 12);

    var humanized = '';
    
    if (years > 0 && maxUnits > 0) {
        humanized += ' ' + years + ' an' + (years > 1 ? 's' : '');
        maxUnits--;
    }
    if (months > 0 && maxUnits > 0) {
        humanized += ' ' + months + ' mois';
        maxUnits--;
    }
    if (days > 0 && maxUnits > 0) {
        humanized += ' ' + days + ' jour' + (days > 1 ? 's' : '');
        maxUnits--;
    }
    if (hours > 0 && maxUnits > 0) {
        humanized += ' ' + hours + ' heure' + (hours > 1 ? 's' : '');
        maxUnits--;
    }
    if (minutes > 0 && maxUnits > 0) {
        humanized += ' ' + minutes + ' minute' + (minutes > 1 ? 's' : '');
        maxUnits--;
    }
    if (seconds > 0 && maxUnits > 0) {
        humanized += ' ' + seconds + ' seconde' + (seconds > 1 ? 's' : '');
        maxUnits--;
    }

    return humanized;
}

function humanizeDurationDays(nbDays, maxUnits = 2) {
    return humanizeDurationSeconds(nbDays * 24 * 60 * 60, maxUnits);
}


/* ---------- HEADER ---------- */

// Set translate link target language based on user's browser language
// Hide the button if the page is already being viewed through Google Translate
document.addEventListener('DOMContentLoaded', function () {
    const translateLink = document.getElementById('translate-btn');
    if (translateLink) {
        if (window.location.hostname.endsWith('.translate.goog')) {
            translateLink.style.display = 'none';
        } else {
            const lang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
            const langCode = lang.split('-')[0];
            const targetLang = langCode === 'fr' ? 'en' : langCode;
            const url = new URL(translateLink.href);
            url.searchParams.set('tl', targetLang);
            translateLink.href = url.toString();
        }
    }
});

/* ---------- TRANSLATE BANNER ---------- */

async function initTranslateBanner() {
    // Don't show if already on a translated page
    if (window.location.hostname.endsWith('.translate.goog')) return;

    // Don't show if user previously dismissed it
    if (localStorage.getItem('translate-banner-dismissed') === '1') return;

    const lang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    const langCode = lang.split('-')[0];

    // Don't show if user's language is already French
    if (langCode === 'fr') return;

    const banner = document.getElementById('translate-banner');
    const link = document.getElementById('translate-banner-link');
    if (!banner || !link) return;

    // Build the Google Translate link for the user's language
    link.href = `https://translate.google.com/translate?sl=fr&tl=${encodeURIComponent(langCode)}&u=${encodeURIComponent('http://alexandre.malfre.yt/')}`;

    // Translate the banner text via the free Google Translate API
    const sourceFr = 'Cette page est en français — Cliquer ici pour la traduire automatiquement (via Google Traduction)';
    try {
        const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${encodeURIComponent(langCode)}&dt=t&q=${encodeURIComponent(sourceFr)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        const translated = data[0].map(chunk => chunk[0]).join('');
        link.textContent = translated;
    } catch (e) {
        // Fallback: show the French text as-is
        link.textContent = sourceFr;
    }

    document.getElementById('translate-banner-close').addEventListener('click', function () {
        banner.style.display = 'none';
        document.documentElement.style.setProperty('--banner-height', '0px');
        localStorage.setItem('translate-banner-dismissed', '1');
    });

    banner.style.display = 'flex';
    document.documentElement.style.setProperty('--banner-height', banner.offsetHeight + 'px');
}

document.addEventListener('DOMContentLoaded', initTranslateBanner);


function checkHeaderIconsOverflow() {
    /* Check if the line of icons in the header overflows into multiple lines
    and add a class to the parent element if it does */

    const container = document.querySelector('.liens ul');
    if (!container || container.children.length === 0) return;

    const originalWhiteSpace = container.style.whiteSpace;

    // Temporarily set white-space to nowrap to measure height of one line
    container.style.whiteSpace = 'nowrap';
    const oneLineHeight = container.scrollHeight;

    // Temporarily set white-space to normal to measure total height
    container.style.whiteSpace = 'normal';
    const totalHeight = container.scrollHeight;

    // Revert white-space to its original value
    container.style.whiteSpace = originalWhiteSpace;

    // If height increased, it means the content overflowed into multiple lines
    if (totalHeight > oneLineHeight) {
        container.parentNode.classList.add('multi-line');
    } else {
        container.parentNode.classList.remove('multi-line');
    }
}


/* ---------- SOCIAL LINKS (dynamic from JSON) ---------- */

document.addEventListener('DOMContentLoaded', generateSocialLinks);

function generateSocialLinks() {
    fetch('./sources/data/links.json')
        .then(res => res.json())
        .then(links => {
            const ul = document.getElementById('social-links');
            if (!ul) return;

            // Remove skeletons
            ul.querySelectorAll('.header-skeleton').forEach(el => el.remove());

            links.forEach(link => {
                const li = createLinkElement(link);
                ul.appendChild(li);
            });

            ul.appendChild(createToggleLi());

            checkHeaderIconsOverflow();
            setupTwitterEasterEgg();
            setupDropdowns();
        })
        .catch(err => {
            console.error('Error loading social links:', err);
        });
}

const ICON_PLACEHOLDER = './sources/images/icons/missing.svg';

function withIconFallback(imgEl) {
    imgEl.addEventListener('error', function () {
        if (imgEl.src !== ICON_PLACEHOLDER) imgEl.src = ICON_PLACEHOLDER;
    });
    return imgEl;
}

function createIconWithSkeleton(src, alt, iconType = 'social') {
    const wrapper = document.createElement('span');
    wrapper.classList.add('skeleton');
    wrapper.style.display = 'inline-flex';
    wrapper.style.verticalAlign = 'middle';
    wrapper.style.justifyContent = 'center';
    wrapper.style.alignItems = 'center';

    const img = document.createElement('img');
    
    if (iconType === 'social') {
        wrapper.classList.add('social-icon', 'icon');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
    } else if (iconType === 'dropdown') {
        wrapper.style.width = '20px';
        wrapper.style.height = '20px';
        wrapper.style.flexShrink = '0';
        wrapper.style.borderRadius = '50%'; // make dropdown skeleton circular too
        // image will adapt to its .dropdown-item img styling implicitly, 
        // but let's ensure it fits inside the wrapper
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
    }

    img.alt = alt;
    img.fetchPriority = 'high';
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.2s';
    
    img.onload = () => {
        img.style.opacity = '1';
        wrapper.classList.remove('skeleton');
    };
    img.src = src;
    
    withIconFallback(img);
    wrapper.appendChild(img);
    
    // We return the wrapper, but we attach a property to access the image if needed (e.g., for easter egg)
    wrapper._img = img;
    return wrapper;
}

function createLinkElement(link) {
    const li = document.createElement('li');

    if (!link.important) {
        li.classList.add('link-secondary');
    }

    if (link.easterEgg) {
        li.dataset.easterEgg = link.easterEgg;
    }

    const iconSrc = './sources/images/icons/' + link.icon;

    if (link.dropdown) {
        // Dropdown item
        li.classList.add('dropdown');

        const iconWrapper = document.createElement('span');
        iconWrapper.classList.add('icon-wrapper');

        const iconContainer = createIconWithSkeleton(iconSrc, link.name, 'social');

        if (link.url) {
            const mainLink = document.createElement('a');
            mainLink.href = link.url;
            mainLink.title = link.name;
            mainLink.appendChild(iconContainer);
            iconWrapper.appendChild(mainLink);
        } else {
            iconWrapper.appendChild(iconContainer);
        }

        const badge = document.createElement('span');
        badge.classList.add('dropdown-badge');
        badge.textContent = '+';
        badge.setAttribute('aria-hidden', 'true');
        iconWrapper.appendChild(badge);
        li.appendChild(iconWrapper);

        const dropdownDiv = document.createElement('div');
        dropdownDiv.classList.add('dropdown-content');

        // Safety zone: invisible bridge between icon and dropdown for hover continuity
        const safetyZone = document.createElement('div');
        safetyZone.classList.add('dropdown-content-safety');
        dropdownDiv.appendChild(safetyZone);

        link.dropdown.forEach(item => {
            if (item.copyText) {
                const a = document.createElement('a');
                a.classList.add('dropdown-item');
                a.href = '#';
                a.title = item.name;

                if (item.icon) {
                    const itemImgPath = './sources/images/icons/' + item.icon;
                    const itemIconContainer = createIconWithSkeleton(itemImgPath, item.name, 'dropdown');
                    a.appendChild(itemIconContainer);
                }

                a.appendChild(document.createTextNode(item.name));

                const textToCopy = item.copyText;
                a.addEventListener('click', function (e) {
                    e.preventDefault();
                    copy(textToCopy);
                });
                dropdownDiv.appendChild(a);
            } else {
                const a = document.createElement('a');
                a.classList.add('dropdown-item');
                a.href = item.url;
                a.title = item.name;

                if (item.icon) {
                    const itemImgPath = './sources/images/icons/' + item.icon;
                    const itemIconContainer = createIconWithSkeleton(itemImgPath, item.name, 'dropdown');
                    a.appendChild(itemIconContainer);
                }

                a.appendChild(document.createTextNode(item.name));
                dropdownDiv.appendChild(a);
            }
        });

        li.appendChild(dropdownDiv);
    } else if (link.url) {
        // Simple link
        const a = document.createElement('a');
        a.href = link.url;
        a.title = link.name;

        const iconContainer = createIconWithSkeleton(iconSrc, link.name, 'social');
        a.appendChild(iconContainer);
        li.appendChild(a);
    } else {
        // No URL (e.g. Xbox TODO) — non-clickable icon
        const iconContainer = createIconWithSkeleton(iconSrc, link.name, 'social');
        iconContainer.classList.add('link-unavailable');
        iconContainer._img.title = link.name;
        li.appendChild(iconContainer);
    }

    return li;
}


/* ---------- LINKS COLLAPSE / EXPAND ---------- */

function createToggleLi() {
    const li = document.createElement('li');
    li.id = 'links-toggle';
    li.title = 'Afficher plus de liens';
    li.setAttribute('aria-label', 'Afficher plus de liens');
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');

    const img = document.createElement('img');
    img.src = './sources/images/icons/chevron.svg';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    li.appendChild(img);

    li.addEventListener('click', toggleLinksExpanded);
    li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleLinksExpanded(); }
    });

    return li;
}

function toggleLinksExpanded() {
    const liensDiv = document.querySelector('.liens');
    const toggle = document.getElementById('links-toggle');
    if (!liensDiv || !toggle) return;

    if (liensDiv.classList.contains('links-expanded')) {
        liensDiv.classList.remove('links-expanded');
        toggle.title = 'Afficher plus de liens';
        toggle.setAttribute('aria-label', 'Afficher plus de liens');
    } else {
        liensDiv.classList.add('links-expanded');
        toggle.title = 'Afficher moins de liens';
        toggle.setAttribute('aria-label', 'Afficher moins de liens');
    }

    checkHeaderIconsOverflow();
}


/* ---------- DROPDOWNS ---------- */

function setupDropdowns() {
    const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const dropdowns = document.querySelectorAll('.dropdown');

    // On mobile: tap icon to toggle dropdown, prevent navigating away
    dropdowns.forEach(dropdown => {
        const mainLink = dropdown.querySelector('.icon-wrapper a');
        if (mainLink) {
            mainLink.addEventListener('click', function (e) {
                if (isTouchDevice()) {
                    e.preventDefault();
                    toggleDropdown(dropdown);
                }
            });
        } else {
            // No link wrapper (e.g. Dons, Email) — icon itself toggles
            const icon = dropdown.querySelector('.icon-wrapper .social-icon');
            if (icon) {
                icon.style.cursor = 'pointer';
                icon.addEventListener('click', function () {
                    if (isTouchDevice()) toggleDropdown(dropdown);
                });
            }
        }
    });

    // Mobile and desktop scrolling should close dropdowns
    // (User requested behavior: "peut-être sur desktop aussi mais ça n'est pas génant")
    window.addEventListener('scroll', function () {
        document.querySelectorAll('.dropdown.dropdown-open').forEach(dd => dd.classList.remove('dropdown-open'));
    }, { passive: true });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (e) {
        dropdowns.forEach(dd => {
            if (!dd.contains(e.target)) dd.classList.remove('dropdown-open');
        });
    });

    // Clamp dropdown position to viewport edges on desktop hover + safety triangle
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('mouseenter', function () {
            clampDropdown(dropdown);
        });
        setupSafetyTriangle(dropdown);
    });
}

function toggleDropdown(dropdown) {
    const wasOpen = dropdown.classList.contains('dropdown-open');
    // Close all others first
    document.querySelectorAll('.dropdown.dropdown-open').forEach(dd => dd.classList.remove('dropdown-open'));
    if (!wasOpen) {
        dropdown.classList.add('dropdown-open');
        clampDropdown(dropdown);
    }
}

function clampDropdown(dropdown) {
    const content = dropdown.querySelector('.dropdown-content');
    if (!content) return;

    // Reset any previous manual positioning
    content.style.left = '';
    content.style.right = '';
    content.style.transform = '';

    // On mobile (fixed positioning), always center
    /* if (window.innerWidth <= 700) {
        content.style.left = '50%';
        content.style.transform = 'translateX(-50%)';
        // Vertically position below the icon
        const rect = dropdown.getBoundingClientRect();
        content.style.top = (rect.bottom + 8) + 'px';
        return;
    } */

    // Desktop: start centered, then clamp
    content.style.left = '50%';
    content.style.transform = 'translateX(-50%)';

    const rect = content.getBoundingClientRect();
    const margin = 20;

    if (rect.left < margin) {
        // Overflows left edge
        const parentRect = dropdown.getBoundingClientRect();
        const shift = margin - rect.left;
        content.style.left = (parentRect.width / 2 + shift) + 'px';
        // Move the triangle to stay centered on the icon
        content.style.setProperty('--arrow-offset', (-shift) + 'px');
    } else if (rect.right > window.innerWidth - margin) {
        // Overflows right edge
        const parentRect = dropdown.getBoundingClientRect();
        const shift = rect.right - (window.innerWidth - margin);
        content.style.left = (parentRect.width / 2 - shift) + 'px';
        content.style.setProperty('--arrow-offset', shift + 'px');
    } else {
        content.style.setProperty('--arrow-offset', '0px');
    }
}


/* ---------- SAFETY TRIANGLE ---------- */

function setupSafetyTriangle(dropdown) {
    let safetySvg = null;
    let safetyPath = null;
    let safetyDebugPath = null;
    let frozenApex = null; // frozen {x, y} when cursor starts moving down
    let prevY = null;

    function ensureOverlay() {
        if (safetySvg) return;
        safetySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        safetySvg.classList.add('dropdown-safety-triangle');

        // Visual debug path (no pointer-events — just shows the full triangle)
        safetyDebugPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        safetyDebugPath.style.pointerEvents = 'none';
        safetyDebugPath.setAttribute('fill', 'none');
        // DEBUG: uncomment to visualize triangle
        // safetyDebugPath.setAttribute('fill', 'rgba(255, 0, 0, 0.12)');
        // safetyDebugPath.setAttribute('stroke', 'red');
        // safetyDebugPath.setAttribute('stroke-width', '0.5');

        // Hit-test path (pointer-events: auto — only covers gap below icon)
        safetyPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        safetyPath.style.pointerEvents = 'auto';
        safetyPath.setAttribute('fill', 'transparent');

        safetySvg.appendChild(safetyDebugPath);
        safetySvg.appendChild(safetyPath);
        dropdown.appendChild(safetySvg);
        frozenApex = null;
        prevY = null;
    }

    function updatePath(mx, my) {
        const content = dropdown.querySelector('.dropdown-content');
        if (!content || !safetyPath) return;

        const r = content.getBoundingClientRect();
        const liRect = dropdown.getBoundingClientRect();

        // If cursor is at or below the dropdown top, no triangle needed
        if (my >= r.top) {
            safetyPath.removeAttribute('d');
            safetyDebugPath.removeAttribute('d');
            frozenApex = null;
            prevY = null;
            return;
        }

        const movingDown = prevY !== null && my > prevY;
        prevY = my;

        if (movingDown) {
            if (!frozenApex) {
                frozenApex = { x: mx, y: my };
            }
        } else {
            frozenApex = null;
        }

        const ax = frozenApex ? frozenApex.x : mx;
        const ay = frozenApex ? frozenApex.y : my;

        // Clamp the base width so the angle at the cursor stays narrow.
        // Max half-width of the base (each side from center of dropdown).
        const maxHalfBase = 100;
        const centerX = (r.left + r.right) / 2;
        const baseLeft = Math.max(r.left, centerX - maxHalfBase);
        const baseRight = Math.min(r.right, centerX + maxHalfBase);

        // Debug path: full triangle from cursor to dropdown corners
        safetyDebugPath.setAttribute('d',
            'M ' + ax + ',' + ay +
            ' L ' + baseLeft + ',' + r.top +
            ' L ' + baseRight + ',' + r.top +
            ' Z');

        // Hit-test path: only the gap below the icon to the dropdown
        const hitTop = Math.max(ay, liRect.bottom);
        safetyPath.setAttribute('d',
            'M ' + ax + ',' + hitTop +
            ' L ' + baseLeft + ',' + r.top +
            ' L ' + baseRight + ',' + r.top +
            ' Z');
    }

    function removeOverlay() {
        if (safetySvg) {
            safetySvg.remove();
            safetySvg = null;
            safetyPath = null;
            safetyDebugPath = null;
            frozenApex = null;
            prevY = null;
        }
    }

    dropdown.addEventListener('mouseenter', function () {
        if (window.innerWidth <= 700) return;
        ensureOverlay();
    });

    dropdown.addEventListener('mousemove', function (e) {
        if (window.innerWidth <= 700) return;
        if (!safetySvg) ensureOverlay();
        updatePath(e.clientX, e.clientY);
    });

    dropdown.addEventListener('mouseleave', function () {
        removeOverlay();
    });
}


/* ---------- TWITTER/X EASTER EGG ---------- */

function setupTwitterEasterEgg() {
    const twitterLi = document.querySelector('[data-easter-egg="twitter-x-glitch"]');
    if (!twitterLi) return;

    const twitterIconWrapper = twitterLi.querySelector('.social-icon');
    if (!twitterIconWrapper) return;
    
    // The actual image is correctly referenced via ._img property or querySelector
    const twitterImg = twitterIconWrapper._img || twitterIconWrapper.querySelector('img');

    const originalSrc = twitterImg.src;
    const xSrc = './sources/images/icons/x.svg';

    function triggerGlitch() {
        // Phase 1: Start glitch animation
        twitterIconWrapper.classList.add('twitter-glitching');

        // Phase 2: Switch to X icon
        setTimeout(function () { twitterImg.src = xSrc; }, 300);

        // Phase 3: Stop glitch, show X cleanly
        setTimeout(function () { twitterIconWrapper.classList.remove('twitter-glitching'); }, 800);

        // Phase 4: Glitch back
        setTimeout(function () { twitterIconWrapper.classList.add('twitter-glitching'); }, 3000);

        // Phase 5: Switch back to Twitter
        setTimeout(function () { twitterImg.src = originalSrc; }, 3300);

        // Phase 6: Clean up and schedule next
        setTimeout(function () {
            twitterIconWrapper.classList.remove('twitter-glitching');
            scheduleGlitch();
        }, 3600);
    }

    function scheduleGlitch() {
        var delay = 30000 + Math.random() * 60000; // 30–90 seconds
        setTimeout(triggerGlitch, delay);
    }

    scheduleGlitch();
}


/* ---------- ABOUT ME SECTION ---------- */

// Audio file
document.getElementById('name-tts-btn').addEventListener('click', function () {
    const audio = new Audio('./sources/audio/alexandre-malfreyt-pronounciation.m4a');
    audio.play();
});

function getAge() {
    let now = new Date();
    let birth = new Date(2003, 1, 26); // 2003-02-26 (mois de 0 à 11)
    var age_dt = new Date(now - birth);

    let age = Math.abs(age_dt.getFullYear() - 1970);

    let birthday = now.getMonth() === birth.getMonth() && now.getDate() === birth.getDate();
    let birthdayText = birthday ? ` <b>(C'est mon anniversaire ! 🎂🥳)</b>` : "";

    document.getElementById('aboutme-age').innerHTML = `${age} ans${birthdayText}`;
}

getAge();


/* ---------- PROJECTS SECTION ---------- */

function generateProjectSkeletons() {
    const container = document.getElementById('projects-loading');
    if (!container) return;

    container.innerHTML = '';
    
    // Calculate how many skeletons we need to fill the screen + some overflow
    const projectWidth = window.innerWidth <= 700 ? window.innerWidth : 330; // approx width + margin
    const numSkeletons = Math.ceil(window.innerWidth / projectWidth) + 1;
    
    for (let i = 0; i < numSkeletons; i++) {
        const div = document.createElement('div');
        div.classList.add('project-div', 'block', 'skeleton-project');
        
        // Randomize lengths to make it look organic
        const titleWidth = Math.floor(Math.random() * 40) + 40; // 40-80%
        const dateWidth = Math.floor(Math.random() * 20) + 20; // 20-40%
        const numTags = Math.floor(Math.random() * 3) + 1; // 1-3 tags
        
        // Complex randomized description
        const descLines = [];
        const numParagraphs = Math.floor(Math.random() * 2) + 1; // 1-2 paragraphs
        
        for (let p = 0; p < numParagraphs; p++) {
            const numLines = Math.floor(Math.random() * 3) + 2; // 2-4 lines per paragraph
            for (let l = 0; l < numLines; l++) {
                const lineWidth = (l === numLines - 1) ? (Math.floor(Math.random() * 50) + 30) : 100;
                descLines.push(`<span class="skeleton-text-line skeleton" style="width: ${lineWidth}%;"></span>`);
            }
            if (p < numParagraphs - 1) {
                 descLines.push(`<br><br>`);
            }
        }
        
        let tagsHtml = '';
        for (let t = 0; t < numTags; t++) {
            const tagWidth = Math.floor(Math.random() * 30) + 40; // 40-70px width
            tagsHtml += `<span class="project-tag skeleton" style="width: ${tagWidth}px; color: transparent; display: inline-block;">tag</span>`;
        }

        div.innerHTML = `
            <div class="project-thumbnail-wrapper skeleton"></div>
            <h3 class="project-title skeleton" style="margin-top: 10px; width: ${titleWidth}%; display: inline-block;">---</h3>
            <p class="project-date skeleton" style="width: ${dateWidth}%; display: block;">---</p>
            <p class="project-description" style="margin-top: 15px">
                ${descLines.join('')}
            </p>
            <div class="project-tags" style="margin-top: 15px;">
                ${tagsHtml}
            </div>
        `;
        
        container.appendChild(div);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    generateProjectSkeletons();
    getProjects();
});

function getProjects() {
    fetchProjectsData()
        .then(projects => {
            const projectsDiv = document.getElementById('projects-timeline');
            projects.forEach(project => {
                try {
                    const projectElement = createProjectElement(project);
                    projectsDiv.appendChild(projectElement);
                } catch (error) {
                }
            });

            const comingSoonElement = createComingSoonElement();
            projectsDiv.appendChild(comingSoonElement);

            removeLoadingDiv();
            scrollToLastProject();
            injectProjectImagesJsonLd(projects);
        })
        .catch(error => {
            const loadingDiv = document.getElementById('projects-loading');
            if (loadingDiv) {
                loadingDiv.innerHTML = '<p class="block" style="width: 100%;">❌ Erreur lors du chargement des projets.</p>';
            }
        });
}

function injectProjectImagesJsonLd(projects) {
    const baseUrl = 'https://alexandre.malfre.yt';
    const creator = {
        "@type": "Person",
        "@id": "https://alexandre.malfre.yt/#person",
        "name": "Alexandre MALFREYT"
    };

    const toAbsolute = src =>
        src.startsWith('http') ? src : baseUrl + src.replace(/^\./, '');

    const imageObjects = projects.map(project => ({
        "@type": "ImageObject",
        "contentUrl": toAbsolute(project['thumbnail']),
        "name": project['name'],
        "description": project['description'],
        "license": "https://creativecommons.org/publicdomain/zero/1.0/",
        "acquireLicensePage": "https://creativecommons.org/publicdomain/zero/1.0/",
        "creditText": "Alexandre MALFREYT",
        "copyrightNotice": "Alexandre MALFREYT",
        "creator": creator
    }));

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": imageObjects
    });
    document.head.appendChild(script);
}

function fetchProjectsData() {
    return new Promise((resolve, reject) => {
        let fileURL = "./sources/data/projects.json";
        let request = new XMLHttpRequest();
        request.open('GET', fileURL);
        request.responseType = 'json';
        request.timeout = 10000;
        request.onload = () => resolve(request.response);
        request.onerror = () => reject(request.statusText || 'Erreur réseau');
        request.ontimeout = () => reject('Timeout');
        request.send();
    });
}

function createProjectElement(project) {
    const url = project['url'] || null;
    const thumbnail = project['thumbnail'] || '';
    const name = project['name'] || '';
    const year = project['year'] || '';
    const description = project['description'] || '';
    const interests = Array.isArray(project['interests']) ? project['interests'] : [];
    const tags = Array.isArray(project['tags']) ? project['tags'] : [];

    const div = document.createElement('div');
    div.classList.add('project-div', 'block');

    const imgWrap = document.createElement('div');
    imgWrap.classList.add('project-thumbnail-wrapper', 'skeleton');

    const img = document.createElement('img');
    img.setAttribute('src', thumbnail);
    img.setAttribute('alt', name);
    img.classList.add('project-thumbnail');
    img.loading = 'lazy';
    img.fetchPriority = 'low'; // Load heavy GIFs last
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.3s ease-in-out';
    img.onload = () => {
        img.style.opacity = '1';
        imgWrap.classList.remove('skeleton');
    };
    imgWrap.appendChild(img);
    div.appendChild(imgWrap);

    const title = document.createElement('h3');
    title.classList.add('project-title');
    title.appendChild(document.createTextNode(name));
    div.appendChild(title);

    const date = document.createElement('p');
    date.classList.add('project-date');
    date.appendChild(document.createTextNode(year));
    div.appendChild(date);

    const descriptionEl = document.createElement('p');
    descriptionEl.classList.add('project-description');
    descriptionEl.appendChild(document.createTextNode(description));
    div.appendChild(descriptionEl);

    if (interests.length > 0) {
        const interestsTitle = document.createElement('h4');
        interestsTitle.classList.add('project-interests-title');
        interestsTitle.appendChild(document.createTextNode('Intérêts principaux'));
        div.appendChild(interestsTitle);

        const interestsList = document.createElement('ul');
        interests.forEach(interest => {
            const interestItem = document.createElement('li');
            interestItem.classList.add('project-interest');
            interestItem.appendChild(document.createTextNode(interest));
            interestsList.appendChild(interestItem);
        });
        interestsList.classList.add('project-interests');
        div.appendChild(interestsList);
    }

    const tagsDiv = document.createElement('div');
    tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.classList.add('project-tag');
        tagSpan.appendChild(document.createTextNode(tag));
        tagsDiv.appendChild(tagSpan);
    });
    tagsDiv.classList.add('project-tags');
    div.appendChild(tagsDiv);

    if (url) {
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.appendChild(div);
        return a;
    }
    return div;
}

function createComingSoonElement() {
    // Create a "coming soon" element at the end of the projects timeline
    const div = document.createElement('div');
    div.classList.add('project-div', 'block', 'coming-soon');

    const imgWrap = document.createElement('div');
    imgWrap.classList.add('project-thumbnail-wrapper', 'skeleton');

    const img = document.createElement('img');
    img.setAttribute('src', './sources/images/project-thumbnails/a-venir.gif');
    img.classList.add('project-thumbnail');
    img.loading = 'lazy';
    img.fetchPriority = 'low';
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.3s ease-in-out';
    img.onload = () => {
        img.style.opacity = '1';
        imgWrap.classList.remove('skeleton');
    };
    imgWrap.appendChild(img);
    div.appendChild(imgWrap);

    const title = document.createElement('h3');
    title.classList.add('project-title');
    title.appendChild(document.createTextNode("D'autres projets à venir..."));
    div.appendChild(title);

    const description = document.createElement('p');
    description.classList.add('project-description');
    description.appendChild(document.createTextNode("Bientôt d'autres projets sur ce site !"));
    div.appendChild(description);

    return div;
}

function removeLoadingDiv() {
    const loadingDiv = document.getElementById('projects-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function scrollToLastProject() {
    // Scroll to the 2nd to last element of projects timeline
    // (the last one is the "coming soon" project which is not interesting à scroll to at the initial load)
    const projectsDiv = document.getElementById('projects-timeline');
    const lastProjectDiv = projectsDiv.querySelector('.project-div:last-child');
    if (lastProjectDiv) {
        const lastProjectWidth = lastProjectDiv.offsetWidth;
        // Scroll to : (width of pro)
        projectsDiv.scrollLeft = projectsDiv.scrollWidth - projectsDiv.clientWidth - lastProjectWidth; // scroll to the end minus the width of the last project to have the 2nd to last project at the end of the screen
    } else {
        // If there are no projects, scroll to the end of the div just in case
        projectsDiv.scrollLeft = projectsDiv.scrollWidth;
    }
    
    updateScrollGradients();
}

function updateScrollGradients() {
    const timeline = document.getElementById('projects-timeline');
    const wrapper = document.getElementById('projects-timeline-wrapper');
    if (!wrapper) return;
    const atLeft = timeline.scrollLeft <= 0;
    const atRight = timeline.scrollLeft >= timeline.scrollWidth - timeline.clientWidth - 1;
    wrapper.classList.toggle('has-left-overflow', !atLeft);
    wrapper.classList.toggle('has-right-overflow', !atRight);
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('projects-timeline').addEventListener('scroll', updateScrollGradients);
});

window.addEventListener('resize', scrollToLastProject);
window.addEventListener('resize', checkHeaderIconsOverflow);

/* ---------- PROJECTS AUTOMATIC SCROLLING ---------- */

let scrollDirection = 0;
let scrollSpeed = 0;
let autoScrollFrameId = null;
let lastTimestamp = null;
let fractionalScroll = 0;

function autoScrollProjects(timestamp) {
    if (scrollDirection !== 0) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        // Cap deltaTime to avoid massive jumps if the tab becomes inactive
        const dt = Math.min(deltaTime, 50);

        const timeline = document.getElementById('projects-timeline');
        if (timeline) {
            // Temporarily disable any CSS scroll snapping or smooth behavior that causes conflicts
            timeline.style.scrollBehavior = 'auto';
            timeline.style.scrollSnapType = 'none';

            // Add to our exact precision accumulator based on pixels per second
            fractionalScroll += scrollDirection * (scrollSpeed * (dt / 1000));
            
            // Apply only the integer part to the actual scrollable element
            const intStep = Math.trunc(fractionalScroll);
            if (intStep !== 0) {
                timeline.scrollLeft += intStep;
                fractionalScroll -= intStep; // Keep the fractional remainder
            }
        }
        autoScrollFrameId = requestAnimationFrame(autoScrollProjects);
    } else {
        const timeline = document.getElementById('projects-timeline');
        if (timeline) {
            timeline.style.scrollBehavior = '';
            timeline.style.scrollSnapType = '';
        }
        autoScrollFrameId = null;
        lastTimestamp = null;
        fractionalScroll = 0;
    }
}

document.addEventListener('mousemove', function(e) {
    // Only apply on devices with a fine pointer (mouse), not touchscreens
    if (!window.matchMedia('(pointer: fine)').matches) {
        scrollDirection = 0;
        return;
    }

    const section = document.getElementById('projects-section');
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const isVerticallyOver = e.clientY >= rect.top && e.clientY <= rect.bottom;

    if (isVerticallyOver) {
        const x = e.clientX;
        const width = window.innerWidth;
        const DETECTION_ZONE = Math.max(250, width * 0.20); // Much wider detection zone (min 250px)
        const MAX_SPEED = 1200; // Max scroll speed in pixels per second

        if (x < DETECTION_ZONE) {
            scrollDirection = -1;
            // Max speed reached at 50% of the detection zone
            const ratio = Math.max(0, (DETECTION_ZONE - x) / (DETECTION_ZONE / 2));
            scrollSpeed = Math.min(1, ratio) * MAX_SPEED;
        } else if (width - x < DETECTION_ZONE) {
            scrollDirection = 1;
            const distToEdge = width - x;
            const ratio = Math.max(0, (DETECTION_ZONE - distToEdge) / (DETECTION_ZONE / 2));
            scrollSpeed = Math.min(1, ratio) * MAX_SPEED;
        } else {
            scrollDirection = 0;
        }

        if (scrollDirection !== 0 && !autoScrollFrameId) {
            lastTimestamp = null;
            fractionalScroll = 0;
            autoScrollFrameId = requestAnimationFrame(autoScrollProjects);
        }
    } else {
        scrollDirection = 0;
    }
});

document.addEventListener('mouseleave', function(e) {
    // Stop scrolling if the mouse leaves the window vertically
    if (e.clientY <= 0 || e.clientY >= window.innerHeight - 1) {
        scrollDirection = 0;
    }
});


/* ---------- ANECDOTES SECTION ---------- */

function getAnecdote() {
    // Add skeleton while loading
    const anecdoteTextEl = document.getElementById('anecdote-text');
    const anecdoteEmojiEl = document.getElementById('anecdote-emoji');
    const learnMoreEl = document.getElementById('anecdote-en_savoir_plus');
    
    anecdoteEmojiEl.classList.add('skeleton');
    anecdoteEmojiEl.style.color = 'transparent';
    
    anecdoteTextEl.innerHTML = '<span class="skeleton-text-line skeleton"></span><span class="skeleton-text-line medium skeleton"></span>';
    
    learnMoreEl.style.display = 'none';

    // Get anecdotes from JSON file
    let fileURL = "./sources/data/anecdotes.json";
    let request = new XMLHttpRequest();
    request.open('GET', fileURL);
    request.responseType = 'json';
    request.timeout = 10000;
    request.send();

    function showAnecdoteError() {
        const anecdoteEmojiEl = document.getElementById('anecdote-emoji');
        const anecdoteTextEl = document.getElementById('anecdote-text');
        
        anecdoteEmojiEl.classList.remove('skeleton');
        anecdoteEmojiEl.style.color = '';
        anecdoteTextEl.classList.remove('skeleton');
        anecdoteTextEl.querySelectorAll('.skeleton-text-line').forEach(line => line.remove());
        
        anecdoteEmojiEl.innerHTML = '❌';
        anecdoteTextEl.innerHTML = 'Erreur lors du chargement de l\'anecdote.';
    }

    request.onerror = showAnecdoteError;
    request.ontimeout = showAnecdoteError;

    request.onload = function () {
        if (!request.response || !Array.isArray(request.response) || request.response.length === 0) {
            showAnecdoteError();
            return;
        }

        // Get currently displayed anecdote
        let current_anecdote = document.getElementById('anecdote-text').innerHTML;

        // Get random anecdote (not the same as the current one)
        let anecdote = null;
        let attempts = 0;
        while (true) {
            let random_anecdote_id = Math.floor(Math.random() * request.response.length);
            anecdote = request.response[random_anecdote_id];
            const text = anecdote['text'] || '';
            if (text !== current_anecdote || ++attempts >= request.response.length) {
                break;
            }
        }

        const text = anecdote['text'] || '';
        const emoji = anecdote['emoji'] || '❓';
        const learnMoreUrl = anecdote['learn_more_url'] || null;
        const learnMoreText = anecdote['learn_more_text'] || 'En savoir plus';

        // Replace placeholders : durations, dates, etc (dynamic content that needs to be up-to-date)
        // Format :
        // {days:ISO8601date} => number of days between the given date and today
        // {timedelta_days_as_seconds_humanized:ISO8601date} => humanized duration for 1 day = 1 second, 2 days = 2 seconds, ..., 1 year = 6 minutes and 5 days, etc
        // {timedelta_years_humanized:ISO8601date} => humanized duration between the given date and today (1 day, 2 days, 1 month, 1 year, etc) floored to the year
        let resolvedText = text;
        let datePlaceholders = resolvedText.match(/{(days|timedelta_days_as_seconds_humanized|timedelta_years_humanized):([^}]+)}/g);
        if (datePlaceholders) {
            datePlaceholders.forEach(placeholder => {
                let [_, type, dateStr] = placeholder.match(/{(days|timedelta_days_as_seconds_humanized|timedelta_years_humanized):([^}]+)}/);
                const date = new Date(dateStr);
                const today = new Date();
                const nbDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
                if (type === 'days') {
                    resolvedText = resolvedText.replace(placeholder, nbDays);
                } else if (type === 'timedelta_days_as_seconds_humanized') {
                    resolvedText = resolvedText.replace(placeholder, humanizeDurationSeconds(nbDays)); // use the number of days as a number of seconds - useful for 1SE duration calculation
                } else if (type === 'timedelta_years_humanized') {
                    resolvedText = resolvedText.replace(placeholder, humanizeDurationDays(nbDays, 1)); // humanize the duration in years, floored to the year
                }
            });
        }

        // Set anecdote
        const anecdoteTextEl = document.getElementById('anecdote-text');
        anecdoteTextEl.innerHTML = resolvedText;
        
        const anecdoteEmojiEl = document.getElementById('anecdote-emoji');
        anecdoteEmojiEl.innerHTML = emoji;
        
        // Remove skeleton classes
        anecdoteTextEl.classList.remove('skeleton');
        anecdoteEmojiEl.classList.remove('skeleton');
        anecdoteEmojiEl.style.color = ''; // Restore emoji color if it was made transparent
        
        // Remove skeleton lines if they were still there
        const skeletonLines = anecdoteTextEl.querySelectorAll('.skeleton-text-line');
        skeletonLines.forEach(line => line.remove());

        const learnMoreEl = document.getElementById('anecdote-en_savoir_plus');
        if (learnMoreUrl) {
            learnMoreEl.setAttribute('href', learnMoreUrl);
            learnMoreEl.innerHTML = learnMoreText;
            learnMoreEl.style.display = '';
        } else {
            learnMoreEl.style.display = 'none';
        }
    }
}

getAnecdote();
