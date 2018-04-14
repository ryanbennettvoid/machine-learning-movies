
const { api_key } = require( '../config.json' );

const Promise = require( 'bluebird' );
const Readable = require( 'stream' ).Readable;
const fetch = require( 'node-fetch' );
const path = require( 'path' );
const md5 = require( 'md5' );

const low = require( 'lowdb' );
const FileSync = require( 'lowdb/adapters/FileSync' );
const adapter = new FileSync( 'db.json' );

const db = low( adapter );
db.defaults( { pages: [] } ).write();

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

module.exports = () => {

  const s = new Readable( {
    objectMode: true,
    read: () => {}
  } );

  // iterate over each year...

  const years = Array.from( new Array( 100 ) ).map( ( _, i ) => i + 1917 );

  Promise.reduce( years, ( acc, year ) => {

    // get first page and total num pages....

    const firstPageUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${api_key}&year=${year}&page=1`;

    return customFetch( firstPageUrl )
    .then( ( firstPage ) => {

      const { total_pages } = firstPage;

      const pages = Array.from( new Array( total_pages ) ).map( ( _, i ) => i + 1 );

      // fetch each page...
      return Promise.reduce( pages, ( acc, page ) => {

        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${api_key}&sort_by=popularity.desc&page=${page}`;

        return customFetch( url )
        .then( ( data ) => {

          const { results } = data;

          results.forEach( ( movie ) => {
            s.push( movie ); // emit to stream
          } );

        } )
        .catch( ( err ) => {
          s.emit( 'error', err );
        } )
        ;

      }, [] )
      ;

    } )
    ;

  }, [] )
  .finally( () => {
    s.push( null );
  } )
  ;

  return s;

};