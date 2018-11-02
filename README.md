# twitter-gas
Google Apps Script(GAS)でtwitter投稿するためのライブラリみたいなものです。
スクリプトエディタ上で新規ファイルを作って、そこにコピペして使います。

オリジナルのソースは
https://gist.github.com/kijtra/f4cdd8775277372d42f7
です。
gist -> gistでフォークしてたのですが、大幅に手を入れることになったのでgithubの方に移してきました。

使い方は呼び出し側のソースで各種のキーをセットして

```javascript
Twitter.CONSUMER_KEY = "aaaaa";
Twitter.CONSUMER_SECRET = "bbbbb";
Twitter.TOKEN = "ccccc";
Twitter.TOKEN_SECRET = "ddddd";

//初期化して

Twitter.init();

Twitter.tweet({ status: "ツイート内容" }))
```
でOK