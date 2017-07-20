#!/bin/sh

#
# Date    : 7 janvier 2010
# Purpose : this is a script that can be used by a job 
#           to retrieve environment variables on worker side
# Usage   : -1- send this script as data using xwsenddata
#           -2- submit a job with this script URI as launchscriptshuri
#           -3- on completion the result contains the output
#

echo ""
echo PWD
pwd

echo ""
echo PRINTENV
printenv

echo ""
echo XWLIBPATH = $XWLIBPATH

echo ""
echo XWBINPATH = $XWBINPATH

echo ""
echo XWDIRINPATH  = $XWDIRINPATH

echo ""
echo XWSTDINPATH = $XWSTDINPATH

