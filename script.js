// ============================================
// SkyCast - Weather Dashboard
// Thiranex Internship Project
// HTML, CSS, JavaScript, Fetch API, Async/Await
// ============================================


// 1. HTML ELEMENTS
const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");

const statusMessage = document.getElementById("status-message");
const cityName = document.getElementById("city-name");
const countryName = document.getElementById("country-name");

const temperature = document.getElementById("temperature");
const weatherIcon = document.getElementById("weather-icon");
const weatherDescription = document.getElementById("weather-description");
const feelsLike = document.getElementById("feels-like");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const windDirection = document.getElementById("wind-direction");
const lastUpdated = document.getElementById("last-updated");


// 2. API ENDPOINTS
const GEOCODING_API =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API =
    "https://api.open-meteo.com/v1/forecast";

let latestRequestId = 0;


// 3. WEATHER CONDITIONS
function getWeatherInfo(code, isDay) {
    const conditions = {
        0: ["☀️", "Clear sky", "🌙"],
        1: ["🌤️", "Mainly clear", "🌙"],
        2: ["⛅", "Partly cloudy", "☁️"],
        3: ["☁️", "Overcast", "☁️"],
        45: ["🌫️", "Fog", "🌫️"],
        48: ["🌫️", "Depositing rime fog", "🌫️"],
        51: ["🌦️", "Light drizzle", "🌧️"],
        53: ["🌦️", "Moderate drizzle", "🌧️"],
        55: ["🌧️", "Dense drizzle", "🌧️"],
        56: ["🌧️", "Light freezing drizzle", "🌧️"],
        57: ["🌧️", "Dense freezing drizzle", "🌧️"],
        61: ["🌦️", "Slight rain", "🌧️"],
        63: ["🌧️", "Moderate rain", "🌧️"],
        65: ["🌧️", "Heavy rain", "🌧️"],
        66: ["🌧️", "Light freezing rain", "🌧️"],
        67: ["🌧️", "Heavy freezing rain", "🌧️"],
        71: ["🌨️", "Slight snowfall", "🌨️"],
        73: ["❄️", "Moderate snowfall", "❄️"],
        75: ["❄️", "Heavy snowfall", "❄️"],
        77: ["🌨️", "Snow grains", "🌨️"],
        80: ["🌦️", "Slight rain showers", "🌧️"],
        81: ["🌧️", "Moderate rain showers", "🌧️"],
        82: ["⛈️", "Violent rain showers", "⛈️"],
        85: ["🌨️", "Slight snow showers", "🌨️"],
        86: ["❄️", "Heavy snow showers", "❄️"],
        95: ["⛈️", "Thunderstorm", "⛈️"],
        96: ["⛈️", "Thunderstorm with slight hail", "⛈️"],
        99: ["⛈️", "Thunderstorm with heavy hail", "⛈️"]
    };

    const condition = conditions[code];

    if (!condition) {
        return ["🌡️", "Unknown weather condition"];
    }

    return isDay
        ? [condition[0], condition[1]]
        : [condition[2], condition[1]];
}


// 4. FIND CITY COORDINATES
async function getCityCoordinates(city) {
    const url = new URL(GEOCODING_API);

    url.searchParams.set("name", city);
    url.searchParams.set("count", "10");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `City search failed. HTTP status: ${response.status}`
        );
    }

    const data = await response.json();

    // Check API response
    if (!data || !Array.isArray(data.results) ||
        data.results.length === 0) {
        throw new Error(
            `City "${city}" not found. Try Chennai or Coimbatore.`
        );
    }

    // Prefer exact city name when available
    const exactMatch = data.results.find(
        place =>
            place.name.toLowerCase() === city.toLowerCase()
    );

    const location = exactMatch || data.results[0];

    return {
        name: location.name,
        country: location.country || "Unknown country",
        state: location.admin1 || "",
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone || "auto"
    };
}


// 5. GET WEATHER DATA
async function getWeatherData(latitude, longitude, timezone) {
    const url = new URL(WEATHER_API);

    url.searchParams.set("latitude", latitude);
    url.searchParams.set("longitude", longitude);

    url.searchParams.set(
        "current",
        [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "weather_code",
            "wind_speed_10m",
            "wind_direction_10m"
        ].join(",")
    );

    url.searchParams.set("timezone", timezone);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Weather request failed. HTTP status: ${response.status}`
        );
    }

    const data = await response.json();

    if (!data || !data.current) {
        throw new Error(
            "Weather information is currently unavailable."
        );
    }

    return data;
}


// 6. DISPLAY WEATHER DATA
function displayWeather(location, data) {
    const current = data.current;

    // Validate essential measurements
    const requiredValues = [
        current.temperature_2m,
        current.relative_humidity_2m,
        current.wind_speed_10m,
        current.wind_direction_10m,
        current.weather_code,
        current.is_day
    ];

    const invalidValue = requiredValues.some(
        value =>
            value === null ||
            value === undefined ||
            !Number.isFinite(value)
    );

    if (invalidValue) {
        throw new Error(
            "Some weather measurements are unavailable."
        );
    }

    // City and country
    cityName.textContent = location.name;

    countryName.textContent = [
        location.state,
        location.country
    ].filter(Boolean).join(", ");

    // Temperature
    temperature.textContent =
        Math.round(current.temperature_2m);

    // Weather icon and description
    const weather = getWeatherInfo(
        current.weather_code,
        current.is_day === 1
    );

    weatherIcon.textContent = weather[0];
    weatherDescription.textContent = weather[1];

    // Feels-like temperature
    if (Number.isFinite(current.apparent_temperature)) {
        feelsLike.textContent =
            `Feels like ${Math.round(current.apparent_temperature)}°C`;
    } else {
        feelsLike.textContent =
            "Feels-like temperature unavailable";
    }

    // Humidity
    humidity.textContent =
        Math.round(current.relative_humidity_2m);

    // Wind speed in km/h
    windSpeed.textContent =
        Number(current.wind_speed_10m).toFixed(1);

    // Wind direction in degrees
    windDirection.textContent =
        `${Math.round(current.wind_direction_10m)}°`;

    // Observation time
    const observationTime = new Date(current.time);

    if (!Number.isNaN(observationTime.getTime())) {
        lastUpdated.textContent =
            "Weather observation: " +
            observationTime.toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short"
            });
    } else {
        lastUpdated.textContent =
            "Weather data received successfully.";
    }

    weatherIcon.setAttribute("aria-label", weather[1]);
}


// 7. SEARCH WEATHER
async function searchWeather(city) {
    const requestId = ++latestRequestId;

    statusMessage.textContent =
        `Searching weather for ${city}...`;

    searchButton.disabled = true;
    searchButton.textContent = "Searching...";

    try {
        // Find the city
        const location = await getCityCoordinates(city);

        if (requestId !== latestRequestId) {
            return;
        }

        // Fetch current weather
        const weatherData = await getWeatherData(
            location.latitude,
            location.longitude,
            location.timezone
        );

        if (requestId !== latestRequestId) {
            return;
        }

        // Render weather
        displayWeather(location, weatherData);

        statusMessage.textContent =
            `Weather loaded successfully for ${location.name}.`;

    } catch (error) {
        if (requestId !== latestRequestId) {
            return;
        }

        console.error("Weather Dashboard Error:", error);

        if (error instanceof TypeError) {
            statusMessage.textContent =
                "Network error. Check your internet connection and try again.";
        } else {
            statusMessage.textContent =
                error.message || "Unable to load weather. Please try again.";
        }

    } finally {
        if (requestId === latestRequestId) {
            searchButton.disabled = false;
            searchButton.textContent = "Search";
        }
    }
}


// 8. HANDLE SEARCH FORM
searchForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        statusMessage.textContent =
            "Please enter a city name.";

        cityInput.focus();
        return;
    }

    if (city.length > 100) {
        statusMessage.textContent =
            "Please enter a shorter city name.";

        cityInput.focus();
        return;
    }

    await searchWeather(city);
});


// 9. LOAD DEFAULT CITY
searchWeather("Chennai");