const removeEmpty = function ( target ) {

    Object.keys( target ).map( function ( key ) {
  
      if ( target[ key ] instanceof Object ) {
  
        if ( ! Object.keys( target[ key ] ).length && typeof target[ key ].getMonth !== 'function') {
  
          delete target[ key ];
  
        }
  
        else {
  
            removeEmpty( target[ key ] );
  
        }
  
      }
  
      else if ( target[ key ] === null ) {
  
        delete target[ key ];
  
      }
  
    } );
  
  
    return target;
  
  };
  module.exports= removeEmpty;