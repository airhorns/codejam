# Hiredis Makefile
# Copyright (C) 2010 Salvatore Sanfilippo <antirez at gmail dot com>
# This file is released under the BSD license, see the COPYING file

OBJ = net.o hiredis.o sds.o async.o


uname_S := $(shell sh -c 'uname -s 2>/dev/null || echo not')
OPTIMIZATION?=-O2
ifeq ($(uname_S),SunOS)
  CFLAGS?= -std=c99 -pedantic $(OPTIMIZATION) -fPIC -Wall -W -D__EXTENSIONS__ -D_XPG6
  CCLINK?= -ldl -lnsl -lsocket -lm -lpthread
  DYLIBNAME?=libhiredis.so
  DYLIB_MAKE_CMD?=gcc -shared -Wl,-soname,${DYLIBNAME} -o ${DYLIBNAME} ${OBJ}
  STLIBNAME?=libhiredis.a
  STLIB_MAKE_CMD?=ar rcs ${STLIBNAME} ${OBJ}
else ifeq ($(uname_S),Darwin)
  CFLAGS?= -std=c99 -pedantic $(OPTIMIZATION) -fPIC -Wall -W -Wwrite-strings $(ARCH) $(PROF)
  CCLINK?= -lm -pthread
  OBJARCH?= -arch i386 -arch x86_64
  DYLIBNAME?=libhiredis.dylib
  DYLIB_MAKE_CMD?=libtool -dynamic -o ${DYLIBNAME} -lm ${DEBUG} - ${OBJ}
  STLIBNAME?=libhiredis.a
  STLIB_MAKE_CMD?=libtool -static -o ${STLIBNAME} - ${OBJ}
else
  CFLAGS?= -std=c99 -pedantic $(OPTIMIZATION) -fPIC -Wall -W -Wwrite-strings $(ARCH) $(PROF)
  CCLINK?= -lm -pthread
  DYLIBNAME?=libhiredis.so
  DYLIB_MAKE_CMD?=gcc -shared -Wl,-soname,${DYLIBNAME} -o ${DYLIBNAME} ${OBJ}
  STLIBNAME?=libhiredis.a
  STLIB_MAKE_CMD?=ar rcs ${STLIBNAME} ${OBJ}
endif
CCOPT= $(CFLAGS) $(CCLINK) $(ARCH) $(PROF)
DEBUG?= -g -ggdb 

PREFIX?= /usr/local
INSTALL_INC= $(PREFIX)/include/hiredis
INSTALL_LIB= $(PREFIX)/lib
INSTALL= cp -a

all: ${DYLIBNAME} 

# Deps (use make dep to generate this)
net.o: net.c fmacros.h net.h
async.o: async.c async.h hiredis.h sds.h util.h
hiredis.o: hiredis.c hiredis.h net.h sds.h util.h
sds.o: sds.c sds.h

${DYLIBNAME}: ${OBJ}
	${DYLIB_MAKE_CMD}

${STLIBNAME}: ${OBJ}
	${STLIB_MAKE_CMD}

dynamic: ${DYLIBNAME}
static: ${STLIBNAME}

# Binaries:


hiredis-%: %.o ${DYLIBNAME}
	$(CC) -o $@ $(CCOPT) $(DEBUG) -L. -lhiredis -Wl,-rpath,. $<


.c.o:
	$(CC) -c $(CFLAGS) $(OBJARCH) $(DEBUG) $(COMPILE_TIME) $<

clean:
	rm -rf ${DYLIBNAME} ${STLIBNAME}  hiredis-example* *.o *.gcda *.gcno *.gcov

dep:
	$(CC) -MM *.c

install: ${DYLIBNAME} ${STLIBNAME}
	mkdir -p $(INSTALL_INC) $(INSTALL_LIB)
	$(INSTALL) hiredis.h async.h adapters $(INSTALL_INC)
	$(INSTALL) ${DYLIBNAME} ${STLIBNAME} $(INSTALL_LIB)

32bit:
	@echo ""
	@echo "WARNING: if it fails under Linux you probably need to install libc6-dev-i386"
	@echo ""
	make ARCH="-m32"

gprof:
	make PROF="-pg"

gcov:
	make PROF="-fprofile-arcs -ftest-coverage"

noopt:
	make OPTIMIZATION=""
