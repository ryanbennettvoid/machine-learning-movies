
const { api_key } = require( '../config.json' );

const Promise = require( 'bluebird' );
const Readable = require('stream').Readable;
const fetch = require( 'node-fetch' );
const fs = require( 'fs' );
const md5 = require( 'md5' );
const path = require( 'path' );

module.exports = () => {

  const s = new Readable( {
    objectMode: true,
    read: () => {}
  } );

  const pages = Array.from( new Array( 1000 ) ).map( ( _, i ) => i+1 );

  Promise.reduce( pages, ( acc, page ) => {

    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${api_key}&sort_by=popularity.desc&page=${page}`;
    const urlHash = md5( url );
    const cacheFilepath = path.resolve( __dirname, `../cache/${urlHash}` );

    // if page is cached, use cache
    if ( fs.existsSync( cacheFilepath ) ) {

      const data = JSON.parse( fs.readFileSync( cacheFilepath ) );

      results.forEach( ( movie ) => {
        s.push( movie );
      } );

    }

    // ... otherwise, fetch then cache

    // API rate limiting is 4 req/sec
    return Promise.delay( 250 )
    .then( () => {
      return fetch( url )
    } )
    .then( ( res ) => res.json() )
    .then( ( data ) => {

      fs.writeFileSync( cacheFilepath, JSON.stringify( data ) );

      const { results } = data;

      results.forEach( ( movie ) => {
        s.push( movie );
      } );

    } )
    .catch( ( err ) => {
      s.emit( 'error', err );
    } )
    ;

  }, [] );

  return s;

};