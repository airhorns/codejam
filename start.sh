redis-server /usr/local/etc/redis.conf &
C_server/serverTest -p 8211 &
cd public
node server.js &
echo "Please open a web browser to this site on port 3000 to view the application."
