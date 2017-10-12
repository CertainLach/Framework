set -e
echo "Cleaning old"
rm -rf ./docs
mkdir docs
echo "Compiling"
typedoc -t ESNext --jsx react --readme none --hideGenerator --name Meteor.Framework --ignoreCompilerErrors --theme minimal --out ./docs ./ 
echo Hi there, i am F6CF > ./docs/.nojekyll
echo "Cleaning old"
rm -rf ./dist
mkdir dist
echo "Compiling"
tsc --declaration || true
cd packages 
    echo "Copy MD"
    find . -name '*.MD' -exec cp --parents {} ../dist/ \; > /dev/null
    find . -name '*.md' -exec cp --parents {} ../dist/ \; > /dev/null
    echo "Copy JSON"
    find . -name '*.json' -exec cp --parents {} ../dist/ \; > /dev/null
cd ../dist
    echo "Copy Authors"
    find . -maxdepth 1 -type d -exec cp ../AUTHORS.MD {} \; > /dev/null
cd ..
echo "Publish"
cd dist
    find . -maxdepth 1 -type d -exec npm publish {} --access public \; > /dev/null
cd ..
git add .
git commit
git push -u origin master