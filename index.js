
const { fork } = require( 'child_process' );
const Log = require( 'log' ), log = new Log();
const express = require( 'express' ), app = express();
const bodyParser = require( 'body-parser' );
const moment = require( 'moment' );
const ml = require( 'ml-regression' ), SLR = ml.SLR;
const createMovieFetcher = require( './streams/movie-fetcher.js' );

const x = [];
const y = [];
let regressionModel;

let index = 0;

const movieFetcher = createMovieFetcher();

movieFetcher.on( 'data', ( data ) => {

  if ( ++index % 2000 === 0 ) log.info( `movies fetched: ${index}` );

  const { vote_average, release_date } = data;

  const release_year = moment( release_date ).format( 'YYYY' );
  if ( isNaN( release_year ) || isNaN( vote_average ) ) return;
  if ( release_year <= 0 || vote_average <= 0 ) return;

  x.push( parseFloat( release_year ) );
  y.push( parseFloat( vote_average ) );

} );

movieFetcher.on( 'error', log.error );

movieFetcher.on( 'end', () => {

  regressionModel = new SLR( x, y );

  log.debug( regressionModel.toString() );

  // start express server for browser UI

  startServer();

} );

const startServer = () => {

  app.use( bodyParser.json() );
  app.use( bodyParser.urlencoded( { extended: true } ) );

  app.use( '/', express.static( './public' ) );

  app.get( '/data', ( req, res ) => {
    
    const inputs = [];
    const outputs = [];

    for ( let year = 1900; year < 2018; year++ ) {
      inputs.push( year );
      outputs.push( regressionModel.predict( parseFloat( year ) ) );
    }

    res.json( { inputs, outputs } );

  } );

  app.listen( process.env.PORT || 8080, () => {
    console.log( 'listening...' );
  } );

};