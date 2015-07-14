#!/bin/bash

typeset __abspath=$(cd ${0%/*} && echo $PWD/${0##*/})
typeset __shelldir=`dirname "${__abspath}"`
typeset __testdir=`dirname "${__shelldir}"`
typeset __tmp=`mktemp /tmp/avn-test.XXXXXX`
typeset __written=""
export HOME="${__testdir}/fixtures"

# start in a known location
cd "${__testdir}/fixtures/home"

function _avn() {
  echo avn called >> ${__tmp}
}

source "${__shelldir}/helpers.sh"
source "${__testdir}/../bin/avn.sh"

# test that _avn isn't invoked when .node-version file isn't there
cd "${__testdir}/fixtures/none"
__written=`echo $(cat ${__tmp})`

assertEqual `pwd` "${__testdir}/fixtures/none" || exit 1
assertEqual "" "${__written}" || exit 1

rm ${__tmp}
