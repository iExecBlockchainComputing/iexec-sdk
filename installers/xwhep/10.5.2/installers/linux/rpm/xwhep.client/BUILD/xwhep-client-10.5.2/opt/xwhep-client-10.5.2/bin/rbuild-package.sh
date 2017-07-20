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



#
# File   : rbuild-package.sh
# Author : O. Lodygensky
# Date   : July 6th, 2011
#
# This script helps to create packages for other platform than the one
# originally used.
# This scripts downloads an XWHEP distrib, makes the packages and upload them
#
# For example if you have run xwconfigure on non debian machine, you can connect
# to a debian machine, download this script and run it.
# This will download your distrib from your source machine, create the debian
# packages and uplaad them back to your machine
#



# Apple PackageMaker
PMAKER="/Applications/PackageMaker.app/Contents/MacOS/PackageMaker"


######################################################################
# creates Mac OS X package
######################################################################
macosx() {
    WHAT=$1
    PMDOC=$2
    MPKG=$3

    if [ ! -x $PMAKER ] ; then
#
# This is where I installed all that; it may not work for you
#
	    PMAKER="/Applications/XCodeAuxiliaryTools/PackageMaker.app/Contents/MacOS/PackageMaker"
    	if [ ! -x $PMAKER ] ; then
			echo "Can't find $PMAKER"
			return 1
	    fi
	fi

    if [ ! -d $PMDOC ] ; then
		echo "Can't find $PMDOC"
		return 1
    fi

    printf "Preparing $WHAT $PKGTYPE package : "
    $PMAKER -d $PMDOC -o $MPKG
    if [ $? -eq 0 ] ; then
		echo "Done"
		cd $PKGTYPE/xwhep.$WHAT/installer
		zip -r xwhep-$WHAT-$VERSION.mpkg.zip xwhep-$WHAT-$VERSION.mpkg 
		cd -
		echo "Uploading distrib : scp $MPKG.zip $RSCP:$RDIR"
		scp $MPKG.zip $RSCP:$RDIR
    else
		echo "Error"
    fi
}


######################################################################
# creates debian package
######################################################################
makedebian() {
    WHAT=$1
    DIR=$2
    DEB=$TMPDIR/$DIR-$VERSION.deb

    DPKGDEB="dpkg-deb"
    type $DPKGDEB
    if [ $? -ne 0 ] ; then
		echo "Can't find $DPKGDEB"
		return 1
    fi

    if [ ! -d $DIR ] ; then
		echo "Can't find $DIR"
		return 1
    fi

    printf "Preparing $WHAT $PKGTYPE package : "
    $DPKGDEB --build $DIR $DEB
    if [ $? -eq 0 ] ; then
		echo "Done"
		echo "Uploading distrib : scp $DEB $RSCP:$RDIR"
		scp $DEB $RSCP:$RDIR
    else
		echo "Error"
    fi
}

######################################################################
# creates rpm package
######################################################################
makerpm() {
    WHAT=$1
    DIR=$2
    SPEC=$DIR/xwhep-$WHAT.spec
    RPMBUILD="rpmbuild"
    type $RPMBUILD
    if [ $? -ne 0 ] ; then
		echo "Can't find $RPMBUILD"
		return 1
    fi

    if [ ! -d $DIR ] ; then
		echo "Can't find $DIR"
		return 1
    fi

	buildRoot="$TMPDIR/$DIR/BUILD/xwhep-$WHAT-*"
	#
	# because the configuration package creates conf/ and keystore/ in server directory
	#
	[ "$WHAT" = "server-conf" ] && buildRoot="$TMPDIR/$DIR/BUILD/xwhep-server-*"

    cat > $HOME/.rpmmacros  <<EOF
%packager Oleg Lodygensky <oleg.lodygensky@lal.in2p3.fr>
%_topdir $TMPDIR/$DIR/
%_tmppath /tmp
EOF
    printf "Preparing $WHAT $PKGTYPE package : "
	echo "$RPMBUILD -bb --buildroot ${buildRoot} $SPEC"
    $RPMBUILD -bb --buildroot ${buildRoot} $SPEC
    if [ $? -eq 0 ] ; then
		echo "Done"
		echo "Uploading distrib : scp $DIR/RPMS/noarch/* $RSCP:$RDIR"
		scp $DIR/RPMS/noarch/* $RSCP:$RDIR
    else
		echo "Error"
    fi
}



######################################################################
# main
######################################################################

progdir=`dirname $0`
currentdir=`pwd`
cd $progdir/..
ROOTDIR=`pwd`
cd $currentdir


if [ $# -lt 3 ] ; then
    cat << EOFUSAGE
Usage : $0 <user@host> dir version [rpm | dpkg | macosx] [server | server-conf | worker | client | bridgedgsg | bridgesgdg]
Where : user@host            is used to download XWHEP distrib
        dir                  is the remote directory containing the XWHEP installers to download
        version              is the XWHEP version (e.g 8.3.0)
        rpm | dpkg | macosx  is optional. Set package type
        server | server-conf | worker | client | bridgedgsg | bridgesgdg 
                             is optional. Determine the package to generate 
EOFUSAGE
    exit 1
fi

USERWHAT=""
RSCP=$1
shift
RDIR=$1
shift
VERSION=$1
shift
PKGTYPE=$1
case $PKGTYPE in
    "rpm" | "dpkg" | "macosx" )
		shift
		USERWHAT=$1
	;;
    * )
		USERWHAT=$PKGTYPE
		PKGTYPE=""
	;;
esac

TMPDIR=/tmp/xwhep/rmakepackage

if [ "X$PKGTYPE" = "X" ] ; then 
	THISOS=`uname`
	[ "$THISOS" = "Darwin" ] && PKGTYPE="macosx"

	if [ "$THISOS" = "Linux" ] ; then 
		[ -f /etc/debian_version ] && PKGTYPE="dpkg"
		[ -f /etc/redhat-release ] && PKGTYPE="rpm"
	fi
fi

if [ "X$PKGTYPE" == "X" ] ; then 
   	echo "Unable to determine package type"
   	exit 1
fi

case $USERWHAT in 
	"server" | "server-conf" | "worker" | "client" | "bridgedgsg" | "bridgesgdg" )
	;;
	"" )
	;;
	* )
		echo "Unknown package \"$USERWHAT\""
		exit 1
	;;
esac

# localdir
LDIR=`basename $RDIR`
PDIR=`dirname $RDIR`
PDIRNAME=`basename $PDIR`

if [ "X$LDIR" != "Xinstallers" ] ; then
    echo "You must provide the 'installers' directory (e.g xwhep-7.5.0/dist/mydist/installers)"
    exit 1
fi

case $PKGTYPE in
    "rpm" | "dpkg" )
		RDIR="$RDIR/linux"
	;;
    "macosx" )
	;;
    * )
		echo "Unknown package type $PKGTYPE"
		exit 1
	;;
esac

# remote dir
RDIR="$RDIR/$PKGTYPE"


TMPDIR=$TMPDIR/$PDIRNAME/
rm -Rf $TMPDIR
mkdir -p $TMPDIR
cd $TMPDIR

echo "Downloading distrib : scp -r $RSCP:$RDIR ."
scp -r $RSCP:$RDIR .
if [ $? -ne 0 ] ; then
    echo "Can't scp $RUSER@$RHOST:$RDIR ."
    exit 1
fi

LDIR=$PKGTYPE

case $PKGTYPE in
    "rpm" )
		if [ "X$USERWHAT" != "X" ] ; then
			DIR="$LDIR/xwhep.$USERWHAT"
			[ "$USERWHAT" = "server-conf" ] && DIR="$LDIR/xwhep.server.conf"
			makerpm $USERWHAT $DIR
			exit 0
		fi
		
	 	WHAT="server"
		DIR="$LDIR/xwhep.$WHAT"
		makerpm $WHAT $DIR

	 	WHAT="server-conf"
		DIR="$LDIR/xwhep.server.conf"
		makerpm $WHAT $DIR
	
	 	WHAT="worker"
		DIR="$LDIR/xwhep.$WHAT"
		makerpm $WHAT $DIR
	
	 	WHAT="client"
		DIR="$LDIR/xwhep.$WHAT"
		makerpm $WHAT $DIR
	
	 	WHAT="bridgedgsg"
		DIR="$LDIR/xwhep.$WHAT"
		makerpm $WHAT $DIR
	;;
    "dpkg" )
		if [ "X$USERWHAT" != "X" ] ; then
			[ "$USERWHAT" = "server-conf" ] && USERWHAT="xwhep.server.conf"
			DIR="$LDIR/$USERWHAT"
			makedebian $USERWHAT $DIR
			exit 0
		fi

	 	WHAT="xwhep.server"
		DIR="$LDIR/$WHAT"
		makedebian $WHAT $DIR
	
	 	WHAT="xwhep.server.conf"
		DIR="$LDIR/$WHAT"
		makedebian $WHAT $DIR
	
	 	WHAT="xwhep.worker"
		DIR="$LDIR/$WHAT"
		makedebian $WHAT $DIR
	
	 	WHAT="xwhep.client"
		DIR="$LDIR/$WHAT"
		makedebian $WHAT $DIR
	
	 	WHAT="xwhep.bridgedgsg"
		DIR="$LDIR/$WHAT"
		makedebian $WHAT $DIR
	;;
    "macosx" )
	 	WHAT="server"
		PMDOC="$LDIR/xwhep.$WHAT/installer/xwhep-$WHAT.pmdoc"
		MPKG="$LDIR/xwhep.$WHAT/installer/xwhep-$WHAT-$VERSION.mpkg"
		macosx $WHAT $PMDOC $MPKG
	
		WHAT="worker"
		PMDOC="$LDIR/xwhep.$WHAT/installer/xwhep-$WHAT.pmdoc"
		MPKG="$LDIR/xwhep.$WHAT/installer/xwhep-$WHAT-$VERSION.mpkg"
		macosx $WHAT $PMDOC $MPKG
		
		WHAT="client"
		PMDOC="$LDIR/xwhep.$WHAT/installer/xwhep-$WHAT.pmdoc"
		MPKG="$LDIR/xwhep.$WHAT/installer/xwhep-$WHAT-$VERSION.mpkg"
		macosx $WHAT $PMDOC $MPKG
	;;
    * )
		echo "Unknown package type $PKGTYPE"
		exit 1
	;;
esac
