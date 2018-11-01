// copy these liens to your code and uncomment and set parameter and init in your own code
// Twitter.CONSUMER_KEY = "";
// Twitter.CONSUMER_SECRET = "";
// Twitter.TOKEN = "";
// Twitter.TOKEN_SECRET = "";
// Twitter.init();

var Twitter = {
    CONSUMER_KEY: "",
    CONSUMER_SECRET: "",
    TOKEN: "",
    TOKEN_SECRET: "",

    apiUrl: "https://api.twitter.com/1.1/",

    oauth: {
        name: "twitter",

        service: function (screen_name) {

            //  Configures the service.
            return OAuth1.createService(this.name)
                // Set the consumer key and secret.
                .setConsumerKey(this.parent.CONSUMER_KEY)
                .setConsumerSecret(this.parent.CONSUMER_SECRET)

                // Manually set the token and secret, as provided by developer console.
                .setAccessToken(this.parent.TOKEN, this.parent.TOKEN_SECRET);
        },
    },

    api: function (path, data) {
        var that = this, service = this.oauth.service();
        if (!service.hasAccess()) {
            Logger.log("先にOAuth認証してください");
            return false;
        }

        path = path.toLowerCase().replace(/^\//, '').replace(/\.json$/, '');

        var method = (
            /^statuses\/(destroy\/\d+|update|retweet\/\d+)/.test(path)
            || /^media\/upload/.test(path)
            || /^direct_messages\/(destroy|new)/.test(path)
            || /^friendships\/(create|destroy|update)/.test(path)
            || /^account\/(settings|update|remove)/.test(path)
            || /^blocks\/(create|destroy)/.test(path)
            || /^mutes\/users\/(create|destroy)/.test(path)
            || /^favorites\/(destroy|create)/.test(path)
            || /^lists\/[^\/]+\/(destroy|create|update)/.test(path)
            || /^saved_searches\/(create|destroy)/.test(path)
            || /^geo\/place/.test(path)
            || /^users\/report_spam/.test(path)
        ) ? "post" : "get";

        var url = this.apiUrl + path + ".json";
        var options = {
            method: method,
            muteHttpExceptions: true
        };

        if ("get" === method) {
            if (!this.isEmpty(data)) {
                // 2015/07/07 再度修正
                // 旧コード）
                // var queries = [];
                // for (var key in data) {
                //   // 2015/05/28 以下の部分を修正
                //   // 旧コード） queries.push(key + "=" + encodeURIComponent(data[key]));
                //   
                //   
                //   var encoded = encodeURIComponent(data[key]).replace(/[!'()*]/g, function(c) {
                //     return "%" + c.charCodeAt(0).toString(16);
                //   });
                //   queries.push(key + "=" + encoded);
                // }
                // url += '?' + queries.join("&");
                url += '?' + Object.keys(data).map(function (key) {
                    return that.encodeRfc3986(key) + '=' + that.encodeRfc3986(data[key]);
                }).join('&');
            }
        } else if ("post" == method) {
            if (!this.isEmpty(data)) {
                // 2015/07/07 修正
                // 旧コード）options.payload = data;
                options.payload = Object.keys(data).map(function (key) {
                    return that.encodeRfc3986(key) + '=' + that.encodeRfc3986(data[key]);
                }).join('&');

                if (data.media) {
                    options.contentType = "multipart/form-data;charset=UTF-8";
                }
            }
        }

        try {
            var result = service.fetch(url, options);
            var json = JSON.parse(result.getContentText());
            if (json) {
                if (json.error) {
                    throw new Error(json.error + " (" + json.request + ")");
                } else if (json.errors) {
                    var err = [];
                    for (var i = 0, l = json.errors.length; i < l; i++) {
                        var error = json.errors[i];
                        err.push(error.message + " (code: " + error.code + ")");
                    }
                    throw new Error(err.join("\n"));
                } else {
                    return json;
                }
            }
        } catch (e) {
            this.error(e);
        }

        return false;
    },

    error: function (error) {
        var message = null;
        if ('object' === typeof error && error.message) {
            message = error.message + " ('" + error.fileName + '.gs:' + error.lineNumber + ")";
        } else {
            message = error;
        }

        Logger.log(message);
    },

    isEmpty: function (obj) {
        if (obj == null) return true;
        if (obj.length > 0) return false;
        if (obj.length === 0) return true;
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) return false;
        }
        return true;
    },

    encodeRfc3986: function (str) {
        return encodeURIComponent(str).replace(/[!'()]/g, function (char) {
            return escape(char);
        }).replace(/\*/g, "%2A");
    },

    init: function () {
        this.oauth.parent = this;
        return this;
    }
};

/********************************************************************
以下はサポート関数
*/

// ツイート検索
Twitter.search = function (data) {
    if ("string" === typeof data) {
        data = { q: data };
    }

    return this.api("search/tweets", data);
};

// 自分のタイムライン取得
Twitter.tl = function (since_id) {
    var data = null;

    if ("number" === typeof since_id || /^\d+$/.test('' + since_id)) {
        data = { since_id: since_id };
    } else if ("object" === typeof since_id) {
        data = since_id;
    }

    return this.api("statuses/home_timeline", data);
};

// ユーザーのタイムライン取得
Twitter.usertl = function (user, since_id) {
    var path = "statuses/user_timeline";
    var data = {};

    if (user) {
        if (/^\d+$/.test(user)) {
            data.user_id = user;
        } else {
            data.screen_name = user;
        }
    } else {
        var path = "statuses/home_timeline";
    }

    if (since_id) {
        data.since_id = since_id;
    }

    return this.api(path, data);
};

// ツイートする
Twitter.tweet = function (data, reply) {
    var path = "statuses/update";
    if ("string" === typeof data) {
        data = { status: data };
    } else if (data.media) {
        path = "statuses/update_with_media ";
    }

    if (reply) {
        data.in_reply_to_status_id = reply;
    }

    return this.api(path, data);
};

// トレンド取得（日本）
Twitter.trends = function (woeid) {
    data = { id: woeid || 1118108 };
    var res = this.api("trends/place", data);
    return (res && res[0] && res[0].trends && res[0].trends.length) ? res[0].trends : null;
};

// トレンドのワードのみ取得
Twitter.trendWords = function (woeid) {
    data = { id: woeid || 1118108 };
    var res = this.api("trends/place", data);
    if (res && res[0] && res[0].trends && res[0].trends.length) {
        var trends = res[0].trends;
        var words = [];
        for (var i = 0, l = trends.length; i < l; i++) {
            words.push(trends[i].name);
        }
        return words;
    }
};