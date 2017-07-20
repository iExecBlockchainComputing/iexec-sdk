#!/bin/sh
#
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



if [ "$1" = "" ] ; then
	echo "not enough arg"
	exit 1
fi

filename=`echo $1 | cut -d '.' -f 1`
datfile=$filename".dat"
gpfile=$filename".gp"
pngfile=$filename".png"

cat $1 | gawk 'BEGIN{FS=";"}{ printf ("%i\t%i\t%i\n", $2,$3,$4)}' > $datfile

echo $gpfile

rm -f $gpfile


cat > $gpfile << EOF
set key outside
set title "lsof | grep java | wc -l\nOneworker, one client and one dispatcher on a single host"
set xlabel "Time (step = ~1 sec)"
set ylabel "opened files"

set terminal png
set output '$pngfile'

plot "$datfile" using 1 title "mysql", "$datfile" using 2 title "pipe", "$datfile" using 3 title "total"

EOF

gnuplot $gpfile


kuickshow $pngfile
