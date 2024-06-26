var mediaRecorder;
var chunks = [];

document.getElementById('startRecording').addEventListener('click', startRecording);
document.getElementById('stopRecording').addEventListener('click', stopRecording);
document.getElementById('recognize').addEventListener('click', recognize);
document.getElementById('upload').addEventListener('click', uploadFile);

function startRecording() {
    var constraints = {
        audio: {
            sampleRate: 16000, // 设置采样率为16k
            sampleSize: 16,    // 设置采样位数为16位
            channelCount: 1    // 设置为单声道
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = function(e) {
                chunks.push(e.data);
            };
            mediaRecorder.onstop = function() {
                var blob = new Blob(chunks, { type: 'audio/mpeg' });
                var url = URL.createObjectURL(blob);
                var audio = new Audio(url);
                audio.controls = true;
                document.getElementById('recordingsList').appendChild(audio);
                document.getElementById('recognize').disabled = false;
            };
            mediaRecorder.start();
            document.getElementById('startRecording').disabled = true;
            document.getElementById('stopRecording').disabled = false;
        })
        .catch(function(err) {
            console.error('录音失败：', err);
        });
}

function stopRecording() {
    mediaRecorder.stop();
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').disabled = true;
}

function recognize() {
    var audioBlob = chunks.length ? new Blob(chunks, { type: 'audio/mpeg' }) : null;
    if (!audioBlob) {
        console.error('没有录制的音频文件！');
        return;
    }

    sendToBackend(audioBlob);
}

function sendToBackend(audioBlob) {
    var formData = new FormData();
    formData.append('audio', audioBlob);

    fetch('http://127.0.0.1:5000/speech-to-text', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        var recognitionResultElement = document.getElementById('recognitionResult');
        if (data.success) {
            console.log('识别成功：', data.text);
            recognitionResultElement.textContent = `识别成功：${data.text}`;
            console.log('错误编号：', data.err_no);
            console.log('错误信息：', data.err_msg);
            console.log('corpus_no：', data.corpus_no);
            console.log('sn：', data.sn);
        } else {
            console.error('识别失败：', data.error);
            recognitionResultElement.textContent = `识别失败：${data.error}`;
        }
    })
    .catch(error => {
        console.error('请求失败：', error);
        document.getElementById('recognitionResult').textContent = `请求失败：${error}`;
    });
}

function uploadFile() {
    var fileInput = document.getElementById('fileInput');
    var file = fileInput.files[0];
    if (!file) {
        console.error('请选择要上传的文件！');
        return;
    }

    var formData = new FormData();
    formData.append('audio', file);

    fetch('http://127.0.0.1:5000/speech-to-text', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        var recognitionResultElement = document.getElementById('recognitionResult');
        if (data.success) {
            console.log('识别成功：', data.text);
            recognitionResultElement.textContent = `识别成功：${data.text}`;
            console.log('错误编号：', data.err_no);
            console.log('错误信息：', data.err_msg);
            console.log('corpus_no：', data.corpus_no);
            console.log('sn：', data.sn);
        } else {
            console.error('识别失败：', data.error);
            recognitionResultElement.textContent = `识别失败：${data.error}`;
        }
    })
    .catch(error => {
        console.error('请求失败：', error);
        document.getElementById('recognitionResult').textContent = `请求失败：${error}`;
    });
}
