fluentd -c /fluentd/etc/$FLUENTD_CONF -p /usr/lib/ruby/gems/2.3.0/gems/ --daemon /home/fluent/fluentd.pid $FLUENTD_OPT 2>&1

node runForAllOrgs.js ./data/testAllorgsFile.json 2>&1