#!/bin/sh

# Copyrights     : CNRS
# Author         : Oleg Lodygensky
# Acknowledgment : XtremWeb-HEP is based on XtremWeb 1.8.0 by inria : http://www.xtremweb.net/
# Web            : http://www.xtremweb-hep.org
#
#      This file is part of XtremWeb-HEP.
#
#    XtremWeb-HEP is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    XtremWeb-HEP is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with XtremWeb-HEP.  If not, see <http://www.gnu.org/licenses/>.
#
#



#  ******************************************************************
#  File    : cernvm_dg.sh
#  Date    : Septembre 27th, 2012
#  Author  : Oleg Lodygensky
# 
#  OS      : Scientific Linux 6
#  Arch    : 32bits
# 
#  Purpose : this script modifies CernVM distrib to comply to XWHEP
#
#  !!!!!!!!!!!!!!!!    DO NOT EDIT    !!!!!!!!!!!!!!!!
#  
#  ******************************************************************


progname=`basename $0`
ROOTDIR=`pwd`

INITDIR="/etc/init.d"
PROLOGUE_NAME=xwcontext_prologue
EPILOGUE_NAME=xwcontext_epilogue
PROLOGUE_INITD="$INITDIR/$PROLOGUE_NAME"
EPILOGUE_INITD="$INITDIR/$EPILOGUE_NAME"

echo INITDIR=$INITDIR

#
# configure contextualization
#
if [ ! -f $ROOTDIR/$PROLOGUE_NAME ] ; then
  echo "FATAL : No prologue found"
  exit 1
fi

cp $ROOTDIR/$PROLOGUE_NAME $PROLOGUE_INITD
chmod +x $PROLOGUE_INITD


if [ ! -f $ROOTDIR/$EPILOGUE_NAME ] ; then
  echo "FATAL : No epilogue found"
  exit 1
fi

cp $ROOTDIR/$EPILOGUE_NAME $EPILOGUE_INITD
chmod +x $EPILOGUE_INITD


/sbin/chkconfig --add $PROLOGUE_NAME
/sbin/chkconfig --add $EPILOGUE_NAME


#
# Configure firewall : deny LAN access
#
if [ -f $ROOTDIR/iptables_rules.sh ] ; then
  cp $ROOTDIR/iptables_rules.sh /root/
  chmod +x /root/iptables_rules.sh
  /root/iptables_rules.sh > /root/iptables_rules.out
else
  echo "No iptables rules found : LAN access allowed"
fi

#
# Install creator pub key
#
if [ -f $ROOTDIR/id_rsa.pub ] ; then
  mkdir /root/.ssh
  chmod 600 /root/.ssh
  cp $ROOTDIR/id_rsa.pub  /root/.ssh/authorized_keys
  cp $ROOTDIR/id_rsa.pub  /root/.ssh/authorized_keys2
  chmod 600 /root/.ssh/authorized_keys*
else
  echo "No pub key found : root access not allowed"
fi


#
# configure sudoers
#
echo "vmuser ALL = PASSWD: ALL, NOPASSWD: /sbin/poweroff, NOPASSWD: /sbin/shutdown" >> /etc/sudoers



[ -x /etc/init.d/firstboot ] && /sbin/chkconfig firstboot off

