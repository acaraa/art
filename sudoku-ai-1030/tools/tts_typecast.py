"""Typecast TTS → vo/<id>.wav (48 kHz mono, silence trimmed) + vo/dur.json.
The session proxy injects the API key for api.typecast.ai; set TYPECAST_API_KEY to call it elsewhere.
Takes are cached: delete vo/<id>.wav to regenerate a line.
Run: python tools/tts_typecast.py [--voice tc_...] [--tempo 1.05]"""
import argparse, json, os, subprocess, sys, urllib.request
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VO = os.path.join(HERE, 'vo')
ap = argparse.ArgumentParser()
ap.add_argument('--voice', default='tc_6731b2b2478a48710ecc9158')   # Jinhee (Korean announcer)
ap.add_argument('--tempo', type=float, default=1.05)
a = ap.parse_args()
lines = json.load(open(os.path.join(VO, 'lines.json')))
dur = {}
for L in lines:
    out = os.path.join(VO, L['id'] + '.wav')
    if not os.path.exists(out):
        body = {'voice_id': L.get('voice', a.voice), 'text': L.get('say', L['text']), 'model': 'ssfm-v30', 'language': 'kor',
                'prompt': {'emotion_preset': 'normal'}, 'output': {'audio_format': 'wav', 'audio_tempo': L.get('tempo', a.tempo)}}
        req = urllib.request.Request('https://api.typecast.ai/v1/text-to-speech', json.dumps(body).encode(),
                                     {'Content-Type': 'application/json', 'X-API-KEY': os.environ.get('TYPECAST_API_KEY', 'proxy-injected')})
        raw = out + '.raw.wav'
        with urllib.request.urlopen(req, timeout=120) as r, open(raw, 'wb') as f: f.write(r.read())
        # trim leading/trailing silence, resample to 48 kHz mono
        af = 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', af, '-ar', '48000', '-ac', '1', out], check=True)
        os.remove(raw)
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], capture_output=True, text=True).stdout)
    dur[L['id']] = round(d, 3); print(f"{L['id']}: {d:.2f}s  {L['text']}")
json.dump(dur, open(os.path.join(VO, 'dur.json'), 'w'), indent=1)
