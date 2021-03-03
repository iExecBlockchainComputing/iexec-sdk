#!/bin/bash

function decryptFile()
{
        if [ -e "/host/$1" ] && [ -n "$3" ]
        then
                echo "Decrypting '$1' to '$2' with key $3"
        else
                echo "Cannot find '$1' or missing key"
    exit 1
        fi
        tail -c+17 "/host/$1" | openssl enc -d -aes-256-cbc -out "/host/$2" -K $(echo $3 | base64 -d | xxd -p -c 32) -iv $(head -c 16 "/host/$1" | xxd -p -c 16)
  exit $?
}

decryptFile $1 $2 $3
