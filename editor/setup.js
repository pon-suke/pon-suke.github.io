const GAS_URL = "https://script.google.com/macros/s/AKfycbwmPFY303UqYqixiT7OwECIIfmbYhiVGjJ4zwZ62bw_Q_lp1PE/exec"

const addMultipleEventListener = (target, eventNames, listener) => {
    const events = eventNames.split(" ");
    events.forEach(event => target.addEventListener(event, listener, false));
};

Reflect.defineProperty(EventTarget.prototype, "on", {
    configurable: true,
    enumerable: false,
    writable: true,
    value: function (eventNames, listener) {
        const events = eventNames.split(" ");
        events.forEach(event => this.addEventListener(event, listener, false));
    },
});

const getUrlQueries = () => {
    let queryStr = window.location.search.slice(1);  // 文頭?を除外
    queries = {};

    // クエリがない場合は空のオブジェクトを返す
    if (!queryStr) {
        return queries;
    }

    // クエリ文字列を & で分割して処理
    queryStr.split('&').forEach((queryStr) => {
        // = で分割してkey,valueをオブジェクトに格納
        let queryArr = queryStr.split('=');
        queries[queryArr[0]] = queryArr[1];
    });

    return queries;
}

const getArticleNumber = () => {
    let n = getUrlQueries().n;
    return isNaN(n) || n == 0 ? -1 : n;
}

// 画像をimgurにアップロード
const ImageUpload = (file, isBase64 = false) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            console.log(event)
            const base64 = reader.result.replace(new RegExp('data.*base64,'), '');
            $.ajax({
                url: "https://api.imgur.com/3/image",
                type: 'POST',
                headers: {
                    "Authorization": 'Client-ID a23f3ab17570a8b'
                },
                data: {
                    image: base64,
                    type: 'base64',
                }
            }).done((res) => {
                console.log(res)
                resolve({
                    success: 1,
                    file: {
                        url: res.data.link
                    }
                })
            }).fail((err) => {
                console.error("error: \n" + err)
                reject({
                    success: 0,
                    file: {
                        url: ""
                    }
                })
            })
        }
    })
}

var hoge;
const getArticle = new Promise((resolve) => {
    $.ajax({
        method: 'POST',
        url: GAS_URL,
        data: {
            request: 'getAll',
        },
        dataType: 'jsonp',
        jsonp: 'jsoncallback',
        jsonpCallback: 'getArticleCallback',
        crossDomain: true,
    }).done((e) => {
        console.log("hoge\n" + e)
    }).fail((e) => {
        console.error(e)
        // console.log(saveData)
        if (e.status === 200) {
            resolve(saveData)
        }
    })
})
// 取得したデータを基に描画 or 表示
// 明日は記事ナンバーからエディターに登録するところをやる
const getArticleCallback = (data) => {
    console.log(data.meta)
    hoge = (data.data)
    saveData = { time: new Date(), blocks: [], version: "2.19.0" }
    let preData = data.data[getArticleNumber()]
    saveData.blocks[0] = { type: "header", data: { level: 2, text: preData.title } }
    saveData.blocks[1] = { type: "header", data: { level: 3, text: preData.subTitle } }
    let i = 2
    const imgPattern = /image[\d]{1}/
    preData.main.split('$').forEach(e => {
        if (imgPattern.test(e)) {
            let imgNum = e.match(/[\d]{1}/)
            saveData.blocks[i++] = { type: "sImage", data: { url: preData.images[imgNum] } }
        } else
            saveData.blocks[i++] = { type: "paragraph", data: { text: e } }
    })
    return saveData
}

const getSaveData = new Promise((resolve, reject) => {
    let n = getArticleNumber()
    if (n > 0) {
        getArticle.then((val) => {
            console.log(val)
            localStorage.setItem("data", JSON.stringify(saveData))
            resolve(val)
        })
    } else {
        console.log('saved data')
        resolve(JSON.parse(localStorage.getItem("data")))
    }
})