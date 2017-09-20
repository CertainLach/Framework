set -e
echo "Cleaning old"
rm -rf ./docs
mkdir docs
echo "Compiling"
typedoc -t ES7 --jsx react --readme none --hideGenerator --name Meteor.Framework --ignoreCompilerErrors --theme minimal --out ./docs ./ 
echo Hi there, i am F6CF > ./docs/.nojekyll