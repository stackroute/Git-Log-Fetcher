FROM mhart/alpine-node

MAINTAINER basavarajkn <rajiff@gmail.com>
LABEL Description="Log fetch and serve over websocket using fluentd for Tattva" 
LABEL Version="1.0"

USER root

#This will install fluent and the plugin for websocket output
RUN apk --no-cache --update add \
                            build-base \
                            ca-certificates \
                            ruby \
                            ruby-irb \
                            ruby-dev && \
    echo 'gem: --no-document' >> /etc/gemrc && \
    gem install oj && \
    gem install fluentd -v 0.12.26 && \
    gem install fluent-plugin-websocket && \
    apk del build-base ruby-dev && \
    rm -rf /tmp/* /var/tmp/* /var/cache/apk/*

RUN adduser -D -g '' -u 1000 -h /home/fluent fluent
RUN chown -R fluent:fluent /home/fluent

# for log storage (maybe shared with host)
RUN mkdir -p /fluentd/log
# configuration/plugins path (default: copied from .)
RUN mkdir -p /fluentd/etc /fluentd/plugins

RUN chown -R fluent:fluent /fluentd

USER fluent
WORKDIR /home/fluent

# Tell ruby to install packages as user
RUN echo "gem: --user-install --no-document" >> ~/.gemrc
ENV PATH /home/fluent/.gem/ruby/2.3.0/bin:$PATH
ENV GEM_PATH /home/fluent/.gem/ruby/2.3.0:$GEM_PATH

COPY fluent.conf /fluentd/etc/
# ONBUILD COPY fluent.conf /fluentd/etc/
# ONBUILD COPY plugins /fluentd/plugins/

ENV FLUENTD_OPT=""
ENV FLUENTD_CONF="fluent.conf"

EXPOSE 24224 5140 7070

#Run the fluentd as a deamon
# RUN exec fluentd -c /fluentd/etc/$FLUENTD_CONF -p /fluentd/plugins --daemon /home/fluent/fluentd.pid $FLUENTD_OPT
RUN exec fluentd -c /fluentd/etc/$FLUENTD_CONF -p /usr/lib/ruby/gems/2.3.0/gems/ --daemon /home/fluent/fluentd.pid $FLUENTD_OPT

WORKDIR /home/fluent/Git-Log-Fetcher
ADD . /home/fluent/Git-Log-Fetcher

USER root
RUN chown -R fluent:fluent /home/fluent/Git-Log-Fetcher
USER fluent

RUN npm install

CMD ["node", "/home/fluent/Git-Log-Fetcher/runForAllOrgs.js ./data/testAllorgsFile.json"]
