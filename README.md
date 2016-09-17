# Git-Log-Fetcher
This program fetches the git logs for a group of git repositories

## How to run
Follow these steps

1. From the root of the project folder, execute `npm install`

2. Edit the data/CapitalOneFile.json with OAuth peronsal token with read permission for github public repositories, you can generate the personal token from your account settings page, check this [here](https://github.com/settings/tokens)

3. Add at least 5 to 10 tokens so that you can see the logs fetching for at least 10 minutes 
	- To add the tokens open the data/CapitalOneFile.json and add the token as array elements into key "gitOauthSets"
		Eg: "gitOauthSets" : [ "<Your OAuth Token>", "<Your OAuth Token>", <Your OAuth Token> ]

4. Once you have added the OAuth tokens, you can simply run as a node app or as a Docker container
	- Run as node app using npm script (you need to have fluent installed along with websocket OUT plugin)
	
			npm start 
		
		Or, run the directly
		
			node ./runForAllOrgs.js ./data/testAllorgsFile.json

	- Run as Docker container (if you are familiar with [Docker](http://docker.com/) )
	
			docker-compose up -d 
			
5. Install [Simple Web Socket plugin](https://chrome.google.com/webstore/detail/simple-websocket-client/pfdhoblngboilpfeibdedpjgfnlcodoo?utm_source=chrome-ntp-icon) on chrome from the web store, which helps to check if the logs are being generated, and open the IP & Port on which you are running the app, this is usually `ws://localhost:7070` or `ws://127.0.0.1:7070`, if you are using docker, running on a docker-machine, its usually `ws://192.168.99.100:7070`

6. If you are seeing logs, then the logs are fetched successfully

7. The logs will stop after some time (Depending on how many tokens you supplied), then simply restart the app relative to the way you started the app

	- For node app `Ctrl + c` and again `npm start' or the direct way
	- For docker-compose simply down and up again i.e, `docker-compose down` and again `docker-compose up -d`
		
8. PS: Add at least 50+ token if you are demoing the app, so that logs run at least for 30 minutes
