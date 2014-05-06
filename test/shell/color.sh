#!/bin/bash

typeset __abspath=$(cd ${0%/*} && echo $PWD/${0##*/})
typeset __shelldir=`dirname "${__abspath}"`
typeset __testdir=`dirname "${__shelldir}"`
typeset __tmp=`mktemp /tmp/avn-test.XXXXXX`
typeset __written=""

# start in a known location
cd "${__testdir}/examples/home"

function _avn() {
  typeset result="off"
  for var in "$@"
  do
    if [[ "${var}" == "--color" ]]; then
      result="on"
    fi
  done
  echo "color-${result}" >> ${__tmp}
}

source "${__shelldir}/helpers.sh"
source "${__testdir}/../bin/avn.sh"

# test that color is an argument
cd "${__testdir}/examples/v0.10"
__written=`echo $(cat ${__tmp})`
assertEqual "color-on" "${__written}" || exit 1

# test that there's no color argument when cd is piped
cd "${__testdir}/examples/home"
echo "" > ${__tmp} # clear output
cd "${__testdir}/examples/v0.10" | cat
__written=`echo $(cat ${__tmp})`
assertEqual "color-off" "${__written}" || exit 1

# test that there's no color argument when cd is captured
cd "${__testdir}/examples/home"
echo "" > ${__tmp} # clear output
`cd "${__testdir}/examples/v0.10"`
__written=`echo $(cat ${__tmp})`
assertEqual "color-off" "${__written}" || exit 1

rm ${__tmp}
