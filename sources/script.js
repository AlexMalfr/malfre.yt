function copy(text) {
    if (window.confirm(text + "\nCopier dans le presse papier ?")) {
        var dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = text;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    }
}

function getAnecdote() {
    let fileURL = "./sources/anecdotes.json";
    let request = new XMLHttpRequest();
    request.open('GET', fileURL);
    request.responseType = 'json';
    request.send();

    request.onload = function () {
        let anecdote = request.response[Math.floor(Math.random() * request.response.length)];

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
    let fileURL = "./sources/projects.json";
    let request = new XMLHttpRequest();
    request.open('GET', fileURL);
    request.responseType = 'json';
    request.send();

    request.onload = function () {
        for (let i = 0; i < request.response.length; i++) {
            let projects_div = document.getElementById('projects-timeline');

            var div = document.createElement('div');
            div.classList.add('project-div')

            var a = document.createElement('a');
            var title = document.createElement('h3');
            var text = document.createTextNode(request.response[i]['Name']);
            title.appendChild(text);
            a.appendChild(title);
            a.setAttribute('href', request.response[i]['Lien']);
            
            div.appendChild(a);
            projects_div.appendChild(div);
        }
    }
}

getProjects();
