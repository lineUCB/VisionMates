const recordButton = document.getElementById('recordButton');
const status = document.getElementById('status');
const memosDiv = document.getElementById('memos');// viewallmemos.js



let mediaRecorder;
let recordedChunks = [];
let currentPosition = null;

// Geolocation updates every 5 seconds
function updateGeolocation() {
    navigator.geolocation.getCurrentPosition((position) => {
        currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };
    });
}

updateGeolocation();
setInterval(updateGeolocation, 5000);

recordButton.addEventListener('click', async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        recordButton.textContent = 'Record';
        status.textContent = 'Press "Record" to start recording...';
    } else {
        recordedChunks = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            alert('Recording has been submitted! Once the request is ready your screen reader will be directed to the response. Loading can take a moment so please wait!');
            const blob = new Blob(recordedChunks, { type: 'audio/wav' });
            const formData = new FormData();
            formData.append('audio', blob, 'memo.wav');
            formData.append('location', JSON.stringify(currentPosition));

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            addMemo(result.transcription, result.time, result.location);

        };

        mediaRecorder.start();
        recordButton.textContent = 'Tap Again to Stop Recording';
        
        status.textContent = 'Recording...';
    }
});

async function noggin(transcription, time, location){
    const response = await fetch(
        'https://noggin.rea.gent/reasonable-orangutan-6546',
        {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer rg_v1_a4f94smpk7q5a2pxq9m5htq2qzlqv36tg2v7_ngk',
            },
            body: JSON.stringify({
            // fill variables here.
            "transcript": transcription,
            "time": new Date(time).toLocaleString(),
            "location": (location.latitude, location.longitude),
            }),
        }
        ).then(response => response.text());
        console.log(response)

        const reagentOutput = response;

        const memoData = JSON.parse(reagentOutput);
        const title1 = memoData.title;
        const date1 = memoData.date;
        const location1 = memoData.location;
        console.log(title1, date1, location1);
    
        createMemoListing(title1, date1, location1, transcription);
}

function memoCollection (title, transcription, id) {
    memoCollectionArray.push({ id, title, transcription });
    console.log(memoCollectionArray); // Log the collection to verify
}

let memoCounter = 0; // Initialize the counter
const memoCollectionArray = [];


function createMemoListing(title, date, location, transcript) {
    const memoContainer = document.getElementById('memoContainer');

    const newMemo = document.createElement('div');
    newMemo.className = 'memoListing';

    memoCounter++;
    newMemo.id = `memo-${memoCounter}`;

    const titleElement = document.createElement('p');
    titleElement.textContent = title;
    newMemo.appendChild(titleElement);

    const dateElement = document.createElement('p');
    dateElement.textContent = new Date(date).toLocaleDateString();
    newMemo.appendChild(dateElement);

    const locationElement = document.createElement('p');
    locationElement.textContent = location;
    newMemo.appendChild(locationElement);

    const playButton = document.createElement('img');
    playButton.className = 'imageContainer';
    playButton.src = 'playbutton.png';
    playButton.alt = 'Play Memo Transcript';
    playButton.addEventListener('click', () => {
        const utterance = new SpeechSynthesisUtterance(transcript);
        speechSynthesis.speak(utterance);
    });
    newMemo.appendChild(playButton);

    const shareButton = document.createElement('img');
    shareButton.className = 'imageContainer';
    shareButton.src = 'sharebutton.png';
    shareButton.alt = 'Share Memo';
    shareButton.addEventListener('click', () => {
        navigator.clipboard.writeText(transcript).then(() => {
            alert('Transcription copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy transcription: ', err);
        });
    });
    newMemo.appendChild(shareButton);

    const deleteButton = document.createElement('img');
    deleteButton.className = 'imageContainer';
    deleteButton.src = 'deletebutton.png';
    deleteButton.alt = 'Delete Memo';
    deleteButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this memo?')) {
            newMemo.remove();
        }
    });
    newMemo.appendChild(deleteButton);

    memoContainer.appendChild(newMemo);

    newMemo.setAttribute('tabindex', '-1');
    newMemo.focus();
    newMemo.setAttribute('aria-label', 'This is one of your memos, scroll to view details, such as the AI-generated Title.');
}

// import fetch from 'node-fetch'; // for node.js

async function noggin2(userInput, memoCollection) {
const response = await fetch(
    'https://noggin.rea.gent/minor-takin-3926',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer rg_v1_2mznaflirycsdzia5mgjzt62al8d7ieo8e0y_ngk',
      },
      body: JSON.stringify({
        // fill variables here.
        "userinput": userInput,
        "memocollection": memoCollection,
      }),
    }
  ).then(response => response.text());
}

function memoSearch(userInput) {
    noggin2(userInput, memoCollectionArray);
}

function addMemo(transcription, time, location) {
    const memoDiv = document.createElement('div');
    memoDiv.className = 'memo';
    /*
    memoDiv.innerHTML = `
        <p>Transcription: ${transcription}</p>
        <p>Time: ${new Date(time).toLocaleString()}</p>
        <p>Location: ${location.latitude}, ${location.longitude}</p>
    `;
    */
    memosDiv.appendChild(memoDiv);
    
    noggin(transcription, time, location);

    document.querySelectorAll('.memo').forEach(memo => {
        const memoLocation = JSON.parse(memo.getAttribute('data-location'));
        if (memoLocation.latitude === location.latitude && memoLocation.longitude === location.longitude) {
            alert(`Previous memo found at this location: ${memo.querySelector('p').textContent}`);
        }
    });
}
