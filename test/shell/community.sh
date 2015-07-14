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
  echo avn >> ${__tmp}
}

function __other_after_cd {
  echo other >> ${__tmp}
}

export -a chpwd_functions;
chpwd_functions+=(__other_after_cd)

source "${__shelldir}/helpers.sh"
source "${__testdir}/../bin/avn.sh"

# test that other hooks were called & called before avn
cd "${__testdir}/fixtures/v0.10"
__written=`echo $(cat ${__tmp})`
assertEqual "other avn" "${__written}" || exit 1

# change to a directory that doesn't exist
cd "${__testdir}/fixtures/home"
echo "" > ${__tmp} # clear output
cd "/path/to/some/place/that/we/expect/never/exists" &> /dev/null
__written=`echo $(cat ${__tmp})`
assertEqual "" "${__written}" || exit 1

rm ${__tmp}
