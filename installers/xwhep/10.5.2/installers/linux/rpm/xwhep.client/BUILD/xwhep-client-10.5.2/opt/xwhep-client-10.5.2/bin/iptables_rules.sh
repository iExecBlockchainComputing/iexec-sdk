#!/bin/sh
#
# Copyrights     : CNRS
# Author         : Simon Delamare
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

# Input
echo Input
/sbin/iptables -P INPUT ACCEPT
# Output
echo Output
/sbin/iptables -P OUTPUT ACCEPT
# Routage
echo Routage
/sbin/iptables -P FORWARD ACCEPT

# Communication allowed on loopback
echo Loopback
/sbin/iptables -A OUTPUT -o lo -j ACCEPT

# Output allowed on established incoming connections 
echo established 
/sbin/iptables -A OUTPUT -m state --state RELATED,ESTABLISHED -j ACCEPT 

# Allow a given port range on output 
echo ports
/sbin/iptables -A OUTPUT -p tcp --dport 4000:4100 -j ACCEPT 

# Deny access to LAN
echo 10
/sbin/iptables -A OUTPUT --destination 10.0.0.0/8 -j REJECT 
echo 172
/sbin/iptables -A OUTPUT --destination 172.16.0.0/12 -j REJECT
echo 192
/sbin/iptables -A OUTPUT --destination 192.168.0.0/24 -j REJECT
echo "done"
