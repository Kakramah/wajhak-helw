#!/usr/bin/env python3
"""ينزّل الخطوط المحلية (رخصة OFL) إلى fonts/. الملفات خارج git بحكم .gitignore في البيت."""
import re, urllib.request, pathlib
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
css = urllib.request.urlopen(urllib.request.Request(
    'https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Noto+Naskh+Arabic:wght@400..700&display=swap',
    headers={'User-Agent': UA}), timeout=30).read().decode()
want = {('arabic', 'Aref Ruqaa', '400'): 'aref-ruqaa-400.woff2', ('arabic', 'Aref Ruqaa', '700'): 'aref-ruqaa-700.woff2',
        ('arabic', 'Noto Naskh Arabic', '400-700'): 'noto-naskh-arabic.woff2'}
out = pathlib.Path(__file__).parent / 'fonts'; out.mkdir(exist_ok=True)
for name, b in re.findall(r'/\* (\w[\w-]*) \*/\s*@font-face \{(.*?)\}', css, re.S):
    fam = re.search(r"font-family: '([^']+)'", b).group(1)
    w = re.search(r'font-weight: ([\d ]+)', b).group(1).strip().replace(' ', '-')
    if (name, fam, w) in want:
        (out / want[(name, fam, w)]).write_bytes(urllib.request.urlopen(re.search(r'url\((.*?)\)', b).group(1), timeout=30).read())
        print('✓', want[(name, fam, w)])
