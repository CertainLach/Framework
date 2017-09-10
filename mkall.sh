cd packages 
find . -name '*.MD' -exec cp -R {} ../dist/{} \;
find . -name '*.json' -exec cp -R {} ../dist/{} \;
cd ../dist
find . -type d -exec cp ../AUTHORS.MD {} \;
cd ..