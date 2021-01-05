'use strict';

//declare the application dependencies/ bring in my dependencies(modules)
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const superagent = require('superagent');


// start my application

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3002;

// Routes
app.get('/', (request, response) => {
  response.status(200).send('hello World');
});
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);

function locationHandler(request, response) {
  const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
  let city = request.query.city;
  const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${request.query.city}&format=json`;
  //a-snsicrness request
  superagent.get(url)
    // then response data
    .then(data => {
      const locationData = (data.body[0]);
      //  create our objects based on our constructor
      const location = new Location(city, locationData);
      response.status(200).send(location);

    });
}

function weatherHandler(request, response) {
  // const city = request.query.search_query;
  const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
  const longitude = request.query.longitude;
  const latitude = request.query.latitude;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?key=${WEATHER_API_KEY}&lat=${request.query.latitude}&lon=${request.query.longitude}&days=8`;

  superagent.get(url).then(instantWeather => {
    const weatherForecast = instantWeather.body;
    const weatherData = weatherForecast.data.map(instantWeather =>
      new Weather(instantWeather));



    response.send(weatherData);

  });
  // .catch(error => console.log(error));

}

// // constructor function

function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.display_name;
  this.latitude = geoData.lat;
  this.longitude = geoData.lon;
}


function Weather(weather) {
  this.forecast = weather.weather.description;
  let date = Date.parse(weather.datetime);
  this.time = new Date(date).toDateString();

}


function errorHandler(request, response) {
  response.status(500).send('Sorry, something went wrong');
}
app.use('*', errorHandler);

app.listen(PORT, () => console.log(`app is listining ${PORT}`));

app.use('*', (request, response) => {
  response.status(500).send('Sorry, something went wrong');
});

// two paramater listing port and ()callback function


