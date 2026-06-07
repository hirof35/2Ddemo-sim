"use strict";

const { WebSocketServer } = require('ws');
const Tiny2D = require('./Tiny2D.js');

const Engine            = Tiny2D.Engine;
const RectangleEntity   = Tiny2D.RectangleEntity;
const CircleEntity      = Tiny2D.CircleEntity;
const LineEntity        = Tiny2D.LineEntity;
const BodyStatic        = Tiny2D.BodyStatic;
const BodyDynamic       = Tiny2D.BodyDynamic;

const engine = new Engine(0, 0, 600, 800, 0, 9.8); 
const colors = ["yellow", "green", "orange", "blue", "white"];
function rand(v) { return Math.floor(Math.random() * v); }

// オリジナル通りの初期配置
let r;
r = new RectangleEntity(500, 50, 50, 400); r.color = "green"; engine.entities.push(r);
r = new RectangleEntity(0, 50, 50, 400); r.color = "yellow"; engine.entities.push(r);
r = new LineEntity(50, 300, 400, 350); r.color = "orange"; engine.entities.push(r);
r = new LineEntity(500, 400, 100, 450); r.color = "orange"; engine.entities.push(r);

for (var i = 0 ; i < 7 ; i++) {
    for (var j = 0 ; j < 3 ; j++) {
        r = new CircleEntity(i * 60 + 100, j * 60 + 100, 5, BodyStatic); r.color = colors[j];
        engine.entities.push(r);
    }
}
for (var i = 0 ; i < 20 ; i++) {
    r = new CircleEntity(rand(400)+50, rand(200), 10, BodyDynamic); r.color = colors[rand(5)];
    r.velocity.x = rand(10) - 5; r.velocity.y = rand(10) - 5;
    engine.entities.push(r);
}

const wss = new WebSocketServer({ port: 8080 });
console.log("=== 物理シミュレーションサーバー（原点回帰版）起動完了 ===");

setInterval(() => {
    try {
        // オリジナルと全く同じ固定ステップ
        engine.step(0.01);

        // 画面外リスポーン処理（物理コアの安全な初期化）
        engine.entities.forEach(e => {
            if (e.shape === 3 && e.bodyType === BodyDynamic) {
                if (e.y > 600 || e.y < -50 || e.x < -50 || e.x > 650) {
                    e.x = rand(400) + 50; e.y = rand(50) + 10;
                    if (e.pos) { e.pos.x = e.x; e.pos.y = e.y; }
                    if (e.velocity) { e.velocity.x = rand(10) - 5; e.velocity.y = rand(10) - 5; }
                }
            }
        });

        // オリジナルの変数名をそのままプレーンに送出
        const dataToSend = engine.entities.map(e => {
            return {
                shape: e.shape, color: e.color,
                x: e.x, y: e.y, w: e.w, h: e.h, radius: e.radius,
                x0: e.x0, y0: e.y0, x1: e.x1, y1: e.y1
            };
        });

        const jsonString = JSON.stringify(dataToSend);
        wss.clients.forEach(client => {
            if (client.readyState === 1) client.send(jsonString);
        });

    } catch (err) {
        console.error(err);
    }
}, 50); // オリジナルと同じ setInterval(tick, 50);