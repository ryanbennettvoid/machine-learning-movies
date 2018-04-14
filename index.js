
const { fork } = require( 'child_process' );
const Log = require( 'log' ), log = new Log();
const express = require( 'express' ), app = express();
const bodyParser = require( 'body-parser' );
const moment = require( 'moment' );
const ml = require( 'ml-regression' ), SLR = ml.SLR, PR = ml.PolynomialRegression;
const createMovieFetcher = require( './lib/movie-fetcher.js' );

const x = [];
const y = [];

const movieReleases = {};

let regressionModel;

const updateModel = () => {
  regressionModel = new PR( x, y, 5 );
  log.debug( regressionModel.toString() );
};

// refresh model periodically
const timer = setInterval( () => {
  updateModel();
}, 1000 * 5 );

// ---

let index = 0;

const movieFetcher = createMovieFetcher();

movieFetcher.on( 'data', ( data ) => {

  if ( ++index % 100 === 0 && process.env.DEV ) log.info( `movies fetched: ${index}` );

  const { vote_average, release_date } = data;

  const release_year = moment( release_date ).format( 'YYYY' );
  if ( isNaN( release_year ) || isNaN( vote_average ) ) return;
  if ( release_year <= 0 || vote_average <= 0 ) return;

  x.push( parseFloat( release_year ) );
  y.push( parseFloat( vote_average ) );
  
  movieReleases[ release_year ] = movieReleases[ release_year ] || [];
  movieReleases[ release_year ].push( data );

} );

movieFetcher.on( 'error', ( err ) => {
  log.error( 'err: ', err );
} );

movieFetcher.on( 'end', () => {

  updateModel();
  clearInterval( timer );
  log.info( 'done' );

} );

// ----

( () => {

  app.use( bodyParser.json() );
  app.use( bodyParser.urlencoded( { extended: true } ) );

  app.use( '/', express.static( './public' ) );

  app.get( '/data', ( req, res ) => {
    
    const inputs = []; // years
    const outputs = []; // predicted average ratings
    const samples = []; // num of yearly ratings
    const averages = []; // average rating each year

    if ( !regressionModel ) return res.json( { inputs, outputs, samples, averages } );

    const currentYear = parseInt( moment().format( 'YYYY' ) );
    const yearRange = 100;
    const startYear = currentYear - yearRange;

    for ( let year = startYear; year <= currentYear; year++ ) {

      inputs.push( year );
      outputs.push( regressionModel.predict( parseFloat( year ) ) );

      const movies = ( movieReleases[ year ] || [] );
      samples.push( movies.length );

      const average = movies.reduce( ( acc, m ) => acc + parseFloat( m.vote_average ), 0 ) / movies.length;
      averages.push( average || 0 );

    }

    res.json( { inputs, outputs, samples, averages } );

  } );

  app.listen( process.env.PORT || 8080, () => {
    console.log( 'listening...' );
  } );

} )();