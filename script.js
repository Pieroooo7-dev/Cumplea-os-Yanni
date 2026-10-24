(() => {
    const $ = id => document.getElementById(id);
    const art = $("art"), bg = art.getContext("2d");
    const canvas = $("scene"), ctx = canvas.getContext("2d");
    const title = $("title"), message = $("message");
    const action = $("action"), hold = $("hold"), meter = $("meter");
    const hint = $("hint"), signature = $("signature");

    let W = 0, H = 0, dpr = 1;
    let phase = 0, startTime = performance.now();
    let stars = [], particles = [], petals = [];
    let pointer = { x: 0, y: 0 };
    let holdStart = 0, charging = false, finished = false;
    let lastFlowerMessage = -1, flowerStart = 0;
    let finalRain = false;

    const words = [
        ["Cierra los ojos un momento...", "Hay algo hermoso que quiero mostrarte."],
        ["Mira las lucecitas...", "A veces, la magia empieza con una pequeña luz."],
        ["Se reúnen para ti...", "Y hasta la noche puede florecer."],
        ["Dicen que las flores hablan...", "Los tulipanes regalan cariño sincero."],
        ["Y los lirios...", "Nos recuerdan la belleza de las cosas sencillas."],
        ["Este pequeño jardín es para ti.", "Que nunca te falten razones para sonreír."],
        ["Feliz cumpleaños, Yanni", "Espero y te guste este pequeño detalle 🌼"]
    ];

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = $("card").clientWidth;
        H = $("card").clientHeight;
        for (const c of [canvas, art]) {
            const r = c === canvas ? $("card").getBoundingClientRect() : $("app").getBoundingClientRect();
            c.width = Math.round(r.width * dpr);
            c.height = Math.round(r.height * dpr);
            c.style.width = r.width + "px";
            c.style.height = r.height + "px";
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bg.setTransform(dpr, 0, 0, dpr, 0, 0);
        stars = Array.from({ length: 115 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: .3 + Math.random() * 1.3, p: Math.random() * 6.28
        }));
        pointer.x = W / 2; pointer.y = H / 2;
    }
    addEventListener("resize", resize);
    resize();

    function setText(t, m) {
        title.textContent = "";
        message.textContent = "";
        let i = 0, j = 0;
        const type = () => {
            if (i < t.length) {
                title.textContent += t[i++];
                setTimeout(type, 65);
            } else if (j < m.length) {
                message.textContent += m[j++];
                setTimeout(type, 27);
            }
        };
        type();
    }

    function makeParticles(count, x = W / 2, y = H * .48, color = "gold") {
        for (let i = 0; i < count; i++) {
            // Distribución uniforme por toda la tarjeta.
            const px = Math.random() * W;
            const py = Math.random() * H;

            particles.push({
                x: px,
                y: py,
                tx: px,
                ty: py,
                vx: (Math.random() - .5) * 1.2,
                vy: (Math.random() - .5) * 1.2,
                size: .6 + Math.random() * 1.8,
                phase: Math.random() * 6.28,
                color
            });
        }
    }

    function formButterfly() {
        particles = [];

        const cx = W / 2;
        const cy = H * .48;
        const scaleX = W * .105;
        const scaleY = H * .17;

        // Curva paramétrica con forma de mariposa.
        function butterflyPoint(t) {
            const r =
                Math.exp(Math.cos(t)) -
                2 * Math.cos(4 * t) -
                Math.pow(Math.sin(t / 12), 5);

            return {
                x: Math.sin(t) * r,
                y: Math.cos(t) * r
            };
        }

        // Creamos puntos a lo largo del contorno y del interior de las alas.
        for (let i = 0; i < 650; i++) {
            const t = Math.random() * Math.PI * 12;
            const p = butterflyPoint(t);

            // Concentra puntos alrededor de la curva y hacia su interior.
            const fill = Math.sqrt(Math.random());
            const targetX = cx + p.x * scaleX * fill;
            const targetY = cy - p.y * scaleY * fill;

            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                tx: targetX,
                ty: targetY,
                vx: 0,
                vy: 0,
                size: .7 + Math.random() * 1.5,
                phase: Math.random() * Math.PI * 2,
                color: "gold"
            });
        }

        // Añade una línea luminosa en el centro como cuerpo.
        for (let i = 0; i < 65; i++) {
            const offset = (Math.random() - .5) * H * .3;

            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                tx: cx + (Math.random() - .5) * 3,
                ty: cy + offset,
                vx: 0,
                vy: 0,
                size: 1 + Math.random() * 1.6,
                phase: Math.random() * Math.PI * 2,
                color: "gold"
            });
        }
    }


    function drawStars(time) {
        bg.clearRect(0, 0, W, H);
        for (const s of stars) {
            const a = .22 + .65 * (0.5 + 0.5 * Math.sin(time * .001 + s.p));
            bg.beginPath();
            bg.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            bg.fillStyle = `rgba(255,226,174,${a})`;
            bg.fill();
        }
    }

    function drawParticles(time) {
        for (const p of particles) {
            if (phase === 1 || phase === 2) {
                p.x += (p.tx - p.x) * .035;
                p.y += (p.ty - p.y) * .035;
            } else if (phase >= 3) {
                p.x += p.vx; p.y += p.vy;
                p.vy -= .008;
            }
            const glow = .45 + .55 * Math.abs(Math.sin(time * .003 + p.phase));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * glow, 0, Math.PI * 2);
            ctx.fillStyle = p.color === "pink"
                ? `rgba(255,157,207,${glow})`
                : `rgba(255,220,132,${glow})`;
            ctx.shadowBlur = 9 * glow;
            ctx.shadowColor = p.color === "pink" ? "#ff9dcf" : "#ffe09a";
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        particles = particles.filter(p => p.x > -50 && p.x < W + 50 && p.y > -80 && p.y < H + 80);
    }

    // Tallos dibujados de forma progresiva.
    function drawStem(x, baseY, topY, lean, progress) {
        const endY = baseY + (topY - baseY) * progress;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.quadraticCurveTo(x + lean * .3, (baseY + endY) / 2, x + lean, endY);
        ctx.strokeStyle = "#57916a";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();

        // Hojas
        if (progress > .65) {
            const lx = x + lean * .35, ly = baseY - (baseY - topY) * .38;
            ctx.save();
            ctx.translate(lx, ly);
            ctx.rotate(-.5);
            ctx.fillStyle = "#4b8960";
            ctx.beginPath();
            ctx.ellipse(0, 0, 5, 17, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function drawTulip(x, y, scale, progress, time, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale * progress, scale * progress);
        const sway = Math.sin(time * .0012 + x) * 2;
        ctx.translate(sway, 0);
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        // Silueta de tulipán: tres pétalos principales.
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.bezierCurveTo(-23, -13, -20, -31, -9, -36);
        ctx.quadraticCurveTo(-8, -20, 0, -22);
        ctx.quadraticCurveTo(7, -41, 12, -35);
        ctx.bezierCurveTo(26, -26, 19, -8, 14, 0);
        ctx.quadraticCurveTo(0, 9, -14, 0);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#ffd7e5";
        ctx.globalAlpha = .55;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -3); ctx.quadraticCurveTo(-2, -20, -8, -30);
        ctx.stroke();
        ctx.restore();
    }

    function drawLily(x, y, scale, progress, time) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale * progress, scale * progress);
        ctx.rotate(Math.sin(time * .001 + x) * .035);
        const colors = ["#fff6ee", "#fce7f0", "#fffaf3", "#f5d5e8", "#fff4e7", "#fce7f0"];
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 3);
            ctx.fillStyle = colors[i];
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ffe7ef";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-8, -8, -10, -26, 0, -34);
            ctx.bezierCurveTo(10, -25, 8, -8, 0, 0);
            ctx.fill();
            ctx.restore();
        }
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#c5a46d";
        ctx.lineWidth = 1.3;
        for (let i = 0; i < 5; i++) {
            const a = i * Math.PI * 2 / 5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 12, Math.sin(a) * 12, 1.7, 0, Math.PI * 2);
            ctx.fillStyle = "#f7c55e";
            ctx.fill();
        }
        ctx.restore();
    }

    const flowers = [
        { x: -.29, top: .49, lean: -20, type: "tulip", color: "#ef789f", size: .8 },
        { x: -.19, top: .38, lean: -12, type: "lily", color: "#fff", size: .78 },
        { x: -.10, top: .46, lean: -8, type: "tulip", color: "#ffadc4", size: .95 },
        { x: .02, top: .34, lean: 0, type: "lily", color: "#fff", size: .95 },
        { x: .13, top: .43, lean: 10, type: "tulip", color: "#f37ca9", size: .9 },
        { x: .23, top: .39, lean: 15, type: "lily", color: "#fff", size: .8 },
        { x: .31, top: .50, lean: 22, type: "tulip", color: "#ffadc4", size: .76 }
    ];

    function drawBouquet(time) {
        const baseY = H * .83;
        const centerX = W / 2;
        const elapsed = time - flowerStart;
        const grow = Math.max(0, Math.min(1, elapsed / 2600));


        flowers.forEach((f, i) => {
            const x = centerX + f.x * W;
            const topY = H * f.top;
            const delay = i * 180;
            const stemProgress = Math.max(0, Math.min(1, (elapsed - delay) / 1500));

            // Todos los tallos comienzan dentro de la maceta.
            const flowerX = x + f.lean;
            const stemBaseX = centerX + f.x * 110;
            const stemLean = flowerX - stemBaseX;

            drawStem(stemBaseX, baseY + 5, topY + 20, stemLean, stemProgress);

            const bloomProgress = Math.max(0, Math.min(1, (elapsed - delay - 900) / 900));
            if (bloomProgress > 0) {
                if (f.type === "tulip") {
                    drawTulip(flowerX, topY, 1.15 * f.size, bloomProgress, time, f.color);
                } else {
                    drawLily(flowerX, topY, .95 * f.size, bloomProgress, time);
                }
            }
        });

        /*flowers.forEach((f, i) => {
            const x = centerX + f.x * W;
            const topY = H * f.top;
            const delay = i * 180;
            const stemProgress = Math.max(0, Math.min(1, (elapsed - delay) / 1500));
            drawStem(x, baseY + 5, topY + 20, f.lean, stemProgress);
            const bloomProgress = Math.max(0, Math.min(1, (elapsed - delay - 900) / 900));
            if (bloomProgress > 0) {
                if (f.type === "tulip") {
                    drawTulip(x + f.lean, topY, 1.15 * f.size, bloomProgress, time, f.color);
                } else {
                    drawLily(x + f.lean, topY, .95 * f.size, bloomProgress, time);
                }
            }
        });*/

        if (grow > .6) {
            ctx.globalAlpha = Math.min(1, (grow - .6) * 3);

            const potTop = baseY - 25;

            ctx.fillStyle = "#e2bdce";
            ctx.beginPath();
            ctx.ellipse(centerX, potTop, 49, 9, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#b98ba8";
            ctx.beginPath();
            ctx.moveTo(centerX - 47, potTop);
            ctx.lineTo(centerX + 47, potTop);
            ctx.lineTo(centerX + 25, baseY + 43);
            ctx.lineTo(centerX - 25, baseY + 43);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "#f2d8e5";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(centerX - 35, potTop + 9);
            ctx.lineTo(centerX - 19, baseY + 31);
            ctx.moveTo(centerX + 35, potTop + 9);
            ctx.lineTo(centerX + 19, baseY + 31);
            ctx.stroke();

            ctx.fillStyle = "#f0c2d9";
            ctx.beginPath();
            ctx.ellipse(centerX - 8, potTop + 2, 11, 6, -.4, 0, Math.PI * 2);
            ctx.ellipse(centerX + 8, potTop + 2, 11, 6, .4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#ffe6f0";
            ctx.beginPath();
            ctx.arc(centerX, potTop + 2, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
        }
    }

    function drawPetals(time) {
            if (phase !== 5) return;
            if (Math.random() < .28) {
                petals.push({
                    x: Math.random() * W, y: -10,
                    vx: (Math.random() - .5) * .8,
                    vy: .6 + Math.random() * 1.3,
                    r: 3 + Math.random() * 4,
                    rot: Math.random() * 6.28,
                    vr: (Math.random() - .5) * .08
                });
            }
            for (const p of petals) {
                p.x += p.vx + Math.sin(time * .001 + p.y * .02) * .4;
                p.y += p.vy; p.rot += p.vr;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = "#f3a0c6";
                ctx.shadowBlur = 8;
                ctx.shadowColor = "#ff99cb";
                ctx.beginPath();
                ctx.ellipse(0, 0, p.r * .65, p.r * 1.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            petals = petals.filter(p => p.y < H + 30);
            ctx.shadowBlur = 0;
        }

        function render(time) {
            drawStars(time);
            ctx.clearRect(0, 0, W, H);

            if (phase === 1 || phase === 2 || phase === 4) drawParticles(time);
            if (phase === 3) drawBouquet(time);
            if (phase === 5) {
                drawPetals(time);
                drawBouquet(time);
            }
            requestAnimationFrame(render);
        }

        function go(next) {
            phase = next;
            startTime = performance.now();
            title.style.opacity = 1;
            message.style.opacity = 1;
            signature.classList.remove("show");
            hold.classList.remove("ready", "charging");
            meter.classList.remove("show");
            hint.style.display = "block";
            action.style.display = "block";

            if (next === 0) {
                setText("Cierra los ojos un momento...", "Hay algo hermoso que quiero mostrarte.");
                action.textContent = "Toca para comenzar ✨";
                //hint.textContent = "PULSA PARA DESCUBRIR";
            }
            if (next === 1) {
                setText("Mira las lucecitas...", "Sigue su brillo y descubre lo que esconden.");
                action.textContent = "Reunir la luz ✨";
                //hint.textContent = "TOCA PARA CONTINUAR";
                particles = [];
                makeParticles(260);
            }
            if (next === 2) {
                setText("Una pequeña mariposa de luz", "Cada destello guarda un deseo bonito para ti.");
                action.textContent = "Que florezca la magia 🌷";
                //hint.textContent = "UN DESEO SE CONVIERTE EN FLORES";
                formButterfly();
            }
            if (next === 3) {
                setText("Un ramo hecho para ti", "Los tulipanes hablan de cariño sincero; los lirios, de admiración y buenos deseos.");
                action.textContent = "Descubrir el último deseo";
                hint.textContent = "FLORES QUE NACEN DE LA LUZ";
                particles = [];
                flowerStart = performance.now();
                lastFlowerMessage = 0;
            }
            if (next === 4) {
                setText("Guarda un poquito de magia", "Mantén presionada la flor para llenar la noche de luz.");
                action.style.display = "none";
                hint.style.display = "none";
                hold.classList.add("ready");
                meter.classList.add("show");
                meter.textContent = "MANTÉN PRESIONADA LA FLOR · 0%";
                particles = [];
            }

            if (next === 5) {
                setText(
                    "¡Feliz cumpleaños, Yanni! 🌷",
                    "Espero y te guste este pequeño detalle. Que tu vida esté llena de alegría, cariño, sueños cumplidos y flores bonitas."
                );

                action.style.display = "none";
                hold.classList.remove("ready");
                hold.style.display = "none";
                meter.classList.remove("show");
                hint.style.display = "none";

                signature.textContent =
                    "Con mucho cariño, de alguien que te desea lo mejor ♡";
                signature.classList.add("show");

                finalRain = true;
                petals = [];
                particles = [];
            }

        }

        action.addEventListener("click", () => {
            if (phase === 0) go(1);
            else if (phase === 1) go(2);
            else if (phase === 2) go(3);
            else if (phase === 3) go(4);
        });

        function chargeStart(e) {
            if (phase !== 4 || finished || charging) return;
            e.preventDefault();
            charging = true;
            holdStart = performance.now();
            hold.classList.add("charging");
            try { hold.setPointerCapture(e.pointerId); } catch (_) { }
            chargeLoop();
        }

        function chargeLoop() {
            if (!charging || finished) return;
            const amount = Math.min(1, (performance.now() - holdStart) / 2400);
            meter.textContent = "ENERGÍA MÁGICA · " + Math.round(amount * 100) + "%";
            hold.style.transform = `translateX(-50%) scale(${1 + amount * .3})`;
            if (amount >= 1) {
                charging = false;
                finished = true;
                hold.style.display = "none";
                if (navigator.vibrate) navigator.vibrate([80, 40, 140]);
                makeParticles(450, W / 2, H * .56, "pink");
                particles.forEach(p => {
                    p.vx = (p.x - W / 2) * .018 + (Math.random() - .5);
                    p.vy = (p.y - H * .56) * .018 - Math.random() * 1.4;
                });
                setTimeout(() => go(5), 1900);
                return;
            }
            requestAnimationFrame(chargeLoop);
        }

        function chargeCancel() {
            if (!charging || finished) return;
            charging = false;
            hold.classList.remove("charging");
            hold.style.transform = "translateX(-50%) scale(1)";
            meter.textContent = "MANTÉN PRESIONADA LA FLOR · 0%";
        }

        hold.addEventListener("pointerdown", chargeStart);
        hold.addEventListener("pointerup", chargeCancel);
        hold.addEventListener("pointercancel", chargeCancel);
        hold.addEventListener("pointerleave", chargeCancel);
        hold.addEventListener("contextmenu", e => e.preventDefault());

        // El ramo también cambia sus frases mientras se desarrolla.
        setInterval(() => {
            if (phase !== 3) return;
            const elapsed = performance.now() - flowerStart;
            if (elapsed > 6500 && lastFlowerMessage === 0) {
                message.textContent = "Los lirios simbolizan admiración, delicadeza y buenos deseos para cada nuevo comienzo.";
                lastFlowerMessage = 1;
            } else if (elapsed > 12500 && lastFlowerMessage === 1) {
                message.textContent = "Que estas flores te recuerden que mereces días llenos de luz, alegría y cariño.";
                lastFlowerMessage = 2;
            }
        }, 500);

        // La pantalla responde al movimiento del dedo o del ratón.
        $("card").addEventListener("pointermove", e => {
            const r = $("card").getBoundingClientRect();
            pointer.x = e.clientX - r.left;
            pointer.y = e.clientY - r.top;
            if (phase === 1) {
                particles.forEach((p, i) => {
                    const a = i * 2.399;
                    p.tx = pointer.x + Math.cos(a) * (12 + i % 38);
                    p.ty = pointer.y + Math.sin(a) * (12 + i % 38);
                });
            }
        });

        go(0);
        requestAnimationFrame(render);
})();
    
