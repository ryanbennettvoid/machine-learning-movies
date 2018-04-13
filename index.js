
const createMovieFetcher = require( './streams/movie-fetcher.js' );

const movieFetcher = createMovieFetcher();

movieFetcher.on( 'data', ( data ) => {

  console.log( 'data: ', JSON.stringify( data ).length );

} );

movieFetcher.on( 'error', ( err ) => {

  console.log( 'err: ', err );

} );