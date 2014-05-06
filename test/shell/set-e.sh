#!/bin/bash

typeset __abspath=$(cd ${0%/*} && echo $PWD/${0##*/})
typeset __shelldir=`dirname "${__abspath}"`
typeset __testdir=`dirname "${__shelldir}"`
typeset __tmp=`mktemp /tmp/avn-test.XXXXXX`
typeset __written=""

set -e

# start in a known location
cd "${__testdir}/examples/home"

# even with `set -e`, if `_avn` exits with a status of 1, the `cd` should still
# work, and both the before and after hooks should be invoked.
function _avn() {
  echo "$1" >> ${__tmp}
  exit 1
}

source "${__shelldir}/helpers.sh"
source "${__testdir}/../bin/avn.sh"

# change to a directory where the after hook will be called
cd "${__testdir}/examples/v0.11"
__written=`echo $(cat ${__tmp})`
assertEqual `pwd` "${__testdir}/examples/v0.11" || exit 1
assertEqual "after-cd" "${__written}" || exit 1

# change to a directory where both the before and after hook will be called
echo "" > ${__tmp} # clear output
cd "${__testdir}/examples/v0.10.28"
__written=`echo $(cat ${__tmp})`
assertEqual `pwd` "${__testdir}/examples/v0.10.28" || exit 1
assertEqual "before-cd after-cd" "${__written}" || exit 1

# change to a directory where the before hook will be called
echo "" > ${__tmp} # clear output
cd "${__testdir}/examples/home"
__written=`echo $(cat ${__tmp})`
assertEqual `pwd` "${__testdir}/examples/home" || exit 1
assertEqual "before-cd" "${__written}" || exit 1

rm ${__tmp}
