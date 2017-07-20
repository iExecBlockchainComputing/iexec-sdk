#!/bin/sh

progdir=`dirname $0`
currentDir=`pwd`
cd $progdir
ROOTDIR=`pwd`/..
cd $currentDir


LIBDIR=$ROOTDIR/lib
CFGDIR=$ROOTDIR/conf
KEYDIR=$ROOTDIR/keystore

#
# java CLASSPATH
#
ZIPS=""
JARS=""
ls $LIBDIR/*.zip > /dev/null 2>&1
if [ $? -eq 0 ] ; then
    ZIPS=`ls $LIBDIR/*.zip`
fi
ls $LIBDIR/*.jar > /dev/null 2>&1
if [ $? -eq 0 ] ; then
    JARS=`ls $LIBDIR/*.jar`
fi

XW_CLASSES=""
for i in $ZIPS $JARS ; do
    if [ "X$i" = "Xxtremweb.jar" ]; then
#        if [ "$PROG" != "xtremweb.worker" -a "$PROG" != "xtremweb.client" ]; then
        if [ "X$PROG" != "Xxtremweb.worker" ]; then
            XW_CLASSES=$i:$XW_CLASSES
        fi
    else
        XW_CLASSES=$i:$XW_CLASSES
    fi
done


[ "X$LOGGERLEVEL" = "Xdebug" ] && echo "java -Dfile.encoding=UTF-8 -Djavax.net.ssl.trustStore=$KEYDIR/xwhepclient.keys -Dxtremweb.cache=/tmp -Dxtremweb.cp=$XW_CLASSES -cp $XW_CLASSES xtremweb.client.HelloWorld --xwconfig $CFGDIR/xtremweb.client.conf"

java -Dfile.encoding=UTF-8 -Djavax.net.ssl.trustStore=$KEYDIR/xwhepclient.keys -Dxtremweb.cache=/tmp -Dxtremweb.cp=$XW_CLASSES -cp $XW_CLASSES xtremweb.client.HelloWorld --xwconfig $CFGDIR/xtremweb.client.conf --xwget $*

