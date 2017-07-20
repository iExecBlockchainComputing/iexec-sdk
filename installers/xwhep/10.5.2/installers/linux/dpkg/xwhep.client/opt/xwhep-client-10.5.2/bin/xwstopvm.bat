@ECHO OFF

SETLOCAL ENABLEEXTENSIONS


REM local variables

REM 
REM  Copyrights     : CNRS
REM  Author         : Oleg Lodygensky
REM  Acknowledgment : XtremWeb-HEP is based on XtremWeb 1.8.0 by inria : http://www.xtremweb.net/
REM  Web            : http://www.xtremweb-hep.org
REM  
REM       This file is part of XtremWeb-HEP.
REM 
REM     XtremWeb-HEP is free software: you can redistribute it and/or modify
REM     it under the terms of the GNU General Public License as published by
REM     the Free Software Foundation, either version 3 of the License, or
REM     (at your option) any later version.
REM 
REM     XtremWeb-HEP is distributed in the hope that it will be useful,
REM     but WITHOUT ANY WARRANTY; without even the implied warranty of
REM     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
REM     GNU General Public License for more details.
REM 
REM     You should have received a copy of the GNU General Public License
REM     along with XtremWeb-HEP.  If not, see <http://www.gnu.org/licenses/>.
REM 
REM 

REM 
REM  Date    : 7 janvier 2010
REM  Purpose : this a script example to start a VirtualBox VM on worker side
REM  Usage   : this script should be used as application launchscriptshuri
REM 
REM  Two env variables must be set when calling this script : 
REM  (they are automatically set by the worker)
REM   - XWDIRINPATH : must contains the drives
REM   - XWJOBUID
REM 


REM  
REM  some variables
REM  


REM
REM RootDir = drive : directory of $0
REM
SET RD=%~d0%~p0
REM
REM remove spaces : keep 8.3 file name only
REM
FOR %%i IN ("%ROOTDIR%") do (
	SET ROOTDIR=%%~si
)
ECHO ROOTDIR=%ROOTDIR%


REM
REM Virtualbox dir
REM remove spaces : keep 8.3 file name only
REM
FOR %%i IN ("%PROGRAMFILES%") do (
	SET PF=%%~si
)


SET VBROOT=%PF%\Oracle\VirtualBox
SET VBMGT=%VBROOT%\VBoxManage
SET VBHL=%VBROOT%\VBoxHeadLess


REM  machines dir
SET VBMDIR=%TMP%
SET VBMDIR2=
REM
REM remove spaces : keep 8.3 file name only
REM
FOR %%i IN ("%USERPROFILE%\VirtualBox VMs") do (
	SET VBMDIR2=%%~si
)
ECHO VBMDIR2=%VBMDIR2%


SET VBHDIR=%TMP%



GOTO main



REM  ****************************************************************
REM  clean()
REM  ****************************************************************
:clean

	date /t
	time /t
    ECHO Clean
	
	IF "X%VMNAME%" EQU "X" (
    	ECHO Clean : VMNAME not set
		goto:eof
	)
	
    %VBMGT% metrics list %VMNAME% > NUL 2>&1
    IF "%ERRORLEVEL%" NEQ "0" (
    	ECHO Can't retrieve %VMNAME%
    	goto:eof
	)

	%VBMGT% controlvm %VMNAME% poweroff > NUL 2>&1

REM
REM let ensure one process only is cleaning
REM because we encountered some machine crashes due to simultaneous cleaning
REM (this crashed the entire physical machine, I mean)
REM VB seems to be sensitive to concurrent accesses
REM	
	FOR %%i in ( 0 1 2 3 4 5 6 7 8 9 ) do (
	    %VBMGT% metrics list %VMNAME% > NUL 2>&1
	    IF "%ERRORLEVEL%" == "0" (
    		GOTO endcleaning
    	)
		date /t
		time /t
    	ECHO Still waiting %VMNAME% to be cleaned
		ECHO sleeping 10s
    	ping 127.0.0.1 -n 10 > NUL 2>&1
	)

:endcleaning

	echo Cleaning done
	
goto:eof


REM  ****************************************************************
REM  fatal()
REM  ****************************************************************
:fatal

	date /t
	time /t

	SET msg=%~1
	IF "%~1" EQU "" SET msg="Ctrl+C"
	
	ECHO "- * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! * -"
	ECHO       Fatal : %msg%
	ECHO "- * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! * -"
echo calling clean
	call:clean
echo called clean


goto:eof


REM  ****************************************************************
REM  main
REM  ****************************************************************
:main


date /t
time /t
ECHO %0 : starting

IF "Z%XWJOBUID%" == "Z" ] (
	echo ERROR XWJOBUID not set
    call:fatal "XWJOBUID is not set"
)

SET VMNAME=xwvm%XWJOBUID%
echo %VMNAME%

call:clean

