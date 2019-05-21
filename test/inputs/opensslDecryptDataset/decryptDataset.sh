#!/bin/bash

function decryptFile()
{
	if [ -e "/encrypted/$1.enc" ] && [ -e "/secrets/$1.secret" ]
	then
		echo "Decrypting '$1'"
	else
		echo "Cannot find '$1.enc' or '$1.secret'."
    exit 1
	fi
	
	openssl base64 -d -in /secrets/$1.secret -out $1.keybin
	openssl enc -aes-256-cbc -pbkdf2 -d -in /encrypted/$1.enc -out $1.recovered -kfile $1.keybin
  exit $?
}

decryptFile $1
