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

    /**
    Make a function that will display the given error message.
    Useful in callbacks, etc. Handler is a callback that will be called
    no matter what. ok_handler will be called when the user clicks "ok"
    on the error dialog.
    */
    function makeErrorMsg(msg, handler, ok_handler)
    {
        return function (data)
        {
            hidePopup();
            $el.dim.show();
            $el.error_msg.show();
            $el.error_msg_text.text(msg);
            centerPopup();
            if (handler) handler(data, msg);
            if (ok_handler)
                $("#error-ok-btn").one("click", {msg: msg, data: data}, function (evt_data)
                {
                    ok_handler(evt_data);
                });
        return false;
        }
    }



    /**
    Display an info message.
    NOTE: msg can be HTML
    */
    function showInfoMsg(msg, legend, ok_handler)
    {
        legend = legend || "";
        $el.dim.show();
        $el.info_msg.show();
        $el.info_msg_text.html(msg);
        $el.info_msg_legend.text(legend);
        centerPopup();
        if (ok_handler)
            $("#info-ok-btn").one("click", {msg: msg}, function (data)
            {
                ok_handler(data);
            });
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
    Make a link to load a given gist/file in CodeBeats
    */
    function makeGistLink(gist_id, file_name)
    {
        return window.location.origin + window.location.pathname +
        "#" + makeUrlArgs({gist: gist_id, file: file_name});
    }

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
    Create a string of arg=value pairs from an object
    */
    function makeUrlArgs(args)
    {
        var args_str = "";
        for (var key in args)
        {
            if (!args.hasOwnProperty(key)) continue;
            args_str += key + "=" + args[key] + "&";
        }
        // eat ending "&"
        args_str = args_str.substring(0, --args_str.length);
        return args_str;
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
        var args = parseUrlArgs(window.location.hash);
        delete args.access_token;
        delete args.token_type;
        window.location.hash = makeUrlArgs(args);
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
        if (recent.indexOf(gist) < 0) recent.push(gist);
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
        var val = null;
        var gist_ob = null;
        
        if (length)
        {
            $select.empty();
            while (length--)
            {
                val = recent[length];
                gist_ob = getRecentGistOb(val);
                $select.prepend("<option value='" + val +
                                "'>" + val +
                                " - " + (gist_ob.desc.substr(0, 30) || "") + "..." +
                                "</option>");
            }
            $nag.hide();
            $select.show();
            return true;
        }
        else
        {
            $nag.show();
            $select.hide();
            return false;
        }
    }

    /**
    Get the gist object for a given id from localStorage or return a new object
    */
    function getRecentGistOb(id)
    {
        var gist = localStorage.getItem(id);
        if (gist) return JSON.parse(gist);
        return { id: id };
    }
    
    /**
    Get the gist object for a given id from localStorage or return a new object
    */
    function saveRecentGistOb(ob)
    {
        localStorage.setItem(ob.id, JSON.stringify(ob));
    }
    

    /**
    Make a request for the info for a specific gist
    */
    function getGistOb(gist_id)
    {
        // TODO: disable pretty much everything if they are not logged in
        var req = $.get(
            "https://api.github.com/gists/" + gist_id + "?" +
            (atoken ? "access_token=" + atoken + "&" : "") +
            "client_id=" + client_id);
        return req;
    }

    /**
    Get the files for a specific gist
    */
    function getGistFiles(id)
    {
        var req = new $.Deferred();
        getGistOb(id)
            .success(function(data){
                req.resolve(data.files);
            })
            .fail(github_api_error);
        return req;
    }


    /**
    Save a snippet to GitHub
    */
    function saveSnippet(gist_id, file_name, desc, content, cb)
    {
        var files = {}
        files[file_name] = { content: content };

        // TODO: let user set public
        var post_data = {
            "public": true,
            description : desc + "\n --  Created by CodeBeats.",
            files: files,
        }
        
        post_data = JSON.stringify(post_data);

        // make the GET request
        var req = $.post(
            "https://api.github.com/gists" +
            ((gist_id) ? "/" + gist_id : "") +
            "?" +
            "access_token=" + atoken + "&" +
            "client_id=" + client_id
            , post_data);

        // success
        req.success(function(data)
        {
            // save code to localStorage
            saveCode();
            // record the gist as recent
            saveRecentGist(data.id);
            // save the description
            var gist_ob = getRecentGistOb(data.id);
            gist_ob.desc = desc;
            // save the last file edited
            gist_ob.last_file = file_name;
            // save the gist info object to local storage
            saveRecentGistOb(gist_ob);
            // add to list of recent gists
            saveRecentGist(data.id);
            if (cb) cb(data);
        });

        // failure
        req.fail(github_api_error);

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

//============================================================================
//      UI Display/Event handling Functions
//============================================================================

    /**
    Load code from a given file/gist into the CM editor
     */
    function loadGistCode(gist_id, file_name)
    {
        var req = getGistOb(gist_id);
        req.success(function(data)
        {
            var file = data.files[file_name];
            // TODO: error handling
            if (file && file.content)
                ui.cm.setValue(file.content);
        });
        req.fail(github_api_error);
    }

    /**
    Handle disabling "recent gists" when the "save to new gist" is checked
     */
    function saveNewGistToggle()
    {
            if ($("#save-create-new").prop("checked"))
            {
                $("#save-recent").attr("disabled", "disabled");
                $("#save-existing-id").attr("disabled", "disabled");
            }
            else
            {
                $("#save-recent").removeAttr("disabled");
                $("#save-existing-id").removeAttr("disabled");
            }
        }


    /**
    Display the prompt to open, setup ui elements
    */
    function setupOpen()
    {
        $("#open-choose-gist").show();
        $("#open-choose-file").hide();
        showPopup( $("#open-form") );
        displayRecentGists($("#open-recent"), $("#open-no-recent"));
        return false;
    }
    
    /**
    Finalize options for opening
    */
    function confirmOpen()
    {
        // check for "Gist ID:"
        var id = $("#open-existing-id").val();
        // check for "Recent Gist"
        if (!id) id = $("#open-recent").val();
        // otherwise, send them back
        if (!id) setupOpen();
        var gist_ob = getRecentGistOb(id);
        if (gist_ob.last_file) $("#open-gist-filename").val(gist_ob.last_file);
        $("#open-choose-gist").hide();
        $("#open-choose-file").show();
        return false;
    }

    /**
    Open gist, handle response
     */
    function handleOpen()
    {
        var id = null;

        // first get filename
        var file_name = $("#open-gist-filename").val();

        if ( !file_name )
        {
            $("#open-gist-filename").focus();
            return false;
        }
        
        // check for "Gist ID:"
        var id = $("#open-existing-id").val();
        // check for "Recent Gist"
        if (!id) id = $("#open-recent").val();
        loadGistCode(id, file_name);
        hidePopup();
        return false;
    }


    /**
    Display the prompt to save, setup ui elements
    */
    function setupSave()
    {
        $("#save-gist-details").hide();
        $("#save-choose-gist").show();
        showPopup( $("#save-form") );
        var recent =
            displayRecentGists($("#save-recent"), $("#save-no-recent"));
        if (!recent)
        {
            $("#save-create-new").prop("checked", true);
        }
        else
        {
            $("#save-create-new").prop("checked", false);
        }
        saveNewGistToggle();
        // size may have changed
        centerPopup();
        return false;
    }

    /**
    Finalize options for saving
    */
    function confirmSave()
    {
        var id = $("#save-recent").val();
        var gist_ob = null;
        // get last entries for the gist if possible
        if (id)
        {
            gist_ob = getRecentGistOb(id);
            if (gist_ob.last_file) $("#save-gist-filename").val(gist_ob.last_file);
            if (gist_ob.desc) $("#save-gist-desc").val(gist_ob.desc);
        }
        $("#save-choose-gist").hide();
        $("#save-gist-details").show();
        return false;
    }


    /**
    Save gist, handle response
     */
    function handleSave()
    {

        var id = null;
        var file_name = $("#save-gist-filename").val();
        var desc = $("#save-gist-desc").val();

        if ( !file_name )
        {
            $("#save-gist-filename").focus();
            return false;
        }
        

        function cb(data)
        {
            hidePopup();
            var code_beats_link =  makeGistLink(data.id, file_name);
            var msg = "Your code has been saved to: " +
                      "<a href='"  + data.html_url + "'>" +
                      data.html_url + "</a><br/><br/>" +
                      "You can link people to it at: " +
                      "<a href='" + code_beats_link + "'>" +
                      code_beats_link + "</a>";
            showInfoMsg(msg, "Gist Saved");
        }
        
        if ($("#save-create-new").prop("checked"))
        {
            saveSnippet(null, file_name, desc, ui.cm.getValue(), cb);
        }
        else
        {
            // first check for "Existing Gist" entry
            id = $("#save-existing-id").val();
            // check for selection in "Recent Gists"
            if (!id) id = $("#save-recent").val();
            // if no id, send them back to select/enter one
            if (!id) return setupSave();
            saveSnippet(id, file_name, desc, ui.cm.getValue(), cb);
        }
        return false;
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

    
    // TODO: these are not used atm
    // the currently selected gist
    var gist = null;
    // the currently selected file
    var file = null;

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
        // popup for info message
        info_msg : "#info-msg",
        // container for info text
        info_msg_text :"#info-msg-text",
        // title for info message
        info_msg_legend :"#info-msg-legend",
        // the container for the CM editor
        editor : "#editor",
        // containers for REPL CM editors
        repl_history : "#repl_history",
        repl_input : "#repl_input",
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


        ui.replHistory = CodeMirror($el.repl_history.get(0), {
            mode: "javascript",
            theme: "monokai",
            lineNumbers: false,
            readOnly: true
        });
        ui.replHistory.getScrollerElement().style.height = '120px';

        ui.replInput = CodeMirror($el.repl_input.get(0), {
            mode: "javascript",
            theme: "monokai",
            lineNumbers: false,
            onChange: onReplChange
        });
        ui.replInput.getScrollerElement().style.height = '40px';

        function onReplChange()
        {
            if (ui.replInput.lineCount() <= 1)
                return;

            var input = ui.replInput.getValue().trimRight();
            ui.replInput.setValue('');

            // Evaluate the audio code
            evalAudioCode(input);

            // Update the history
            var history = ui.replHistory.getValue();
            if (history.length > 0)
                history += '\n'
            history += input;
            ui.replHistory.setValue(history);

            // Scroll the history to the last line
            ui.replHistory.scrollIntoView({line:ui.replHistory.lineCount(), ch:0});
        }


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
        $("#save-btn").click(setupSave);
        $("#save-next-btn").click(confirmSave);
        $("#save-confirm-btn").click(handleSave);
        $("#save-create-new").change(saveNewGistToggle);
        
        // open Gist button
        $("#load-btn").click(setupOpen);
        $("#open-next-btn").click(confirmOpen);
        $("#open-confirm-btn").click(handleOpen);
        

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
    var args = parseUrlArgs(window.location.hash);

    // if there is an auth cookie, it needs to be overwritten for the life
    // of the page so it can't be accessed from eval()'d code
    if (cookies && cookies.gha && cookies.gha !== no_cookie) {
        atoken = cookies.gha;
        logged_in = true;
        clearAuthArgs();
    }
    // check if the load is coming from a github authentication
    // redirect
    else if (args.access_token)
    {
        atoken = args.access_token;
        logged_in = true;
        clearAuthArgs();
    }
    
    // check if we need to load a file
    // TODO: args object hasn't been scrubbed yet, does it need it?
    if ( args.gist && args.file ) loadGistCode(args.gist, args.file);



    /**
    Window event listeners
    */
    var $window = $(window);

    $(init);
    $window.unload(unload);
    $window.resize(sizeCM);
    $window.resize(centerPopup);

//})();
