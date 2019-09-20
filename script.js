const output = document.querySelector("#output");
const pokeList = document.querySelector("#poke-list");
const form = document.querySelector("#search-poke-form");

var pokemon = {
    name: "",
    img: "",
    id: "",
    type: ""
}

// Search button which activates the findPokemon function!
form.addEventListener('submit', (e) => {
    e.preventDefault();
    findPokemon();

    // This if statement clears the public API pokemon div in case you no longer wish to see it.
    if (form.name.value.length == 0) {
        output.innerHTML = '';
    }
})

// Finding a pokemon on the public API "pokeapi.co"
function findPokemon() {
    var xhr = new XMLHttpRequest();
    var param = form.name.value;
    var url = "https://pokeapi.co/api/v2/pokemon/" + param;

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {

            $.getJSON(url, (data) => {
                if (param.length !== 0) {
                    pokemon.name = data.name.charAt(0).toUpperCase() + data.name.substring(1);
                    pokemon.img = data.sprites.front_default;
                    pokemon.id = data.id;
                    pokemon.type = data.types[0].type.name.charAt(0).toUpperCase() + data.types[0].type.name.substring(1);

                    // Craft a little div window to show the pokeon you found!
                    output.innerHTML = '<div class="card card-body text-white border border-dark bg-info mb-3" style="max-width: 14rem">' +
                        '<h4>' + pokemon.name + '</h4>' +
                        '<img src=' + pokemon.img + '>' +
                        '<h4>ID: ' + pokemon.id + '</h4>' +
                        '<h4>Type: ' + pokemon.type + '</h4>' +
                        '<input type="submit" id="saveBtn" class="btn btn-warning" value="save">' +
                        '</div>';

                    const saving = document.querySelector("#saveBtn");
                    saving.addEventListener('click', (e) => {
                        save(pokemon);
                    })
                }
            });
        }
    }
    xhr.open('GET', url);
    xhr.send();
    form.name.value = '';
}

// Save the pokemon to the firestore!
function save(pokemon) {
    db.collection("pokeList").doc(pokemon.name).set({
        Pokemon: pokemon
    })
        .then(() => {
            console.log("Data saved!")
        })
        .catch((error) => {
            console.error("Saving has failed: ", error);
        });
}

// Real-time listener!
db.collection("pokeList").onSnapshot(snapshot => {
    let changes = snapshot.docChanges();
    changes.forEach(change => {
        if (change.type === 'added') {
            renderList(change.doc);
        } else if (change.type === 'removed') {
            let li = pokeList.querySelector('[data-id=' + change.doc.id + ']');
            pokeList.removeChild(li);
        } else if (change.type === 'modified') {
            //The only way I could figure out how to instantly update the pokemon cards after changing their name. 
            let li = pokeList.querySelector('[data-id=' + change.doc.id + ']');
            pokeList.removeChild(li);
            renderList(change.doc);
        }
    })
})

// Create the list of pokemon!
function renderList(doc) {
    const li = document.createElement('div');
    li.className = "card card-body text-white bg-success mb-3 border border-dark position-relative"
    li.style = "max-width: 14rem"
    const name = document.createElement('h4');
    const newName = document.createElement('input');
    newName.type = 'text';
    newName.placeholder = 'Enter new name';
    newName.className = 'mb-2';
    const pokeid = document.createElement('h4');
    const img = document.createElement('img');
    img.src = doc.data().Pokemon.img;
    const type = document.createElement('h4');
    const deletion = document.createElement('button');
    deletion.className = "badge badge-pill badge-danger mb-1";
    const editing = document.createElement('button');
    editing.className = "badge badge-pill badge-warning";

    li.setAttribute('data-id', doc.id);
    name.textContent = doc.data().Pokemon.name;
    pokeid.textContent = 'ID: ' + doc.data().Pokemon.id;
    type.textContent = 'Type: ' + doc.data().Pokemon.type;
    deletion.textContent = 'Remove';
    editing.textContent = 'Edit Name';

    li.appendChild(name);
    li.appendChild(pokeid);
    li.appendChild(img);
    li.appendChild(type);
    li.appendChild(deletion);
    li.appendChild(editing);

    pokeList.insertBefore(li, pokeList.firstChild);

    // Deleting data
    deletion.addEventListener('click', (e) => {

        var result = confirm("Are you sure you want to delete " + name.textContent + "?");

        if (result) {
            e.stopPropagation();
            let id = e.target.parentElement.getAttribute('data-id');
            db.collection('pokeList').doc(id).delete();
        }
    })

    // Editing data
    editing.addEventListener('click', (e) => {

        if (editing.textContent == 'Edit Name') {
            // Here we change the button and replace the pokemon name with a text input!
            editing.textContent = 'Save';
            name.parentNode.replaceChild(newName, name);
            newName.value = '';

        } else {
            // Here we return everything back to normal and change the pokemon name in the firestore.
            if (newName.value.length !== 0) {
                editing.textContent = 'Edit Name';
                editedName = newName.value;

                newName.parentNode.replaceChild(name, newName);

                let id = e.target.parentElement.getAttribute('data-id');
                var pokeRef = db.collection("pokeList").doc(id);

                pokeRef.update({
                    "Pokemon.name": editedName
                })
                    .then(function () {
                        console.log("Document successfully updated!");
                    })
                    .catch(function (error) {
                        console.error("Error updating document: ", error);
                    });

            } else {
                alert("You need to type something!")
            }
        }
    })
}

