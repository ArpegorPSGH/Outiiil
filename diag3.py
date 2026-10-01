import json, os, zipfile, urllib.request, tempfile

api_url = 'https://api.github.com/repos/ArpegorPSGH/Outiiil/releases/latest'
req = urllib.request.Request(api_url, headers={'Accept': 'application/vnd.github+json', 'User-Agent': 'release.py'})
with urllib.request.urlopen(req, timeout=30) as resp:
    data = json.loads(resp.read().decode('utf-8'))

zip_url = None
for asset in data.get('assets', []) or []:
    if asset.get('name', '').endswith('.zip'):
        zip_url = asset.get('browser_download_url')
        break
print('zip_url:', zip_url)

with tempfile.TemporaryDirectory() as temp_dir:
    zip_path = os.path.join(temp_dir, 'release.zip')
    req = urllib.request.Request(zip_url, headers={'User-Agent': 'release.py'})
    with urllib.request.urlopen(req, timeout=60) as resp:
        with open(zip_path, 'wb') as f:
            f.write(resp.read())
    with zipfile.ZipFile(zip_path, 'r') as zf:
        for name in zf.namelist():
            if name.endswith('manifest.json'):
                remote_raw = zf.read(name)
                with open('manifest.json', 'rb') as f:
                    local_raw = f.read()
                remote = remote_raw.replace(b'3.27', b'0.0.0')
                local = local_raw.replace(b'3.27', b'0.0.0')
                remote = remote.replace(b'images/icons/', b'icons/')
                local = local.replace(b'images/icons/', b'icons/')
                local_obj = json.loads(local.decode('utf-8'))
                remote_obj = json.loads(remote.decode('utf-8'))
                local_norm = json.dumps(local_obj, sort_keys=True, ensure_ascii=False)
                remote_norm = json.dumps(remote_obj, sort_keys=True, ensure_ascii=False)
                print('Local len:', len(local_norm))
                print('Remote len:', len(remote_norm))
                if local_norm != remote_norm:
                    for i in range(min(len(local_norm), len(remote_norm))):
                        if local_norm[i] != remote_norm[i]:
                            print('First diff at char', i)
                            print('  local =', repr(local_norm[i]))
                            print('  remote =', repr(remote_norm[i]))
                            print('  local ctx:', repr(local_norm[max(0,i-60):i+60]))
                            print('  remote ctx:', repr(remote_norm[max(0,i-60):i+60]))
                            break
                    else:
                        print('Length diff only')
                else:
                    print('IDENTICAL')