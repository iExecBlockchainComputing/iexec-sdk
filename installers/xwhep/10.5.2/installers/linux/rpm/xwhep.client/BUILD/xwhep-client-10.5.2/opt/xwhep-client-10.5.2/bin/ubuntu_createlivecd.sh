#!/bin/sh

# Copyrights     : CNRS
# Author         : Simon Dadoun
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
# Change log:
# Jan 24th, 2014:
# author : Oleg Lodygensky
#    get kernel console for debugging boot process, if needed 
#    See https://www.virtualbox.org/wiki/Serial_redirect
#

#

#  ******************************************************************
#  File    : ubuntu_createlivecd.sh
#  Date    : Jan 6th, 2012
#  Author  : Simon Dadoun; Oleg Lodygensky
# 
#  OS      : Linux Ubuntu 11 and 12
#  Arch    : 32bits
# 
#  Purpose : this script creates a new Ubuntu LiveCD
#
#  Requirements: xwcontext_prologue and xwcontext_epilogue
#
# -1- The created Live CD contains the following packages
#   - debootstrap syslinux squashfs-tools genisoimage sbm
#   - dbus ubuntu-standard casper lupin-casper discover laptop-detect os-prober linux-generic 
#   - aptitude openssh-server x11-apps vim cpp gcc subversion whois zip unzip
#   - libfreetype6-dev xpmutils libxpm-dev libxpm4 vim subversion build-essential gfortran gcc-c++
#   - libxext-dev libxext6 libxft-dev libpng3 libpng12-dev libgif-dev libgif4 libxerces-c3.1
#   - libxerces-c3-samples libxerces-c3-doc libxerces-c3-dev python-dev zlib1g-dev
#   - libghc6-bzlib-dev-0.5.0.0-a3a7c libxaw7-dev lesstif2-dev libxmu-dev 
#   - libxmu-headers libxi-dev libgl1-mesa-dev libglu1-mesa-dev dosfstools sudo
#   - gfortran gcc-c++ libx11-dev libxpm-dev libxft-dev libxext-dev xlibmesa-glu-dev python-dev
#   - libxml2-dev zlib1g-dev libbz2-dev libxi-dev libicu-dev libgif-dev
#   - gd-devel bzip2-devel openmotif-devel wget
#
# -2- The created Live CD is configured as follow:
#   - Root access allowed if any id_rsa.pub* provided at LiveCD creation time
      (e.g. id_rsa.pub-user1,id_rsa.pub-user2 etc.) 
#     (see -3- below)
#   - network access customized if iptables_rules.sh provided
#     (see -3- below)
#   - a non privileged user "vmuser"
#   - mount points : see xwcontext_prologue.sh
#
#  -3- Optional files may be installed in the resulted LiveCD
#     - id_rsa.pub* are appended to /root/.ssh/authorized_keys2 so that livecd creators may connect as root
#     - iptables_rules.sh installed in /root/
#     - user.packages, a text file, containing a list of optional packages to install
#     - user.hostname, a text file, containing the expected host name
#     - *.deb are installed
# 
#  !!!!!!!!!!!!!!!!    DO NOT EDIT    !!!!!!!!!!!!!!!!
# 
#  ******************************************************************

# based on :
# https://help.ubuntu.com/community/LiveCDCustomizationFromScratch
# and
# http://doc.ubuntu-fr.org/personnaliser_livecd#modifications_de_la_configuration_du_compte_utilisateur
# host requirements:
# apt-get install debootstrap
# apt-get install syslinux squashfs-tools genisoimage sbm
# 
# 
# *****************
# If using a LiveCD
# must do 
# apt-cdrom add (even if no package available in the CD)
# apt-get install debootstrap
# apt-get install syslinux squashfs-tools genisoimage sbm
# on a oneiric distrib, sucessully re created a LiveCD "oneiric" but not "natty"
# I changed "vmlinuz-2.6*" by "vmlinuz-*"
# *****************

# *****************
# WORK_DIR must be empty : there must be no previous installation in there
# *****************
WORK_DIR="/mnt/xwscratch"
CHROOT_DIR="chroot9"
CHROOT_PATH=$WORK_DIR"/"$CHROOT_DIR

progname=`basename $0`
ROOTDIR=`pwd`

USERPKGSNAME="user.packages"
USERPKGSFILE=$ROOTDIR/$USERPKGSNAME

USERHOSTNAME="user.hostname"
USERHOSTNAMEFILE=$ROOTDIR/$USERHOSTNAME

CUSTOMHOSTNAME="xwlivecd_ubuntu1110.localdomain"
[ -r $USERHOSTNAMEFILE ] && CUSTOMHOSTNAME=`cat $USERHOSTNAMEFILE` 

echo CUSTOMHOSTNAME=$CUSTOMHOSTNAME

LSBCODENAME="oneiric"
CURRENTLSBCODENAME=`lsb_release -c | cut -d ':' -f 2`
if [ 0 -ne $? ] ; then
	CURRENTLSBCODENAME=`cat /etc/lsb-release | grep -i CODENAME | cut -d "=" -f 2`
fi
if [ "X$CURRENTLSBCODENAME" != "X" ] ; then
		LSBCODENAME=$CURRENTLSBCODENAME
fi
LSBRELEASE="11.10"
CURRENTLSBRELEASE=`cat /etc/lsb-release | grep RELEASE | cut -d "=" -f 2`
if [ "X$CURRENTLSBRELEASE" != "X" ] ; then
	LSBRELEASE=$CURRENTLSBRELEASE
fi

ISO_NAME="livecd-ubuntu-${LSBRELEASE}.iso"

#
# Since August 31st, 2012, we comply to HEPiX Virtualization Working Group
#
INITDIR="/etc/init.d"
PROLOGUE_NAME=xwcontext_prologue
PROLOGUE_FILE=$ROOTDIR/$PROLOGUE_NAME
EPILOGUE_NAME=xwcontext_epilogue
EPILOGUE_FILE=$ROOTDIR/$EPILOGUE_NAME


PROLOGUE_INITD=$INITDIR/$PROLOGUE_NAME
EPILOGUE_INITD=$INITDIR/$EPILOGUE_NAME


# *********************************************************
# buildubuntulivecd()
# *********************************************************
buildubuntulivecd()
{
  echo "`date` : entering buildubuntulivecd"
  echo "`date` : mounting proc"
  mount none -t proc /proc
  echo "`date` : mounting sys"
  mount none -t sysfs /sys
  echo "`date` : mounting devpts"
  mount none -t devpts /dev/pts
  export HOME=/root
  export LC_ALL=C

  #a package repository needs this key
  echo "`date` : calling apt-key"
  apt-key adv --recv-keys --keyserver keyserver.ubuntu.com 16126D3A3E5C1192
  echo "`date` : calling apt-get update"
  apt-get update

  echo "`date` : calling apt-get install dbus"
  apt-get install --yes dbus
  mkdir -p /var/lib/dbus/
  /bin/dbus-uuidgen > /var/lib/dbus/machine-id
  dpkg-divert --local --rename --add /sbin/initctl

  ln -s /bin/true /sbin/initctl

  #add by me to avoid question from grub-pc, and -q (quiet), it seems to work
  export DEBIAN_FRONTEND=noninteractive
  apt-get install -q --yes ubuntu-standard casper lupin-casper
  apt-get install -q --yes discover laptop-detect os-prober
  apt-get install -q --yes linux-generic 
  # add specific packages
  apt-get install -q --yes aptitude openssh-server
  # required by NEMO and probably by Root and Geant4 applications
  apt-get install -q --yes x11-apps
  apt-get install -q --yes vim
  apt-get install -q --yes cpp
  apt-get install -q --yes gcc
  apt-get install -q --yes subversion whois zip unzip

  apt-get install -q --yes g++ cmake make patch libexpat1-dev zlib1g-dev libbz2-1.0 libbz2-dev libbz2-ocaml libbz2-ocaml-dev

  apt-get install -q --yes libfreetype6-dev xpmutils libxpm-dev libxpm4 vim subversion build-essential gfortran g++ libxext-dev libxext6 libxft-dev libpng3 libpng12-dev libgif-dev libgif4 libxerces-c3.1 libxerces-c3-samples libxerces-c3-doc libxerces-c3-dev python-dev zlib1g-dev libghc6-bzlib-dev libxaw7-dev lesstif2-dev
  apt-get install -q --yes libxmu-dev libxmu-headers libxi-dev libgl1-mesa-dev libglu1-mesa-dev dosfstools sudo gd-devel bzip2-devel openmotif-devel wget
# some packages to be able to create a new livecd from a livecd
  apt-get install -q --yes debootstrap
  apt-get install -q --yes syslinux squashfs-tools genisoimage

# some packages to be able to run SuperNemo applications
  apt-get install -q --yes gfortran g++ libx11-dev libxpm-dev libxft-dev libxext-dev xlibmesa-glu-dev python-dev libxml2-dev zlib1g-dev libbz2-dev libxi-dev libicu-dev libgif-dev

#
# install this script in /usr/local/sbin/
#
	mkdir -p /usr/local/sbin/
	cp -f /tmp/$progname /usr/local/sbin/
	chown root /usr/local/sbin/$progname
	chmod +x /usr/local/sbin/$progname

#
# allow sudo for this script and poweroff
#
	echo "vmuser ALL = NOPASSWD: /sbin/poweroff" >> /etc/sudoers

#
# install user packages
#
	for p in `cat /tmp/$USERPKGSNAME` ; do 
		echo "apt-get install -q --yes $p"
		apt-get install -q --yes $p
	done
	rm -f /tmp/$USERPKGSNAME

#
# this is the place where you can install custom packages
# they will then be automatically inserterd in the new LiveCD
#
# Example : to create a LiveCD with the XWHEP worker 
# - we first copy the DPKG in a contextualization virtual disk
# - the following line tries to find the DPKG and eventually installs it
# - of course we must copy to the contextualization disk:
#   + this script 
#   + the worker DPKG
# = result : the worker is installed in the new LiveCD
#
#
# install user packages
#
	for p in `ls /tmp/*.deb` ; do 
		echo "Install $p"
		dpkg -i --no-debsig $p
		if [ $? -eq 0 ] ; then
			echo "Installation successed : $p"
		else
			echo "Installation error : $p"
		fi
		rm -f $p
	done

  ROOTPASSWD=`dd if=/dev/urandom count=50|md5sum`
  echo "echo root:${ROOTPASSWD} | chpasswd" >> /etc/rc.local


# otherwise casper ask to close the disk tray and hit enter: the host never powers off

  echo "rm -f /etc/rc0.d/*casper" >> /etc/rc.local
  echo "rm -f /etc/rc6.d/*casper" >> /etc/rc.local

  echo "loadkeys us" >> /etc/rc.local

  echo "#" >> /etc/rc.local
  echo "# Start contextualization" >> /etc/rc.local
  echo "#" >> /etc/rc.local
  echo "[ -f /etc/init.d/xwcontext_prologue ] && chmod +x /etc/init.d/xwcontext_prologue" >> /etc/rc.local
  echo "[ -f /etc/init.d/xwcontext_epilogue ] && chmod +x /etc/init.d/xwcontext_epilogue" >> /etc/rc.local
  echo "[ -x /etc/init.d/xwcontext_prologue ] && /etc/init.d/xwcontext_prologue start" >> /etc/rc.local
  echo "[ -x /etc/init.d/xwcontext_epilogue ] && /etc/init.d/xwcontext_epilogue start" >> /etc/rc.local

  echo "exit 0" >> /etc/rc.local

  rm /var/lib/dbus/machine-id
  rm /sbin/initctl
  dpkg-divert --rename --remove /sbin/initctl

# oleg : 2.6 -> 3.0
#  ls /boot/vmlinuz-2.6.**-**-generic > list.txt
  ls /boot/vmlinuz-*-generic > list.txt
  sum=$(cat list.txt | grep '[^ ]' | wc -l)ech
  if [ $sum -gt 1 ]; then
    dpkg -l 'linux-*' | sed '/^ii/!d;/'"$(uname -r | sed "s/\(.*\)-\([^0-9]\+\)/\1/")"'/d;s/^[^ ]* [^ ]* \([^ ]*\).*/\1/;/[0-9]/!d' | xargs sudo apt-get -y purge
  fi
  rm list.txt

  apt-get clean
  rm -rf /tmp/*
  rm /etc/resolv.conf
  umount -lf /proc
  umount -lf /sys
  umount -lf /dev/pts
  exit
}


# *********************************************************
# main
# *********************************************************


#
# if there is a parameter we are in chroot
#
if [ "$1" = "buildubuntu" ] ; then 
  buildubuntulivecd
  exit
fi

if [ ! -f $PROLOGUE_FILE ] ; then
  echo "FATAL : prologue not found ($PROLOGUE_FILE)"
  exit 1
fi
if [ ! -f $EPILOGUE_FILE ] ; then
  echo "FATAL : epilogue not found ($EPILOGUE_FILE)"
  exit 1
fi

ls -l $ROOTDIR/id_rsa.pub*
if [ $? -ne 0 ] ; then
  echo "WARN : no pub key found ($ROOTDIR/id_rsa.pub) : root access not allowed"
fi

if [ ! -f $ROOTDIR/iptables_rules.sh ] ; then
  echo "WARN : iptables rules not found ($ROOTDIR/iptables_rules.sh) : LAN access allowed"
fi

apt-get update

apt-cdrom add
apt-get -q --yes install debootstrap
apt-get -q --yes install syslinux 
apt-get -q --yes install squashfs-tools
apt-get -q --yes install genisoimage
# next may not be available...
apt-get -q --yes install sbm

apt-get update

mkdir -p $CHROOT_PATH
cd $WORK_DIR
echo "`date` : current directory `pwd`"



echo "`date` : calling sudo debootstrap --arch=i386 $LSBCODENAME $WORK_DIR/$CHROOT_DIR http://archive.ubuntu.com/ubuntu/"
sudo debootstrap --arch=i386 $LSBCODENAME $WORK_DIR/$CHROOT_DIR http://archive.ubuntu.com/ubuntu/
echo "`date` : debotstrap called"

echo "`date` : binding dev mount --bind /dev $CHROOT_DIR/dev"
mount --bind /dev $CHROOT_DIR/dev

cp /etc/hosts $CHROOT_DIR/etc/hosts
cp /etc/resolv.conf $CHROOT_DIR/etc/resolv.conf
cp /etc/apt/sources.list $CHROOT_DIR/etc/apt/sources.list

cp -f $ROOTDIR/* $CHROOT_DIR/tmp/
cp $0 $CHROOT_DIR/tmp/
chmod +x $CHROOT_DIR/tmp/$progname

echo "`date` : entering chroot  $CHROOT_DIR /tmp/$progname buildubuntu"
/usr/sbin/chroot $CHROOT_DIR /tmp/$progname buildubuntu

# test life after chroot OK !!
#touch $ROOTDIR/afterchroot.txt
#echo $ROOTDIR >> $ROOTDIR/afterchroot.txt
#echo "and me" >> $ROOTDIR/afterchroot.txt
touch /tobesure.txt

# after chroot

#
# deleting /etc/udev/rules.d/*persistent-net.rules 
# because we don't know which network interface to use
# 
echo "`date` : deleting $CHROOT_DIR/etc/udev/rules.d/*persistent-net.rules"
rm -f $CHROOT_DIR/etc/udev/rules.d/*persistent-net.rules

#
# configure casper
#
echo "`date` : creating /etc/casper.conf"
rm /etc/casper.conf
echo "" > $CHROOT_DIR/etc/casper.conf
echo "export USERNAME=\"vmuser\"" >> $CHROOT_DIR/etc/casper.conf
echo "export USERFULLNAME=\"XtremWeb-HEP live session user\"" >> $CHROOT_DIR/etc/casper.conf
echo "export HOST=\"$CUSTOMHOSTNAME\"" >> $CHROOT_DIR/etc/casper.conf
echo "export BUILD_SYSTEM=\"Ubuntu\"" >> $CHROOT_DIR/etc/casper.conf

sed -i 's/sleep .*$/sleep 5/g' $CHROOT_DIR/etc/init/failsafe.conf

sed -i 's/NOPASSWD://g' $CHROOT_DIR/usr/share/initramfs-tools/scripts/casper-bottom/10adduser

mkdir -p $CHROOT_DIR/$INITDIR
cp $PROLOGUE_FILE $CHROOT_DIR/$PROLOGUE_INITD
chmod +x $LIVE/$PROLOGUE_INITD
cp $EPILOGUE_FILE $CHROOT_DIR/$EPILOGUE_INITD
chmod +x $LIVE/$EPILOGUE_INITD

#
# copy user packages
#
cp $USERPKGSFILE $CHROOT_DIR/tmp/
cp $ROOTDIR/*.deb $CHROOT_DIR/tmp/

mkdir -p $CHROOT_DIR/root/.ssh
ls -l $ROOTDIR/id_rsa.pub*
if [ $? -eq 0 ] ; then
	touch $CHROOT_DIR/root/.ssh/authorized_keys2
	for i in `ls $ROOTDIR/id_rsa.pub*` ; do 
		cat $i >> $CHROOT_DIR/root/.ssh/authorized_keys2
		if [ $? -eq 0 ] ; then
			echo "Public key $i appended to $CHROOT_DIR/root/.ssh/authorized_keys2"
		else
			echo "ERROR : public key $i not appended to $CHROOT_DIR/root/.ssh/authorized_keys2"
		fi
	done
else
	echo "WARN : no public key found in $ROOTDIR"
fi
chmod 600 $CHROOT_DIR/root/.ssh/
chmod 600 $CHROOT_DIR/root/.ssh/authorized_keys2
cp $ROOTDIR/iptables_rules.sh $CHROOT_DIR/root/
chmod 700 $CHROOT_DIR/root/iptables_rules.sh

cd $WORK_DIR
echo "`date` : unmounting $CHROOT_PATH/dev"
umount $CHROOT_PATH/dev
#umount: /work/chroot/dev: device is busy.
echo "`date` : $CHROOT_PATH/dev unmounted"

mkdir -p image/casper image/isolinux image/install

# oleg : 2.6 -> 3.0
#cp $CHROOT_DIR/boot/vmlinuz-2.6.**-**-generic image/casper/vmlinuz
#cp $CHROOT_DIR/boot/initrd.img-2.6.**-**-generic image/casper/initrd.gz
cp $CHROOT_DIR/boot/vmlinuz-*-generic image/casper/vmlinuz
cp $CHROOT_DIR/boot/initrd.img-*-generic image/casper/initrd.gz

cp /usr/lib/syslinux/isolinux.bin image/isolinux/

cp /boot/memtest86+.bin image/install/memtest
cp /boot/sbm.img image/install/

echo "Welcome on this Ubuntu $LSBRELEASE ($LSBCODENAME) Livecd, launched by XtremWeb-HEP" > image/isolinux/isolinux.txt


#echo command not tested, done manually
echo "DEFAULT live
LABEL live
  menu label ^Start or install Ubuntu
  kernel /casper/vmlinuz
  append  file=/cdrom/preseed/ubuntu.seed boot=casper initrd=/casper/initrd.gz console=ttyS0 console=tty0 ignore_loglevel --
LABEL check
  menu label ^Check CD for defects
  kernel /casper/vmlinuz
  append  boot=casper integrity-check initrd=/casper/initrd.gz console=ttyS0 console=tty0 ignore_loglevel --
LABEL memtest
  menu label ^Memory test
  kernel /install/memtest
  append -
LABEL hd
  menu label ^Boot from first hard disk
  localboot 0x80
  append -
DISPLAY isolinux.txt
#TIMEOUT 300
TIMEOUT 60
PROMPT 1 

#prompt flag_val
# 
# If flag_val is 0, display the "boot:" prompt 
# only if the Shift or Alt key is pressed,
# or Caps Lock or Scroll lock is set (this is the default).
# If  flag_val is 1, always display the "boot:" prompt.
#  http://linux.die.net/man/1/syslinux   syslinux manpage 
" > image/isolinux/isolinux.cfg


sudo /usr/sbin/chroot $CHROOT_DIR dpkg-query -W --showformat='${Package} ${Version}\n' | sudo tee image/casper/filesystem.manifest
sudo cp -v image/casper/filesystem.manifest image/casper/filesystem.manifest-desktop
REMOVE='ubiquity ubiquity-frontend-gtk ubiquity-frontend-kde casper lupin-casper live-initramfs user-setup discover1 xresprobe os-prober libdebian-installer4'
for i in $REMOVE 
do
        sudo sed -i "/${i}/d" image/casper/filesystem.manifest-desktop
done

sudo mksquashfs $CHROOT_DIR image/casper/filesystem.squashfs -e boot

echo "#define DISKNAME  Ubuntu $LSBRELEASE \"$LSBCODENAME\" - Release i386 **Remix**
#define TYPE  binary
#define TYPEbinary  1
#define ARCH  i386
#define ARCHi386  1
#define DISKNUM  1
#define DISKNUM1  1
#define TOTALNUM  0
#define TOTALNUM0  1" > image/README.diskdefines


touch image/ubuntu

mkdir image/.disk
cd image/.disk
touch base_installable
echo "full_cd/single" > cd_type
echo "Ubuntu $LSBRELEASE \"$LSBCODENAME\" - i386 " > info
echo "http//ubuntu-rescue-remix.org" > release_notes_url
cd ../..

#sudo -s
#(cd image && find . -type f -print0 | xargs -0 md5sum | grep -v "\./md5sum.txt" > md5sum.txt)
#exit
cd image && find . -type f -print0 | xargs -0 md5sum | grep -v "\./md5sum.txt" > md5sum.txt

#cd image
sudo mkisofs -r -V "$IMAGE_NAME" -cache-inodes -J -l -b isolinux/isolinux.bin -c isolinux/boot.cat -no-emul-boot -boot-load-size 4 -boot-info-table -o ../$ISO_NAME .
cd ..


