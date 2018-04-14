
( function() {

  var createChart = function( args ) {

    var inputs = args.inputs;
    var outputs = args.outputs;

    var config = {
      type: 'line',
      data: {
        labels: inputs,
        datasets: [ {
          data: outputs,
          label: 'rating',
          borderColor: '#336699',
          fill: false
        } ]
      },
      options: {
        title: {
          display: true,
          text: 'Movie ratings over time'
        }
      }
    };

    var chart = new Chart( document.getElementById( 'line-chart' ), config );

  };

  // ---

  fetch( '/data', {
    headers: {
      'Content-Type': 'application/json'
    }
  } )
  .then( function( res ) {
    return res.json();
  } )
  .then( function( data ) {

    console.log( 'data: ', data );

    createChart( {
      inputs: data.inputs,
      outputs: data.outputs
    } );

  } )
  .catch( function( err ) {
    console.log( 'err: ', err );
  } );

} )();