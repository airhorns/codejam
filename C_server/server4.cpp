// The very simple socket server - listens on specified port, accept
// connection, prints client address, sends (optional) greeting and
// closes the socket. 

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <string>
#include <unistd.h>

#include <sys/types.h>
#include <netinet/in.h>
#include <netinet/tcp.h>

#include <errno.h>
#include <netdb.h>
#include <time.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <fcntl.h>

#include <boost/regex.hpp>

#include <list>

#include "hiredis.h"

#if defined(linux)
#	include <limits.h>
#	include <linux/netfilter_ipv4.h>
#endif // linux

#define CONNTIMEOUT 4
#define MINBIDVALUE 0
#define MAXBIDVALUE 100
#define MAXBIDATONCE 10000
#define TOTALSHARES 1000
#define ACCEPTSTR "A\r\n"
#define ERRORSTR "E\r\n"
#define CLOSESTR "C\r\n"
#define RESETSTR "R\r\n"
//portnum is devined via command line; so should be these values
using namespace std;

int bidOpen;

const string CORRECTCLOSE("C|TERMINATE\r\n");
const string CORRECTRESET("R\r\n");
const string CORRECTSUMMARY("S|SUMMARY\r\n");

//const boost::regex CORRECTREGEX("^B\|[0-9]{1,7}\|[0-9]{1,7}\|\s*.+?\s*$");

redisContext *redC;
redisReply *rreply;
long long bidID;
long long *ptrBidID = &bidID;

struct Session
{
  int sockfd;
  // NOTE: in readbuff we keep data received from the socket,
  // buffering it until we have the whole request.  In the
  // writebuffer, we put what we want to send and keep track in
  // wbytes; wsize says how many bytes there are to send
  

  char readbuf[60], writebuf[10]; //we won't be needing larger sizes
  size_t rbytes, wbytes, wsize;
  int completed;
  int firstConn;
  Session(int sock)
  {
    sockfd = sock;
    int ii;
    for(ii =0 ; ii < 60 ; ii++)	readbuf[ii]='\0'; //no need to clear writebuf - it's always 3 characters long.
    completed = rbytes = wbytes = wsize = firstConn = 0;
  };
};

static void printStatus(){
	if ( bidOpen) printf("Auction Status OPEN\n");
	else printf("Auction Status CLOSED\n");

	int clearingPrice = 0, ii=0;
/*	int diffprices = 1;//TODO SOME REQYEST
	int prices[diffprices], shares[diffprices];
	for (ii=0;ii<diffPrices;ii++){
		prices[ii] = 0;//TODO: request
		shares[ii] = 0; //TODO: request
	}

	printf("Clearing Price $%i\n", clearingPrice);
	printf("Bid Price\tTotal\n\t\tShares\n");
	for(ii=0, ii< diffPrices;ii++){
		printf("$%i\t\t%i\n",prices[ii], shares[ii]);
	}*/
}

static void usage(const char *progname)
{
 // printf("Usage: %s -p portnum [-h(elp)]\n", progname);
}


static void set_non_blocking(int sockfd)
{
  int flags = fcntl( sockfd, F_GETFL, 0);
  fcntl( sockfd, F_SETFL, flags | O_NONBLOCK);
}

static void setReply( Session *sessPtr, const char *reply)
{
  int toCopy = strlen(reply);
  if( toCopy >= sizeof( sessPtr->writebuf))
    toCopy = sizeof(sessPtr->writebuf);

  memcpy( sessPtr->writebuf, reply, toCopy);
  sessPtr->wsize = toCopy;
}

static void resetAll(){
	bidOpen = 1;
	redisCommand(redC, "PUBLISH commands reset");
	redisCommand(redC, "FLUSHALL");
	rreply = (redisReply*)redisCommand(redC, "INCR global:nextBid");	
	bidID = rreply->integer;
	printf("flushed; bid: %i\n",bidID);
	//freeReplyObject((void*)rreply);
}

static bool parseRequest(Session *sptr)
{
	printf("%i\t%s\n",sptr->rbytes, sptr->readbuf);
	
//	if( sptr->readbuf[0] == 'C' ) sptr->readbuf[13] = '\0'; //workaround the trailing ascii 1
//	if( sptr->readbuf[0] == 'S' ) sptr->readbuf[11] = '\0';
	
	char* output;
	string input(sptr->readbuf, sptr->rbytes);
	
	
	if( !bidOpen){
		if( strcmp("R\r\n", sptr->readbuf) == 0 ){
			resetAll();
			output = RESETSTR;
		}else{
			output = CLOSESTR;
		}setReply( sptr, output);
		return true;
	}
	int strlength, firstSeparator,secondSeparator,thirdSeparator, length1, length2, val1, val2, bidNameLen;
	char bidderName[60];
	char fixedBidderName[32];
	char *buf;
	int strStart = 0, ii=0;
	switch(sptr->readbuf[0] ){
		case ('B') :
			//TODO: input parsing
			strlength = sptr->rbytes;
			firstSeparator = input.find("|",0);
			secondSeparator = input.find("|",firstSeparator+1);
			thirdSeparator = input.find("|",secondSeparator+1);
			length1 = secondSeparator - firstSeparator -1;
			length2 = thirdSeparator - secondSeparator -1;
			val1 = atoi(input.substr(firstSeparator+1,length1).c_str()); //value of the first field - number of bids
			val2 = atoi(input.substr(secondSeparator+1,length2).c_str());//value of the second field - cost of bids
			bidNameLen = thirdSeparator - (sptr->rbytes - 1);
			if( //	(!regex_match( input, CORRECTREGEX)) ||
				(thirdSeparator == (-1) ) || //error checking...
				(firstSeparator != 1) || 
				(secondSeparator-firstSeparator <= 1) ||
				(secondSeparator-firstSeparator >= 10) ||
				(thirdSeparator-secondSeparator <= 1) ||
				(thirdSeparator-secondSeparator >= 10) ||
				(strlength - thirdSeparator > 35) ||
				(thirdSeparator - (sptr->rbytes - 2) <= 1) || //last field (company name) is empty
				(sptr->readbuf[sptr->rbytes - 1] != '\n') ||
				(sptr->readbuf[sptr->rbytes - 2] != '\r') ||
				(val1 == 0) ||
				(val2 == 0) ||
				(val1 > MAXBIDATONCE ) || 
				(val2 > MAXBIDVALUE ) || 
				(val2 < MINBIDVALUE ) )
				{
					output = ERRORSTR;
					break;
			}
			strStart=0;
			strcpy(bidderName, input.substr(thirdSeparator+1, bidNameLen-3).c_str()); //the -2 compensates for the lasr \r\n
			while(bidderName[strStart] == ' ') strStart++; 
			while((bidderName[strlen(bidderName)-1] == ' ') || 
				(bidderName[strlen(bidderName)-1] == '\r') || 
				(bidderName[strlen(bidderName)-1] == '\n')) 
					bidderName[strlen(bidderName)-1] = '\0'; //strips the trailing whitespaces from bidderName
			for(ii=0;ii<32;ii++)fixedBidderName[ii]='\0';
			for(ii = strStart;bidderName[ii] != '\0' ; ii++) fixedBidderName[ii-strStart] = bidderName[ii];	
			char ***ignored; //output value of hmset; is ignored
			rreply = (redisReply*)redisCommand(redC, "INCR global:nextBid");	
			bidID = rreply->integer;
			
			freeReplyObject((void*)rreply);
			char *str[12];
			str[0]="HMSET";
			str[2]="shares";
			str[4]="price";
			str[6]="bidder";
			str[8]="time";
			str[10]="\0";
			str[11]="\0";
			sprintf(str[1], "bid_%lli", bidID);
			printf("1\n");
			str[3] = (char*)malloc(sizeof(char)*12);
			sprintf(str[3], "%i", val1);
			printf("3\n");
			str[5] = (char*)malloc(sizeof(char)*12);
			sprintf(str[5], "%i", val2);
			printf("5\n");
			str[7] = (char*)malloc(sizeof(char)*32);
			sprintf(str[7], "\"%s\"", fixedBidderName);
			printf("7\n");
			str[9] = (char*)malloc(sizeof(char)*18);
			sprintf(str[9], "%i", time(0));
			printf("ok\n");
			redisCommand(redC, "%s %s %s %s %s %s %s %s %s %s", str[0],str[1],str[2],str[3],str[4],str[5],str[6],str[7],str[8],str[9]);
			str[2] = (char*)malloc(sizeof(char)*10);
			str[0]="SADD";
			str[1]="bIds";
			str[2]="{bId:";
			str[4]="shares:";
			str[6]="price:";
			str[8]="bidder:";
			str[10]="time:"; 
			sprintf(str[2], "%i", bidID);
			redisCommand(redC, "SADD bIds %s" ,str[2]);
			printf("sendsecond\n");
			sprintf(buf,  "PUBLISH bids {bId: %lli, shares: %i, price: %i, bidder: \"%s\", time: %i}",  bidID, val1, val2, fixedBidderName,time(0));
			redisCommand(redC, "%s", buf);
//			redisCommand(redC, "PUBLISH bids {bId: %lli, shares: %i, price: %i, bidder: \"%s\", time: %i}",  bidID, val1, val2, fixedBidderName,time(0)); //channel = bids.
			printf("before free\n");
			free(str[1]);
			//for(ii=0;ii<10;ii++) free(buf[ii]);
			output = ACCEPTSTR;
			break;
		case ('C'):
			if( strcmp("C|TERMINATE\r\n", sptr->readbuf) == 0 ) { //the wierd char ascii 1 we get after performing a server reset
				output = ACCEPTSTR;
				bidOpen = 0;
				redisCommand(redC, "PUBLISH commands close"); //channel = bids.
			} else{
				output = ERRORSTR;
			}break;
		case('S'):
			if( strcmp("S|SUMMARY\r\n", sptr->readbuf) == 0 ){
				redisCommand(redC, "PUBLISH commands summary");
				printStatus();
				output = ACCEPTSTR;
			}else{
				output = ERRORSTR;
			}break;
		case('R'):
			if( strcmp("R\r\n", sptr->readbuf) == 0 ){
				resetAll();
				output = RESETSTR;
			}else{
				output = ERRORSTR;
			}break;
		default:
			output = ERRORSTR;
			break;
	}	
	setReply( sptr, output);
	
  if( memchr(sptr->readbuf, '\n', sptr->rbytes) != NULL)
    return true;

  return false;
}

void run_server(int listeningSocket)
{
  int maxFd = listeningSocket;
  fd_set rmask, wmask;
  
  std::list<Session *> sessions;
  std::list<Session *>::iterator it;

  while(true) {
    FD_ZERO(&rmask);
    FD_ZERO(&wmask);
//	printf("%i sessions currently present\n", sessions.size());
    FD_SET( listeningSocket, &rmask);
    for( it=sessions.begin(); it != sessions.end(); ++it) {
      Session *sess = *it;
	  
      
      // Read until there is a free space
      if( sess-> rbytes < sizeof(sess->readbuf))
	FD_SET( sess->sockfd, &rmask);
      
      if( sess->wbytes < sess->wsize)
	FD_SET( sess->sockfd, &wmask);
      
      if( maxFd < sess->sockfd)
	maxFd = sess->sockfd;
    }

    int selected = select( maxFd+1, &rmask, &wmask, NULL, NULL);
    
    if( selected > 0) {
      // First of all, check if we have new connection to accept
      if( FD_ISSET( listeningSocket, &rmask)) {
		// Accept new connection
		sockaddr_in addr;
		socklen_t addrlen = sizeof(addr);
		
		int newSock = accept( listeningSocket, 
					  (struct sockaddr *)&addr,
					  &addrlen);

		set_non_blocking( newSock);

		if( newSock >= 0) {
//		  printf("New session accepted from socket %d\n", newSock);
		  Session *newSess = new Session( newSock);
		  sessions.push_back( newSess);
		}
      }

      // Now go trough all the sockets and process them
      for( it = sessions.begin(); it != sessions.end(); ) {
		bool sessionClosed = false;

		Session *sessPtr = *it;
		int n;
		if( FD_ISSET( sessPtr->sockfd, &rmask)) {
		  int to_read = sizeof( sessPtr->readbuf) - sessPtr->rbytes;
		  n = read( sessPtr->sockfd, 
				sessPtr->readbuf + sessPtr->rbytes,
				to_read);
//		  if(sessPtr->completed) goto skip_checks;
		  if(sessPtr->firstConn == 0 ) sessPtr->firstConn = time(0);
		  if( (n == (-1) ) && (time(0) - sessPtr->firstConn < CONNTIMEOUT) ) continue;
		  sessPtr->rbytes += n;
		  if(((time(0) - sessPtr->firstConn) < CONNTIMEOUT) &&( (sessPtr->rbytes < 1) || (sessPtr->readbuf[(sessPtr->rbytes)-1] != '\n') )) continue;  

//skip_checks:

		  if( n == 0) {
			// In theory we should check for an error here, but it's
			// for later
			sessionClosed = true;
//			printf("Session with socket %d is closed (errno %d (%s))\n",
//			   sessPtr->sockfd, errno, strerror(errno));
		  } else {
			// Try to parse the request. For now, we assume request is
			// done when there is a newline in the string. If the
			// buffer is full and still no request is found - it's an
			// error, and error message is sent to the client
						
//			sessPtr->completed=1;
			if( parseRequest(sessPtr)) {
			  ;//setReply( sessPtr, GoodReply);
			} else if( sessPtr->rbytes == sizeof(sessPtr->readbuf)){
			  ;//setReply( sessPtr, BadReply);
			}
		  }
		}

		if( !sessionClosed && FD_ISSET( sessPtr->sockfd, &wmask)) {
		  int wrote = write( sessPtr->sockfd, 
					 sessPtr->writebuf + sessPtr->wbytes,
					 sessPtr->wsize - sessPtr->wbytes);
	//		printf( "%i bytes written\n",wrote);

		  if( wrote <= 0) {
			printf("Error writing to session with sock %d (%d - %s)\n",
			   sessPtr->sockfd, errno, strerror(errno));
			sessionClosed = true;
		  } else {
			sessPtr->wbytes += wrote;
			if( sessPtr->wbytes == sessPtr->wsize) {
			  // Everything was sent - nothing to do, let's close
			  // session. We support only one request per connection
			  // for now.
			  sessionClosed = true;
			}
		  }
		}
	
	if( sessionClosed) {
//	  printf("Session with socket %d deleted\n", sessPtr->sockfd);
	  close(sessPtr->sockfd);
	  it = sessions.erase(it);
	  delete sessPtr;
	}
	else
	  it++;
      }
    }
  }
}

int main(int argc, char *argv[])
{
  int arg;
  bidOpen = 1;
  if( argc == 1){
	usage(argv[0]);
    exit(1);
  }
  unsigned short portnum = 0;

  // Parse command line
  while( (arg=getopt(argc, argv, "p:h")) != EOF) {
    switch( arg) {
    case 'p':
      portnum = (unsigned short)atoi(optarg);
      break;
    case 'h':
    default:
      usage(argv[0]);
      exit(1);
      // Notreached
      break;
    }
  }
  bidID = 0;
  redC = redisConnect((char*)"127.0.0.1", 6379); 

  // Create listening socket
  int listeningSock = socket( AF_INET, SOCK_STREAM, IPPROTO_TCP);
  
  // Set listening address (127.0.0.1) and port
  sockaddr_in addr;
  memset( &addr, 0, sizeof(addr));
  addr.sin_family = AF_INET;
  addr.sin_port = htons(portnum);
  addr.sin_addr.s_addr = INADDR_ANY;


  int on = 1;
  setsockopt(listeningSock, SOL_SOCKET, SO_REUSEADDR, (char *)&on, sizeof(on));

  int ret;
  ret = bind(listeningSock, (struct sockaddr*) &addr, sizeof(addr));

  if(ret != 0)	{
    printf( "Bind failed with errno %d (%s)\n",
	    errno, strerror(errno));
    exit(1);
  }
  
  set_non_blocking(listeningSock);

  ret = listen(listeningSock, 10);
  if(ret != 0) {
    printf( "Listen failed with errno %d (%s)\n",
	    errno, strerror(errno));
    
    exit(1);
  }
  
  run_server(listeningSock);

  close(listeningSock);

  return 0;
}
