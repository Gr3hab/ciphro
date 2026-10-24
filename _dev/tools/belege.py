#!/usr/bin/env python3
"""Belegsuche für die Redaktion: lädt Wikipedia-Artikel (Klartext) und zeigt die Sätze, die zu Suchmustern passen.

Aufruf:  python3 tools/belege.py spec.json [--out belege.json]
spec.json: { "n001": [["en", "Sloth", ["breath", "40 minutes"]], ["de", "Faultiere", ["Luft", "Minuten"]]], ... }

Die Artikel werden in _dev/.cache/ zwischengespeichert. Ausgabe: je Fakt die gefundenen Sätze mit Adresse.
Das Werkzeug erfindet nichts: Es zeigt nur, was tatsächlich im Artikel steht. Die Bewertung macht ein Mensch.
"""
import json, os, random, re, sys, time, urllib.error, urllib.parse, urllib.request

UA = 'NUMIGMA-Faktencheck/1.0 (https://github.com/Gr3hab/numfact)'
CACHE = os.path.join(os.path.dirname(__file__), '..', '.cache', 'wiki')
os.makedirs(CACHE, exist_ok=True)


def fetch(lang, title):
    key = re.sub(r'[^\w-]+', '_', f'{lang}_{title}')[:150]
    path = os.path.join(CACHE, key + '.json')
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    q = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'prop': 'extracts|info', 'inprop': 'url',
                                'explaintext': 1, 'redirects': 1, 'titles': title})
    url = f'https://{lang}.wikipedia.org/w/api.php?{q}'
    # Wikipedia begrenzt die Zahl der Anfragen: bei 429 geduldig warten und nochmal versuchen
    for attempt in range(10):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30) as r:
                data = json.load(r)
            break
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 9:
                raise
            wait = int(e.headers.get('retry-after') or 2)
            time.sleep(wait + 2 * attempt + random.random() * 2)
        except Exception:  # noqa: BLE001
            if attempt == 9:
                raise
            time.sleep(3 + attempt)
    page = next(iter(data['query']['pages'].values()))
    out = {'title': page.get('title', title), 'url': page.get('fullurl', ''), 'text': page.get('extract', ''), 'missing': 'missing' in page}
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False)
    time.sleep(1.5)
    return out


def sentences(text):
    text = re.sub(r'\s+', ' ', text)
    return re.split(r'(?<=[.!?])\s+(?=[A-ZÄÖÜ0-9"„(])', text)


def main():
    spec = json.load(open(sys.argv[1], encoding='utf-8'))
    out_path = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else None
    result = {}
    for fid, items in spec.items():
        result[fid] = []
        for lang, title, pats in items:
            a = fetch(lang, title)
            if a['missing'] or not a['text']:
                result[fid].append({'lang': lang, 'title': title, 'url': '', 'hits': [], 'missing': True})
                continue
            hits = []
            for s in sentences(a['text']):
                if any(re.search(p, s, re.I) for p in pats):
                    hits.append(s.strip()[:360])
            result[fid].append({'lang': lang, 'title': a['title'], 'url': a['url'], 'hits': hits[:5]})
    if out_path:
        old = json.load(open(out_path, encoding='utf-8')) if os.path.exists(out_path) else {}
        old.update(result)
        json.dump(old, open(out_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for fid, rows in result.items():
        print(f'=== {fid}')
        for r in rows:
            print(f"  [{r['lang']}] {r['title']} {r['url']}" + ('  (FEHLT)' if r.get('missing') else ''))
            for h in r['hits']:
                print('     · ' + h)


if __name__ == '__main__':
    main()
