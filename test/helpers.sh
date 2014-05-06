#!/bin/bash

function assertEqual() {
  if [[ "$1" != "$2" ]]; then
    echo "expected \"$1\" to equal \"$2\""
    exit 1
  fi
}
