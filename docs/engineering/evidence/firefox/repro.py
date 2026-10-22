import base64, json, os, pathlib, shutil, socket, subprocess, tempfile, time, sys, re

FF = pathlib.Path(os.environ.get('OREUI_FIREFOX', r'C:\Program Files\Firefox Developer Edition\firefox.exe'))
REPO = pathlib.Path(os.environ.get('OREUI_REPO', pathlib.Path.cwd()))
COMMIT = os.environ.get('OREUI_COMMIT', 'unknown')
PORT = int(os.environ.get('OREUI_MARIONETTE_PORT', '2828'))
TMP = pathlib.Path(tempfile.mkdtemp(prefix='oreui-firefox-interaction-'))
PROFILE = TMP / 'profile'
PROFILE.mkdir()
FIXTURE = TMP / 'fixture.html'
RAW = TMP / 'marionette-raw.jsonl'
RESULT = TMP / 'interaction-result.json'
CSS = (REPO / 'dist' / 'styles.css').as_uri()
MOD = (REPO / 'dist' / 'components' / 'scrollbar' / 'scrollbar.js').as_uri()

html = '''<!doctype html><meta charset="utf-8"><title>OreUI Firefox interaction fixture</title>
<link rel="stylesheet" href="__CSS__">
<style>html,body{margin:0;padding:0;background:#222} #box{display:block;box-sizing:border-box;width:180px;height:90px;margin:5px;overflow:auto;scroll-behavior:auto} #content{width:500px;height:400px;background:linear-gradient(135deg,#345,#789)} .probe{height:10px}</style>
<div id="box" class="ore-scrollbar" tabindex="0"><div id="content"><div class="probe"></div></div></div>
<script type="module">import {initScrollbar,destroyScrollbar} from '{MOD}';
const box=document.querySelector('#box'); window.__scrollEvents=0; window.__pointerTrace=[]; box.addEventListener('scroll',()=>window.__scrollEvents++); for (const type of ['pointerdown','pointermove','pointerup','gotpointercapture','lostpointercapture']) box.addEventListener(type,e=>window.__pointerTrace.push({type,target:e.target.className||e.target.id||e.target.tagName,pointerId:e.pointerId,captured:e.target.hasPointerCapture?.(e.pointerId)||false,client:[e.clientX,e.clientY]}),true);
window.__ready=true; window.__init=()=>initScrollbar(box); window.__destroy=()=>destroyScrollbar(box);
window.__measure=(label)=>{ const q=s=>{ const r=s.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}; }; const d=t=>t?{hidden:t.hidden,rect:q(t),thumb:t.firstElementChild?{rect:q(t.firstElementChild),css:[t.firstElementChild.style.width,t.firstElementChild.style.height,t.firstElementChild.style.transform]}:null}:null; const vt=box.querySelector('.ore-scrollbar-track-vertical'),ht=box.querySelector('.ore-scrollbar-track-horizontal'); return {label,initialized:box.dataset.oreInitialized||null,client:[box.clientWidth,box.clientHeight],scrollSize:[box.scrollWidth,box.scrollHeight],scroll:[box.scrollLeft,box.scrollTop],events:window.__scrollEvents,behavior:getComputedStyle(box).scrollBehavior,width:getComputedStyle(box).scrollbarWidth,color:getComputedStyle(box).scrollbarColor,tracks:{vertical:d(vt),horizontal:d(ht)}}; };
window.__init();</script>'''
html = html.replace('__CSS__',CSS).replace('{MOD}',MOD)
FIXTURE.write_text(html, encoding='utf-8')
# Validate the inline module JavaScript before launching Firefox.
script_text = html.split('<script type="module">',1)[1].split('</script>',1)[0]
script_text = re.sub(r'^import .*?;\s*', '', script_text, count=1)
check = subprocess.run(['node','--check','--input-type=module'], input=script_text, text=True, capture_output=True)
if check.returncode:
    raise RuntimeError('fixture Node --check failed: '+check.stderr)
NODE_CHECK = check.stdout + check.stderr
# Keep a directly rerunnable copy beside all evidence.
shutil.copy2(__file__, TMP / 'repro.py')


def recv_exact(sock, n):
    out=b''
    while len(out)<n:
        part=sock.recv(n-len(out))
        if not part: raise RuntimeError('EOF while reading Marionette packet')
        out += part
    return out

def recv_packet(sock):
    head=b''
    while not head.endswith(b':'):
        head += recv_exact(sock, 1)
    return json.loads(recv_exact(sock, int(head[:-1])).decode())

def send_packet(sock, packet):
    data=json.dumps(packet,separators=(',',':')).encode()
    sock.sendall(str(len(data)).encode()+b':'+data)

p = subprocess.Popen([FF,'--headless','--no-remote','--new-instance','--profile',str(PROFILE),'--marionette','--marionette-port',str(PORT),'--width','800','--height','600'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
sock=None; rawf=RAW.open('w',encoding='utf-8'); records=[]

def record(kind, packet):
    rawf.write(json.dumps({'type':kind,'packet':packet},separators=(',',':'))+'\n'); rawf.flush()

def cmd(reqid,name,params):
    packet=[0,reqid,name,params]; record('command',packet); send_packet(sock,packet)
    response=recv_packet(sock); record('response',response); records.append({'id':reqid,'command':name,'response':response})
    if response[0]==1 and isinstance(response[3],dict) and response[3].get('error'):
        raise RuntimeError(f'{name}: {response[3]}')
    return response[3]

def script(reqid, source):
    return cmd(reqid,'WebDriver:ExecuteScript',{'script':source,'args':[]})['value']

def screenshot(reqid, name):
    val=cmd(reqid,'WebDriver:TakeScreenshot',{})['value']
    path=TMP/name; path.write_bytes(base64.b64decode(val)); return str(path)

result={'commit':COMMIT,'firefoxBinaryVersion':'159.0b5','nodeSyntaxCheck':'passed','tmp':str(TMP),'fixture':str(FIXTURE),'profile':str(PROFILE),'screenshots':{},'steps':[]}
req=1
try:
    deadline=time.time()+15
    while time.time()<deadline:
        try: sock=socket.create_connection(('127.0.0.1',PORT),timeout=1); break
        except OSError: time.sleep(.2)
    if sock is None: raise RuntimeError('Marionette port 2828 unavailable')
    sock.settimeout(3); result['greeting']=sock.recv(4096).decode(); sock.settimeout(15)
    new=cmd(req,'WebDriver:NewSession',{'capabilities':{'alwaysMatch':{'browserName':'firefox','moz:headless':True}}}); req+=1
    result['session']=new
    sid=new['sessionId']
    cmd(req,'WebDriver:Navigate',{'url':FIXTURE.as_uri()}); req+=1
    time.sleep(.5)
    for _ in range(20):
        if script(req,'return window.__ready===true'): req+=1; break
        req+=1; time.sleep(.1)
    result['steps'].append({'name':'initial','measure':script(req,'return window.__measure("initial")')}); req+=1
    result['screenshots']['initial']=screenshot(req,'initial.png'); req+=1

    # Short viewport clamp: both dimensions 20px while content remains overflowing.
    script(req,'const b=document.querySelector("#box"); b.style.width="20px"; b.style.height="20px"; b.scrollTo(0,0); window.__init(); return true'); req+=1; time.sleep(.3)
    result['steps'].append({'name':'clamp-20x20','measure':script(req,'return window.__measure("clamp-20x20")')}); req+=1
    result['screenshots']['clamp-20x20']=screenshot(req,'clamp-20x20.png'); req+=1

    # Restore normal viewport and test midpoint/end transforms with scroll events.
    script(req,'const b=document.querySelector("#box"); b.style.width="180px"; b.style.height="90px"; b.style.scrollBehavior="auto"; b.scrollTo(0,0); window.__init(); return true'); req+=1; time.sleep(.3)
    result['steps'].append({'name':'normal-restored','measure':script(req,'return window.__measure("normal-restored")')}); req+=1
    for label, js in [('midpoint','const b=document.querySelector("#box"); b.scrollTo((b.scrollWidth-b.clientWidth)/2,(b.scrollHeight-b.clientHeight)/2); return true'),('end','const b=document.querySelector("#box"); b.scrollTo(b.scrollWidth,b.scrollHeight); return true')]:
        script(req,js); req+=1; time.sleep(.35)
        result['steps'].append({'name':'scroll-'+label,'measure':script(req,f'return window.__measure("scroll-{label}")')}); req+=1
        result['screenshots']['scroll-'+label]=screenshot(req,'scroll-'+label+'.png'); req+=1

    # Real WebDriver End/Home keys against the host element.
    elem=cmd(req,'WebDriver:FindElement',{'using':'css selector','value':'#box'})['value']; req+=1
    script(req,'document.querySelector("#box").focus(); return true'); req+=1
    key_status={}
    for label,key,start in [('End','\ue010',[0,0]),('Home','\ue011',[320,310])]:
        try:
            script(req,f'document.querySelector("#box").scrollTo({start[0]},{start[1]}); document.querySelector("#box").focus(); return true'); req+=1; time.sleep(.3)
            before=script(req,f'return window.__measure("key-{label}-before")'); req+=1
            cmd(req,'WebDriver:ElementSendKeys',{'id':elem['element-6066-11e4-a52e-4f735466cecf'],'text':key}); req+=1; time.sleep(.35)
            after=script(req,f'return window.__measure("key-{label}-after")'); req+=1
            posChanged=before['scroll'] != after['scroll']
            expectedTop = after['scrollSize'][1] - after['client'][1] if label == 'End' else 0
            reached = after['scroll'][1] == expectedTop and after['scroll'][0] == before['scroll'][0]
            key_status[label]={'ok':True,'before':before,'after':after,'scrollChanged':posChanged,'reachedExpectedEndpoint':reached}
            result['screenshots']['key-'+label]=screenshot(req,'key-'+label+'.png'); req+=1
        except Exception as ex:
            key_status[label]={'ok':False,'error':str(ex)}
    result['steps'].append({'name':'webdriver-keys','results':key_status})

    # Send mouse drags from measured thumb centers and retain event/capture traces.
    def pointer_drag(axis, dx, dy):
        thumb_css='.ore-scrollbar-thumb-vertical' if axis=='vertical' else '.ore-scrollbar-thumb-horizontal'
        script(req,f'document.querySelector("#box").scrollTo(0,0); return true')
        before=script(req+1,f'const t=document.querySelector("{thumb_css}").getBoundingClientRect(); return {{x:t.x,y:t.y,width:t.width,height:t.height}}')
        center=[before['x']+before['width']/2,before['y']+before['height']/2]
        hit=script(req+2,f'const e=document.elementFromPoint({center[0]},{center[1]}); return {{class:e?.className||null,match:e===document.querySelector("{thumb_css}")}}')
        trace_before=script(req+3,'return window.__pointerTrace.length')
        target=[center[0]+dx,center[1]+dy]
        actions=[{'type':'pointer','id':'mouse-'+axis,'parameters':{'pointerType':'mouse'},'actions':[{'type':'pointerMove','origin':'viewport','x':center[0],'y':center[1],'duration':0},{'type':'pointerDown','button':0},{'type':'pointerMove','origin':'viewport','x':target[0],'y':target[1],'duration':150},{'type':'pointerUp','button':0}]}]
        cmd(req+4,'WebDriver:PerformActions',{'actions':actions})
        time.sleep(.35)
        measure=script(req+5,f'return window.__measure("pointer-drag-{axis}")')
        trace=script(req+6,f'return window.__pointerTrace.slice({trace_before})')
        return {'center':center,'target':target,'elementFromPoint':hit,'measure':measure,'events':trace,'scrollChanged':measure['scroll'] != [0,0]}
    for axis,dx,dy in [('vertical',0,40),('horizontal',50,0)]:
        try:
            drag_result=pointer_drag(axis,dx,dy); result['steps'].append({'name':'pointer-drag-'+axis,'ok':drag_result['scrollChanged'],'result':drag_result})
            result['screenshots']['pointer-drag-'+axis]=screenshot(req+7,'pointer-drag-'+axis+'.png')
        except Exception as ex:
            result['steps'].append({'name':'pointer-drag-'+axis,'ok':False,'error':str(ex)})
        req+=8

    # Destroy verifies native fallback, then reinit verifies custom overlay can be restored.
    script(req,'window.__destroy(); return true'); req+=1; time.sleep(.15)
    result['steps'].append({'name':'destroy-native-fallback','measure':script(req,'return window.__measure("destroy-native-fallback")')}); req+=1
    result['screenshots']['destroy-native-fallback']=screenshot(req,'destroy-native-fallback.png'); req+=1
    script(req,'window.__init(); return true'); req+=1; time.sleep(.3)
    result['steps'].append({'name':'reinit','measure':script(req,'return window.__measure("reinit")')}); req+=1
    result['screenshots']['reinit']=screenshot(req,'reinit.png'); req+=1
    cmd(req,'WebDriver:DeleteSession',{}); req+=1
except Exception as ex:
    result['error']=repr(ex)
finally:
    rawf.close()
    if sock: sock.close()
    try: p.terminate(); p.wait(timeout=5)
    except Exception:
        try: p.kill(); p.wait(timeout=5)
        except Exception: pass
RESULT.write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({'tmp':str(TMP),'result':str(RESULT),'raw':str(RAW),'pid':p.pid},indent=2))
