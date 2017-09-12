##
# Functionality specific to avn
#

if [[ -n "${BASH_VERSION:-}" ]]; then
  true
elif [[ -n "${ZSH_VERSION:-}" ]]; then
  setopt null_glob
else
  printf "%b" "avn does not yet support this shell\n"
fi

export PATH="$HOME/.avn/bin:$PATH"

# plugins may add to this, it's an array of version file names
export -a __avn_files
__avn_files=(".node-version")

# the full path to the active version file, /path/to/.node-version
export __avn_active_file

# load each plugin
for plugin in $HOME/.avn/plugins/*
do
  [[ -f "$plugin/load.sh" ]] && . "$plugin/load.sh"
done

# run _avn & eval results written to fd 3
function __avn_eval() {
  typeset cmd actions actions_result options

  cmd=$1
  shift

  [[ -t 1 ]] && options="--color"

  actions=$(_avn ${cmd} $options "$@" 3>&1 1>&2)
  actions_result=$?
  if [[ $actions_result -eq 0 ]]
  then
    eval "$actions"
  fi
}

# avn chpwd hook
function __avn_chpwd() {
  local file=$(__avn_find_file)
  local dir=${file%/*}
  local name=${file##*/}

  [[ -n "$file" ]] && [[ "$file" != "$__avn_active_file" ]] &&
    __avn_eval chpwd "$dir" "$name" || true

  __avn_active_file=$file

  true
}

# debug that includes file lookup
function __avn_debug() {
  local file=$(__avn_find_file)
  local dir=${file%/*}
  local name=${file##*/}

  _avn explain -v "$dir" "$name"
}

# find version specification file
function __avn_find_file() {
  local found
  local dir=$PWD
  while [[ -z "$found" ]] && [[ "$dir" != "" ]]; do
    for file in "${__avn_files[@]}"; do
      if [[ -f "$dir/$file" ]]; then
        found="$dir/$file"
        break
      fi
    done
    if [[ "$dir" == "$HOME" ]]; then
      break
    fi
    dir=${dir%/*}
  done
  echo $found
}

__avn_chpwd # run chpwd once since the shell was just loaded


##
# Hooks that will happen after the working directory is changed
#

export -a chpwd_functions;

# add avn functionality
[[ " ${chpwd_functions[*]} " == *" __avn_chpwd "* ]] ||
  chpwd_functions+=(__avn_chpwd)

# support rvm until chpwd_functions are integrated
[[ " ${chpwd_functions[*]} " == *" __rvm"* ]] ||
  chpwd_functions+=(__rvm_cd_functions_set)


##
# Compatibility
#
# The code below based on Michal Papis's bash_zsh_support and licensed under
# the LGPL. You can find a full copy of the project and the license:
# https://github.com/mpapis/bash_zsh_support
# https://github.com/mpapis/bash_zsh_support/blob/master/LICENSE
#

function __zsh_like_cd()
{
  \typeset __zsh_like_cd_hook
  if
    builtin "$@"
  then
    for __zsh_like_cd_hook in chpwd "${chpwd_functions[@]}"
    do
      if \typeset -f "$__zsh_like_cd_hook" >/dev/null 2>&1
      then "$__zsh_like_cd_hook" || break # finish on first failed hook
      fi
    done
    true
  else
    return $?
  fi
}

[[ -n "${ZSH_VERSION:-}" ]] ||
{
  function cd()    { __zsh_like_cd cd    "$@" ; }
  function popd()  { __zsh_like_cd popd  "$@" ; }
  function pushd() { __zsh_like_cd pushd "$@" ; }
}
