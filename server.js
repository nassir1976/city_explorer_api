'use strict';
//declare application dependencies
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = process.env.PORT;


app.get('/',(request, response)=>{
  response.send('hello World');
});
app.get('/location', locationHandler);
// app.get('/weather', weatherHandler);
// app.use('*', errorHandler);

function locationHandler(request, response){
  const geoData = require('./data/location.json');
  const city = request.query.city;
  const locationData = new Location(city, geoData);

  response.send(locationData);
}



// // constructor function

function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}


function Weather(weather){
  // this.time = weather.valid_date;
  // this.forecast =weather.weather.description;
  this.forecast = weather.weather.description;
  let date = Date.parse(weather.datetime);
  this.time = new Date(date).toDateString();

}
app.get('/weather',(request, response)=>{
  let emptyArr = [];
  const weatherData = require('./data/weather.json');
  weatherData.data.forEach(weatherData=>{
    const updatedWeather = new Weather(weatherData);
    emptyArr.push(updatedWeather);

  });
  // response.status(200).json(emptyArr);
  response.send(emptyArr);

});

app.use('*', errorHandler);

function errorHandler(request, response){
  response.status(500).send('Sorry, something went wrong');
}


app.use('*', (request, response) => {
  response.status(500).send('Sorry, something went wrong');
});
app.listen(PORT, () => console.log(`app is listining ${PORT}`));


