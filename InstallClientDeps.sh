#!/bin/sh

cd app

# basic setup
mkdir components && cd components
# folders for each dep
mkdir jquery
mkdir codemirror
# handle jquery
cd jquery
curl -o jquery.min.js https://ajax.googleapis.com/ajax/libs/jquery/1.8.0/jquery.min.js
# handle codemirror
cd ../codemirror
mkdir lib
mkdir theme
mkdir mode
cd lib
curl -o codemirror.js https://raw.github.com/marijnh/CodeMirror/master/lib/codemirror.js
curl -o codemirror.css https://raw.github.com/marijnh/CodeMirror/master/lib/codemirror.css
cd ../theme
curl -o monokai.css https://raw.github.com/marijnh/CodeMirror/master/theme/monokai.css
cd ../mode
mkdir javascript && cd javascript
curl -o javascript.js https://raw.github.com/marijnh/CodeMirror/master/mode/javascript/javascript.js



