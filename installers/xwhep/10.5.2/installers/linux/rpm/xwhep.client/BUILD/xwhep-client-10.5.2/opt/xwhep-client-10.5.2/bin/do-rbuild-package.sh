#!/bin/sh 
#=============================================================================
# Copyrights     : CNRS
# Author         : Oleg Lodygensky
# Acknowledgment : XtremWeb-HEP is based on XtremWeb 1.8.0 by INRIA : http://www.xtremweb.net/
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
#=============================================================================

#
# next variables must be set
#
VERSION=9.1.1
# next variable must have a value among rpm, dpkg or macosx
#WHAT=
# next variable must be like someone@somewhere
RHOST=
# next variable must be like /home/someone/xwhep/dist/
RDISTDIR=
# space separated package names, if any
PACKAGES="PUBLIC PRIVATE"

[ "$WHAT" = "" ] && { echo "Please set variables" ; exit 1; }

for p in $PACKAGES ; do 
	RDIR=${RDISTDIR}/$p/installers
	echo "./rbuild-package.sh ${RHOST} ${RDIR} ${VERSION}  ${WHAT} "
	./rbuild-package.sh ${RHOST} ${RDIR} ${VERSION}  ${WHAT} 
done

