#!/bin/bash

PACKAGE_NAME=$(npm pack)
PACKAGE_DIR="./package"

echo "Package name: ${PACKAGE_NAME}"

echo ""
echo "Unpacking NPM package."
echo ""

# Unpack the tar
tar zxvf ${PACKAGE_NAME}

echo ""
echo "Install modules."
echo ""
cd ${PACKAGE_DIR}
npm install --production
cd ..

echo ""
echo "Performing release tracking."
echo ""

node ./test/helpers/release-tracking.js ${PACKAGE_NAME} ${PACKAGE_DIR}

rm ${PACKAGE_NAME}
rm -rf ${PACKAGE_DIR}
