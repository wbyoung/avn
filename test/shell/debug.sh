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
  echo "$@" >> ${__tmp}
}

source "${__shelldir}/helpers.sh"
source "${__testdir}/../bin/avn.sh"

# change to a directory where we can debug
cd "../v0.10.11"
echo "" > ${__tmp} # clear output
__avn_debug
__written=`echo $(cat ${__tmp})`
assertEqual "explain -v ${__testdir}/fixtures/v0.10.11 .node-version" "${__written}" || exit 1

rm ${__tmp}
