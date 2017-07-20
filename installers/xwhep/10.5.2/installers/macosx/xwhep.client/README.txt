
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
#  File    : installers/macosx/xwhep.client/README.txt
#  Date    : Aug 23rd, 2012
#  Author  : Oleg Lodygensky
# 
#  OS      : Apple Mac OS X
# 
#  ******************************************************************

This directory contains files to generate an Apple Mac OS X package to install the XWHEP client

Since Mac OS 10.8, XCode and PackageMaker are not in /Developer folder.
Hence the xwconfigure script may be unable to automatically build Mac OS X installation package

To create Mac OS X installation packages:
- install PackageMaker
- use it as follows
 $> PackageMaker -d installers/macosx/xwhep.client/installer/xwhep-client.pmdoc -o installers/macosx/xwhep.client/installer/xwhep-client.mpkg

