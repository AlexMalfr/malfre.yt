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

function humanizeDuration(nbSeconds) {
    var seconds = nbSeconds % 60;
    var minutes = Math.floor(nbSeconds / 60) % 60;
    var hours = Math.floor(nbSeconds / 60 / 60) % 24;
    var days = Math.floor(nbSeconds / 60 / 60 / 24) % 30;
    var months = Math.floor(nbSeconds / 60 / 60 / 24 / 30) % 12;
    var years = Math.floor(nbSeconds / 60 / 60 / 24 / 30 / 12);

    var humanized = '';

    if (years > 0) humanized += ' ' + years + ' an' + (years > 1 ? 's' : '');
    if (months > 0) humanized += ' ' + months + ' mois';
    if (days > 0) humanized += ' ' + days + ' jour' + (days > 1 ? 's' : '');
    if (hours > 0) humanized += ' ' + hours + ' heure' + (hours > 1 ? 's' : '');
    if (minutes > 0) humanized += ' ' + minutes + ' minute' + (minutes > 1 ? 's' : '');
    if (seconds > 0) humanized += ' ' + seconds + ' seconde' + (seconds > 1 ? 's' : '');

    return humanized;
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
        console.log('multi-line');
    } else {
        container.parentNode.classList.remove('multi-line');
        console.log('single-line');
    }
}

// Check if header icons overflow on page load and on resize
document.addEventListener('DOMContentLoaded', checkHeaderIconsOverflow);
window.addEventListener('resize', checkHeaderIconsOverflow);


/* ---------- ABOUT ME SECTION ---------- */

// Audio file
// document.getElementById('name-tts-btn').addEventListener('click', function () {
//     const audio = new Audio('./sources/audio/name-pronunciation.mp3');
//     audio.play();
// });

// Text-to-speech (TTS) using Web Speech API with Google Translate fallback
document.getElementById('name-tts-btn').addEventListener('click', function () {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Alexandre Malfreyt');
        utterance.lang = 'fr-FR';
        window.speechSynthesis.speak(utterance);
    } else {
        // Fallback: Google Translate TTS
        const audio = new Audio('https://translate.googleapis.com/translate_tts?ie=UTF-8&q=Alexandre+Malfreyt&tl=fr&client=gtx');
        audio.play();
    }
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
                const projectElement = createProjectElement(project);
                projectsDiv.appendChild(projectElement);
            });
            removeLoadingDiv();
            scrollToLastProject();
        })
        .catch(error => console.error('Error fetching projects data:', error));
}

function fetchProjectsData() {
    return new Promise((resolve, reject) => {
        let fileURL = "./sources/data/projects.json";
        let request = new XMLHttpRequest();
        request.open('GET', fileURL);
        request.responseType = 'json';
        request.onload = () => resolve(request.response);
        request.onerror = () => reject(request.statusText);
        request.send();
    });
}

function createProjectElement(project) {
    const a = document.createElement('a');
    a.setAttribute('href', project['Lien']);

    const div = document.createElement('div');
    div.classList.add('project-div', 'block');
    a.appendChild(div);

    const img = document.createElement('img');
    img.setAttribute('src', project['Thumbnail']);
    img.classList.add('project-thumbnail');
    div.appendChild(img);

    const title = document.createElement('h3');
    title.classList.add('project-title');
    title.appendChild(document.createTextNode(project['Name']));
    div.appendChild(title);

    const date = document.createElement('p');
    date.classList.add('project-date');
    date.appendChild(document.createTextNode(project['Année']));
    div.appendChild(date);

    const description = document.createElement('p');
    description.classList.add('project-description');
    description.appendChild(document.createTextNode(project['Description']));
    div.appendChild(description);

    if (project.hasOwnProperty('Interets') && project['Interets'].length > 0) {
        const interestsTitle = document.createElement('h4');
        interestsTitle.classList.add('project-interests-title');
        interestsTitle.appendChild(document.createTextNode('Intérêts principaux'));
        div.appendChild(interestsTitle);

        const interests = document.createElement('ul');
        project['Interets'].forEach(interest => {
            const interestItem = document.createElement('li');
            interestItem.classList.add('project-interest');
            interestItem.appendChild(document.createTextNode(interest));
            interests.appendChild(interestItem);
        });
        interests.classList.add('project-interests');
        div.appendChild(interests);
    }

    const tags = document.createElement('div');
    project['Tags'].forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.classList.add('project-tag');
        tagSpan.appendChild(document.createTextNode(tag));
        tags.appendChild(tagSpan);
    });
    tags.classList.add('project-tags');
    div.appendChild(tags);

    return a;
}

function removeLoadingDiv() {
    const loadingDiv = document.getElementById('projects-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function scrollToLastProject() {
    const projectsDiv = document.getElementById('projects-timeline');
    projectsDiv.scrollLeft = projectsDiv.scrollWidth;
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
    request.send();

    request.onload = function () {
        // Get currently displayed anecdote
        let current_anecdote = document.getElementById('anecdote-text').innerHTML;

        // Get random anecdote (not the same as the current one)
        let anecdote = null;
        while (true) {
            let random_anecdote_id = Math.floor(Math.random() * request.response.length);
            anecdote = request.response[random_anecdote_id];
            if (anecdote['Texte'] != current_anecdote) {
                break;
            }
        }

        // Replace placeholders
        let OSE_debut = new Date(2018, 3, 11);
        let OSE_today = new Date();
        let OSE_nbJours = Math.floor((OSE_today - OSE_debut) / (1000 * 60 * 60 * 24)) + 1;
        let OSE_humanized = humanizeDuration(OSE_nbJours, { round: true });
        anecdote['Texte'] = anecdote['Texte'].replace('{1SE_nbJours}', OSE_nbJours);
        anecdote['Texte'] = anecdote['Texte'].replace('{1SE_duree}', OSE_humanized);
        
        // Set anecdote
        document.getElementById('anecdote-text').innerHTML = anecdote['Texte'];
        document.getElementById('anecdote-emoji').innerHTML = anecdote['Emoji'];
        document.getElementById('anecdote-en_savoir_plus').setAttribute('href', anecdote['En savoir plus']);
    }
}

getAnecdote();
