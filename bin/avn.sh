##
# Functionality specific to avn
#

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

function __avn_after_cd() {
  [[ -f "`pwd`/.node-version" ]] &&
    __avn_eval after-cd `pwd` "$@" || true
}

export PATH="$HOME/.avn/bin:$PATH"


##
# Hooks that will happen after the working directory is changed
#

export -a chpwd_functions;

# add avn functionality
[[ " ${chpwd_functions[*]} " == *" __avn_after_cd "* ]] ||
  chpwd_functions+=(__avn_after_cd)

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

[[ -n "${ZSH_VERSION:-}" ]] ||
{
  # On bash and old zsh we need to define chpwd_functions handler
  __zsh_like_cd()
  {
    typeset __zsh_like_cd_hook
    if
      builtin "$@"
    then
      shift || true # remove the called method
      for __zsh_like_cd_hook in chpwd "${chpwd_functions[@]}"
      do
        if typeset -f "$__zsh_like_cd_hook" >/dev/null 2>&1
        then "$__zsh_like_cd_hook" "$@" || break # finish on first failed hook
        fi
      done
      true
    else
      return $?
    fi
  }
  cd()    { __zsh_like_cd cd    "$@" ; }
  popd()  { __zsh_like_cd popd  "$@" ; }
  pushd() { __zsh_like_cd pushd "$@" ; }
}
