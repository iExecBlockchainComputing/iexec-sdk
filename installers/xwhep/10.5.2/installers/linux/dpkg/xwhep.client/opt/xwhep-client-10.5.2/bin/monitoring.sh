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




FREE=/usr/bin/free
#LSOF=/usr/bin/lsof
LSOF=/usr/sbin/lsof
NETSTAT=netstat
SLEEP=60
HOST=`uname -n`

USER=xwhep

[ -x /usr/bin/free  ] && FREE=/usr/bin/free
[ -x /usr/sbin/free ] && FREE=/usr/sbin/free

[ -x /usr/bin/lsof  ] && LSOF=/usr/bin/lsof
[ -x /usr/sbin/lsof ] && LSOF=/usr/sbin/lsof


DATEFILE=`date "+%Y%m%d"`
CURRENTDATEFILE=$DATEFILE

totalMem=`$FREE | grep Mem | sed "s/[[:space:]][[:space:]]*/ /g" | cut -d ' ' -f 2`
totalSwap=`$FREE | grep Swap | sed "s/[[:space:]][[:space:]]*/ /g" | cut -d ' ' -f 2`

while [ 1 -eq 1 ] ; do

    DATEFILE=`date "+%Y%m%d"`

    OUTFILE=$HOST"_"$DATEFILE".txt"

    newFile=0

#    if [ -f $OUTFILE ] ; then
#	mv $OUTFILE $OUTFILE.bak
#    else
    if [ ! -f $OUTFILE ] ; then
	newFile=1
    fi
    
    touch $OUTFILE

    if [ $CURRENTDATEFILE != $DATEFILE ] ; then
	newFile=1
    fi

    if [ $newFile -eq 1 ] ; then
	echo "# To retreive the date from Unix time stamp, in Excel or Number : =DATE(1970,1,1)+YOURCELL/86400" >> $OUTFILE

	echo "# Host : "`uname -a` >> $OUTFILE
	echo "# Total Mem : $totalMem" >> $OUTFILE
	echo "# Total Swap : $totalSwap" >> $OUTFILE
	echo "date;sqlOf;xwgmondof;javaof;totalOf;netstatXWGmond;netstatXW;netstatMYSQL;TOTALPROC;XWPROC;XWCPU;XWMEM;buffers;FREEMEM;FREESWAP" >> $OUTFILE

    fi

    CURRENTDATEFILE=$DATEFILE

    freeMem=`$FREE | grep Mem | sed "s/[[:space:]][[:space:]]*/ /g" | cut -d ' ' -f 4`
    freeSwap=`$FREE | grep Swap | sed "s/[[:space:]][[:space:]]*/ /g" | cut -d ' ' -f 4`
    buffers=`$FREE | grep Mem | sed "s/[[:space:]][[:space:]]*/ /g" | cut -d ' ' -f 6`
    totalof=`$LSOF | wc -l`
    xwgmondof=`$LSOF | grep $USER | grep perl  | wc -l`
    javaof=`$LSOF | grep $USER | grep java  | wc -l`
    mysqlof=`$LSOF | grep mysql | wc -l`
    
    TOTALPROC=`ps u -u $USER | wc -l`
    XWPROC=`ps u -u $USER | grep java | wc -l`
    XWCPUS=`ps u -u $USER | grep java | sed "s/[[:space:]][[:space:]]*/ /g" | cut -d ' ' -f 3`
    XWMEMS=`ps u -u $USER | grep java | sed "s/[[:space:]][[:space:]]*/ /g" | cut -d ' ' -f 4`
    
    XWTOTALCPU=0
    for cpu in $XWCPUS ; do
	XWTOTALCPU=`echo "$XWTOTALCPU + $cpu" | bc`
    done
    XWTOTALMEM=0
    for mem in $XWMEMS ; do
	XWTOTALMEM=`echo "$XWTOTALMEM + $mem" | bc`
    done
    
#	echo "XWTOTALCPU = $XWTOTALCPU"
#	echo "XWTOTALMEM = $XWTOTALMEM"
    
#    NBCHILD=`ps u -u $USER | grep -v java | wc -l`
#    CHILDCPUS=`ps u -u $USER | grep -v java | grep -v "%CPU" | sed "s/[[:space:]][[:space:]]*/ /g" | cut -d ' ' -f 3`
#    CHILDMEMS=`ps u -u $USER | grep -v java | grep -v "%MEM" | sed "s/[[:space:]][[:space:]]*/ /g" | cut -d ' ' -f 4`
#    
#    CHILDTOTALCPU=0
#    for cpu in $CHILDCPUS ; do
##			echo "$CHILDTOTALCPU + $cpu"
#	CHILDTOTALCPU=`echo "$CHILDTOTALCPU + $cpu" | bc`
##			echo "CHILDTOTALCPU = $CHILDTOTALCPU"
#    done
#    CHILDTOTALMEM=0
#    CHILDMAXMEM=0
#    PIDCHILDMAXMEM=0
#    for mem in $CHILDMEMS ; do
#	CHILDTOTALMEM=`echo "$CHILDTOTALMEM + $mem" | bc`
#	test=`echo "$mem > $CHILDMAXMEM" | bc`
#	if [ "$test" = "1"  ] ; then
#	    CHILDMAXMEM=$mem
#	    PIDCHILDMAXMEM=$mem
#	fi
#    done

    netstatMYSQL=`$NETSTAT --numeric-ports | grep ':3306' | wc -l`
    netstatXW=`$NETSTAT --numeric-ports  | grep ':4321' | wc -l`
    netstatXWGmond=`$NETSTAT --numeric-ports  | grep ':8694' | wc -l`

    
    
    pourcentSwapFree=`echo $freeSwap"00/"$totalSwap | bc`
#		[] && echo "TotalSwap = $totalSwap  FreeSwap = $freeSwap  %SwapFree=$pourcentSwapFree"
#	echo "NBCHILD       = $NBCHILD"
#	echo "CHILDTOTALCPU = $CHILDTOTALCPU"
#	echo "CHILDTOTALMEM = $CHILDTOTALMEM"
    
    echo `date +%s`";$mysqlof;$xwgmondof;$javaof;$totalof;$netstatXWGmond;$netstatXW;$netstatMYSQL;$TOTALPROC;$XWPROC;$XWTOTALCPU;$XWTOTALMEM;$buffers;$freeMem;$freeSwap" >> $OUTFILE

    sleep $SLEEP
done
