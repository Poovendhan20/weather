document.addEventListener('DOMContentLoaded', () => {
    // YOUR API KEY
    const apiKey = 'c8ae83e145ae85ea5a8a6857f9d8443f'; 
    const weatherApiUrl = 'https://api.openweathermap.org/data/2.5/weather';

    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const weatherDisplay = document.getElementById('weather-display');
    const errorMsg = document.getElementById('error-message');
    
    // DOM Elements for Video Control
    const videoElement = document.getElementById('video-bg');
    const videoSourceElement = document.getElementById('video-source');

    // Elements for weather display
    const cityNameEl = document.getElementById('city-name');
    const temperatureEl = document.getElementById('temperature');
    const descriptionEl = document.getElementById('description');
    const humidityEl = document.getElementById('humidity');
    const windSpeedEl = document.getElementById('wind-speed');
    // ❌ REMOVED: weatherIconContainer


    // ❌ REMOVED: getWeatherIconClass function


    // 3. Dynamic Video Switching Function
    function updateBackgroundByCondition(condition) {
        const normalizedCondition = condition.toLowerCase(); 
        let videoFile = 'default.mp4'; 

        if (normalizedCondition.includes('clear')) {
            videoFile = 'clear.mp4';
        } else if (normalizedCondition.includes('cloud') || normalizedCondition.includes('mist') || normalizedCondition.includes('haze')) {
            videoFile = 'clouds.mp4';
        } else if (normalizedCondition.includes('rain') || normalizedCondition.includes('drizzle')) {
            videoFile = 'rain.mp4';
        } else if (normalizedCondition.includes('snow')) {
            videoFile = 'snow.mp4';
        } else if (normalizedCondition.includes('thunderstorm')) {
            videoFile = 'thunder.mp4';
        }
        
        const newSrc = `videos/${videoFile}`;

        // Cross-fade the video using opacity and then change source
        videoElement.style.opacity = 0;
        
        setTimeout(() => {
            // Check if the source needs to change before updating
            if (videoSourceElement.src !== newSrc) {
                videoSourceElement.src = newSrc;
                videoElement.load(); // Reload the video element to pick up the new source
            }
            videoElement.play();
            videoElement.style.opacity = 1; // Fade back in
        }, 800); // 800ms to match the CSS transition duration
    }


    // 1. Fetch Weather Data from API
    async function fetchWeather(city) {
        if (!city) {
            displayError('Please enter a city name.');
            return;
        }
        const url = `${weatherApiUrl}?q=${city}&appid=${apiKey}&units=metric`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.cod === 200) {
                updateWeatherDisplay(data);
                updateBackgroundByCondition(data.weather[0].main); 
                displayError(''); 
            } else {
                updateWeatherDisplay(null);
                updateBackgroundByCondition('default'); // Use default video on error
                displayError(`City not found: ${city}. Please check the spelling.`);
            }
        } catch (error) {
            updateWeatherDisplay(null);
            updateBackgroundByCondition('default');
            displayError('Could not fetch weather data. Check your connection.');
            console.error('Fetch error:', error);
        }
    }

    // 2. Update the HTML with fetched data and trigger animations
    function updateWeatherDisplay(data) {
        if (data) {
            weatherDisplay.style.display = 'none'; 
            
            cityNameEl.textContent = `${data.name}, ${data.sys.country}`;
            temperatureEl.innerHTML = `${Math.round(data.main.temp)}°C`;
            descriptionEl.textContent = data.weather[0].description;
            humidityEl.textContent = `${data.main.humidity}%`;
            windSpeedEl.textContent = `${data.wind.speed} m/s`;

            setTimeout(() => {
                weatherDisplay.style.display = 'block';
                weatherDisplay.classList.remove('fadeInSlideUp');
                void weatherDisplay.offsetWidth;
                weatherDisplay.classList.add('fadeInSlideUp');
            }, 50);
        } else {
            weatherDisplay.style.display = 'none';
        }
    }

    // 4. Display Error Messages
    function displayError(message) {
        errorMsg.textContent = message;
    }


    // --- Event Listeners and Initial Load ---
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        fetchWeather(city);
    });

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            fetchWeather(city);
        }
    });
    
    // Initial load: fetch data and set the default video
    updateBackgroundByCondition('default'); 
});