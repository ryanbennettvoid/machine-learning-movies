
const Log = require( 'log' ), log = new Log();
const readline = require( 'readline' );
const moment = require( 'moment' );
const ml = require( 'ml-regression' ), SLR = ml.SLR;
const createMovieFetcher = require( './streams/movie-fetcher.js' );

const rl = readline.createInterface( {
  input: process.stdin,
  output: process.stdout
} );


const x = [];
const y = [];
let regressionModel;

let index = 0;


const movieFetcher = createMovieFetcher();

movieFetcher.on( 'data', ( data ) => {

  if ( ++index % 100 === 0 ) log.info( `movies fetched: ${index}` );

  const { vote_average, release_date } = data;

  const release_year = moment( release_date ).format( 'YYYY' );
  if ( isNaN( release_year ) || isNaN( vote_average ) ) return;
  if ( release_year <= 0 || vote_average <= 0 ) return;

  // console.log( release_year, '->', vote_average );

  x.push( parseFloat( release_year ) );
  y.push( parseFloat( vote_average ) );

} );

movieFetcher.on( 'error', log.error );

movieFetcher.on( 'end', () => {

  log.info( 'end' );

  regressionModel = new SLR( x, y );

  log.debug( regressionModel.toString() );

  prompt();

} );

const prompt = () => {

  rl.question( 'Enter X value: ', ( answer ) => {

    console.log( `prediction: ${regressionModel.predict( parseFloat( answer ) )}` );

    prompt();

  } );

};