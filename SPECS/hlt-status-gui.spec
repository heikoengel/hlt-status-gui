%define _topdir         %(echo $PWD)/
%define name            hlt-status-gui
%define release         1
%define version         1.0

Summary:                HLT Framework Status GUI
License:                GPL
Name:                   %{name}
Version:                %{version}
Release:                %{release}
Packager:               Heiko Engel <hengel@cern.ch>
Prefix:                 /opt/HLT
Group:                  Development/Tools
Requires:               httpd
Requires(post):         systemd
Requires(preun):        systemd
Requires(postun):       systemd
BuildRequires:          systemd
BuildRoot:              %{_tmppath}/%{name}-%{version}-root 

%description
HLT Framework Status GUI

%build
mkdir -p $RPM_BUILD_ROOT/opt/HLT/hlt-status-gui
mkdir -p $RPM_BUILD_ROOT/etc/httpd/conf.d/
cp -r %{_topdir}/SOURCES/css $RPM_BUILD_ROOT/opt/HLT/hlt-status-gui/
cp -r %{_topdir}/SOURCES/fonts $RPM_BUILD_ROOT/opt/HLT/hlt-status-gui/
cp -r %{_topdir}/SOURCES/js $RPM_BUILD_ROOT/opt/HLT/hlt-status-gui/
cp -r %{_topdir}/SOURCES/img $RPM_BUILD_ROOT/opt/HLT/hlt-status-gui/
cp -r %{_topdir}/SOURCES/*.html $RPM_BUILD_ROOT/opt/HLT/hlt-status-gui/
cp %{_topdir}/SOURCES/99-hlt-status-gui.conf $RPM_BUILD_ROOT/etc/httpd/conf.d/

%files
%defattr(-,apache,apache)
/opt/HLT/hlt-status-gui
%config /etc/httpd/conf.d/99-hlt-status-gui.conf

%post
systemctl try-restart httpd.service

%postun
systemctl try-restart httpd.service
