#!/bin/bash
#=============================================================================
#
#  Copyright (C) 2011-2013 O. LODYGENSKY
#                          at LAL, Univ Paris-Sud, IN2P3/CNRS, Orsay, France
#  License GPL v3
#
#  Date : July 5th, 2013
#
#  Shell script to configure IP aliases
#
#  Requirements: privilege rights
#
#  Parameters : base_network_service base_IP_addr max_IP_aliases
#
#  Output : networksetup.out
#
#=============================================================================

ROOTDIR=`dirname $0`
OUTPUT=$ROOTDIR/networksetup.out
ALIASBASENAME="xwhep"


#=============================================================================
#  Function  usage()
#=============================================================================
usage()
{
  if [ "$*" ]; then
    echo       > /dev/stderr
    echo "$*"  > /dev/stderr
  fi
  
  cat << "END_OF_HELP"  > /dev/stderr

Usage : $0 --help | --list | --create network_itf base_IP_addr aliases_amount | --clean

  --help : this help
  
  --list : list network devices

  --create : create new IP aliases
    network_itf    : the network interface    (e.g.: eth0)
    base_IP_addr   : base alias IP address    (e.g.: 192.168.0.50)
    aliases_amount : how many alias to create

  --clean : remove aliases found in networksetup.out

Example: $0 --create eth0 192.168.0.50 10
         This creates 10 IP alias for interface eth0
         (192.158.0.50 to 192.158.0.59) 

END_OF_HELP

  exit 1
}


#=============================================================================
#  Function  fatal()
#=============================================================================
fatal()
{
  RC=$?
  if [ $RC -eq 0 ]; then RC=1; fi
  
  echo "$(date "$DATE_FORMAT")  $0  FATAL:  ${*:-Ctrl+C}"  > /dev/stderr
  exit $RC
}


#=============================================================================
#  Function  clean()
#=============================================================================
clean()
{
  RC=$?
  if [ $RC -eq 0 ]; then RC=1; fi
  
  echo "$(date "$DATE_FORMAT")  $0  Trying to clean"  > /dev/stderr

  for itf in `cat $OUTPUT`; do

  	case $OSTYPE in
  
    	darwin* )
    		echo networksetup -removenetworkservice $itf
    		networksetup -removenetworkservice $itf
	    	;;
    
    	linux* )
    		ifconfig $itf down
      		;;
    
		* )
    		fatal "$OSTYPE not supported"
    	;;

	esac

  done

  rm -f $OUTPUT
  
  exit $RC
}

#=============================================================================
#  Function  create()
# @arg interface name  : the NIC to create aliases for
# @arg base IP address : the base IP aliases
# @arg alias amount    : how many aliases to create
#=============================================================================
create()
{
	ITF=$1
	shift
	BASE_IP=$1
	IP0=`echo $BASE_IP | cut -d '.' -f 1`
	IP1=`echo $BASE_IP | cut -d '.' -f 2`
	IP2=`echo $BASE_IP | cut -d '.' -f 3`
	IP3=`echo $BASE_IP | cut -d '.' -f 4`
	shift
	MAX_ALIASES=$1

	touch $OUTPUT 

	for ((i=0 ; i < $MAX_ALIASES ; i++)) ; do

		NEWIP3=`expr $IP3 + $i`
		ALIASIP="$IP0.$IP1.$IP2.$NEWIP3"
		ALIASSUBNET="$IP0.$IP1.$IP2.255"

echo $NEWIP3 $ALIASIP $ALIASSUBNET

		case $OSTYPE in
	   	darwin* )
			ALIASITF="$ALIASBASENAME$NEWIP3"
			echo $ALIASITF >> $OUTPUT 
			echo networksetup -duplicatenetworkservice "$ITF" $ALIASITF
			networksetup -duplicatenetworkservice "$ITF" $ALIASITF
			[ $? -ne 0 ] && fatal "Cannot duplicate network service $ITF"
			echo networksetup -setmanualwithdhcprouter $ALIASITF $ALIASIP
			#networksetup -setmanualwithdhcprouter $ALIASITF $ALIASIP
			networksetup -setmanual $ALIASITF $ALIASIP "255.255.255.0"
			[ $? -ne 0 ] && fatal "Cannot setmanual IP addr $ALIASITF $ALIASIP"
		;;

    	linux* )
			ALIASITF="$ITF:$NEWIP3"
			echo $ALIASITF >> $OUTPUT 
			echo "ifconfig $ALIASITF $ALIASIP"
			ifconfig $ALIASITF $ALIASIP
      	;;

		* )
	    	fatal "$OSTYPE not supported"
	    ;;
	  esac

	done
}

#=============================================================================
#  Function  list()
#=============================================================================
list()
{
  RC=$?
  if [ $RC -eq 0 ]; then RC=1; fi
  
  case $OSTYPE in
  
    darwin* )
    	networksetup -listallnetworkservices
    	RC=$?
	    ;;
    
    linux* )
		ifconfig
    	RC=$?
      ;;
    
  esac
  
  exit $RC
}


#=============================================================================
#  MAIN
#=============================================================================
trap fatal SIGINT SIGTERM

[ $# -lt 1 ] && usage

ifconfig > /dev/null 2>&1
[ $? -ne 0 ] && usage "Can't find ifconfig"


DATE_FORMAT='+%Y-%m-%d %H:%M:%S%z'

case $1 in
"-h" | "--help" | "--xwhelp" )
    usage
    ;;
"--list" )
	list
    ;;
"--clean" )
    clean
    ;;
"--create" )
	[ $# -lt 4 ] && usage "Not enough arguments"
	shift
	create "$1" $2 $3
	;;
* )
	usage
	;;
esac

echo  > /dev/stderr
