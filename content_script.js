let db;

function initDatabase() {
  // Open a connection to the IndexedDB database named "EventNotesDB" with version 1.
  const request = window.indexedDB.open("EventNotesDB", 1);

  request.onerror = function(event) {
    // Log any errors that occur when opening the database.
    console.error("An error occurred with IndexedDB:", event.target.errorCode);
  };

  request.onsuccess = function(event) {
    // On successful opening or creation, save the database connection.
    db = event.target.result;
    console.log("Database initialized.");
  };

  request.onupgradeneeded = function(event) {
    // This event is triggered if the database is being created for the first time,
    // or if the version number specified in `open` is greater than the existing version number.
    const db = event.target.result;
    
    // Create an object store named "eventsWithNotes" to hold our events and their notes.
    // We use "eventId" as the key path because it is unique for each event.
    const objectStore = db.createObjectStore("eventsWithNotes", { keyPath: "eventId" });
    
    // Although we're using only the "eventId" as a key, each record will be an object 
    // that includes both an "eventId" and a "note". The database schema implicitly supports 
    // this because it doesn't restrict the structure of the objects stored in each record 
    // beyond requiring them to have a unique "eventId".
    console.log("Object store created.");
  };
}

function saveEventNote(eventId, note) {
  const transaction = db.transaction(["eventsWithNotes"], "readwrite");
  const objectStore = transaction.objectStore("eventsWithNotes");
  const request = objectStore.put({ eventId: eventId, note: note });

  request.onerror = function(event) {
    console.error("Error saving the note:", event.target.errorCode);
  };

  request.onsuccess = function(event) {
    console.log("Note saved successfully!");
  };
}



initDatabase();


document.body.addEventListener('click', function(e) {
    setTimeout(() => {
        const popup = document.querySelector('[role="dialog"]');
        if (!popup) return;

        const existingNote = popup.querySelector('.custom-note');
        if (existingNote) return;

        // Identify the eventId from the popup
        const eventIdElement = popup.querySelector('[data-eventid]');
        const eventId = eventIdElement ? eventIdElement.getAttribute('data-eventid') : null;

        if (eventId && db) {
            const transaction = db.transaction(["eventsWithNotes"]);
            const objectStore = transaction.objectStore("eventsWithNotes");
            const request = objectStore.get(eventId);

            request.onerror = function(event) {
                console.error("Error fetching event from IndexedDB:", event.target.errorCode);
            };

            request.onsuccess = function(event) {
                const data = request.result;
                if (data && data.note) {
                    // Note exists, display it
                    displayNote(popup, data.note, eventId);
                } else {
                    // No note exists, show "Add Note" button
                    addNoteButton(popup, eventId);
                }
            };
        }
    }, 500);
});


function buildNote(note, eventId) {
	const container = document.createElement('div');
    container.style = 'padding: 10px; background-color: #fff; font-size: 14px; color: #000; border-left: 3px solid #4285f4; pointer-events: auto;';
    container.classList.add('custom-note');
    
    const noteElement = document.createElement('pre'); // Use 'pre' to preserve line breaks and spaces
    noteElement.textContent = note;
    noteElement.style = 'padding: 10px; background-color: #fff; font-size: 14px; color: #000; pointer-events: auto; max-width: 300px; white-space: pre-wrap;'; // Added 'white-space: pre-wrap;' to allow long text to wrap
    container.appendChild(noteElement);


    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.style = 'display: block; width: 100%; padding: 10px; background-color: #4285f4; color: #fff; border: none; cursor: pointer; pointer-events: auto;';
    container.appendChild(editButton);

    // Add click listener to the Edit button
    editButton.addEventListener('click', () => {
        // Replace the displayed note with the input area, pre-filled with the note's content
        const inputArea = createNoteInput(eventId, note); // Adjust `createNoteInput` to accept note content
        container.replaceWith(inputArea);
    });

    return container;
}

function displayNote(popup, note, eventId) {
    popup.appendChild(buildNote(note, eventId));
}


function addNoteButton(popup, eventId) {
    const button = document.createElement('button');
    button.textContent = 'Add Note';
    button.classList.add('custom-note');
    button.style = 'padding: 10px; background-color: #4285f4; color: #fff; border: none; cursor: pointer; position: relative; z-index: 1000; pointer-events: auto;';
    
    popup.appendChild(button);

   button.addEventListener('click', (event) => {
        // Replace the "Add Note" button with the note input field and save button
        button.replaceWith(createNoteInput(eventId));
    });
}

function createNoteInput(eventId, existingNote = '') {
    const container = document.createElement('div');
    container.style = 'padding: 10px; background-color: #fff; font-size: 14px; color: #000; border-left: 3px solid #4285f4; pointer-events: auto;';
    container.classList.add('custom-note');
    
    // Use textarea for multiline input
    const input = document.createElement('textarea');
    input.placeholder = 'Enter note';
    input.rows = 4; // Example: Adjust the number of rows as needed
    input.style = 'width: 100%; padding: 10px; box-sizing: border-box; pointer-events: auto; margin-bottom: 10px;'; // Ensure the textarea fits the container and add margin for the button below
    input.value = existingNote; // Pre-fill the textarea if editing an existing note

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.style = 'display: block; width: 100%; padding: 10px; background-color: #4285f4; color: #fff; border: none; cursor: pointer; pointer-events: auto;';

    container.appendChild(input);
    container.appendChild(saveButton); // This ensures the button is below the textarea

    saveButton.addEventListener('click', () => {
        const note = input.value.trim();
        if (note) {
            saveEventNote(eventId, note);
            container.replaceWith(buildNote(note, eventId));
        }
    });
    
    // After appending the container or replacing the content, focus the input
    requestAnimationFrame(() => {
        input.focus();
    });

    return container;
}