
# machine-learning-movies

A Node.js app I'm using to practice machine learning. It will predict movie ratings based on attributes such as year released, genre, etc.

Requires an API key from https://www.themoviedb.org

![chart](/screenshots/chart-4-4-18.png?raw=true)

### Forenote

See the `example.config.json` files for example config formats.

### Run

First, place your API key in `./config.json`, then:

```
npm install
DEV=1 node .
```

In browser, go to `http://localhost:8080`

There are currently over 350,000 movies in the DB, so the initial non-cached fetching may take several hours since the API has rate limiting of 4 req/sec/IP.

### Fetch data faster with AWS Lambda

Since AWS Lambda uses a different IP for each request, we can vastly speed up the fetching with concurrent requests.

At this point, you should have your API key in both `./config.json` and `./serverless-fetch/config.json`.

```
cd ./serverless-fetch
npm install -g serverless
serverless config credentials --provider aws --key MY_AWS_KEY --secret MY_AWS_SECRET
serverless deploy -v
```

You should get back a URL like so: `https://XXXXX.execute-api.us-east-1.amazonaws.com/dev/fetch`.

Place that url as the `lambda_fetch_url` value in `./config.json`.