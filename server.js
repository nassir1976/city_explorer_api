'use strict';

//declare the application dependencies/ bring in my dependencies(modules)
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();


// start my application

const app = express();
const PORT = process.env.PORT || 3002;

// start database


app.use(cors());
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const YELP_API_KEY = process.env.YELP_API_KEY;
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', error => console.error(error));

// Routes
app.get('/', (request, response) => {
  response.status(200).send('hello World');
});
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/movies', movieHandler);
app.get('/yelp', yelpHandler);



function locationHandler(request, response) {
  // console.log('1', request.query.city);
  client.query('SELECT * FROM firstTable WHERE search_query =$1;', [request.query.city]).then(data => {
    if (data.rows.length > 0) {
      console.log('info. from database');
      console.log(data.rows);
      response.send(data.rows[0]);
    } else {
      console.log('from internet');
      // const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
      // let city = request.query.city;
      // console.log(request.query.city);
      const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${request.query.city}&format=json`;
      //asnsicrness request
      superagent.get(url)
        // then response data
        .then(data => {

          const locationData = data.body;
          console.log(locationData);
          //  create our objects based on our constructor
          const location = new Location(request.query.city, locationData[0]);
          console.log(location);
          client.query(`INSERT INTO firstTable(search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);`, [location.search_query, location.formatted_query, location.latitude, location.longitude]).then(() => {
            console.log('last call', location);
            response.status(200).send(location);
          });

        });
    }
  });
}




function weatherHandler(request, response) {
  // const city = request.query.search_query;
  // const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
  const longitude = request.query.longitude;
  const latitude = request.query.latitude;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?key=${WEATHER_API_KEY}&lat=${request.query.latitude}&lon=${request.query.longitude}&days=8`;

  superagent.get(url).then(instantWeather => {
    const weatherForecast = instantWeather.body;
    const weatherData = weatherForecast.data.map(instantWeather =>
      new Weather(instantWeather));



    response.send(weatherData);

  }).catch(error => console.log(error));


}
function movieHandler(request, response) {
  // const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
  const city = request.query.search_query;
  console.log(city);
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&query=${request.query.search_query}`;
  superagent.get(url).then(movieInfo => {
    const movies = movieInfo.body;
    console.log(movies);
    const updatedMovieInfo = movies.results.map(movieInfo => new MovieDb(movieInfo));
    response.send(updatedMovieInfo);
  }).catch(error => console.log(error));

}

function yelpHandler(request, response) {
  // limit the amount of resturant perpage
  const numPerPage = 5;
  const page = request.query.page || 1;
  const start = ((page - 1) * numPerPage + 1);
  const YELP_API_KEY = process.env.YELP_API_KEY;
  console.log(YELP_API_KEY);
  const city = request.query.search_query;

  console.log(city);
  const url = `http://api.yelp.com/v3/businesses/search?&location=${request.query.search_query}&term="resturant"`;

  // limit the amount of resturant perpage
  const quaryparams = {
    limit: numPerPage,
    offset: start
  };

  return superagent.get(url)
    .set('Authorization', `Bearer ${YELP_API_KEY}`)
    // limit the amount of resturant perpage
    .query(quaryparams)

    .then(getBusinessInfo => {
      const yelpInfo = getBusinessInfo.body.businesses;
      console.log(yelpInfo);
      const newInfo = yelpInfo.map(getBusinessInfo => new Yelp(getBusinessInfo));
      response.send(newInfo);
    }).catch(error => console.log(error));
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

function MovieDb(movie) {
  this.title = movie.orginal_title;
  this.overview = movie.overview;
  this.average_votes = movie.average_votes;
  this.total_votes = movie.total_votes;
  this.popularity = movie.popularity;
  this.released_on = movie.released_on;
  this.image_url = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  // this.image_url = "https://image.tmdb.org/t/p/w500/afkYP15OeUOD0tFEmj6VvejuOcz.jpg";


}
function Yelp(yelpInfo) {
  this.name = yelpInfo.name;
  this.image_url = yelpInfo.image_url;
  this.price = yelpInfo.price;
  this.rating = yelpInfo.rating;
  this.url = yelpInfo.url;
}



function errorHandler(request, response) {
  response.status(500).send('Sorry, something went wrong');
}
app.use('*', errorHandler);


client.connect().then(() => {
  app.listen(PORT, () => console.log(`now listening on port${PORT}`));



}).catch(error => console.error(error));

