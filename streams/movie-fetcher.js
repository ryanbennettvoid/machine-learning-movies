
const { api_key } = require( '../config.json' );

const Promise = require( 'bluebird' );
const Readable = require( 'stream' ).Readable;
const fetch = require( 'node-fetch' );
const path = require( 'path' );
const md5 = require( 'md5' );
const moment = require( 'moment' );

const low = require( 'lowdb' );
const FileSync = require( 'lowdb/adapters/FileSync' );
const adapter = new FileSync( 'db.json' );

const db = low( adapter );
db.defaults( { pages: [] } ).write();

// ---

const customFetch = ( url ) => {

  const urlHash = md5( url.toLowerCase() );

  const dbPage = db.get( 'pages' ).find( { urlHash } ).value();

  if ( !!dbPage ) return Promise.resolve( dbPage );

  return Promise.delay( 250 ) // rate limited at 4 req/sec 
  .then( () => {
    return fetch( url );
  } )
  .then( ( res ) => {
    return res.json();
  } )
  .then( ( json ) => {
    db.get( 'pages' ).push( { ...json, urlHash } ).write();
    return json;
  } )
  ;

};

// ---

const handleStream = ( s ) => {

  // iterate over each year...

  const currentYear = parseInt( moment().format( 'YYYY' ) );
  const yearRange = 100;
  const startYear = currentYear - yearRange;

  const years = Array.from( new Array( yearRange ) ).map( ( _, i ) => i + startYear );

  return Promise.reduce( years, ( acc, year ) => {

    // get first page and total num pages....

    const firstPageUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${api_key}&sort_by=popularity.desc&year=${year}&page=1`;

    return customFetch( firstPageUrl )
    .then( ( firstPage ) => {

      const { total_pages } = firstPage;

      const pages = Array.from( new Array( Math.min( 1000, total_pages ) ) ).map( ( _, i ) => i + 1 );

      // fetch each page...
      return Promise.reduce( pages, ( acc, page ) => {

        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${api_key}&sort_by=popularity.desc&year=${year}&page=${page}`

        return customFetch( url )
        .then( ( data ) => {

          const { results } = data;

          results.forEach( ( movie ) => {
            s.push( movie ); // emit to stream
          } );

        } )
        ;

      }, [] )
      ;

    } )
    ;

  }, [] )
  .catch( ( err ) => {
    s.emit( 'error', err );
  } )
  .finally( () => {
    s.push( null );
  } )
  ;

};

// ---

module.exports = () => {

  const s = new Readable( {
    objectMode: true,
    read: () => {}
  } );

  handleStream( s );

  return s;

};