
const { api_key, lambda_fetch_url } = require( '../config.json' );

const Promise = require( 'bluebird' );
const Readable = require( 'stream' ).Readable;
const fetch = require( 'node-fetch' );
const path = require( 'path' );
const moment = require( 'moment' );
const fs = Promise.promisifyAll( require( 'fs' ) );

// ---

const customFetch = ( { year, page } ) => {

  const querySignature = `${year}-${page}`;
  const cacheFilepath = path.resolve( __dirname, `../cache/${querySignature}` );

  return fs.statAsync( cacheFilepath )
  .then( () => true )
  .catch( ( err ) => {
    if ( err.code === 'ENOENT' ) return false;
    throw err;
  } )
  .then( ( exists ) => {

    if ( exists ) return fs.readFileAsync( cacheFilepath, 'utf8' ).then( ( str ) => JSON.parse( str ) );

    const url = lambda_fetch_url || `https://api.themoviedb.org/3/discover/movie?api_key=${api_key}&sort_by=popularity.desc&year=${year}&page=${page}`;

    return Promise.delay( 250 ) // rate limited at 4 req/sec/IP
    .then( () => {
      return fetch( url, {
        headers: { 'Content-Type': 'application/json' },
        method: lambda_fetch_url ? 'POST' : 'GET',
        body: lambda_fetch_url ? JSON.stringify( { year, page } ) : undefined
      } );
    } )
    .then( ( res ) => {
      return res.json();
    } )
    .then( ( json ) => {
      return fs.writeFileAsync( cacheFilepath, JSON.stringify( json ) )
      .then( () => json );
    } )
    ;

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

    return customFetch( { year, page: 1 } )
    .then( ( firstPage ) => {

      const { total_pages } = firstPage;

      const pages = Array.from( new Array( Math.min( 1000, total_pages ) ) ).map( ( _, i ) => i + 1 );

      // fetch each page via lambda, concurrently
      if ( lambda_fetch_url ) {

        return Promise.map( pages, ( page ) => {

          return customFetch( { year, page } )
          .catch( ( err ) => {
            s.emit( 'error', err );
          } )
          ;

        }, { concurrency: 500 } )
        .then( ( data ) => {

          data.forEach( ( d ) => {

            const { results } = d||{};

            ( results || [] ).forEach( ( movie ) => {
              s.push( movie ); // emit to stream
            } );

          } );

        } )
        ;

      }

      // fetch each page from local machine, sequentially
      return Promise.reduce( pages, ( acc, page ) => {

        return customFetch( { year, page } )
        .then( ( data ) => {

          const { results } = data||{};

          ( results || [] ).forEach( ( movie ) => {
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