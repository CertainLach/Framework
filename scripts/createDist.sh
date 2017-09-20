set -e
echo "Cleaning old"
rm -rf ./dist
mkdir dist
echo "Compiling"
tsc --declaration
echo "Copying JSONs and MDs"
cd packages 
    find . -name '*.MD' -exec cp -R {} ../dist/{} \; > /dev/null
    find . -name '*.json' -exec cp -R {} ../dist/{} \; > /dev/null
cd ../dist
    find . -maxdepth 1 -type d -exec cp ../AUTHORS.MD {} \; > /dev/null
cd ..
echo "Done dist"