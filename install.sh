#!/bin/bash

cd redis-2.0.4
make clean
make install

cd ../C_server
gcc -o ./credis.o -c ./credis.c
make clean
make
g++ -o serverTest ./*.o ./server3.cpp

