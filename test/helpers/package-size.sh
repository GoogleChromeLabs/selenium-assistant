#!/bin/bash

PACKAGE_NAME=$(npm pack)
PACKAGE_DIR="./package"

echo "Package name: ${PACKAGE_NAME}"

# Unpack the tar
tar zxvf ${PACKAGE_NAME}

echo ""
echo "Performing releast tracking."
echo ""

node ./test/helpers/release-tracking.js ${PACKAGE_NAME} ${PACKAGE_DIR}

rm ${PACKAGE_NAME}
rm -rf ${PACKAGE_DIR}
