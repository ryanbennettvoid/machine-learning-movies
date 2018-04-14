
const { api_key } = require( '../config.json' );

const Promise = require( 'bluebird' );
const Readable = require( 'stream' ).Readable;
const fetch = require( 'node-fetch' );
const path = require( 'path' );

const low = require( 'lowdb' );
const FileSync = require( 'lowdb/adapters/FileSync' );
const adapter = new FileSync( 'db.json' );

module.exports = () => {

  const db = low( adapter );
  db.defaults( { pages: [] } ).write();

  const s = new Readable( {
    objectMode: true,
    read: () => {}
  } );

  const pages = Array.from( new Array( 1000 ) ).map( ( _, i ) => i+1 );

  Promise.reduce( pages, ( acc, page ) => {

    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${api_key}&sort_by=popularity.desc&page=${page}`;

    // if page is cached, use cache

    const dbPage = db.get( 'pages' ).find( { page } ).value();

    if ( !!dbPage ) {

      const { results } = dbPage;

      results.forEach( ( movie ) => {
        s.push( movie );
      } );

      return;

    }

    // ... otherwise, fetch then cache

    // API rate limiting is 4 req/sec

    return Promise.delay( 250 )
    .then( () => {
      return fetch( url )
    } )
    .then( ( res ) => res.json() )
    .then( ( data ) => {

      db.get( 'pages' ).push( data ).write();

      const { results } = data;

      results.forEach( ( movie ) => {
        s.push( movie );
      } );

    } )
    .catch( ( err ) => {
      s.emit( 'error', err );
    } )
    ;

  }, [] )
  .finally( () => {
    s.push( null );
  } )
  ;

  return s;

};