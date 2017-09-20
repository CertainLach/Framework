cp ./lerna/precompile.json ./lerna.json
lerna bootstrap
lerna publish --skip-npm
rm ./lerna.json
echo "Done bump version"