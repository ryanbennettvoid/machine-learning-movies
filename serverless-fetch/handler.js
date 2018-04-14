'use strict';

const { api_key } = require( './config.json' );

const fetch = require( 'node-fetch' );

module.exports.fetch = ( event, context, callback ) => {

  const body = JSON.parse( event.body );

  const { year, page } = body;

  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${api_key}&sort_by=popularity.desc&year=${year}&page=${page}`;

  fetch( url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  } )
  .then( ( res ) => {
    return res.json()
    .then( ( json ) => {
      if ( res.status !== 200 ) throw json;
      return json;
    } );
  } )
  .then( ( data ) => {

    const response = {
      statusCode: 200,
      body: JSON.stringify( data ),
    };

    callback( null, response );

  } )
  .catch( ( err ) => {

    const response = {
      statusCode: 500,
      body: JSON.stringify( data ),
    };

    callback( null, response );

  } )
  ;

};
