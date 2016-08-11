SPEC=SPECS/hlt-status-gui.spec
ARCH=$(shell uname -m)
DEPS=$(shell find SOURCES SPECS -type f)
NAME=$(shell cat $(SPEC) | awk '/define name/ { print $$3 }')
VERSION=$(shell cat $(SPEC) | awk '/define version/ { print $$3 }')
RELEASE=$(shell cat $(SPEC) | awk '/define release/ { print $$3 }')


OBJ=RPMS/$(ARCH)/$(NAME)-$(VERSION)-$(RELEASE).$(ARCH).rpm

all: $(OBJ)

$(OBJ): $(DEPS)
	mkdir -p RPMS BUILD
	rpmbuild -v -bb --clean $(SPEC)

list: $(OBJ)
	rpm -q -filesbypkg -p $<

info: $(OBJ)
	rpm -q -i -p $<

clean:
	$(RM) -rf RPMS/$(ARCH)

.PHONY: info list clean all
