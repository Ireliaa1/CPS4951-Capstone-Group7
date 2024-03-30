from flask import Flask, request, jsonify
from flask_cors import CORS
from aip import AipSpeech
import subprocess
import io
from pydub import AudioSegment
import wave

# pip install chardet
# pip install Flask baidu-aip pydub
# pip install flask-cors

app = Flask(__name__)
CORS(app)

# Configuring the Baidu Speech Recognition API
APP_ID = '58902875'
API_KEY = 'QVowgInd9Zf3jdeEifI1qLdi'
SECRET_KEY = 'PKUg0EAuOd5XEUPbjZTimMC9s8kAxdZ5'
aipSpeech = AipSpeech(APP_ID, API_KEY, SECRET_KEY)

def convert_to_wav(audio_content):
    print("Converting to WAV (PCM_S16LE) format...")
    # Convert audio content to WAV format
    audio = AudioSegment.from_file(io.BytesIO(audio_content))
    
    # Set parameters for PCM_S16LE format
    sample_width = 2  # 16-bit
    channels = 1  # Mono
    frame_rate = 16000  # 16000 Hz
    
    # Export audio to temporary WAV file
    temp_wav_file = io.BytesIO()
    audio.export(temp_wav_file, format="wav")
    
    # Convert temporary WAV file to PCM_S16LE format using FFmpeg
    ffmpeg_command = ['ffmpeg', '-i', '-', '-f', 'wav', '-acodec', 'pcm_s16le', '-ac', '1', '-ar', '16000', '-']
    ffmpeg_process = subprocess.Popen(ffmpeg_command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    ffmpeg_output, ffmpeg_error = ffmpeg_process.communicate(input=temp_wav_file.getvalue())
    
    if ffmpeg_process.returncode != 0:
        raise RuntimeError(f"FFmpeg process returned non-zero exit status: {ffmpeg_process.returncode}. Error message: {ffmpeg_error.decode('utf-8')}")
    
    print("Conversion to WAV (PCM_S16LE) format complete.")
    return ffmpeg_output

@app.route('/speech-to-text', methods=['POST'])
def speech_to_text():
    try:
        if 'audio' not in request.files:
            print("No audio file uploaded.")
            return jsonify({'success': False, 'error': 'No audio file uploaded'})
        
        # Get the uploaded audio file
        audio_file = request.files['audio']
        audio_content = audio_file.read()

        # Convert audio to WAV format
        wav_content = convert_to_wav(audio_content)

        print("Sending audio content to Baidu Speech Recognition API...")
        result = aipSpeech.asr(wav_content, 'wav', 16000, {
            'lan': 'zh', 
            'dev_pid': 1537   # Set the language type to Mandarin
        })
        print("Response received from Baidu Speech Recognition API.")
        
        if 'result' in result:
            text = result['result'][0]
            return jsonify({
                'success': True,
                'err_no': result.get('err_no', 0),
                'err_msg': result.get('err_msg', 'success.'),
                'corpus_no': result.get('corpus_no', ''),
                'sn': result.get('sn', ''),
                'text': text
            })
        else:
            return jsonify({
                'success': False,
                'err_no': result.get('err_no', 2000),
                'err_msg': result.get('err_msg', 'Unknown error'),
                'corpus_no': result.get('corpus_no', ''),
                'sn': result.get('sn', '')
            })
    except Exception as e:
        print("An error occurred:", str(e))
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
