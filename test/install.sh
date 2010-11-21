wget http://nodejs.org/dist/node-v0.2.5.tar.gz
tar xvpf node-v0.2.5.tar.gz && cd node-v0.2.5
./configure
make
make install
cd ../
curl http://npmjs.org/install.sh | sh
npm install express jade redis socket.io yaml
cd C_server
make && gcc -o ./hiredis.o -c ./hiredis.c && g++ -O3 -Wall -o serverTest ./server3.cpp ./*.o
