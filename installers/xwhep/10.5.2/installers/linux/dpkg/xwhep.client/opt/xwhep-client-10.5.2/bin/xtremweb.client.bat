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



java -Djavax.net.ssl.trustStore=..\keystore\xwhepclient.keys -cp ..\lib\xtremweb.jar;..\lib\bcprov-jdk16-140.jar xtremweb.client.Client --xwconfig "%USERPROFILE%\.xtremweb\xtremweb.client.conf"  --xwgui
