cp ./lerna/aftercompile.json ./lerna.json
lerna publish --exact
rm ./lerna.json
echo "Done publish compiled"