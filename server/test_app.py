import io
import json
import os
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

from server import app, store


class CourseApiTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        env = patch.dict(os.environ, {"MBA_DB": str(Path(tmp.name)/"test.sqlite3"),
                                     "MBA_ORIGIN": "https://127.0.0.1:9443"})
        env.start()
        self.addCleanup(env.stop)
        store.initialize()
        self.password = "contraseña de prueba local"
        self.token = "token_de_activacion_solo_para_pruebas"
        self.q = next(q for q in app.QUESTIONS.values() if q["type"] == "comprension")
        self.payload = {"mode": "eleccion", "text": "borrador anterior", "choice": self.q["options"][0], "revision": 0}
        self.url = "/api/drafts/" + self.q["id"]

    def req(self, verb, url, data=None, cookie="", **kw):
        wire = json.dumps(data or {}, ensure_ascii=False).encode()
        env = dict(PATH_INFO=url, REQUEST_METHOD=verb, CONTENT_TYPE="application/json",
                   CONTENT_LENGTH=str(len(wire)), HTTP_COOKIE=cookie, REMOTE_ADDR="127.0.0.1",
                   HTTP_ORIGIN=os.environ["MBA_ORIGIN"])
        env["wsgi.input"] = io.BytesIO(wire)
        env.update(kw)
        result = {}
        def reply(status, headers):
            result.update(status=int(status[:3]), headers=dict(headers))
        body = b"".join(app.application(env, reply))
        return result["status"], json.loads(body), result["headers"]

    def login(self, name):
        store.create_user(name, self.password)
        code, body, hdr = self.req("POST", "/api/login", dict(username=name,password=self.password))
        self.assertEqual((code,body),(200,{"user":name}))
        return hdr["Set-Cookie"].split(";")[0]

    def test_activation_only_once_and_never_log_in_with_temporary_password(self):
        store.create_user("lacuna", "admin", self.token)
        creds = {"username":"lacuna","password":"admin"}
        self.assertEqual(self.req("POST","/api/login",creds)[0],403)
        self.assertEqual(self.req("POST","/api/login",dict(creds,bootstrapToken="bad",newPassword=self.password))[0],403)
        self.assertEqual(self.req("POST","/api/login",dict(creds,bootstrapToken=self.token,newPassword="x"))[0],422)
        valid = dict(creds, bootstrapToken=self.token,newPassword=self.password)
        code, body, hdr = self.req("POST", "/api/login",valid)
        self.assertEqual((code,body),(200,{"user":"lacuna"}))
        self.assertIn("Secure",hdr["Set-Cookie"])
        self.assertIn("HttpOnly",hdr["Set-Cookie"])
        self.assertEqual(self.req("POST", "/api/login",valid)[0],401)
        self.assertEqual(self.req("POST", "/api/login",dict(creds,password=self.password))[0],200)
        with closing(store.connect()) as db:
            row=db.execute("SELECT activation_hash,password_hash FROM users").fetchone()
            self.assertIsNone(row["activation_hash"])
            self.assertNotEqual(row["password_hash"],self.password)

    def test_persist_isolate_and_bind_user(self):
        a=self.login("ana"); b=self.login("bea")
        self.assertEqual(self.req("PUT",self.url,self.payload,a,HTTP_X_MBA_USER="bea")[0],401)
        self.assertEqual(self.req("PUT",self.url,self.payload,a)[0:2],(200,{"revision":1}))
        self.assertEqual(self.req("PUT","/api/last",{"lastId":"1.0"},a)[0],200)
        self.assertEqual(self.req("GET","/api/state",cookie=b)[1],{"drafts":{},"lastId":""})
        state=self.req("GET","/api/state",cookie=a)[1]
        self.assertEqual(state["drafts"][self.q["id"]],dict(self.payload,revision=1))
        self.assertEqual(state["lastId"],"1.0")
        self.assertEqual(self.req("PUT",self.url,dict(self.payload,choice="inventada"),a)[0],422)
        self.assertEqual(self.req("PUT",self.url,dict(self.payload,text="y"*32001),a)[0],422)
        self.assertEqual(self.req("PUT",self.url,dict(self.payload,text="otra"),a,HTTP_ORIGIN="https://otro.test")[0],403)
        self.assertEqual(self.req("POST","/api/logout",{},a)[0],200)
        self.assertEqual(self.req("GET","/api/state",cookie=a)[0],401)
        self.assertEqual(self.req("GET","/api/session",cookie=a)[1],{"user":None})

    def test_stale_write_returns_winner_and_retry_is_idempotent(self):
        cookie=self.login("ana")
        def write(text):
            return self.req("PUT",self.url,dict(self.payload,text=text),cookie)
        with ThreadPoolExecutor(max_workers=2) as pool:
            replies=list(pool.map(write,("opción 1","opción 2")))
        self.assertEqual(sorted(result[0] for result in replies),[200,409])
        conflict=next(result[1]["draft"] for result in replies if result[0]==409)
        self.assertEqual(conflict["revision"],1)
        self.assertEqual(write(conflict["text"])[0:2],(200,{"revision":1}))
        self.assertEqual(self.req("PUT",self.url,dict(self.payload,text="",choice="",revision=1),cookie)[1],{"revision":2})
        self.assertEqual(self.req("GET","/api/state",cookie=cookie)[1]["drafts"][self.q["id"]]["choice"],"")

    def test_account_limit_applies_across_forwarded_ips(self):
        cookie=self.login("eva")
        with patch.object(store,"verify_password",return_value=False):
            for i in range(15):
                code,*_ = self.req("POST","/api/login",{"username":"eva","password":"error"},HTTP_X_REAL_IP="10.0.0."+str(i))
                self.assertEqual(code,401)
            self.assertEqual(self.req("POST","/api/login",{"username":"eva","password":"error"},HTTP_X_REAL_IP="10.1.0.1")[0],429)
        self.assertEqual(self.req("GET","/api/session",cookie=cookie)[1],{"user":"eva"})
        with closing(store.connect()) as db:
            db.execute("UPDATE sessions SET expires=0")
        self.assertEqual(self.req("GET","/api/session",cookie=cookie)[1],{"user":None})


if __name__ == "__main__":
    unittest.main()
