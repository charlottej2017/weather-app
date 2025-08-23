function formatDate(timestamp) {
  let date = new Date(timestamp);
  let hours = date.getHours();
  if (hours < 10) {
    hours = `0${hours}`;
  }
  let minutes = date.getMinutes();
  if (minutes < 10) {
    minutes = `0${minutes}`;
  }

  let days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  let day = days[date.getDay()];
  return `${day} ${hours}:${minutes}`;
}

function formatDay(timestamp) {
  let date = new Date(timestamp * 1000);
  let day = date.getDay();
  let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return days[day];
}

function displayForecast(forecastData) {
  let forecast = forecastData.properties.periods;
  let forecastElement = document.querySelector("#forecast");

  let forecastHTML = `<div class="row">`;
  forecast.forEach(function (period, index) {
    if (index < 6) {
      // limit to 6 periods
      forecastHTML += `
        <div class="col-2">
          <div class="weather-forecast-date">${period.name}</div>
          <img src="${period.icon}" alt="${period.shortForecast}" width="42"/>
          <div class="weather-forecast-temperatures">
            <span class="weather-forecast-temperature-max">${period.temperature}°${period.temperatureUnit}</span>
          </div>
        </div>
      `;
    }
  });

  forecastHTML += `</div>`;
  forecastElement.innerHTML = forecastHTML;
}

function getForecast(coordinates) {
  let apiKey = "b95f9ececad46adfb2b7b5be4da60099";

  let apiUrl = `https://api.openweathermap.org/data/2.5/weather?q={CITY_NAME}&appid={API_KEY}&units=imperial`;
  axios.get(apiUrl).then(displayForecast);
}

function displayTemperature(forecastData, city) {
  const current = forecastData.properties.periods[0];

  let temperatureElement = document.querySelector("#temperature");
  let cityElement = document.querySelector("#city");
  let descriptionElement = document.querySelector("#description");
  let windElement = document.querySelector("#wind");
  let dateElement = document.querySelector("#date");
  let iconElement = document.querySelector("#icon");

  temperatureElement.innerHTML = current.temperature;
  cityElement.innerHTML = city;
  descriptionElement.innerHTML = current.shortForecast;
  windElement.innerHTML = current.windSpeed;
  dateElement.innerHTML = formatDate(new Date(current.startTime));

  iconElement.setAttribute("src", current.icon);
  iconElement.setAttribute("alt", current.shortForecast);

  displayForecast(forecastData);
}

async function search(city) {
  try {
    // Convert city → lat/lon using Nominatim
    const geoUrl = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
      city
    )}&format=json&limit=1`;
    const geoRes = await fetch(geoUrl, {
      headers: { "User-Agent": "MyWeatherApp (myemail@example.com)" },
    });
    const geoData = await geoRes.json();
    if (geoData.length === 0) throw new Error("City not found");
    const lat = geoData[0].lat;
    const lon = geoData[0].lon;

    // Weather.gov point lookup
    const pointRes = await fetch(
      `https://api.weather.gov/points/${lat},${lon}`
    );
    const pointData = await pointRes.json();

    // Grab city + state from weather.gov API
    const cityName =
      pointData.properties.relativeLocation.properties.city || city;
    const stateName =
      pointData.properties.relativeLocation.properties.state || "";

    // Forecast URL
    const forecastUrl = pointData.properties.forecast;
    const forecastRes = await fetch(forecastUrl);
    const forecastData = await forecastRes.json();

    // Pass to display function
    displayTemperature(forecastData, `${cityName}, ${stateName}`);
  } catch (err) {
    console.error("Search error:", err);
  }
}

function handleSubmit(event) {
  event.preventDefault();
  let cityInputElement = document.querySelector("#city-input");
  search(cityInputElement.value);
}

// Current location button

function showPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  fetch(`https://api.weather.gov/points/${lat},${lon}`)
    .then((res) => res.json())
    .then((pointData) => {
      const city =
        pointData.properties.relativeLocation.properties.city || "Unknown City";
      const state =
        pointData.properties.relativeLocation.properties.state || "";

      // Now fetch the forecast
      return fetch(pointData.properties.forecast)
        .then((res) => res.json())
        .then((forecastData) =>
          displayTemperature(forecastData, `${city}, ${state}`)
        );
    })
    .catch((err) => console.error(err));
}

let button = document.querySelector("#current-location");
button.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(showPosition);
});
// Celsius and Fahrenheit
function displayFahrenheitTemperature(event) {
  event.preventDefault();
  let fahrenheitTemperature = (celsiusTemperature * 9) / 5 + 32;
  celsiusLink.classList.remove("active");
  fahrenheitLink.classList.add("active");
  let temperatureElement = document.querySelector("#temperature");
  temperatureElement.innerHTML = Math.round(fahrenheitTemperature);
}

let form = document.querySelector("#search-form");
form.addEventListener("submit", handleSubmit);

search("New York");
