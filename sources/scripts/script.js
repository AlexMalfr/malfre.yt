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

            links.forEach(link => {
                const li = createLinkElement(link);
                ul.appendChild(li);
            });

            ul.appendChild(createToggleLi());

            checkHeaderIconsOverflow();
            setupTwitterEasterEgg();
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

        if (link.url) {
            const mainLink = document.createElement('a');
            mainLink.href = link.url;
            mainLink.title = link.name;

            const img = withIconFallback(document.createElement('img'));
            img.classList.add('social-icon', 'icon');
            img.src = iconSrc;
            img.alt = link.name;
            mainLink.appendChild(img);
            li.appendChild(mainLink);
        } else {
            const img = withIconFallback(document.createElement('img'));
            img.classList.add('social-icon', 'icon');
            img.src = iconSrc;
            img.alt = link.name;
            li.appendChild(img);
        }

        const dropdownDiv = document.createElement('div');
        dropdownDiv.classList.add('dropdown-content');

        link.dropdown.forEach(item => {
            if (item.copyText) {
                const input = document.createElement('input');
                input.classList.add('dropdown-item');
                input.type = 'image';
                input.title = item.name;
                input.alt = item.name;
                if (item.icon) {
                    input.src = './sources/images/icons/' + item.icon;
                withIconFallback(input);
                }
                const textToCopy = item.copyText;
                input.addEventListener('click', function (e) {
                    e.preventDefault();
                    copy(textToCopy);
                });
                dropdownDiv.appendChild(input);
            } else {
                const a = document.createElement('a');
                a.classList.add('dropdown-item');
                a.href = item.url;
                a.title = item.name;

                if (item.icon) {
                    const itemImg = withIconFallback(document.createElement('img'));
                    itemImg.src = './sources/images/icons/' + item.icon;
                    itemImg.alt = item.name;
                    a.appendChild(itemImg);
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

        const img = withIconFallback(document.createElement('img'));
        img.classList.add('social-icon', 'icon');
        img.src = iconSrc;
        img.alt = link.name;
        a.appendChild(img);
        li.appendChild(a);
    } else {
        // No URL (e.g. Xbox TODO) — non-clickable icon
        const img = withIconFallback(document.createElement('img'));
        img.classList.add('social-icon', 'icon', 'link-unavailable');
        img.src = iconSrc;
        img.alt = link.name;
        img.title = link.name;
        li.appendChild(img);
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


/* ---------- TWITTER/X EASTER EGG ---------- */

function setupTwitterEasterEgg() {
    const twitterLi = document.querySelector('[data-easter-egg="twitter-x-glitch"]');
    if (!twitterLi) return;

    const twitterIcon = twitterLi.querySelector('.social-icon');
    if (!twitterIcon) return;

    const originalSrc = twitterIcon.src;
    const xSrc = './sources/images/icons/x.svg';

    function triggerGlitch() {
        // Phase 1: Start glitch animation
        twitterIcon.classList.add('twitter-glitching');

        // Phase 2: Switch to X icon
        setTimeout(function () { twitterIcon.src = xSrc; }, 300);

        // Phase 3: Stop glitch, show X cleanly
        setTimeout(function () { twitterIcon.classList.remove('twitter-glitching'); }, 800);

        // Phase 4: Glitch back
        setTimeout(function () { twitterIcon.classList.add('twitter-glitching'); }, 3000);

        // Phase 5: Switch back to Twitter
        setTimeout(function () { twitterIcon.src = originalSrc; }, 3300);

        // Phase 6: Clean up and schedule next
        setTimeout(function () {
            twitterIcon.classList.remove('twitter-glitching');
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

document.addEventListener("DOMContentLoaded", getProjects);

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
                loadingDiv.textContent = '❌ Erreur lors du chargement des projets.';
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

    const img = document.createElement('img');
    img.setAttribute('src', thumbnail);
    img.setAttribute('alt', name);
    img.classList.add('project-thumbnail');
    div.appendChild(img);

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

    const img = document.createElement('img');
    img.setAttribute('src', './sources/images/project-thumbnails/a-venir.gif');
    img.classList.add('project-thumbnail');
    div.appendChild(img);

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


/* ---------- ANECDOTES SECTION ---------- */

function getAnecdote() {
    // Get anecdotes from JSON file
    let fileURL = "./sources/data/anecdotes.json";
    let request = new XMLHttpRequest();
    request.open('GET', fileURL);
    request.responseType = 'json';
    request.timeout = 10000;
    request.send();

    function showAnecdoteError() {
        document.getElementById('anecdote-emoji').innerHTML = '❌';
        document.getElementById('anecdote-text').innerHTML = 'Erreur lors du chargement de l\'anecdote.';
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
        document.getElementById('anecdote-text').innerHTML = resolvedText;
        document.getElementById('anecdote-emoji').innerHTML = emoji;
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
