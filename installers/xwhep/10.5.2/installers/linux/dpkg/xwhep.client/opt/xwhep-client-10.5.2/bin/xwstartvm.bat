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
REM Program Files dir
REM remove spaces : keep 8.3 file name only
REM
FOR %%i IN ("%PROGRAMFILES%") do (
	SET PF=%%~si
)

REM
REM Program Files x86 dir
REM remove spaces : keep 8.3 file name only
REM
FOR %%i IN ("%PROGRAMFILES(X86)%") do (
	SET PF32=%%~si
)

REM
REM Program Files W6432
REM remove spaces : keep 8.3 file name only
REM
FOR %%i IN ("%PROGRAMW6432%") do (
	SET PF64=%%~si
)

REM 
REM we could do that using 
REM   reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Oracle\VirtualBox"
REM But this script works, so let use it just like that
REM :)
REM 
SET VBROOT=%PF%\Oracle\VirtualBox
IF NOT EXIST "%VBROOT%" (
	SET VBROOT=%PF32%\Oracle\VirtualBox
)
IF NOT EXIST "%VBROOT%" (
	SET VBROOT=%PF64%\Oracle\VirtualBox
)
IF NOT EXIST "%VBROOT%" (
	call:fatal VirtualBox not found %VBROOT%
)

SET VBMGT=%VBROOT%\VBoxManage
SET VBHL=%VBROOT%\VBoxHeadLess


REM 
REM Lock file to correctly unregister VM and VDs
REM 
SET LOCKNAME=xwvm.lock
SET LOCKDIR=%TEMP%
SET LOCKPATH=%LOCKDIR%\%LOCKNAME%
echo LOCKPATH=%LOCKPATH%



REM 
REM  This tells if we can run all this localy
REM  Default is TRUE for debug purposes
REM  The xwaddvbapp.sh script sets this variable to FALSE to ensure
REM  the GUI is not opened when running on volunteer resources
REM 
SET TESTINGONLY=TRUE


REM 
REM These are the commands to execute
REM 
REM  This is set by --install command line parameter
SET INSTALL=TRUE
REM  This is set by --uninstall command line parameter
SET UNINSTALL=TRUE
REM  This is set by --start command line parameter
SET START=TRUE
REM  This is set by --stop command line parameter
SET STOP=TRUE



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

SET VMOSTYPE=Linux26
SET VMRAM=512
SET VMCPUS=1
SET VMSTORAGECTRLNAME=ide_ctrl


SET VBREQUIREDVERSION=4.1

SET SCRATCHSIZE=4096
SET WAITDELAY=2

SET HDTYPE=hdd
SET DVDTYPE=dvddrive

REM ********************************************************************
REM 
REM  This is set by xwaddvbapp.sh script
REM  This may also be set by --hda command line parameter
REM 
REM  This is the main bootable virtual drive
REM  This must be set
REM  This may be an ISO, VHD, VDI or VMDK file
REM 
REM   ******************************************************************
REM    WARN WARN WARN WARN WARN WARN WARN WARN WARN WARN WARN WARN WARN 
REM 
REM     This file is deleted by clean() method
REM 
REM    WARN WARN WARN WARN WARN WARN WARN WARN WARN WARN WARN WARN WARN 
REM   ******************************************************************
SET HDA1FILE=""
REM ********************************************************************

SET HDB1PORT=0
SET HDB2PORT=1
SET HDBDEVICE=1
SET HDBTYPE=%HDTYPE%
SET HDA1PORT=0
SET HDA1DEVICE=0
SET HDA1TYPE=%HDTYPE%
SET KEEPHDB1=N


SET HDBADEFAULTFILENAME=hda
SET CONTEXTDEFAULTFILENAME=hdb



REM 
REM scratch disk /dev/hdb2 to be mounted on /mnt/xwscratch
REM

SET HDB2FILE=
SET HDB2EXT=
SET HDB2FILENAME=
SET HDB2DIRNAME=




REM 
REM  XWPORTS is the env var that may contain a comma separated ports list
REM 
REM  NAT ssh port forwarding localhost:XWPORTS[0] to guest:22
REM 

SET SSHLOCALPORT=
SET SSHGUESTPORT=22


REM 
REM  NAT http port forwarding localhost:XWPORTS[1] to guest:80
REM 

SET HTTPLOCALPORT=
SET HTTPGUESTPORT=80


GOTO main




##################################################
# usage()
##################################################
:usage

	date /t
	time /t

	echo Usage : xwstartvm.bat [cmd] [--context aFile] [--scratch aFile] [--sshport portNumber]
	echo.
	echo    --context aFile : a virtual disk (VD) file to mount on /context
	echo                      this file may be ISO, VDI, VMDK or VHD file
	echo                      this VD may contain a context.sh script
	echo    --scracth aFile : a virtual disk (VD) file to mount on /mnt/xwscratch
	echo                      this file may be ISO, VDI, VMDK or VHD file
	echo                      if not provided, the script creates, formats 
	echo                      and mounts a new empty 4Gb disk
	echo    --sshport       : a port number to connect through ssh
	echo.
	echo.
	echo  ** The previous parameters may also be used with the following commands
	echo.
	echo  ** Following commands are not allowed when running on Desktop Grid.
	echo  ** (they are automatically disabled on DG)
	echo  ** They are only provided for testing and debugging.
	echo.
	echo.
	echo  Available commands 
	echo    --install --name vm_name --hda aFile
	echo        * this installs a new VM inside VirtualBox and exits
	echo        * --hda aFile to provide the boot disk
	echo        * --context, --scratch, --sshport are also taken into account
	echo.
	echo    --uninstall --name vm_name
	echo        * this uninstalls vm_name from VirtualBox
	echo.
	echo    --start --name vm_name
	echo       * this starts vm_name
	echo.
	echo    --stop --name vm_name
	echo       * this stops vm_name
	echo.

	GOTO:eof



REM  ****************************************************************
REM  clean()
REM  ****************************************************************
:clean

	date /t
	time /t
    ECHO Clean
	
	IF "%VMNAME%"=="" (
    	ECHO ERROR : VMNAME not set
		GOTO:eof
	)
	
    %VBMGT% metrics list %VMNAME% > NUL 2>&1
    IF NOT "%ERRORLEVEL%" == "0" (
    	ECHO ERROR : can't retrieve %VMNAME%
    	GOTO:eof
	)
	
	SET LOCKFILE=%LOCKPATH%_%VMNAME%
	ECHO LOCKFILE=%LOCKFILE%

REM
REM let ensure one process only is cleaning
REM because we encountered some machine crashes due to simultaneous cleaning
REM (this crashed the entire physical machine, I mean)
REM VB seems to be sensitive to concurrent accesses
REM	
	FOR %%i in ( 0 1 2 3 4 5 6 7 8 9 ) do (
    	IF NOT EXIST %LOCKFILE% (
    		ECHO INFO : clean allowed
    		GOTO docleaning
    	)
		date /t
		time /t
    	ECHO WARNING another process is cleaning!
		ECHO sleeping 10s
    	ping 127.0.0.1 -n 10 > NUL 2>&1
	)

:docleaning

	date /t
	time /t
	ECHO Cleaning

	date /t > %LOCKFILE%
	
	

	%VBMGT% controlvm %VMNAME% poweroff > NUL 2>&1 
	IF NOT "%ERRORLEVEL%" == "0" ( 
REM
REM because CTRL+C may put the VM in a "ABORTED" status
REM and we can't manage "ABORTED" VMs 
REM next forces the VM status to "POWEROFF"
REM
		ECHO Must restart and poweroff the machine : please wait 5s
		%VBMGT% startvm --type headless %VMNAME%
REM sleep 10s
    	ping 127.0.0.1 -n 5 > NUL 2>&1
		%VBMGT% controlvm %VMNAME% poweroff
	)
	
	SET INFOFILE=%TEMP%\%VMNAME%.vbinfo
	echo INFOFILE=%INFOFILE%
	%VBMGT% showvminfo %VMNAME% --machinereadable > %INFOFILE%
    IF NOT "%ERRORLEVEL%" == "0" (
		ECHO ERROR : can't retrieve info for %VMNAME%
		GOTO:eof
	)

	FOR /F "tokens=2 delims='='" %%i in ('find "ide_ctrl-0-1" "%INFOFILE%" ') do (
		SET HDB1FILE=%%i
	)

	ECHO HDB1FILE found : %HDB1FILE%
REM 
REM  detach secondary drive
REM 
    IF EXIST %HDB1FILE% (
	    ECHO %VMNAME% : detach secondary drive %HDB1FILE%
    	%VBMGT% storageattach %VMNAME% --storagectl %VMSTORAGECTRLNAME% --port %HDB1PORT% --device %HDBDEVICE% --type %HDTYPE% --medium none
	
	    IF "%ERRORLEVEL%" == "0" (
			ECHO %HDB1FILE% : delete
			%VBMGT% closemedium disk %HDB1FILE% --delete
    	)
    )

REM 
REM  detach third drive
REM 
	FOR /F "tokens=2 delims='='" %%i in ('find "ide_ctrl-1-1" "%INFOFILE%" ') do (
		SET HDB2FILE=%%i
	)
	
	ECHO HDB2FILE found : %HDB2FILE%
	
    IF EXIST %HDB2FILE% (
		ECHO %VMNAME% : detach third drive %HDB2FILE%
		%VBMGT% storageattach %VMNAME% --storagectl %VMSTORAGECTRLNAME% --port %HDB2PORT% --device %HDBDEVICE% --type %HDTYPE% --medium none
    	IF "%ERRORLEVEL%" == "0" (
			ECHO %HDB2FILENAME% : delete
			%VBMGT% closemedium disk %HDB2FILE%
		)
    )

REM 
REM  detach main drive
REM 
	FOR /F "tokens=2 delims='='" %%i in ('find "ide_ctrl-0-0" "%INFOFILE%" ') do (
		SET HDA1FILE=%%i
	)
	
	ECHO HDA1FILE found : %HDA1FILE%

    ECHO %VMNAME% : detach main drive %HDA1FILE%
    %VBMGT% storageattach %VMNAME% --storagectl %VMSTORAGECTRLNAME% --port %HDA1PORT% --device %HDA1DEVICE% --type %HDTYPE% --medium none
    IF "%ERRORLEVEL%" == "0" (
		ECHO %HDANAME% : close
		%VBMGT% closemedium dvd %HDA1FILE%
   	)

    ECHO %VMNAME% : unregister
    %VBMGT% unregistervm %VMNAME%

REM 
REM sleep a while
REM
	ECHO sleeping %WAITDELAY%
    ping 127.0.0.1 -n %WAITDELAY% >NUL 2>&1

REM ECHO We don't clean
REM GOTO:dontclean

REM 
REM the last antislash helps to determine if it is a directory
REM 
    IF EXIST %VBMDIR%\%VMNAME%\   RMDIR  /S /Q  %VBMDIR%\%VMNAME%
REM 
REM and now non dir file tests
REM 
    IF EXIST %VBMDIR2%\%VMNAME%\  RMDIR /S /Q  %VBMDIR2%\%VMNAME%
	IF "%KEEPHDB1%"=="N" (
    	IF EXIST %HDB1FILE%           DEL /Q /S /F %HDB1FILE%
	    IF EXIST %VBHDIR%\%HDB1FILE%  DEL /Q /S /F %VBHDIR%\%HDB1FILE%
    	IF EXIST %ROOTDIR%\%HDB1FILE% DEL /Q /S /F %ROOTDIR%\%HDB1FILE%
    )
    IF EXIST %HDB2FILENAME%           DEL /Q /S /F %HDB2FILENAME%
    IF EXIST %VBHDIR%\%HDB2FILENAME%  DEL /Q /S /F %VBHDIR%\%HDB2FILENAME%
    IF EXIST %ROOTDIR%\%HDB2FILENAME% DEL /Q /S /F %ROOTDIR%\%HDB2FILENAME
REM 	IF EXIST "%HDA1FILE%"           DEL /Q /S /F %HDA1FILE%
REM 	IF EXIST "%HDB2FILE%"          DEL /Q /S /F %HDB2FILE%

GOTO:eof

:dontclean
    ECHO CLEAN "%VBMDIR%\%VMNAME%\" 
REM 
REM and now non dir file tests
REM 
    ECHO CLEAN "%VBMDIR2%\%VMNAME%"   DEL /Q /S /F "%VBMDIR2%\%VMNAME%"
    ECHO CLEAN "%HDB1FILE%"           DEL /Q /S /F "%HDB1FILE%"
    ECHO CLEAN "%VBHDIR%\%HDB1FILE%"  DEL /Q /S /F "%VBHDIR%\%HDB1FILE%"
    ECHO CLEAN "%ROOTDIR%\%HDB1FILE%" DEL /Q /S /F "%ROOTDIR%\%HDB1FILE%"
    ECHO CLEAN "%HDB2FILENAME%"           DEL /Q /S /F "%HDB2FILENAME%"
    ECHO CLEAN "%VBHDIR%\%HDB2FILENAME%"  DEL /Q /S /F "%VBHDIR%\%HDB2FILENAME%"
    ECHO CLEAN "%ROOTDIR%\%HDB2FILENAME%" DEL /Q /S /F "%ROOTDIR%\%HDB2FILENAME%"


	DEL /Q /F %LOCKFILE%
	DEL /Q /F %INFOFILE%

	
GOTO:eof


REM  ****************************************************************
REM  install()
REM  ****************************************************************
:install
	ECHO VMNAME="%VMNAME%"
	ECHO XWJOBUID="%XWJOBUID%"
	ECHO XWDIRINPATH="%XWDIRINPATH%"
	ECHO XWSTDINPATH="%XWSTDINPATH%" 
	ECHO XWLIBPATH="%XWLIBPATH%"
	ECHO XWBINPATH="%XWBINPATH%" 
	ECHO XWPORTS="%XWPORTS%" 
	ECHO HDA1FILE="%HDA1FILE%" 
	ECHO HDB1FILE="%HDB1FILE%" 
	ECHO SCRATCHSIZE=%SCRATCHSIZE%
	
	REM 
	REM  Let unregister VM just in case...
	REM  This may happen if the worker has been killed and had no chance to clean everything
	REM  In such a case the VM has been aborted  and is in a very bad state
	REM  Finally the worker could not restart the same job because the VM would still be registered
	REM 
	%VBMGT% unregistervm %VMNAME% > NUL 2>&1
		
	IF "X%HDA1FILE%"== "X" (
		call :fatal HDA1FILE is not set
	)
	
	IF NOT EXIST %HDA1FILE% (
	    call:fatal File not found : %HDA1FILE%
	)
	
	REM 
	REM retrieve HDA1FILE extension and directory
	REM 
	FOR %%i in (%HDA1FILE%) do (
		SET HDA1EXT=%%~xi
		SET HDA1FILENAME=%%~ni
		SET HDA1DIRNAME=%%~pi
	)
	
	ECHO HDA1EXT=%HDA1EXT%
	ECHO HDA1DIRNAME=%HDA1DIRNAME%
	ECHO HDA1FILENAME=%HDA1FILENAME%
	
	IF "X%XWDIRINPATH%"=="X" (
		SET XWDIRINPATH=%HDA1DIRNAME%
	)
	
	ECHO XWDIRINPATH=%XWDIRINPATH%
	
	
	IF "%HDA1EXT%"==".iso" (
		SET HDA1TYPE=%DVDTYPE%
	)
	IF "%HDA1EXT%"==".ISO" (
		SET HDA1TYPE=%DVDTYPE%
	)
	IF "%HDA1EXT%"==".vdi" (
		SET HDA1TYPE=%HDTYPE%
	)
	IF "%HDA1EXT%"==".VDI" (
		SET HDA1TYPE=%HDTYPE%
	)
	IF "%HDA1EXT%"==".vhd" (
		SET HDA1TYPE=%HDTYPE%
	)
	IF "%HDA1EXT%"==".VHD" (
		SET HDA1TYPE=%HDTYPE%
	)
	IF "%HDA1EXT%"==".vmdk" (
		SET HDA1TYPE=%HDTYPE%
	)
	IF "%HDA1EXT%"==".VMDK" (
		SET HDA1TYPE=%HDTYPE%
	)
	
	ECHO HDA1FILE=%HDA1FILE%
	ECHO HDA1FILENAME=%HDA1FILENAME%
	
	
	
	IF NOT EXIST %HDA1FILE% (
	    call:fatal File not found : %HDA1FILE%
	)
	
	REM 
	REM  Create and register a new temp VM
	REM 
	%VBMGT% createvm --name %VMNAME% --ostype %VMOSTYPE% --register
	IF NOT "%ERRORLEVEL%" == "0" (
	    call:fatal Can't create VM : %VMNAME%
	)
	
	ECHO Modifying VM %VMNAME% --memory %VMRAM% --acpi on --boot1 dvd --nic1 nat
	
	
	%VBMGT% modifyvm %VMNAME% --memory %VMRAM% --acpi on --boot1 dvd --nic1 nat
	IF NOT "%ERRORLEVEL%" == "0" (
	    call:fatal Can't modify VM : %VMNAME%
	)
	
	REM 
	REM  some disk space to be mounted on /mnt/xwscratch
	REM 
	
	SET CREATENEWHDB2="N"
	
	IF %HDB2FILE%.==. (
	
		SET HDB2FILE=xwhd%XWJOBUID%.vdi
		SET HDB2EXT=.vdi
		SET HDB2FILENAME=xwhd%XWJOBUID%
		SET HDB2DIRNAME=.
		SET CREATENEWHDB2="Y"
	)
	
	
	ECHO CREATENEWHDB2=%CREATENEWHDB2%
	ECHO HDB2FILE=%HDB2FILE%
	ECHO HDB2EXT=%HDB2EXT%
	ECHO HDB2FILENAME=%HDB2FILENAME%
	ECHO HDB2DIRNAME=%HDB2DIRNAME%
	
	
	if %CREATENEWHDB2%=="Y" (
	
	REM 
	REM  Create new HD /deb/hdb2 to be mounted on /mnt/xwscratch
	REM 
		ECHO createhd --filename %HDB2FILENAME% --size %SCRATCHSIZE%
		%VBMGT% createhd --filename %HDB2FILENAME% --size %SCRATCHSIZE%
		IF NOT "%ERRORLEVEL%" == "0" (
	    	call:fatal  Can't create HD : %HDB2FILENAME%
		)
	)
	
	
	IF NOT EXIST %HDB2FILE% (
	    call:fatal  File not found : %HDB2FILE%
	)
	
	REM 
	REM retrieve HDB2FILE extension and directory
	REM 
	FOR %%i in (%HDB2FILE%) do (
		SET HDB2EXT=%%~xi
		SET HDB2FILENAME=%%~ni
		SET HDB2DIRNAME=%%~pi
	)
	
	IF "%HDB2EXT%"==".vdi" (
		SET HDB2TYPE=%HDTYPE%
	)
	IF "%HDB2EXT%"==".VDI" (
		SET HDB2TYPE=%HDTYPE%
	)
	IF "%HDB2EXT%"==".vhd" (
		SET HDB2TYPE=%HDTYPE%
	)
	IF "%HDB2EXT%"==".VHD" (
		SET HDB2TYPE=%HDTYPE%
	)
	IF "%HDB2EXT%"==".vmdk" (
		SET HDB2TYPE=%HDTYPE%
	)
	IF "%HDB2EXT%"==".VMDK" (
		SET HDB2TYPE=%HDTYPE%
	)
	
	REM 
	REM  We rename HDB2 and set a new UUID for non ISO, because we want 
	REM  to be able to launch several simultaneous VM using the same HDB2 file
	REM 
	SET HDB2TMPFILENAME=%XWJOBUID%_%HDB2FILENAME%
	SET HDB2TMPFILE=%HDB2DIRNAME%\%HDB2TMPFILENAME%
	move /Y %HDB2FILE% %HDB2TMPFILE%
	SET HDB2FILE=%HDB2TMPFILE%
	SET HDB2FILENAME=%HDB2TMPFILENAME%
	
	IF NOT %HDB2TYPE%==%DVDTYPE% (
		%VBMGT% internalcommands sethduuid %HDB2FILE%
	)
	echo HDB2FILE copy =%HDB2FILE%
	
	REM 
	REM  Add a new disk controller
	REM 
	ECHO storagectl %VMNAME% --name %VMSTORAGECTRLNAME% --add ide
	%VBMGT% storagectl %VMNAME% --name %VMSTORAGECTRLNAME% --add ide
	IF NOT "%ERRORLEVEL%" == "0" (
	    call:fatal Can't create controller : %VMSTORAGECTRLNAME%
	)
	
	REM 
	REM  Attach main drive
	REM 
	ECHO storageattach %VMNAME% --storagectl %VMSTORAGECTRLNAME% --port %HDA1PORT% --device %HDA1DEVICE% --type %HDA1TYPE% --medium %HDA1FILE%
	%VBMGT% storageattach %VMNAME% --storagectl %VMSTORAGECTRLNAME% --port %HDA1PORT% --device %HDA1DEVICE% --type %HDA1TYPE% --medium %HDA1FILE%
	IF NOT "%ERRORLEVEL%" == "0" (
	    call:fatal Can't attach main drive : %HDA1FILENAME% (%HDA1FILE%)
	)
	
	REM 
	REM  Attach secondary drive
	REM 
	ECHO storageattach %VMNAME% --storagectl %VMSTORAGECTRLNAME% --port %HDB2PORT% --device %HDBDEVICE% --type %HDB2TYPE% --medium %HDB2FILE%
	%VBMGT% storageattach %VMNAME% --storagectl %VMSTORAGECTRLNAME% --port %HDB2PORT% --device %HDBDEVICE% --type %HDB2TYPE% --medium %HDB2FILE%
	IF NOT "%ERRORLEVEL%" == "0" (
	    call:fatal Can't attach HDB2 : %HDB2FILE%
	)
	
	REM 
	REM  Contextualization ?
	REM 
	
	IF %HDB1FILE%.==. (
	REM just to be sure this file does not exist
		SET HDB1FILE=paM207mlkj038%VMNAME%
	)
	
	IF EXIST %HDB1FILE% (
		
	REM 
	REM retrieve HDB1FILE extension and directory
	REM 
		FOR %%i in (%HDB1FILE%) do (
			SET HDB1EXT=%%~xi
			SET HDB1FILENAME=%%~ni
			SET HDB1DIRNAME=%%~pi
		)
	
		IF "%HDB1EXT%"==".vdi" (
			SET HDBTYPE=%HDTYPE%
		)
		IF "%HDB1EXT%"==".VDI" (
			SET HDBTYPE=%HDTYPE%
		)
		IF "%HDB1EXT%"==".vhd" (
			SET HDBTYPE=%HDTYPE%
		)
		IF "%HDB1EXT%"==".VHD" (
			SET HDBTYPE=%HDTYPE%
		)
		IF "%HDB1EXT%"==".vmdk" (
			SET HDBTYPE=%HDTYPE%
		)
		IF "%HDB1EXT%"==".VMDK" (
			SET HDBTYPE=%HDTYPE%
		)
	
	REM 
	REM  Attach contextualization drive
	REM 
		ECHO storageattach %VMNAME% --storagectl %VMSTORAGECTRLNAME% --port %HDB1PORT% --device %HDBDEVICE% --type %HDBTYPE% --medium %HDB1FILE%
		%VBMGT% storageattach %VMNAME% --storagectl %VMSTORAGECTRLNAME% --port %HDB1PORT% --device %HDBDEVICE% --type %HDBTYPE% --medium %HDB1FILE%
	    IF NOT "%ERRORLEVEL%" == "0" (
			call:fatal Can't attach HDB1 : %HDB1FILE%
	    )
	)
	
	ECHO HDB1FILE=%HDB1FILE%
	ECHO HDB1EXT=%HDB1EXT%
	ECHO HDB1FILENAME=%HDB1FILENAME%
	ECHO HDB1DIRNAME=%HDB1DIRNAME%
	
	
	REM 
	REM  Port forwarding
	REM 
	IF NOT "X%XWPORTS%"=="X" (
	
		ECHO Forwarding ports %XWPORTS%
		
	    REM  XWPORTS must contain a comma
	
		SET SSHP=""
		SET HTTP=""
		for %%p in (%XWPORTS%) do (
	
			SET GUESTPORT=
	
			IF "%SSHLOCALPORT%"=="" (
				SET  SSHLOCALPORT=%%p
				ECHO SSHLOCALPORT=%SSHLOCALPORT%
		        ECHO modifyvm %VMNAME% --natpf1 "xwssh,tcp,,%%p,,%SSHGUESTPORT%"
		        %VBMGT% modifyvm %VMNAME% --natpf1 "xwssh,tcp,,%%p,,%SSHGUESTPORT%"
	    	) ELSE (
				IF "%HTTPLOCALPORT%"=="" (
					SET  HTTPLOCALPORT=%%p
			    	ECHO HTTPLOCALPORT=%HTTPLOCALPORT%
		    	    ECHO modifyvm %VMNAME% --natpf1 "xwweb,tcp,,%%p,,%HTTPGUESTPORT%"
		    	    %VBMGT% modifyvm %VMNAME% --natpf1 "xwweb,tcp,,%%p,,%HTTPGUESTPORT%"
	    		)
			)
		)
	)
	
	ECHO controlvm %VMNAME% cpuexecutioncap %XWCPULOAD%
	%VBMGT% controlvm %VMNAME% cpuexecutioncap %XWCPULOAD%

GOTO:eof


REM  ****************************************************************
REM  fatal()
REM  ****************************************************************
:fatal

	date /t
	time /t

	SET msg=%*
	IF "X%~1"=="X" SET msg="Ctrl+C"
	
	ECHO "- * * * * * * * * * * * * * * * * * * * * * * * -"
	ECHO       Fatal : %msg%
	ECHO "- * * * * * * * * * * * * * * * * * * * * * * * -"
echo calling clean
	call:clean
echo called clean

GOTO:eof


REM  ****************************************************************
REM  main
REM  ****************************************************************
:main


date /t
time /t
ECHO %0 : starting


REM 
REM Parse command line paremeter
REM 
:Boucle

IF "%1" == "" GOTO ContinuerMain

	IF "%1" == "--help" (
		call:usage
		GOTO:eof
	)
	IF "%1" == "--context" (
REM file name 8.3 format
		SET HDB1FILE=%~s2
		SET HDB1EXT=%~x2
		SET HDB1FILENAME=%~n2
		SET HDB1DIRNAME=%~p2
	)
	IF "%1" == "--scratch" (
REM file name 8.3 format
		SET HDB2FILE=%~s2
		SET HDB2EXT=%~x2
		SET HDB2FILENAME=%~n2
		SET HDB2DIRNAME=%~p2
	)
	IF "%1" == "--sshport" (
		IF "X%XWPORTS%"=="X" (
		    SET XWPORTS=%2
		)
		ELSE (
			echo "WARNING : ports are set to $XWPORTS"
			echo "WARNING : ignoring --sshport %2"
		)
	)
	IF "%1" == "--install" (
		IF NOT "%TESTINGONLY%"=="TRUE" (
			call:fatal NOT allowed %1
		)
		IF "%INSTALL%"=="FALSE" (
			call:fatal Syntax error : you can't provide more than one command
		)
	    SET VMRAM=1024
	    SET XWDISKSPACE=10240
    	SET KEEPHDB1=Y
	    SET XWCPULOAD=100
	    SET XWJOBUID=xwvm
		SET UNINSTALL=FALSE
		SET START=FALSE
		SET STOP=FALSE
	)
	IF "%1" == "--uninstall" (
		IF NOT "%TESTINGONLY%"=="TRUE" (
			call:fatal NOT allowed %1
		)
		IF "%UNINSTALL%"=="FALSE" (
			call:fatal Syntax error : you can't provide more than one command
		)
	    SET VMRAM=1024
	    SET XWDISKSPACE=10240
    	SET KEEPHDB1=Y
	    SET XWCPULOAD=100
	    SET XWJOBUID=xwvm
		SET INSTALL=FALSE
		SET START=FALSE
		SET STOP=FALSE
	)
	IF "%1" == "--start" (
		IF NOT "%TESTINGONLY%"=="TRUE" (
			call:fatal NOT allowed %1
		)
		IF "%START%"=="FALSE" (
			call:fatal Syntax error : you can't provide more than one command
		)
	    SET VMRAM=1024
	    SET XWDISKSPACE=10240
    	SET KEEPHDB1=Y
	    SET XWCPULOAD=100
	    SET XWJOBUID=xwvm
		SET INSTALL=FALSE
		SET UNINSTALL=FALSE
		SET STOP=FALSE
	)
	IF "%1" == "--stop" (
		IF NOT "%TESTINGONLY%"=="TRUE" (
			call:fatal NOT allowed %1
		)
		IF "%STOP%"=="FALSE" (
			call:fatal Syntax error : you can't provide more than one command
		)
	    SET VMRAM=1024
	    SET XWDISKSPACE=10240
    	SET KEEPHDB1=Y
	    SET XWCPULOAD=100
	    SET XWJOBUID=xwvm
		SET INSTALL=FALSE
		SET UNINSTALL=FALSE
		SET START=FALSE
	)
	IF "%1" == "--name" (
		SET VMNAME=%2
	)
	IF "%1" == "--hda" (
		SET HDA1FILE=%2
	)
	 
	SHIFT
GOTO Boucle


:ContinuerMain


IF "X%XWJOBUID%"=="X" (
	ECHO FATAL : XWJOBUID is not set
	GOTO:eof
)

REM
REM this is the VM name
REM
IF "%VMNAME%"=="" SET VMNAME=xwvm%XWJOBUID%


IF "X%XWCPULOAD%"=="X" (
	SET XWCPULOAD=50
)

ECHO XWCPULOAD="%XWCPULOAD%" 


IF NOT "X%XWDISKSPACE%"=="X" (
	SET SCRATCHSIZE=%XWDISKSPACE%
)


IF "%INSTALL%"=="TRUE" (
	call:install
)


REM VBoxHeadless call is blocking
IF "%START%"=="TRUE" (
	%VBHL% --startvm %VMNAME%
)

IF "%STOP%"=="TRUE" (
	%VBMGT% controlvm %VMNAME% poweroff
)


IF "%UNINSTALL%"=="TRUE" (
	call:clean
)


REM  
REM      EOF        EOF     EOF        EOF     EOF       EOF 
REM  

ENDLOCAL
