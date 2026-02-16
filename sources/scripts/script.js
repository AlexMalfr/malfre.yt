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


function getAge() {
    let now = new Date();
    let birth = new Date(2003, 2, 26);
    var age_dt = new Date(now-birth);

    let age = Math.abs(age_dt.getFullYear() - 1970);

    document.getElementById('aboutme-age').innerHTML = `${age} ans`;
}

getAge();


function getProjects() {
    // Get projects from JSON file
    let fileURL = "./sources/data/projects.json";
    let request = new XMLHttpRequest();
    request.open('GET', fileURL);
    request.responseType = 'json';
    request.send();

    request.onload = function () {
        // Create div for each project
        for (let i = 0; i < request.response.length; i++) {
            let projects_div = document.getElementById('projects-timeline');

            // Create a link
            var a = document.createElement('a');
            a.setAttribute('href', request.response[i]['Lien']);

            // Create div
            var div = document.createElement('div');
            div.classList.add('project-div')
            div.classList.add('block')

            a.appendChild(div);

            // Add an image
            var img = document.createElement('img');
            img.setAttribute('src', request.response[i]['Thumbnail']);
            img.classList.add('project-thumbnail');
            div.appendChild(img);
            
            // Add a title which is a link
            var title = document.createElement('h3');
            var name = document.createTextNode(request.response[i]['Name']);
            title.classList.add('project-title');
            title.appendChild(name);
            div.appendChild(title);

            // Add a date
            var date = document.createElement('p');
            var date_text = document.createTextNode(request.response[i]['Année']);
            date.appendChild(date_text);
            date.classList.add('project-date');
            div.appendChild(date);
            
            // Add a description (take into account newlines)
            var description = document.createElement('p');
            var description_text = document.createTextNode(request.response[i]['Description']);
            description.appendChild(description_text);
            
            description.classList.add('project-description');
            div.appendChild(description);

            // Add "interets principaux"
            if (request.response[i].hasOwnProperty('Interets')) {
                // title for interests
                var interests_title = document.createElement('h4');
                var interests_title_text = document.createTextNode('Intérêts principaux');
                interests_title.appendChild(interests_title_text);
                interests_title.classList.add('project-interests-title');
                div.appendChild(interests_title);

                // interests
                var interests = document.createElement('ul');
                for (let j = 0; j < request.response[i]['Interets'].length; j++) {
                    var interest = document.createElement('li');
                    var interest_text = document.createTextNode(request.response[i]['Interets'][j]);
                    interest.appendChild(interest_text);
                    interest.classList.add('project-interest');
                    interests.appendChild(interest);
                }
                interests.classList.add('project-interests');
                div.appendChild(interests);
            }

            // Add tags
            var tags = document.createElement('div');
            for (let j = 0; j < request.response[i]['Tags'].length; j++) {
                var tag = document.createElement('span');
                var tag_text = document.createTextNode(request.response[i]['Tags'][j]);
                tag.appendChild(tag_text);
                tag.classList.add('project-tag');
                tags.appendChild(tag);
            }
            tags.classList.add('project-tags');
            div.appendChild(tags);
            
            projects_div.appendChild(a);
        }

        // Remove loading div
        document.getElementById('projects-loading').remove();
    }
}

getProjects();


function humanizeDuration(nbSeconds) {
    var seconds = nbSeconds % 60;
    var minutes = Math.floor(nbSeconds / 60) % 60;
    var hours = Math.floor(nbSeconds / 60 / 60) % 24;
    var days = Math.floor(nbSeconds / 60 / 60 / 24) % 30;
    var months = Math.floor(nbSeconds / 60 / 60 / 24 / 30) % 12;
    var years = Math.floor(nbSeconds / 60 / 60 / 24 / 30 / 12);

    var humanized = '';

    if (years > 0)   humanized += ' ' + years + ' an' + (years > 1 ? 's' : '');
    if (months > 0)  humanized += ' ' + months + ' mois';
    if (days > 0)    humanized += ' ' + days + ' jour' + (days > 1 ? 's' : '');
    if (hours > 0)   humanized += ' ' + hours + ' heure' + (hours > 1 ? 's' : '');
    if (minutes > 0) humanized += ' ' + minutes + ' minute' + (minutes > 1 ? 's' : '');
    if (seconds > 0) humanized += ' ' + seconds + ' seconde' + (seconds > 1 ? 's' : '');

    return humanized;
}