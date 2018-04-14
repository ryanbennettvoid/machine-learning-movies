
( function() {

  var _chart;

  var normalizeValues = function( values ) {

    var ratio = Math.max.apply( Math, values ) / 100;

    return values.map( function ( v ) {
      return Math.round( v / ratio );
    } );

  };

  var createData = function( args ) {

    var inputs = args.inputs;
    var outputs = args.outputs.map( ( o ) => o * 10 );
    var samples = normalizeValues( args.samples );
    var averages = args.averages.map( ( a ) => a * 10 );

    return {
      labels: inputs,
      datasets: [
        {
          data: outputs,
          label: 'predicted average yearly rating',
          borderColor: '#336699',
          fill: false
        },
        {
          data: averages,
          label: 'actual average yearly rating',
          borderColor: '#ff0000',
          fill: false
        },
        {
          data: samples,
          label: 'number of yearly samples',
          borderColor: '#339933',
          fill: false
        }
      ]
    };

  };

  var createCharts = function( args ) {

    var config = {
      type: 'line',
      data: createData( args ),
      options: {
        title: {
          display: true,
          text: 'Movie ratings over time'
        }
      }
    };

    _chart = new Chart( document.getElementById( 'line-chart' ), config );

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

    createCharts( data );

    startPolling();

  } )
  .catch( function( err ) {
    console.log( 'err: ', err );
  } )
  ;

  var startPolling = function() {

    setInterval( function() {

      if ( !_chart ) return;

      fetch( '/data', {
        headers: {
          'Content-Type': 'application/json'
        }
      } )
      .then( function( res ) {
        return res.json();
      } )
      .then( function( data ) {

        if ( _chart ) {
          _chart.data = createData( data );
          _chart.update();
        }

      } )
      ;

    }, 10 * 1000 );

  };

} )();