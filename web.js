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
// Server-Side Code
//============================================================================


/**
Module Imports
*/
var express = require('express');
// TODO: github docs say https is needed, test this
var http    = require('https');

/**
The options for the POST to get an auth token
*/
var auth_req_ops = {
    host: 'github.com',
    path: '/login/oauth/access_token',
    method: 'POST'
};


/**
Application Server (handles all http requests)
*/
var app = express.createServer(express.logger());

/**
Configure app and middleware
*/
app.configure(function()
{

    // middleware to exchange code for token
    app.use( '/auth/', function(req, res, next)
    {

        // TODO: error handling; no "code" parameter etc

        var code = req.query["code"];

        // note: <% CLIENT_ID %> & <% SECRET_ID %> must be replaced
        // with real ones before deployment
        var post_data =
            "client_id=<% CLIENT_ID %>&client_secret=<% SECRET_ID %>&state=xviv&code="
            + code;

        // need to set Content-Length
        auth_req_ops.headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': post_data.length
        }
        
        // the request object for the POST
        var auth_req = http.request( auth_req_ops, function ( auth_response )
        {
            // token_str will hold the auth token
            var token_str = '';

            auth_response.setEncoding('utf8');

            // getting data from GitHub
            auth_response.on('data', function (chunk)
            {
                token_str += chunk;
            });

            // TODO: need on.close() handler?

            // request done, add token to request object and call
            // next middleware
            auth_response.on('end', function ()
            {
                req.token = token_str;
                next();
            });
        });

        // request for token errored
        auth_req.on('error', function (e)
        {
            // TODO: error handling?
            next();
        });

        // send POST
        auth_req.write(post_data);
        auth_req.end();
    });


    // if not /auth/ fallback on the static server middleware
    // which will just serve static files from /app
    // TODO: app manifest needs to be sent with special headers
    //       implement in another middleware?
    app.use(express.static(__dirname + '/app'));
});


/**
Handlers for app
*/

// The GitHub API will redirect back to /auth/ by the time the request
// hits this handler the middleware has already retrieved an auth token
// and added it to the reguest
app.get('/auth/', function (req, res)
{
    if (req.token)
    {
        // append token to hash and redirect
        res.redirect("/#" + req.token);
    }
    else
    {
        // TODO: redirect with error message
        res.send("doh!");
    }
});


/**
Initialize Server
*/

// heroku puts the appropriate port in env.PORT
var port = process.env.PORT || 5000;

// start server
app.listen(port, function ()
{
    console.log("Listening on:\t" + port);
});