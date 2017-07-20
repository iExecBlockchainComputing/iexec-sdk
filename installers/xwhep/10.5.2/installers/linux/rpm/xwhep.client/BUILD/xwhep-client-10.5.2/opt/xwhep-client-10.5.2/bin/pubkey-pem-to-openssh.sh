#!/bin/sh
#=============================================================================
#  Copyright 2012 by Etienne URBAH for LAL, Univ Paris-Sud, IN2P3/CNRS
#  Licence GPL v3
#
#  Shell script for an SSH public key :
#  If necessary, convert the PEM format to the OpenSSH format
#  Argument:  File containing the SSH public key
#=============================================================================

#-----------------------------------------------------------------------------
#  Option for verbosity
#-----------------------------------------------------------------------------
verbose=''
if [ '(' "$1" = "-v" ')' -o '(' "$1" = "--verbose" ')' ]; then
  verbose=1
  shift
fi

#-----------------------------------------------------------------------------
#  First parameter must be present
#-----------------------------------------------------------------------------
[ "$verbose" ]  &&  \
  echo  "$0:  Check if the first parameter is NOT empty"  > /dev/stderr
if [ "$1" = "" ]; then
  echo  "Usage:  $0  [-v]  File_containing_the_SSH_public_key"  > /dev/stderr
  exit 1
fi

#-----------------------------------------------------------------------------
#  The file containing the SSH public key must be a regular file
#-----------------------------------------------------------------------------
[ "$verbose" ]  &&  \
  echo  "$0:  Check if '$1' exists and is a regular file"  > /dev/stderr
if [ ! -f "$1" ]; then
  echo  "$0:  '$1' is NOT a regular file"  > /dev/stderr
  exit 2
fi

#-----------------------------------------------------------------------------
#  If the file containing the SSH public key is already in OpenSSH format,
#  then it is already OK
#-----------------------------------------------------------------------------
[ "$verbose" ]  &&  \
  echo  "$0:  Check if '$1' is already in OpenSSH format"  > /dev/stderr
grep  -v  -E  '^ssh-rsa  *[\+/0-9A-Za-z=][\+/0-9A-Za-z=]*( |$)' "$1"  \
  > /dev/null
result=$?
if [ $result -eq 1 ]; then
  echo  "$0:  '$1' is already in OpenSSH format"
  exit 0
fi
if [ $result -ne 0 ]; then
  exit $result
fi

#-----------------------------------------------------------------------------
#  Read the file containing the SSH public key
#-----------------------------------------------------------------------------
comment=''
key=''
result=''
cat  "$1"  |  \
(
  [ "$verbose" ]  &&  echo  "$0:  Reading '$1' :  Begin"
  
  while read line; do
    
    result=$(expr "$line" : '--* *\([A-Z]*\) *SSH2 *PUBLIC *KEY *--* *$')
    if [ '(' "$result" = "BEGIN" ')' -o '(' "$result" = "END" ')' ]; then
      continue
    fi
    
    result=$(expr "$line" : ' *Comment: *"\(.*\)" *$')
    if [ "$result" ]; then
      [ "$verbose" ]  &&  echo  "$0:  Comment = '$result'"  > /dev/stderr
      comment="$result"
      continue
    fi
    
    result=$(expr "$line"  : '\([\+/0-9A-Za-z=]*\)$')
    if [ "$result" ]; then
      [ "$verbose" ]  &&  echo  "$0:  KeyPart = '$result'"  > /dev/stderr
      key="$key$result"
      continue
    fi
    
    [ "$verbose" ]  &&  echo  "$0:  Garbage = '$line'"  > /dev/stderr
    break
    
  done
  
  [ "$verbose" ]  &&  echo  "$0:  Reading '$1' :  End"
  
  #-----------------------------------------------------------------------------
  #  If necessary, conversion of the file from PEM to OpenSSH format
  #-----------------------------------------------------------------------------
  if [ "$result" -a "$key" ]; then
    
    echo  "$0:  Saving '$1' as '$1.pem'"
    mv  "$1"  "$1.pem"
    result=$?
    if [ $result -ne 0 ]; then
      exit $result
    fi
    
    echo  "$0:  Writing '$1' with OpenSSH format :  Begin"
    echo  "ssh-rsa $key $comment"  > "$1"
    echo  "$0:  Writing '$1' with OpenSSH format :  End"
    [ "$verbose" ]  &&  echo       > /dev/stderr
    [ "$verbose" ]  &&  cat  "$1"  > /dev/stderr
    
  else
    echo  "$0:  '$1' is NOT an SSH2 public key in PEM format"
    exit 3
  fi
)
