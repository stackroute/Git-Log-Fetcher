sudo apt-get install gem –y
sudo td-agent-gem fluent-plugin-websocket
cd /etc/td-agent/
ls
cd plugin/
sudo td-agent-gem fluent-plugin-websocket
sudo apt-get install linux-headers-3.16.0-4-amd64 build-essential
sudo td-agent-gem install fluent-plugin-websocket


stackroute@stackroute-main:~$ sudo find / -type f -name "out_websocket.rb"
/opt/td-agent/embedded/lib/ruby/gems/2.1.0/gems/fluent-plugin-websocket-0.1.6/out_websocket.rb
/opt/td-agent/embedded/lib/ruby/gems/2.1.0/gems/fluent-plugin-websocket-0.1.6/lib/fluent/plugin/out_websocket.rb

