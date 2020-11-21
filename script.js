var SimpleImages = ""

// editorの設定
const editor = new EditorJS({
    holder: 'editor',
    autofocus: true,
    tools: {
        header: Header,
        list: List,
        delimiter: Delimiter,
        sImage: {
            class: SimpleImage,
            inlineToolbar: true
        },
        image: {
            class: ImageTool,
            config: {
                uploader: {
                    /**
                    * Upload file to the server and return an uploaded image data
                    * @param {File} file - file selected from the device or pasted by drag-n-drop
                    * @return {Promise.<{success, file: {url}}>}
                    */
                    uploadByFile(file) {
                        return ImageUpload(file).then((result) => {
                            return result;
                        })
                    },
                    uploadByUrl(url) {
                        return new Promise((resolve) => {
                            resolve({
                                success: 1,
                                file: {
                                    url: url
                                }
                            })
                        });
                    }
                }
            }
        }
        // checklist: Checklist,
        // quote: Quote,
        // code: CodeTool
    }

});

// 入力内容を一時保存
const editorCheck = document.getElementById('editor')
addMultipleEventListener(editorCheck, "input paste", () => {
    editor.save().then((data) => {
        let title = ""
        let subTilte = ""
        let text = ""
        let img = ""
        let cnt = 0
        data.blocks.forEach(e => {
            // listいる？
            switch (e.type) {
                case "paragraph":
                    text += "<p>" + e.data.text + "</p>"
                    break;
                case "header":
                    let i = e.data.level
                    switch (i) {
                        case 2:
                            title = e.data.text
                            break;
                        case 3:
                            subTilte = e.data.text
                            break;
                        default:
                            text += `<h${i}>${e.data.text}</h${i}>`
                            break;
                    }
                    break;
                case "delimiter":
                    text += "<hr>"
                    break;
                // base64形式の場合、imgurにpostする
                case "image":
                    if (!e.data.file.url.match(new RegExp('data.*base64,'))) {
                        text += "$image" + cnt++
                        img += e.data.file.url + ','
                    }
                    break;
                case "sImage":
                    if (!e.data.url.match(new RegExp('data.*base64,'))) {
                        text += "$image" + cnt++
                        img += e.data.url + ','
                    }
                    break;
                default:
                    break;
            }
        })
        // console.log(text, img)
        localStorage.setItem('title', title)
        localStorage.setItem('subTitle', subTilte)
        localStorage.setItem('text', text)
        localStorage.setItem('image', img)
    })
})

// ボタンを押したら保存
const save = document.getElementById('save');
save.addEventListener('click', () => {
    editor.save().then((outputData) => {
        // ここでデータ形式を整えて送信
        outputData.blocks.forEach(element => {
            console.log(element)
        });
        $.ajax({
            method: 'POST',
            url: 'https://script.google.com/macros/s/AKfycbwmPFY303UqYqixiT7OwECIIfmbYhiVGjJ4zwZ62bw_Q_lp1PE/exec',
            data: {
                title: localStorage.getItem("title"),
                subTitle: localStorage.getItem("subTitle"),
                text: localStorage.getItem("text"),
                image: localStorage.getItem("image"),
            },
            dataType: 'jsonp',
            jsonp: 'jsoncallback',
            jsonpCallback: 'displayData',
            crossDomain: true,
        })
    }).catch((error) => {
        console.log('Saving failed: ', error)
    });
});
function displayData(data) {
    console.log(data)
}

// 画像をbase64に変換
function toBase64Url(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        var reader = new FileReader();
        reader.onloadend = function () {
            callback(reader.result);
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
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
                method: 'POST',
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

const uploadByBase64 = (base64) => {

}

// ページを離れる前に警告
$(function () {
    $(window).on('beforeunload', function () {
        return "このページを離れると、入力したデータが削除されます。修正の場合には、「修正ボタン」をクリックしてください。";
    });
});