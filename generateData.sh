#!/bin/bash
params=("$@")

fill_missing_args() {
  if [[ $ENGINE == '' ]]; then
    ENGINE='mmfiles'
  fi
  if [[ $VERSION == '' ]]; then
    VERSION='devel'
  fi
  if [[ $BUILD == '' ]]; then
    if [[ $VERSION == 'devel' ]]; then
      BUILD='build'
    else
      BUILD="build-$VERSION"
    fi
  fi
}

parse_args() {
  while [[ -n "$1" ]]; do
    case "${1}" in
      -e|--engine)
        ENGINE=${2}
        shift
        ;;
      -v|--version)
        VERSION=${2}
        shift
        ;;
      -b|--build)
        BUILD=${2}
        shift
        ;;
      *)
        echo "Unknown parameter: ${1}" >&2
        help
        exit 1
        ;;
    esac

    if ! shift; then
      echo 'Missing parameter argument.' >&2
      return 1
    fi
  done
}

parse_args "${params[@]}"
fill_missing_args

PREFIX='upgrade-data-tests'
ARANGOD="$BUILD/bin/arangod"
ARANGOSH="$BUILD/bin/arangosh"
NAME="upgrade-data-$ENGINE-$VERSION"

echo 'Starting server...'
$ARANGOD --database.directory $PREFIX/$NAME \
         --server.storage-engine $ENGINE \
         --server.authentication false \
         --server.endpoint http+tcp://localhost:23456 \
         | tee $PREFIX/arangod.stdout 2>&1 &
sleep 10

echo 'Running data generation script...'
$ARANGOSH --server.endpoint http+tcp://localhost:23456 \
          --javascript.execute $PREFIX/js/generateData.js

echo 'Stopping server...'
curl -X DELETE --silent http://localhost:23456/_admin/shutdown > /dev/null
sleep 10

echo 'Creating archive...'
(
  cd $PREFIX/$NAME &&
  tar --create \
      --gzip \
      --file=../data/$NAME.tar.gz \
      *
)
rm -rf $PREFIX/arangod.stdout $PREFIX/$NAME

echo 'Done!'
