(function() {
  
  // ui namespace
  window.ui = {};
  
  
  // internal UI elements
  var $window     = $( window );
  var $dim        = null;
  var $popup      = null;
  var $popup_body = null;
  
  
  /* Code Saving/Restoring */
  
  
  ui.getSavedCode = function( name ) {
    return localStorage.getItem( (name || "codebeats-last-code") );
  }
  
  ui.saveCode = function( name ) {
    localStorage.setItem( (name || "codebeats-last-code"), ui.cm.getValue() );
  }
  
  
  /* Resizing/Layout */
  
  
  // *sizeCM*
  // The CodeMirror editor should take up the available space and be at least 300px tall.
  ui.sizeCM = function() {
    var height = $window.height() - ui.$editor.position().top;
    ui.cm.setSize( null, (height < 300  ? 300 : height) + "px" );
  }
  
  // *centerPopup*
  // Make sure the popup is centered on the page.
  ui.centerPopup = function() {
    var offset = {};
    offset.left = ( $window.width() / 2 ) - ( $popup.width() / 2 );
    offset.top  = ( $window.height() / 2 ) - ( $popup.height() / 2 );
    $popup.offset( offset );
  }
  
  
  /* UI Widgets */
  
  ui.showPopup = function( $content_div ) {
    $popup_body.empty();
    $content_div = $content_div.clone();
    $popup_body.append( $content_div );
    $content_div.show();
    $dim.show();
    $popup.show();
    ui.centerPopup();
  }
  
  ui.hidePopup = function( ) {
    $dim.hide();
    $popup.hide();
    $popup_body.empty();
  }
  
  /* Utility Functions */
  
  ui.parseUrlArgs = function( args_str ) {
    var args_ob  = {};
    var params   = null;
    if ( !args_str.length ) return false;
    // eat leading # or ?
    params = args_str.substr( 1 ).split( "&" );
    params.forEach(function( val ) {
      val = val.split( "=" );
      if ( val.length === 2 ) args_ob[ val[0] ] = val[ 1 ];
    });
    return args_ob;
  }
  
  
  /* GitHub Gist Integration */

  
  
  /* Event Handling, Init, Etc */
  
  // init
  // Initialize the UI
  function init() {
    // initialize locals
    $dim        = $( "#dim" );
    $popup      = $( "#popup" );
    $popup_body = $( "#popup-content" );
    
    // initialize ui properties
    ui.$editor = $( "#editor" );
    ui.editor  = ui.$editor.get( 0 );
    
    // create code mirror editor
    ui.cm = CodeMirror( ui.editor, {
       value: ui.getSavedCode()
      ,mode:  "javascript"
      ,theme: "monokai"
      ,lineNumbers: true
    });
    
    // Handle GH auth
    
    
    // Update UI
    ui.sizeCM();
    
    // ui event listeners
    $( "#popup-close" ).click( function(){
      ui.hidePopup();
      return false;
    });
    
    // test
    // TODO: remove
    $( "#load-btn" ).click( function() {
      ui.showPopup( $("#open-form") );
    });
  }
  
  
  // Window event listeners
  $( init );
  $window.unload( ui.saveCode );
  $window.resize( ui.sizeCM );
  $window.resize( ui.centerPopup );
  
})();