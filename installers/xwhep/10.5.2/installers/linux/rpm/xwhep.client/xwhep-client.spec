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

%define _unpackaged_files_terminate_build 0

%define	name	xwhep-client
%define version	10.5.2
%define release 1

Summary: XtremWeb-HEP (XWHEP) is a platform for Global and Peer-to-Peer Computing, based on XtremWeb.
Name: %{name}
Version: %{version}
Release: %{release}
License: GPL
Group: Applications/Distributed Computing
Source: %{name}-%{version}.tar.gz
URL: http://www.xtremweb-hep.org
Vendor: Laboratoire de l Accelerateur Lineaire (http://www.lal.in2p3.fr)
Packager: Oleg Lodygensky <lodygens@lal.in2p3.fr>
#Requires: j2sdk
Provides: %{name}-%{version}
BuildArch: noarch
Distribution: whatever


BuildRoot: %{_builddir}/%{name}-%{version}
# rpm -q --whatprovides /etc/rc.d/init.d/httpd
# AutoReqProv: no

%define XW_INSTALLDIR /opt/%{name}-%{version}
%define XW_BINDIR %{XW_INSTALLDIR}/bin
%define XW_CONFDIR %{XW_INSTALLDIR}/conf
%define XW_KEYDIR %{XW_INSTALLDIR}/keystore
%define XW_DOCDIR %{XW_INSTALLDIR}/doc
%define XW_LIBDIR %{XW_INSTALLDIR}/lib
%define LOG /var/log/xwhep-client.log
%define USRBIN /usr/bin

%description
XWHEP is a Distributed Computing Plateform. It allows to set up
Global and Peer-to-Peer applications. The software is composed of
a server, a worker (the computing element) and a client (the user
interface element) parts.

This package installs the XWHEP client.

%prep
echo "[`date`] [%{name}] RPM prep nothing to do" >> %{LOG} 2>&1

%setup

touch %{LOG}
echo "[`date`] [%{name}] RPM setup" >> %{LOG}  2>&1 

echo "[`date`] [%{name}] SETUP _tmppath = "%{_tmppath} >> %{LOG}  2>&1 
echo "[`date`] [%{name}] SETUP _builddir = "%{_builddir} >> %{LOG}  2>&1 
mkdir -p  %{XW_INSTALLDIR} >> %{LOG}  2>&1 
cp -rf %{_builddir}/%{name}-%{version}/* %{XW_INSTALLDIR} >> %{LOG}  2>&1 


echo "[`date`] [%{name}] RPM setup done" >> %{LOG}  2>&1 

%pre
# this is done when installing the RPM
echo "[`date`] [%{name}] RPM pre nothing to do" >> %{LOG}  2>&1 


%install
# this is done when creating the RPM
echo "[`date`] [%{name}] RPM install XW_INSTALLDIR = %{XW_INSTALLDIR}" >> %{LOG}  2>&1 


%post
# this is done when installing the RPM


touch %{LOG}
echo "[`date`] [%{name}] RPM post" >> %{LOG}  2>&1 

ln -fs %{XW_BINDIR}/xwalive %{USRBIN}
ln -fs %{XW_BINDIR}/xwdownload %{USRBIN}
ln -fs %{XW_BINDIR}/xwusergroups %{USRBIN}
ln -fs %{XW_BINDIR}/xwapps %{USRBIN}
ln -fs %{XW_BINDIR}/xwgroups %{USRBIN}
ln -fs %{XW_BINDIR}/xwusers %{USRBIN}
ln -fs %{XW_BINDIR}/xwgroupworks %{USRBIN}
ln -fs %{XW_BINDIR}/xwsendapp %{USRBIN}
ln -fs %{XW_BINDIR}/xwstatus %{USRBIN}
ln -fs %{XW_BINDIR}/xwgui %{USRBIN}
ln -fs %{XW_BINDIR}/xwsenddata %{USRBIN}
ln -fs %{XW_BINDIR}/xwsendgroup %{USRBIN}
ln -fs %{XW_BINDIR}/xwsubmit %{USRBIN}
ln -fs %{XW_BINDIR}/xwversion %{USRBIN}
ln -fs %{XW_BINDIR}/xwchmod %{USRBIN}
ln -fs %{XW_BINDIR}/xwsendsession %{USRBIN}
ln -fs %{XW_BINDIR}/xwtasks %{USRBIN}
ln -fs %{XW_BINDIR}/xwclean %{USRBIN}
ln -fs %{XW_BINDIR}/xwsenduser %{USRBIN}
ln -fs %{XW_BINDIR}/xwworkers %{USRBIN}
ln -fs %{XW_BINDIR}/xwclient %{USRBIN}
ln -fs %{XW_BINDIR}/xwsendusergroup %{USRBIN}
ln -fs %{XW_BINDIR}/xwworks %{USRBIN}
ln -fs %{XW_BINDIR}/xwping %{USRBIN}
ln -fs %{XW_BINDIR}/xwsendwork %{USRBIN}
ln -fs %{XW_BINDIR}/xwresults %{USRBIN}
ln -fs %{XW_BINDIR}/xwsessions %{USRBIN}
ln -fs %{XW_BINDIR}/xwdatas %{USRBIN}
ln -fs %{XW_BINDIR}/xwrm %{USRBIN}

echo "[`date`] [%{name}] RPM post done" >> %{LOG}  2>&1 



%clean
# this is called at the end of the rpmbuild

touch %{LOG}
echo "[`date`] [%{name}] RPM clean" >> %{LOG}  2>&1  >> %{LOG}  2>&1
 
rm -Rf %{XW_INSTALLDIR}/opt >> %{LOG}  2>&1 
[ -d ${XW_BINDIR} ] || rm -Rf %{XW_INSTALLDIR} >> %{LOG}  2>&1

echo "[`date`] [%{name}] RPM clean done" >> %{LOG}  2>&1  >> %{LOG}  2>&1 



###########################################################
# package uninstallation
###########################################################
# The RPM upgrading first installs new version, then remove older one
# Scripts have one argument (known as $1) containing count the number of versions of the package that are installed
# This argument is as follow
#  first installation, $1 == 1
#  upgrade             $1 >  1
#  remove              $1 == 0
# See:
# http://docs.fedoraproject.org/en-US/Fedora_Draft_Documentation/0.1/html/RPM_Guide/ch09s04s05.html
###########################################################

%preun
touch %{LOG}
echo "[`date`] [%{name}] RPM preun ($1)" >> %{LOG} 2>&1

if [ $1 = 0 ] ; then 
	echo "[`date`] [%{name}] RPM preun is unistalling" >> %{LOG} 2>&1

	rm -f %{USRBIN}/xwalive
	rm -f %{USRBIN}/xwdownload
	rm -f %{USRBIN}/xwusergroups
	rm -f %{USRBIN}/xwapps
	rm -f %{USRBIN}/xwgroups
	rm -f %{USRBIN}/xwusers
	rm -f %{USRBIN}/xwgroupworks
	rm -f %{USRBIN}/xwsendapp
	rm -f %{USRBIN}/xwstatus
	rm -f %{USRBIN}/xwgui
	rm -f %{USRBIN}/xwsenddata
	rm -f %{USRBIN}/xwsendgroup
	rm -f %{USRBIN}/xwsubmit
	rm -f %{USRBIN}/xwversion
	rm -f %{USRBIN}/xwchmod
	rm -f %{USRBIN}/xwsendsession
	rm -f %{USRBIN}/xwtasks
	rm -f %{USRBIN}/xwclean
	rm -f %{USRBIN}/xwsenduser
	rm -f %{USRBIN}/xwworkers
	rm -f %{USRBIN}/xwclient
	rm -f %{USRBIN}/xwsendusergroup
	rm -f %{USRBIN}/xwworks
	rm -f %{USRBIN}/xwping
	rm -f %{USRBIN}/xwsendwork
	rm -f %{USRBIN}/xwresults
	rm -f %{USRBIN}/xwsessions
	rm -f %{USRBIN}/xwdatas
	rm -f %{USRBIN}/xwrm

	rm -Rf %{XW_INSTALLDIR} >> %{LOG}  2>&1 

	rm -Rf /tmp/xwhep.client*
	rm -Rf /tmp/XW.CLIENT*
else
	echo "[`date`] [%{name}] RPM preun does nothing" >> %{LOG} 2>&1
fi

echo "[`date`] [%{name}] RPM preun done" >> %{LOG}  2>&1  >> %{LOG}  2>&1 

%files
%defattr(755,root,root,-)
%{XW_BINDIR}/
%{XW_LIBDIR}/
%{XW_KEYDIR}/
%config %{XW_CONFDIR}/
%doc %{XW_DOCDIR}/


%changelog
