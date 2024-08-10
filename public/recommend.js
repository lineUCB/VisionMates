// Don't push api keys to repo
const yelpApiKey = '';
const googleApiKey = '';

const recordButton = document.getElementById('recordButton');
const status = document.getElementById('status');
const memosDiv = document.getElementById('memos');

let mediaRecorder;
let recordedChunks = [];
let currentPosition = null;

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
        recordButton.textContent = 'Tap to stop recording message';
        status.textContent = 'Recording...';
    }
});

function addMemo(transcription, time, location) {
    const memoDiv = document.createElement('div');
    memoDiv.className = 'memo';
    /*memoDiv.innerHTML = `
        <p>Transcription: ${transcription}</p>
        <p>Time: ${new Date(time).toLocaleString()}</p>
        <p>Location: ${location.latitude}, ${location.longitude}</p>
    `;
    */
    memosDiv.appendChild(memoDiv);
    respond(transcription);
}


// You can treat this as the main function
function respond(transcription) {
    if (navigator.geolocation) {
        // showPosition is a callback function
        navigator.geolocation.getCurrentPosition(function(position) {
            showPosition(position, transcription);
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Callback
function showPosition(position, transcription) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    getRestaurants(lat, lon, transcription);
}

// This function identifies a user's intent by taking in the user's transcribed audio input
// then identifying whether the data is for a new rec or a continued
// conversation. If it is a new rec, then the user will get a restaurant 
// recommendation using yelp data. Otherwise, the user will get a response based on the 
// comtinued dialogue while using saved localStorage recommendation data from before.
// Identifies the user's intent and outputs either 'first' or 'continued'
async function identifyIntentFirst(transcription) {
    // import fetch from 'node-fetch'; // for node.js

    const response = await fetch(
        'https://noggin.rea.gent/desperate-echidna-9253',
        {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer rg_v1_ikqio64in5964woesbbzllecm42kyxvyz1ry_ngk',
        },
        body: JSON.stringify({
            // fill variables here.
            "user_input": transcription,
        }),
        }
    ).then(response => response.text());
    console.log(response);
    return response;
}

// Returns the current addres for Qiongwen's requirement of current location info
async function getCurrentAddress(lat, lon) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleApiKey}&language=en`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const address = data.results[0].formatted_address;
            displayCurrentAddress(address);
            return address;
        } else {
            console.error('No address found for the given coordinates.');
        }
    } catch (error) {
        console.error('Error fetching data from Google Maps API:', error);
    }
}

// Passing in Yelp JSON results and current address to LLM. It also responds differently based 
// on whether it is a continued conversation.
async function getRestaurants(lat, lon, transcription) {
    console.log(transcription)
    command = await identifyIntentFirst(transcription);

    // const currentAddress = await getCurrentAddress(lat, lon);

    try {
        let data;
        if (command == 'first') {
            const url = `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lon}&categories=restaurants&limit=10`;
            const options = {
                headers: {
                    Authorization: `Bearer ${yelpApiKey}`,
                },
            };
            const response1 = await fetch(url, options);
            data = await response1.json();
            console.log(data);
            localStorage.setItem('storedData', JSON.stringify(data));
        } else {
            // Make sure that the data is deleted once the user exits the html page. Just
            // add this line when needed: localStorage.removeItem('storedData');
            data = JSON.parse(localStorage.getItem('storedData'));
            console.log(data);
        }
        // if (!data || !data.businesses) {
        //     console.error("Invalid input: data or businesses is null or undefined.");
        // } else {
        //     displayRestaurantData(data.businesses);
        // }
        // import fetch from 'node-fetch'; // for node.js

        // Convert JSON data to a readable string format
        const yelpJsonString = JSON.stringify(data, null, 2);
        console.log(data);
        console.log(yelpJsonString);

        // import fetch from 'node-fetch'; // for node.js

        const response2 = await fetch(
            'https://noggin.rea.gent/painful-koala-9693',
            {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer rg_v1_d2f9ea4u17kprijpqgad3tub67i0mgxyovvl_ngk',
            },
            body: JSON.stringify({
                // fill variables here.
                "user_input": transcription,
                "yelp_recommendation": yelpJsonString,
            }),
            }
        ).then(response2 => response2.text());

        // localStorage.removeItem('storedData');
        displayLLMResponse(response2);
    } catch (error) {
        console.error('Error fetching data from Yelp API:', error);
    }
}

// These display functions below are used for my own programming reference, 
// displayLLMResponse might still be useful for outputting LLM responses to our UI
// function displayLLMResponse(response) {
//     const llmDiv = document.createElement('div');
//     llmDiv.innerHTML = `<h2>LLM Response</h2><p>${response}</p>`;
//     document.body.appendChild(llmDiv);
// }

// Use this one for displaying to Josh's UI.
function displayLLMResponse(response) {
    const chatResponseDiv = document.querySelector('.chatResponse');
    const llmResponse = document.createElement('p');
    llmResponse.innerHTML = `${response}`;
    chatResponseDiv.appendChild(llmResponse);
    chatResponseDiv.focus();
}

// function displayCurrentAddress(address) {
//     const currentLocationDiv = document.createElement('div');
//     currentLocationDiv.innerHTML = `<h2>Current Location</h2><p>${address}</p>`;
//     document.body.appendChild(currentLocationDiv);
// }

// function displayRestaurantData(restaurants) {
//     const restaurantDiv = document.getElementById('restaurants');
//     restaurantDiv.innerHTML = '';

//     restaurants.forEach((restaurant) => {
//         const restaurantElement = document.createElement('div');
//         restaurantElement.innerHTML = `
//             <h2>${restaurant.name}</h2>
//             <p>${restaurant.url}</p>
//             <p>${restaurant.location.address1}, ${restaurant.location.city}</p>
//             <p>Rating: ${restaurant.rating}</p>
//             <p>Review Count: ${restaurant.review_count}</p>
//         `;
//         restaurantDiv.appendChild(restaurantElement);
//     });
// }
