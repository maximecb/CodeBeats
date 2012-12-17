#!/bin/sh


# External deps are kept in app/components
cd app
# Clean install
rm -rf components
mkdir components
cd components


# Handle jquery UI/bootstrap
wget https://github.com/addyosmani/jquery-ui-bootstrap/zipball/v0.23
unzip v0.23
mv addyosmani-jquery-ui-bootstrap-cf2a77b jqui-bootstrap
rm v0.23


# Handle codemirror
mkdir codemirror
cd codemirror
mkdir lib
mkdir theme
mkdir mode
cd lib
wget -O codemirror.js https://raw.github.com/marijnh/CodeMirror/master/lib/codemirror.js
wget -O codemirror.css https://raw.github.com/marijnh/CodeMirror/master/lib/codemirror.css
cd ../theme
wget -O monokai.css https://raw.github.com/marijnh/CodeMirror/master/theme/monokai.css
cd ../mode
mkdir javascript
cd javascript
wget -O javascript.js https://raw.github.com/marijnh/CodeMirror/master/mode/javascript/javascript.js

echo "Deps installed."