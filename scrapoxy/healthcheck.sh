#!/bin/sh

export http_proxy="http://$SCRAPOXY_USERNAME:$SCRAPOXY_PASSWORD@$SCRAPOXY_HOST:$SCRAPOXY_PORT"
export https_proxy="http://$SCRAPOXY_USERNAME:$SCRAPOXY_PASSWORD@$SCRAPOXY_HOST:$SCRAPOXY_PORT"

wget -qO- --timeout=5 api.ipify.org >/dev/null 2>&1
