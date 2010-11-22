#!/bin/bash
redis-server /usr/local/etc/redis.conf &
cd public
node server.js &
echo "Please open a web browser to this site on port 3000 to view the application."

aaa=`cat config.yaml | grep minSharePrice | cut -d: -f2 | sed -e 's/\s//'`
maxbidatonce=`cat config.yaml | grep maxSharePrice | cut -d: -f2 | sed -e 's/\s//'`
totalshares=`cat config.yaml | grep clearingShares | cut -d: -f2 | sed -e 's/\s//'`
maxsharesperbid=`cat config.yaml | grep maxSharesPerBid | cut -d: -f2 | sed -e 's/\s//'`
portnum=`cat config.yaml | grep ^port | cut -d: -f2 | sed -e 's/\s//'`

cd ../C_server
./serverTest ${portnum} ${aaa} ${maxbidatonce} ${totalshares} $maxsharesperbid &
chromium-browser localhost:3000
