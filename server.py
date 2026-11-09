import urllib.request
import urllib.parse
import urllib.error
from http.server import ThreadingHTTPServer as HTTPServer, SimpleHTTPRequestHandler
import sys
import os
import sqlite3
import hashlib
import secrets
import datetime
import json

PORT = 8080 if len(sys.argv) < 2 else int(sys.argv[1])
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'portfolio_users.db')

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS user_portfolios (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                data_json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        ''')
        conn.commit()

init_db()

def hash_password(password, salt_hex):
    return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt_hex), 100000).hex()

def make_empty_portfolio(name):
    return {
        "ver": 4,
        "activeAccount": "MAIN",
        "accounts": {
            "MAIN": {
                "id": "MAIN",
                "name": f"Portfolio {name}",
                "icon": "💼",
                "file": "",
                "inst": {},
                "tx": [],
                "dividends": [],
                "watch": ["ASML.AS", "NVDA", "AAPL"],
                "plan": {"sym": "", "amount": 0, "day": 1, "active": False},
                "alerts": []
            }
        },
        "inst": {},
        "tx": [],
        "dividends": [],
        "watch": ["ASML.AS", "NVDA", "AAPL"],
        "plan": {"sym": "", "amount": 0, "day": 1, "active": False},
        "alerts": [],
        "set": {"theme": "dark", "refresh": 30, "finnhub": "", "proxy": True, "hideEst": True}
    }

def verify_token(token):
    if not token:
        return None
    with get_db() as conn:
        c = conn.cursor()
        c.execute('''
            SELECT u.id, u.email, u.name, u.created_at, s.expires_at
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token = ?
        ''', (token,))
        row = c.fetchone()
        if not row:
            return None
        now_str = datetime.datetime.now().isoformat()
        if row['expires_at'] < now_str:
            c.execute('DELETE FROM sessions WHERE token = ?', (token,))
            conn.commit()
            return None
        return dict(row)


# ===== Yahoo Finance kalender (cookie + crumb nodig) =====
import http.cookiejar, time
_YH = {'opener': None, 'crumb': None, 'ts': 0}
_UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36'}
_CAL_CACHE = {}

def _yahoo_session(force=False):
    if not force and _YH['crumb'] and time.time() - _YH['ts'] < 3600:
        return _YH['opener'], _YH['crumb']
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    try:
        opener.open(urllib.request.Request('https://fc.yahoo.com', headers=_UA), timeout=5)
    except Exception:
        pass  # geeft vaak 404, maar zet wel de cookie
    crumb = opener.open(urllib.request.Request('https://query2.finance.yahoo.com/v1/test/getcrumb', headers=_UA), timeout=5).read().decode().strip()
    _YH.update(opener=opener, crumb=crumb, ts=time.time())
    return opener, crumb

def _ts_to_date(v):
    try:
        raw = v.get('raw') if isinstance(v, dict) else v
        if not raw:
            return None
        return datetime.datetime.utcfromtimestamp(int(raw)).strftime('%Y-%m-%d')
    except Exception:
        return None

def fetch_calendar(sym):
    hit = _CAL_CACHE.get(sym)
    if hit and time.time() - hit[0] < 6 * 3600:
        return hit[1]
    res = None
    for attempt in range(2):
        try:
            opener, crumb = _yahoo_session(force=attempt > 0)
            url = ('https://query2.finance.yahoo.com/v10/finance/quoteSummary/' + urllib.parse.quote(sym) +
                   '?modules=calendarEvents,summaryDetail,defaultKeyStatistics,price&crumb=' + urllib.parse.quote(crumb))
            j = json.loads(opener.open(urllib.request.Request(url, headers=_UA), timeout=10).read())
            r = (j.get('quoteSummary', {}).get('result') or [None])[0] or {}
            ce = r.get('calendarEvents', {}) or {}
            earn = ce.get('earnings', {}) or {}
            dates = [d for d in (_ts_to_date(x) for x in (earn.get('earningsDate') or [])) if d]
            ks = r.get('defaultKeyStatistics', {}) or {}
            ldv = ks.get('lastDividendValue')
            res = {
                'earningsDate': dates[0] if dates else None,
                'earningsEstimated': bool(earn.get('isEarningsDateEstimate')),
                'exDividendDate': _ts_to_date(ce.get('exDividendDate')),
                'dividendDate': _ts_to_date(ce.get('dividendDate')),
                'lastDividendValue': (ldv.get('raw') if isinstance(ldv, dict) else ldv),
                'currency': (r.get('price', {}) or {}).get('currency'),
            }
            break
        except Exception:
            res = None
    if res is not None:
        _CAL_CACHE[sym] = (time.time(), res)
    return res


# ===== Yahoo data voor de aandelenbekijker =====
_Q_CACHE = {}
def _yahoo_json(url):
    for attempt in range(2):
        try:
            opener, crumb = _yahoo_session(force=attempt > 0)
            sep = '&' if '?' in url else '?'
            full = url + sep + 'crumb=' + urllib.parse.quote(crumb)
            return json.loads(opener.open(urllib.request.Request(full, headers=_UA), timeout=12).read())
        except Exception as e:
            last = e
    raise last

def _cached(key, ttl, fn):
    hit = _Q_CACHE.get(key)
    if hit and time.time() - hit[0] < ttl:
        return hit[1]
    val = fn()
    _Q_CACHE[key] = (time.time(), val)
    return val

from concurrent.futures import ThreadPoolExecutor
_QFILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'quotes_cache.json')
try:
    with open(_QFILE, encoding='utf-8') as _f:
        _QDISK = json.load(_f)
except Exception:
    _QDISK = {}

def _quote_from_chart(sym):
    """Snelle fallback: de chart-API heeft geen cookie/crumb nodig."""
    try:
        url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + urllib.parse.quote(sym) + '?range=1y&interval=1d'
        j = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=_UA), timeout=6).read())
        r = j['chart']['result'][0]; m = r['meta']
        closes = [c for c in (r.get('indicators', {}).get('quote', [{}])[0].get('close') or []) if c is not None]
        price = m.get('regularMarketPrice'); prev = m.get('chartPreviousClose') or m.get('previousClose')
        if len(closes) >= 2:
            prev = closes[-2]
        q = {'symbol': sym, 'shortName': m.get('shortName'), 'longName': m.get('longName'),
             'currency': m.get('currency'), 'regularMarketPrice': price, 'quoteType': m.get('instrumentType')}
        if price and prev:
            q['regularMarketChangePercent'] = (price / prev - 1) * 100
        if price and closes:
            q['fiftyTwoWeekChangePercent'] = (price / closes[0] - 1) * 100
        return q
    except Exception:
        return None

def fetch_quotes(syms):
    key = 'q:' + ','.join(syms)
    hit = _Q_CACHE.get(key)
    if hit and time.time() - hit[0] < 60:
        return hit[1]
    out = {}
    # 1. Snelle route: v7 quote (inclusief marktwaarde, K/W, dividend), korte timeouts
    try:
        opener, crumb = _yahoo_session()
        for i in range(0, len(syms), 50):
            chunk = syms[i:i+50]
            url = ('https://query2.finance.yahoo.com/v7/finance/quote?symbols=' + urllib.parse.quote(','.join(chunk)) +
                   '&crumb=' + urllib.parse.quote(crumb))
            j = json.loads(opener.open(urllib.request.Request(url, headers=_UA), timeout=6).read())
            for q in j.get('quoteResponse', {}).get('result', []) or []:
                out[q['symbol']] = q
    except Exception as e:
        print('v7 quote mislukt, val terug op chart-API:', e)
    # 2. Ontbrekende symbolen parallel via de chart-API
    missing = [s for s in syms if s not in out]
    if missing:
        with ThreadPoolExecutor(max_workers=16) as ex:
            for q in ex.map(_quote_from_chart, missing):
                if q:
                    out[q['symbol']] = q
    # 3. Wat nu nog ontbreekt: laatst bekende waarde van schijf
    for s in syms:
        if s not in out and s in _QDISK:
            out[s] = dict(_QDISK[s], stale=True)
    res = [out[s] for s in syms if s in out]
    _Q_CACHE[key] = (time.time(), res)
    _QDISK.update({q['symbol']: q for q in res if not q.get('stale')})
    try:
        with open(_QFILE, 'w', encoding='utf-8') as f:
            json.dump(_QDISK, f)
    except Exception:
        pass
    return res

def cached_quotes(syms):
    return [_QDISK[s] for s in syms if s in _QDISK]

STOCK_MODULES = 'price,summaryDetail,defaultKeyStatistics,financialData,assetProfile,earnings,calendarEvents,incomeStatementHistoryQuarterly,fundProfile,topHoldings,recommendationTrend'
def fetch_stock(sym):
    def load():
        j = _yahoo_json('https://query2.finance.yahoo.com/v10/finance/quoteSummary/' + urllib.parse.quote(sym) + '?modules=' + STOCK_MODULES)
        return (j.get('quoteSummary', {}).get('result') or [None])[0]
    return _cached('s:' + sym, 3600, load)

def fetch_chart(sym, rng, interval):
    def load():
        return _yahoo_json('https://query2.finance.yahoo.com/v8/finance/chart/' + urllib.parse.quote(sym) +
                           '?range=' + rng + '&interval=' + interval + '&includePrePost=false')
    return _cached('c:%s:%s:%s' % (sym, rng, interval), 60 if rng in ('1d', '5d') else 1800, load)

class TrackerHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, X-Requested-With')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, status_code, data):
        payload = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def get_auth_token(self):
        auth_hdr = self.headers.get('Authorization', '')
        if auth_hdr.startswith('Bearer '):
            return auth_hdr[7:].strip()
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        return qs.get('token', [''])[0]

    def read_json_body(self):
        try:
            content_len = int(self.headers.get('Content-Length', 0))
            if content_len == 0:
                return {}
            raw = self.rfile.read(content_len).decode('utf-8')
            return json.loads(raw)
        except Exception:
            return {}

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        clean_path = parsed_url.path

        # 1. Yahoo Finance Proxy
        if self.path.startswith('/api/yahoo?url='):
            raw_url = self.path[len('/api/yahoo?url='):]
            target_url = urllib.parse.unquote(raw_url)
            host = urllib.parse.urlparse(target_url).hostname or ''
            if urllib.parse.urlparse(target_url).scheme != 'https' or not (host == 'finance.yahoo.com' or host.endswith('.finance.yahoo.com')):
                return self.send_json(403, {'error': 'Alleen Yahoo Finance-adressen zijn toegestaan.'})
            try:
                req = urllib.request.Request(
                    target_url,
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    content = resp.read()
                    self.send_response(resp.status)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(content)
            except urllib.error.HTTPError as e:
                try:
                    content = e.read()
                except Exception:
                    content = b'{"error":"Not Found"}'
                self.send_response(e.code)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                self.send_response(502)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(f"Proxy error: {e}".encode())
            return

        # Aandelenbekijker endpoints
        if clean_path in ('/api/quotes', '/api/stock', '/api/chart'):
            qs = urllib.parse.parse_qs(parsed_url.query)
            try:
                if clean_path == '/api/quotes':
                    syms = [s.strip() for s in qs.get('symbols', [''])[0].split(',') if s.strip()][:300]
                    if qs.get('cached', [''])[0] == '1':
                        return self.send_json(200, {'quotes': cached_quotes(syms)})
                    return self.send_json(200, {'quotes': fetch_quotes(syms)})
                sym = qs.get('symbol', [''])[0].strip()
                if not sym:
                    return self.send_json(400, {'error': 'symbol ontbreekt'})
                if clean_path == '/api/stock':
                    return self.send_json(200, {'data': fetch_stock(sym)})
                rng = qs.get('range', ['1y'])[0]
                interval = qs.get('interval', ['1d'])[0]
                return self.send_json(200, fetch_chart(sym, rng, interval))
            except Exception as e:
                return self.send_json(502, {'error': 'Yahoo niet bereikbaar: %s' % e})

        # Live kalender (/api/calendar?symbols=A,B)
        if clean_path == '/api/calendar':
            qs = urllib.parse.parse_qs(parsed_url.query)
            syms = [s.strip() for s in qs.get('symbols', [''])[0].split(',') if s.strip()][:40]
            out = {}
            for s in syms:
                c = fetch_calendar(s)
                if c:
                    out[s] = c
            return self.send_json(200, {'data': out})

        # 2. Auth: Current User Check (/api/auth/me)
        if clean_path == '/api/auth/me':
            token = self.get_auth_token()
            user = verify_token(token)
            if not user:
                return self.send_json(401, {'error': 'Niet ingelogd of sessie verlopen.'})
            return self.send_json(200, {
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['name'],
                    'created_at': user['created_at']
                }
            })

        # 3. Portfolio Data Fetch (/api/user/data)
        if clean_path == '/api/user/data':
            token = self.get_auth_token()
            user = verify_token(token)
            if not user:
                return self.send_json(401, {'error': 'Niet geautoriseerd.'})
            with get_db() as conn:
                c = conn.cursor()
                c.execute('SELECT data_json, updated_at FROM user_portfolios WHERE user_id = ?', (user['id'],))
                row = c.fetchone()
                if not row:
                    return self.send_json(200, {'portfolio': None, 'updated_at': None})
                try:
                    portfolio_data = json.loads(row['data_json'])
                except Exception:
                    portfolio_data = None
                return self.send_json(200, {'portfolio': portfolio_data, 'updated_at': row['updated_at']})

        # 4. User stats (/api/auth/stats)
        if clean_path == '/api/auth/stats':
            with get_db() as conn:
                c = conn.cursor()
                c.execute('SELECT COUNT(*) AS cnt FROM users')
                cnt = c.fetchone()['cnt']
                return self.send_json(200, {'total_users': cnt})

        # Static files: alleen de website zelf, nooit database, back-ups of broncode
        ext = os.path.splitext(clean_path)[1].lower()
        if clean_path not in ('/', '') and ext not in ('.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp', '.woff', '.woff2'):
            return self.send_json(404, {'error': 'Niet gevonden.'})
        if '/.' in clean_path:
            return self.send_json(404, {'error': 'Niet gevonden.'})
        if self.path in ('/', ''):
            if os.path.exists('index.html'):
                self.path = '/index.html'
            else:
                self.path = '/portfolio.html'
        else:
            # Case-insensitivity check voor Linux filesystems
            local_rel = clean_path.lstrip('/')
            if not os.path.exists(local_rel):
                parent_dir = os.path.dirname(local_rel) or '.'
                base_name = os.path.basename(local_rel).lower()
                if os.path.isdir(parent_dir):
                    for fname in os.listdir(parent_dir):
                        if fname.lower() == base_name:
                            self.path = '/' + (os.path.join(parent_dir, fname) if parent_dir != '.' else fname).replace('\\', '/')
                            break
        super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        clean_path = parsed_url.path
        body = self.read_json_body()

        # 1. Register (/api/auth/register)
        if clean_path == '/api/auth/register':
            email = str(body.get('email', '')).strip().lower()
            password = str(body.get('password', '')).strip()
            name = str(body.get('name', '')).strip()
            initial_data = body.get('initial_data')

            if not email or '@' not in email or '.' not in email:
                return self.send_json(400, {'error': 'Vul een geldig e-mailadres in.'})
            if len(password) < 6:
                return self.send_json(400, {'error': 'Het wachtwoord moet minimaal 6 tekens bevatten.'})
            if not name:
                name = email.split('@')[0].capitalize()

            salt = secrets.token_hex(16)
            pw_hash = hash_password(password, salt)
            now_iso = datetime.datetime.now().isoformat()

            with get_db() as conn:
                c = conn.cursor()
                try:
                    c.execute('''
                        INSERT INTO users (email, name, password_hash, salt, created_at)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (email, name, pw_hash, salt, now_iso))
                    user_id = c.lastrowid
                except sqlite3.IntegrityError:
                    return self.send_json(409, {'error': 'Dit e-mailadres is al in gebruik. Log in met je bestaande account.'})

                # Create session token (valid for 30 days)
                token = secrets.token_hex(32)
                expires = (datetime.datetime.now() + datetime.timedelta(days=30)).isoformat()
                c.execute('''
                    INSERT INTO sessions (token, user_id, created_at, expires_at)
                    VALUES (?, ?, ?, ?)
                ''', (token, user_id, now_iso, expires))

                # Save initial portfolio data (use supplied data or clean empty portfolio)
                portfolio_to_save = initial_data if initial_data else make_empty_portfolio(name)
                c.execute('''
                    INSERT INTO user_portfolios (user_id, data_json, updated_at)
                    VALUES (?, ?, ?)
                ''', (user_id, json.dumps(portfolio_to_save), now_iso))

                conn.commit()

            return self.send_json(201, {
                'token': token,
                'user': {
                    'id': user_id,
                    'email': email,
                    'name': name,
                    'created_at': now_iso
                }
            })

        # 2. Login (/api/auth/login)
        if clean_path == '/api/auth/login':
            email = str(body.get('email', '')).strip().lower()
            password = str(body.get('password', '')).strip()

            if not email or not password:
                return self.send_json(400, {'error': 'Vul e-mailadres en wachtwoord in.'})

            with get_db() as conn:
                c = conn.cursor()
                c.execute('SELECT * FROM users WHERE email = ?', (email,))
                user = c.fetchone()
                if not user:
                    return self.send_json(401, {'error': 'Ongeldig e-mailadres of wachtwoord.'})

                expected_hash = hash_password(password, user['salt'])
                if expected_hash != user['password_hash']:
                    return self.send_json(401, {'error': 'Ongeldig e-mailadres of wachtwoord.'})

                token = secrets.token_hex(32)
                now_iso = datetime.datetime.now().isoformat()
                expires = (datetime.datetime.now() + datetime.timedelta(days=30)).isoformat()
                c.execute('''
                    INSERT INTO sessions (token, user_id, created_at, expires_at)
                    VALUES (?, ?, ?, ?)
                ''', (token, user['id'], now_iso, expires))
                conn.commit()

            return self.send_json(200, {
                'token': token,
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'name': user['name'],
                    'created_at': user['created_at']
                }
            })

        # 3. Logout (/api/auth/logout)
        if clean_path == '/api/auth/logout':
            token = self.get_auth_token()
            if token:
                with get_db() as conn:
                    c = conn.cursor()
                    c.execute('DELETE FROM sessions WHERE token = ?', (token,))
                    conn.commit()
            return self.send_json(200, {'success': True})

        # 4. Save Portfolio Data (/api/user/data)
        if clean_path == '/api/user/data':
            token = self.get_auth_token()
            user = verify_token(token)
            if not user:
                return self.send_json(401, {'error': 'Niet geautoriseerd.'})

            portfolio = body.get('portfolio')
            if portfolio is None:
                return self.send_json(400, {'error': 'Geen portfolio data meegegeven.'})

            now_iso = datetime.datetime.now().isoformat()
            data_str = json.dumps(portfolio)

            with get_db() as conn:
                c = conn.cursor()
                c.execute('''
                    INSERT INTO user_portfolios (user_id, data_json, updated_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(user_id) DO UPDATE SET
                        data_json = excluded.data_json,
                        updated_at = excluded.updated_at
                ''', (user['id'], data_str, now_iso))
                conn.commit()

            return self.send_json(200, {'success': True, 'updated_at': now_iso})

        return self.send_json(404, {'error': 'Endpoint niet gevonden.'})


if __name__ == '__main__':
    print(f"==================================================")
    print(f" Northstar Multi-User Server (Auth & Database)")
    print(f" Database: {DB_FILE}")
    print(f" Open in je browser: http://localhost:{PORT}")
    print(f"==================================================")
    try:
        httpd = HTTPServer(('0.0.0.0', PORT), TrackerHandler)
    except OSError:
        print(f"\n!! Poort {PORT} is al in gebruik. Draait er nog een oude server? Stop die eerst (Ctrl+C).")
        sys.exit(1)
    httpd.serve_forever()