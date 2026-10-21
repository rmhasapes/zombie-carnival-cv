"""Local game launcher. Python 3 only; no additional packages required."""
import argparse
import json
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import sys
import webbrowser

ROOT = Path(__file__).resolve().parent
BUILD = '0.6.0'
REQUIRED = ['cv-lab.html','cv/math.js','cv/kalman.js','cv/detector.js','cv/calibration.js','cv/tracker.js','cv/worker.js','cv/capture.js','cv/game-adapter.js','cv/lab.js','cv/lab.css','index.html','boot.js','app.js','game.js','core.js','perspective.js','tracker.js',
            'vendor/phaser.min.js','vendor/tracking.min.js','vendor/maptastic.js',
            'rig.js','assets/carnival-muted.png','assets/rig-frames.json','assets/detailed-cover.png','assets/prop-frames.json','assets/audio/music/creepy-ambient-loop.ogg','assets/audio/sfx/zombie-rise.wav','assets/audio/sfx/zombie-hit.wav','assets/audio/sfx/zombie-scare.wav','assets/audio/sfx/zombie-snarl.wav'] + [f'assets/rig-muted-{i}.png' for i in range(6)]

def validate_package():
    missing = [name for name in REQUIRED if not (ROOT / name).is_file()]
    if missing:
        raise RuntimeError('Incomplete game folder. Extract the whole ZIP, then launch server.py from that extracted folder. Missing: ' + ', '.join(missing))
    for name in ['assets/rig-frames.json','assets/prop-frames.json']:
        json.loads((ROOT / name).read_text())

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def guess_type(self,path):
        suffix=Path(path).suffix.lower()
        return {'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.png':'image/png'}.get(suffix) or super().guess_type(path)
    def end_headers(self):
        self.send_header('Cache-Control','no-store, max-age=0')
        self.send_header('Permissions-Policy','camera=(self), microphone=()')
        super().end_headers()
    def do_GET(self):
        if self.path.split('?')[0]=='/health.json':
            body=json.dumps({'build':BUILD,'ready':True,'asset_count':sum(name.startswith('assets/') for name in REQUIRED)}).encode()
            self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        else:super().do_GET()

def make_server(port=None):
    ports=[port] if port is not None else range(8765,8800)
    last_error=None
    for candidate in ports:
        try:return ThreadingHTTPServer(('127.0.0.1',candidate),Handler)
        except OSError as error:
            last_error=error
            if error.errno not in (48,98,10048):raise
    raise RuntimeError('No available local port. Stop the older server or use --port with another port.') from last_error

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=None,help='Explicit port; otherwise use the first available port from 8765.')
    parser.add_argument('--no-browser',action='store_true')
    args=parser.parse_args()
    try:
        validate_package();server=make_server(args.port)
    except (RuntimeError,OSError,ValueError) as error:
        print('STARTUP ERROR: '+str(error),file=sys.stderr,flush=True);sys.exit(1)
    url=f'http://127.0.0.1:{server.server_port}/?build={BUILD}'
    print(f'Zombie Carnival build {BUILD}\nGame folder: {ROOT}\nOpen THIS address: {url}\nKeep this terminal open. Press Control+C to stop.',flush=True)
    if not args.no_browser:webbrowser.open(url)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
