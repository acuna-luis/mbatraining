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
        self.assertEqual(self.req("GET","/api/state",cookie=b)[1],{"drafts":{},"lastId":"","activeSeconds":0})
        state=self.req("GET","/api/state",cookie=a)[1]
        self.assertEqual(state["drafts"][self.q["id"]],dict(self.payload,revision=1))
        self.assertEqual(state["lastId"],"1.0")
        self.assertEqual(self.req("PUT",self.url,dict(self.payload,choice="inventada"),a)[0],422)
        self.assertEqual(self.req("PUT",self.url,dict(self.payload,text="y"*32001),a)[0],422)
        self.assertEqual(self.req("PUT",self.url,dict(self.payload,text="otra"),a,HTTP_ORIGIN="https://otro.test")[0],403)
        self.assertEqual(self.req("POST","/api/logout",{},a)[0],200)
        self.assertEqual(self.req("GET","/api/state",cookie=a)[0],401)
        self.assertEqual(self.req("GET","/api/session",cookie=a)[1],{"user":None})

    def test_module_finals_use_the_same_account_and_scoreable_choices(self):
        finals = [q for q in app.QUESTIONS.values() if q["type"] == "final"]
        self.assertCountEqual([q["module"] for q in finals], range(1, 12))
        cookie = self.login("estudiante")
        self.assertEqual(self.req("PUT", self.url, self.payload, cookie)[0], 200)
        for q in finals:
            with self.subTest(module=q["module"]):
                self.assertEqual(len(set(q["options"])), 4)
                correct = q["options"][q["correctIndex"]]
                payload = dict(mode="eleccion", text="", choice=correct, revision=0)
                url = "/api/drafts/" + q["id"]
                self.assertEqual(self.req("PUT", url, dict(payload, mode="texto"), cookie)[0], 422)
                self.assertEqual(self.req("PUT", url, payload, cookie)[0], 200)
                self.assertEqual(self.req("PUT", "/api/last", {"lastId": q["id"]}, cookie)[0], 200)
        state = self.req("GET", "/api/state", cookie=cookie)[1]
        self.assertEqual(len(state["drafts"]), len(finals) + 1)
        for q in finals:
            self.assertEqual(state["drafts"][q["id"]]["choice"], q["options"][q["correctIndex"]])

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

    def test_activity_totals_use_max_per_record_and_survive_unordered_concurrent_retries(self):
        cookie = self.login("ana")
        first = "7a970454-21bd-40ce-a54f-fa7e5be47102"
        second = "870454ac-21bd-40ce-a54f-fa7e5be47133"

        def write(key, seconds):
            return self.req("PUT", "/api/activity", {"activityId": key, "seconds": seconds}, cookie)[:2]

        self.assertEqual(write(first, 0), (200, {"activeSeconds": 0, "recordSeconds": 0}))
        samples = [(first, 18), (second, 12), (first.upper(), 25), (second, 5), (first, 18), (first, 25)]
        with ThreadPoolExecutor(max_workers=4) as pool:
            replies = list(pool.map(lambda pair: write(*pair), samples))
        for (code, totals), (_, sent) in zip(replies, samples):
            self.assertEqual(code, 200)
            self.assertGreaterEqual(totals["recordSeconds"], sent)
            self.assertGreaterEqual(totals["activeSeconds"], totals["recordSeconds"])
        self.assertEqual(write(first, 0), (200, {"activeSeconds": 37, "recordSeconds": 25}))
        self.assertEqual(write(second, 12), (200, {"activeSeconds": 37, "recordSeconds": 12}))
        self.assertEqual(self.req("GET", "/api/state", cookie=cookie)[1]["activeSeconds"], 37)

    def test_activity_validates_and_binds_each_measurement_to_the_authenticated_account(self):
        ana = self.login("ana")
        bea = self.login("bea")
        payload = {"activityId": "870454ac-21bd-40ce-a54f-fa7e5be47133", "seconds": 30}
        send = lambda fields, cookie="", **kwargs: self.req("PUT", "/api/activity", fields, cookie, **kwargs)[:2]
        self.assertEqual(send(payload)[0], 401)
        self.assertEqual(send(payload, ana, HTTP_X_MBA_USER="bea")[0], 401)
        self.assertEqual(send(payload, ana, HTTP_ORIGIN="https://otro.test")[0], 403)
        for bad in ({"activityId": None}, {"activityId": "no-es-un-identificador"},
                    {"seconds": True}, {"seconds": -1}, {"seconds": 1.5}, {"seconds": 2**31}):
            with self.subTest(bad=bad):
                self.assertEqual(send(dict(payload, **bad), ana), (422, {"error": "invalid_activity"}))
        self.assertEqual(send(payload, ana), (200, {"activeSeconds": 30, "recordSeconds": 30}))
        self.assertEqual(send(dict(payload, seconds=10), bea), (200, {"activeSeconds": 10, "recordSeconds": 10}))
        self.assertEqual(self.req("GET", "/api/state", cookie=ana)[1]["activeSeconds"], 30)

    def test_activity_migration_preserves_existing_accounts_sessions_and_answers(self):
        cookie = self.login("ana")
        self.assertEqual(self.req("PUT", self.url, self.payload, cookie)[0], 200)
        self.assertEqual(self.req("PUT", "/api/last", {"lastId": "1.0"}, cookie)[0], 200)
        with closing(store.connect()) as db:
            db.execute("DROP TABLE study_activity")
        store.initialize()
        state = self.req("GET", "/api/state", cookie=cookie)[1]
        self.assertEqual(state["activeSeconds"], 0)
        self.assertEqual(state["lastId"], "1.0")
        self.assertEqual(state["drafts"][self.q["id"]], dict(self.payload, revision=1))
        data = {"activityId": "d2965475-161d-48a4-a54f-fa7e5be47133", "seconds": 20}
        self.assertEqual(self.req("PUT", "/api/activity", data, cookie)[0], 200)
        store.initialize()
        self.assertEqual(self.req("GET", "/api/state", cookie=cookie)[1]["activeSeconds"], 20)

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
