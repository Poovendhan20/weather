document.addEventListener('DOMContentLoaded', () => {
    // YOUR API KEY
    const apiKey = 'c8ae83e145ae85ea5a8a6857f9d8443f'; 
    const currentWeatherApiUrl = 'https://api.openweathermap.org/data/2.5/weather';
    const forecastApiUrl = 'https://api.openweathermap.org/data/2.5/forecast'; // New API endpoint

    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const weatherDisplay = document.getElementById('weather-display');
    const forecastContainer = document.getElementById('forecast-container');
    const forecastCards = document.getElementById('forecast-cards');
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

    // Helper to map OpenWeatherMap icon code to a Font Awesome class (used for forecast)
    function getWeatherIconClass(iconCode) {
        switch (iconCode) {
            case '01d': return 'fa-sun'; 
            case '01n': return 'fa-moon'; 
            case '02d': return 'fa-cloud-sun'; 
            case '02n': return 'fa-cloud-moon'; 
            case '03d':
            case '03n': return 'fa-cloud'; 
            case '04d':
            case '04n': return 'fa-cloud-meatball'; 
            case '09d':
            case '09n': return 'fa-cloud-showers-heavy'; 
            case '10d':
            case '10n': return 'fa-cloud-sun-rain'; 
            case '11d':
            case '11n': return 'fa-bolt'; 
            case '13d':
            case '13n': return 'fa-snowflake'; 
            case '50d':
            case '50n': return 'fa-smog'; 
            default: return 'fa-question-circle';
        }
    }
    
    // NEW: Function to process 3-hour forecast into 5 daily forecasts
    function processForecastData(data) {
        const dailyData = {};
        const today = new Date().toDateString();

        // Iterate over all 40 (5 days * 8 intervals) 3-hour forecasts
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000); // Convert Unix timestamp to milliseconds
            const dateStr = date.toDateString(); // e.g., "Wed Oct 01 2025"

            // Skip today's data as it's typically covered by the current weather card
            if (dateStr === today) return;

            // Initialize daily entry if it doesn't exist
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = {
                    minTemp: item.main.temp,
                    maxTemp: item.main.temp,
                    icon: item.weather[0].icon,
                    day: date.toLocaleDateString('en-US', { weekday: 'short' })
                };
            } else {
                // Update min/max temps
                dailyData[dateStr].minTemp = Math.min(dailyData[dateStr].minTemp, item.main.temp);
                dailyData[dateStr].maxTemp = Math.max(dailyData[dateStr].maxTemp, item.main.temp);
            }
        });

        // Convert the object to an array and slice to get the next 5 days
        const forecastArray = Object.values(dailyData).slice(0, 5);
        displayForecast(forecastArray);
    }
    
    // NEW: Function to inject forecast cards into HTML
    function displayForecast(forecasts) {
        forecastCards.innerHTML = ''; // Clear previous forecasts
        
        if (forecasts.length === 0) {
            forecastContainer.style.display = 'none';
            return;
        }

        forecasts.forEach(day => {
            const iconClass = getWeatherIconClass(day.icon);
            const item = document.createElement('div');
            item.classList.add('forecast-item');
            item.innerHTML = `
                <p class="day-name">${day.day}</p>
                <i class="fa-solid ${iconClass}"></i>
                <p class="temp-range">${Math.round(day.maxTemp)}° / ${Math.round(day.minTemp)}°</p>
            `;
            forecastCards.appendChild(item);
        });

        forecastContainer.style.display = 'block';
    }


    // 3. Dynamic Video Switching Function
    function updateBackgroundByCondition(condition) {
        const normalizedCondition = condition.toLowerCase(); 
        let videoFile = 'default.mp4'; 

        if (normalizedCondition.includes('clear')) { videoFile = 'clear.mp4'; } 
        else if (normalizedCondition.includes('cloud') || normalizedCondition.includes('mist') || normalizedCondition.includes('haze')) { videoFile = 'clouds.mp4'; } 
        else if (normalizedCondition.includes('rain') || normalizedCondition.includes('drizzle')) { videoFile = 'rain.mp4'; } 
        else if (normalizedCondition.includes('snow')) { videoFile = 'snow.mp4'; } 
        else if (normalizedCondition.includes('thunderstorm')) { videoFile = 'thunder.mp4'; }
        
        const newSrc = `videos/${videoFile}`;

        videoElement.style.opacity = 0;
        
        setTimeout(() => {
            if (videoSourceElement.src !== newSrc) {
                videoSourceElement.src = newSrc;
                videoElement.load();
            }
            videoElement.play();
            videoElement.style.opacity = 1; 
        }, 800);
    }


    // 1. Unified Fetch Function
    async function fetchWeatherData(city) {
        if (!city) {
            displayError('Please enter a city name.');
            return;
        }

        // 1. Fetch Current Weather
        const currentWeatherUrl = `${currentWeatherApiUrl}?q=${city}&appid=${apiKey}&units=metric`;
        // 2. Fetch 5-Day Forecast
        const forecastUrl = `${forecastApiUrl}?q=${city}&appid=${apiKey}&units=metric`;
        
        try {
            const [currentResponse, forecastResponse] = await Promise.all([
                fetch(currentWeatherUrl),
                fetch(forecastUrl)
            ]);

            const [currentData, forecastData] = await Promise.all([
                currentResponse.json(),
                forecastResponse.json()
            ]);

            if (currentData.cod === 200 && forecastData.cod === '200') {
                updateWeatherDisplay(currentData);
                processForecastData(forecastData); // Process and display forecast
                updateBackgroundByCondition(currentData.weather[0].main); 
                displayError(''); 
            } else {
                updateWeatherDisplay(null);
                displayForecast([]); // Clear forecast
                updateBackgroundByCondition('default'); 
                displayError(`City not found: ${city}. Please check the spelling.`);
            }
        } catch (error) {
            updateWeatherDisplay(null);
            displayForecast([]);
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
        fetchWeatherData(city);
    });

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            fetchWeatherData(city);
        }
    });
    
    updateBackgroundByCondition('default'); 
});