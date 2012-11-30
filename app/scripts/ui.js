/*****************************************************************************
*
*                  CodeBeats : Online Music Coding Platform
*
*  This file is part of the CodeBeats project. The project is distributed at:
*  https://github.com/maximecb/CodeBeats
*
*  Copyright (c) 2012, Maxime Chevalier-Boisvert
*  All rights reserved.
*
*  This software is licensed under the following license (Modified BSD
*  License):
*
*  Redistribution and use in source and binary forms, with or without
*  modification, are permitted provided that the following conditions are
*  met:
*    * Redistributions of source code must retain the above copyright
*      notice, this list of conditions and the following disclaimer.
*    * Redistributions in binary form must reproduce the above copyright
*      notice, this list of conditions and the following disclaimer in the
*      documentation and/or other materials provided with the distribution.
*    * Neither the name of the Universite de Montreal nor the names of its
*      contributors may be used to endorse or promote products derived
*      from this software without specific prior written permission.
*
*  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
*  IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
*  TO, THE IMPLIED WARRANTIES OF MERCHApNTABILITY AND FITNESS FOR A
*  PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL UNIVERSITE DE
*  MONTREAL BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
*  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
*  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
*  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
*  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
*  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
*  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
*****************************************************************************/

//============================================================================
//      UI Lib Code
//============================================================================

// TODO: everything in global scope for testing via console, uncomment
//(function()
//{

    /*      DOM HELPERS     */



    /*
    Take an object of name/selector pairs and
    create jQuery objects from them
    */
    function makeJQObjects($el)
    {
        for (var id in $el)
        {
            if ($el.hasOwnProperty(id)) $el[id] = $($el[id]);
        }
        return $el;
    }
    
    /*
    Make a function that toggles the buttons
    */
    function makeToggler(play, pause, stop)
    {
        return function ()
        {
            $el.toolbar_btns.attr('disabled', 'disabled');
            if (play) $el.play_btn.removeAttr('disabled');
            if (pause) $el.pause_btn.removeAttr('disabled');
            if (stop) $el.stop_btn.removeAttr('disabled');
        }
    }
    
    /**
    Make a function that will display the given error message.
    Useful in callbacks, etc. Handler is a callback that will be called
    no matter what. ok_handler will be called when the user clicks "ok"
    on the error dialog.
    */
    function makeErrorMsg(msg, handler, ok_handler)
    {
        return function ()
        {
            $el.dim.show();
            $el.error_msg.show();
            $el.error_msg_text.text(msg);
            centerPopup();
            if (handler) handler();
            if (ok_handler)
                $("#error-ok-btn").one("click", {msg: msg}, function (data)
                {
                    ok_handler(data);
                });
        }
    }



    /*      Resizing/Layout     */



    /**
    The CodeMirror editor should take up the available space
    and be at least 400px tall.
    */
    function sizeCM()
    {
        var height = $window.height() - $el.editor.position().top;
        ui.cm.setSize(null, (height < 400  ? 400 : height) + "px");
    }

    /**
    Make sure the popup is centered on the page.
    */
    function centerPopup()
    {
        var $popup = $el.popups.filter(":visible").first();
        var offset = {};
        offset.left = ($window.width() / 2) - ($popup.width() / 2);
        offset.top  = ($window.height() / 2) - ($popup.height() / 2);
        $popup.offset(offset);
    }



    /*      UI Widgets      */



    /**
    Display a popover populated by $content_div
    */
    function showPopup($popup) {
        $el.dim.show();
        $popup.show();
        centerPopup();
    }

    /**
    Hide the popup displayed with showPopup()
    */
    function hidePopup()
    {
        $el.dim.hide();
        $el.popups.hide();
        return false;
    }



    /*      Code Saving/Restoring       */


    /**
    Get the code in localStorage
    */
    function getSavedCode(name)
    {
        return localStorage.getItem(name || "codebeats-last-code");
    }

    /**
    Save the code in localStorage
    */
    function saveCode(name)
    {
        localStorage.setItem((name || "codebeats-last-code"), ui.cm.getValue());
    }



    /*      Utility Functions       */



    /**
    Parse a string like location.hash or location.query into an object
    */
    function parseUrlArgs(args_str)
    {
        var args_ob = {};
        var params = null;
        if ( !args_str.length ) return false;

        // eat leading # or ?
        params = args_str.substr(1).split("&");
        var val = null;
        var i = params.length;
        while (i--)
        {
            val = params[i].split("=");
            if (val.length === 2) args_ob[val[0]] = val[1];
        }

        return args_ob;
    }

    /**
    Parse the document.cookie string into an object
    */
    function parseCookies()
    {
        var args_ob = {};
        var cookies = document.cookie;
        if (!cookies.length) return false;
        
        cookies = cookies.split(";");
        cookies.forEach(function(val)
        {
            val = val.split("=");
            if (val.length === 2) args_ob[val[0]] = val[1];
        });
        return args_ob;
    }

    /**
    Clear out any hash args and cookies we don't want
     */
    function clearAuthArgs()
    {
        // TODO: have this preserve any non-auth related args
        // like gist=, file= etc
        window.location.hash = "";
        document.cookie = "gha=" + no_cookie;
    }

    /**
    Log the user out, destroying any copies of the auth token
    and reloading the page
     */
    function logOut()
    {
        atoken = null;
        logged_in = false;
        clearAuthArgs();
        window.location.reload();
        return false;
    }

    /* GitHub Gist Integration */


    /**
    Get the gists that have been saved to recently.
    */
    function getRecentGists()
    {
        var recent = localStorage.getItem("codebeats-recent-gists");
        return (recent) ? recent.split(",") : [];
    }

    /**
    Add a gist to the recently-saved-to list.
    */
    function saveRecentGist(gist)
    {
        var recent = getRecentGists();
        recent.push( gist );
        recent = recent.join(",");
        return localStorage.setItem("codebeats-recent-gists", recent);
    }
    
    /**
    Display recently saved gist in a select (used by multiple forms)
    */
    function displayRecentGists($select, $nag)
    {
        var recent = getRecentGists();
        var length = recent.length;
        if (length)
        {
            $select.empty();
            while (length--)
            {
                $select.prepend("<option>" + recent[length] + "</option>")
            }
            $nag.hide();
            $select.show();
        }
        else
        {
            $nag.show();
            $select.hide();
        }
    }


    /**
    Make a request for the info for a specific gist
    */
    function getGistOb(gist_id)
    {
        var req = $.get(
            "https://api.github.com/gists/" + gist_id + "?" +
            "access_token=" + atoken + "&" +
            "client_id=" + client_id
            , post_data);
        return req;
    }

    /**
    Get the files for a specific gist
    */
    function getGistFiles(id)
    {
        var req = new $.Deferred();
        getGistOb()
            .success(function(data){
                req.resolve(data.files);
            })
            .fail(github_api_error);
        return req;
    }


    /**
    Save a snippet to GitHub
    */
    function saveSnippet(gist_id, file_name, content)
    {
        // TODO: right now this just saves to a new gist, not update one
        // TODO: let the user enter a description
        var files = {}
        files[file_name] = { content: content };

        var post_data = {
            "public": true,
            description : "Created by CodeBeats.",
            files: files,
        }
        
        post_data = JSON.stringify(post_data);

        // make the GET request
        var req = $.post(
            "https://api.github.com/gists?" +
            "access_token=" + atoken + "&" +
            "client_id=" + client_id
            , post_data);

        // success
        req.success(function(data)
        {
            saveRecentGist(data.id);
        });

        // failure
        req.fail(github_api_error);

        return false;
    }

    function handleSave() {
        hidePopup();
        return false;
    }
    
    
    /**
    Retrieve info about the user; name, gravatar, etc
    */
    function getUserInfo()
    {
        var data = {
            access_token: atoken,
            client_id: client_id
        }

        // make the GET request
        var req = $.get("https://api.github.com/user", data);
        req.success(showUserInfo);
        req.fail(github_api_error);
    }
    
    /**
    Display the user info in a little badge in the toolbar
    */
    function showUserInfo( info )
    {
        user_info = info;
        if (!user_info) return false;
        // display user info in a little badge
        $("#github-login").hide();
        $("#user-info").html("" +
            "<a href='#' id='log-out'>Log Out</a>" + 
            "<small>" + user_info.login + "</small>" +
            "<img src='" + user_info.avatar_url +
            "'>" + 
            "").show();
        $('#log-out').click(logOut);
        return true;
    }

//============================================================================
//      UI Main
//============================================================================


    /**
    ui namespace
    */
    window.ui = {};
    
    /**
    Internal UI state/vars
    */
    
    // codemirror instance
    var cm = null;
    // github auth token
    var atoken  = null;
    // whether the user is logged into GitHub
    var logged_in = false;
    // gihub user info
    var user_info = null;
    // bad hacker, no cookie
    var no_cookie  = "(ಠ_ಠ)"
    // the client id for the app
    // NOTE: this needs to be changed for a real one
    var client_id = "<% CLIENT_ID %>";

    // ui elements
    var $el = {
        // dims the background for popups
        dim : "#dim",
        // all the popup containers
        popups : ".popup",
        // popup for error messages
        error_msg : "#error-msg",
        // container for error text
        error_msg_text :"#error-msg-text",
        // the container for the CM editor
        editor : "#editor",
        // play button in toolbar
        play_btn : "#play-btn",
        // pause button in toolbar
        pause_btn : "#pause-btn",
        // stop button in toolbar
        stop_btn : "#stop-btn",
        // all the toolbar buttons
        toolbar_btns : ".toolbar-btn",
        // link on Load Gist popup
        load_local_link : "#load-local",
        // link on Save Gist popup
        save_local_link : "#save-local"
    }
    
    /**
    Error functions
    */
    
    // Generic error function used for problems connecting to github
    // TODO: make this more robust and specific for various errors
    // for now all errors will just say this and log you out.
    var gh_error_msg = "There was a problem connecting to GitHub."
    var github_api_error =
        makeErrorMsg(gh_error_msg, null, logOut);


    /**
    Initialize all ui functions, elements, etc
    */
    function init() {
        // make jQuery objects for all the elements we need upfront
        $el = makeJQObjects($el);

        // create code mirror editor
        // TODO: keep CM enclosed in this scope to prevent
        // user code monkeying with it?
        ui.cm = CodeMirror($el.editor.get(0), {
            value: getSavedCode(),
            mode: "javascript",
            theme: "monokai",
            lineNumbers: true
        });

        /**
        Update UI
        */
        sizeCM();
        
        /**
        User/Github initializations
        */
        if (logged_in) getUserInfo();

        /**
        ui event listeners
        */

        // close buttons shared by all popups
        $(".popup-close").click(hidePopup);
        $(".cancel-btn").click(hidePopup);

        // save Gist button
        $("#save-btn").click(function() {
            showPopup( $("#save-form") );
            return false;
        });
        
        // open Gist button
        $("#load-btn").click(function() {
            showPopup( $("#open-form") );
            displayRecentGists($("#open-recent"), $("#open-no-recent"));
            return false;
        });
        

        // the "just save what I have locally" link
        $el.save_local_link.click(function ()
        {
            saveCode();
            return hidePopup();
        });
        
        // the "just load what I have saved locally" link
        $el.load_local_link.click(function ()
        {
            ui.cm.setValue(getSavedCode());
            return hidePopup();
        });

        // play
        $el.play_btn.click(makeToggler(false,true,true));
        $el.play_btn.click(function ()
        {
            playAudio(ui.cm.getValue());
        });

        // pause
        $el.pause_btn.click(makeToggler(true,false,true));
        $el.pause_btn.click(function ()
        {
            pauseAudio();
        });

        // stop
        $el.stop_btn.click(makeToggler(true,false,false));
        $el.stop_btn.click(function ()
        {
            stopAudio();
        });
    }


    /**
    Teardown the UI; save any code and if logged in save the auth token to
    a cookie.
    */
    function unload()
    {
        saveCode();
        if (atoken && logged_in)
            document.cookie = "gha=" + atoken;
    }


    /*      Handle Auth and UI pre-initialization       */

    // first check if we already have an auth cookie
    var cookies = parseCookies();
    // if there is an auth cookie, it needs to be overwritten for the life
    // of the page so it can't be accessed from eval()'d code
    if (cookies && cookies.gha && cookies.gha !== no_cookie) {
        atoken = cookies.gha;
        logged_in = true;
        clearAuthArgs()
    } else {
        // parse auth token if any
        // TODO: this needs to be done earlier to grab any
        // gist=&file= args
        var args = parseUrlArgs(window.location.hash);
        if (args.access_token)
        {
            atoken = args.access_token;
            logged_in = true;
            clearAuthArgs();
        }
    }



    /**
    Window event listeners
    */
    var $window = $(window);

    $(init);
    $window.unload(unload);
    $window.resize(sizeCM);
    $window.resize(centerPopup);

//})();
