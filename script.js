/* ══════════════════════════════════════════════
   Wedding Invitation — Full Controller
   ══════════════════════════════════════════════ */
// Always start from the top on load/refresh
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

(() => {
    'use strict';

    // ── DOM refs ────────────────────────────
    const videoIntro      = document.getElementById('video-intro');
    const video           = document.getElementById('intro-video');
    const playOverlay     = document.getElementById('play-overlay');
    const hero            = document.getElementById('hero');
    const heroAnimEls     = document.querySelectorAll('.hero__anim');
    const musicToggle     = document.getElementById('music-toggle');
    const bgMusic         = document.getElementById('bg-music');

    // Supabase Configuration
    const supabaseUrl = 'https://scsriauqtwqicudtzwrq.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjc3JpYXVxdHdxaWN1ZHR6d3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4ODA0MzUsImV4cCI6MjA5NzQ1NjQzNX0.b5d3ceCldrW8y1s-KtrcbQpIchFhaCSTfTtEoFvZOZc';
    const _supabase = supabase.createClient(supabaseUrl, supabaseKey);


    // ═══════════════════════════════════════════
    // VIDEO INTRO
    // ═══════════════════════════════════════════
    let transitionTriggered = false;
    function triggerTransition() {
        if (transitionTriggered) return;
        transitionTriggered = true;

        // Pause the video exactly on the open-gate frame so it behaves as a static background
        video.pause();

        // Transition the video intro into background mode (opacity lowers to 0.2 and z-index becomes 0)
        videoIntro.classList.add('bg-mode');
        
        // Show the hero section
        hero.classList.add('visible');
        
        // Stagger the entry animations for hero elements
        heroAnimEls.forEach(el => el.classList.add('animate-in'));
        document.body.classList.add('hero-visible');
        
        // Make music toggle button visible
        musicToggle.classList.add('visible');

        // Try autoplaying music muted if it hasn't started yet
        if (!musicStarted) {
            tryAutoplayMusic();
        }
    }

    playOverlay.addEventListener('click', () => {
        playOverlay.classList.add('hidden');
        video.play();
        
        // Safety fallback: trigger transition after 4.2s (since video action ends at 4.0s)
        setTimeout(triggerTransition, 4200);
    });

    video.addEventListener('ended', triggerTransition);

    // Trigger transition as soon as the video reaches 4.0s to avoid the freeze frame tail
    video.addEventListener('timeupdate', () => {
        if (video.currentTime >= 4.0) {
            triggerTransition();
        }
    });

    // ═══════════════════════════════════════════
    // BACKGROUND MUSIC
    // ═══════════════════════════════════════════
    let musicStarted = false;
    let isMuted = true;

    function tryAutoplayMusic() {
        bgMusic.volume = 0;
        bgMusic.muted = true;
        bgMusic.play().then(() => {
            musicStarted = true;
            musicToggle.classList.add('muted');
        }).catch(() => {});
    }

    // Unmute on first user interaction
    function handleFirstInteraction() {
        if (!musicStarted) {
            bgMusic.volume = 0;
            bgMusic.muted = false;
            bgMusic.play().then(() => {
                musicStarted = true;
                fadeAudioIn();
                isMuted = false;
                musicToggle.classList.remove('muted');
            }).catch(() => {});
        } else if (isMuted) {
            bgMusic.muted = false;
            fadeAudioIn();
            isMuted = false;
            musicToggle.classList.remove('muted');
        }
        document.removeEventListener('touchstart', handleFirstInteraction);
        document.removeEventListener('click', handleFirstInteraction);
    }
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    document.addEventListener('click', handleFirstInteraction, { once: true });

    function fadeAudioIn() {
        let vol = 0;
        bgMusic.volume = 0;
        const interval = setInterval(() => {
            vol += 0.05;
            if (vol >= 0.6) { vol = 0.6; clearInterval(interval); }
            bgMusic.volume = vol;
        }, 50);
    }

    function fadeAudioOut(cb) {
        let vol = bgMusic.volume;
        const interval = setInterval(() => {
            vol -= 0.05;
            if (vol <= 0) { vol = 0; clearInterval(interval); if (cb) cb(); }
            bgMusic.volume = vol;
        }, 50);
    }

    musicToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isMuted) {
            bgMusic.muted = false;
            if (!musicStarted) {
                bgMusic.play().then(() => { musicStarted = true; });
            }
            fadeAudioIn();
            isMuted = false;
            musicToggle.classList.remove('muted');
        } else {
            fadeAudioOut(() => { bgMusic.muted = true; });
            isMuted = true;
            musicToggle.classList.add('muted');
        }
    });

    // ═══════════════════════════════════════════
    // SCROLL REVEAL
    // ═══════════════════════════════════════════
    const revealEls = document.querySelectorAll('.scroll-reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));





    // ═══════════════════════════════════════════
    // GUESTBOOK
    // ═══════════════════════════════════════════
    const gbForm = document.getElementById('guestbook-form');
    const gbMessages = document.getElementById('guestbook-messages');
    const emojiSelector = document.getElementById('emoji-selector');
    const colorSelector = document.getElementById('color-selector');
    const signatureCanvas = document.getElementById('signature-canvas');
    const canvasClear = document.getElementById('canvas-clear');

    let selectedEmoji = '';
    let selectedColor = '#3a3632';

    // Emoji selector
    emojiSelector.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            emojiSelector.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('emoji-btn--active'));
            btn.classList.add('emoji-btn--active');
            selectedEmoji = btn.dataset.emoji;
        });
    });

    // Color selector
    colorSelector.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            colorSelector.querySelectorAll('.color-btn').forEach(b => b.classList.remove('color-btn--active'));
            btn.classList.add('color-btn--active');
            selectedColor = btn.dataset.color;
        });
    });

    // ── Signature Canvas (touch-friendly) ───
    const ctx = signatureCanvas.getContext('2d');
    let drawing = false;
    let lastX = 0, lastY = 0;

    function resizeCanvas() {
        const rect = signatureCanvas.parentElement.getBoundingClientRect();
        signatureCanvas.width = rect.width;
        signatureCanvas.height = 120;
        ctx.strokeStyle = '#3a3632';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function getPos(e) {
        const rect = signatureCanvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }

    function startDraw(e) {
        e.preventDefault();
        drawing = true;
        const pos = getPos(e);
        lastX = pos.x; lastY = pos.y;
    }
    function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastX = pos.x; lastY = pos.y;
    }
    function endDraw() { drawing = false; }

    signatureCanvas.addEventListener('mousedown', startDraw);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', endDraw);
    signatureCanvas.addEventListener('mouseleave', endDraw);
    signatureCanvas.addEventListener('touchstart', startDraw, { passive: false });
    signatureCanvas.addEventListener('touchmove', draw, { passive: false });
    signatureCanvas.addEventListener('touchend', endDraw);

    canvasClear.addEventListener('click', () => {
        ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    });

    // Helper to escape HTML characters
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Render guestbook card
    function renderGuestbookCard(item, prepend) {
        const cardColor = item.color || '#3a3632';
        const card = document.createElement('div');
        card.className = 'gb-card';
        if (cardColor !== '#3a3632') {
            card.style.setProperty('background', cardColor + '22', 'important');
            card.style.setProperty('border-color', cardColor, 'important');
        }

        const headerDiv = document.createElement('div');
        headerDiv.className = 'gb-card__header';
        headerDiv.innerHTML = `<span class="gb-card__name">${escapeHTML(item.name)}</span><span class="gb-card__emoji">${item.emoji || '✨'}</span>`;

        const msgP = document.createElement('p');
        msgP.className = 'gb-card__message';
        msgP.textContent = item.message;

        card.appendChild(headerDiv);
        card.appendChild(msgP);

        if (item.signature) {
            const sigDiv = document.createElement('div');
            sigDiv.className = 'gb-card__signature';
            const sigImg = document.createElement('img');
            sigImg.src = item.signature;
            sigImg.alt = 'Signature';
            sigDiv.appendChild(sigImg);
            card.appendChild(sigDiv);
        }

        if (prepend) {
            gbMessages.insertBefore(card, gbMessages.firstChild);
        } else {
            gbMessages.appendChild(card);
        }
    }

    // Fetch and display messages from Supabase
    async function loadGuestbook() {
        try {
            const { data, error } = await _supabase
                .from('guestbook')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            gbMessages.innerHTML = '';
            if (data && data.length > 0) {
                data.forEach(item => {
                    renderGuestbookCard(item, false);
                });
            }
        } catch (err) {
            console.error('Error loading guestbook:', err);
        }
    }

    // Load guestbook items on startup
    loadGuestbook();

    // Guestbook submit
    gbForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('gb-name').value.trim();
        const message = document.getElementById('gb-message').value.trim();
        if (!name || !message) {
            if (!name) { document.getElementById('gb-name').focus(); document.getElementById('gb-name').style.borderColor = '#e74c3c'; }
            else { document.getElementById('gb-message').focus(); document.getElementById('gb-message').style.borderColor = '#e74c3c'; }
            return;
        }

        // Get signature image
        const hasDrawing = ctx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height).data.some((ch, i) => i % 4 === 3 && ch > 0);
        const sigData = hasDrawing ? signatureCanvas.toDataURL('image/png') : null;

        const submitBtn = document.getElementById('gb-submit');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending...';

        const newItem = {
            name: name,
            message: message,
            emoji: selectedEmoji || '✨',
            color: selectedColor || '#3a3632',
            signature: sigData
        };

        try {
            const { error } = await _supabase
                .from('guestbook')
                .insert([newItem]);

            if (error) throw error;

            // Render card on screen
            renderGuestbookCard(newItem, true);

            // Reset form
            gbForm.reset();
            emojiSelector.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('emoji-btn--active'));
            colorSelector.querySelectorAll('.color-btn').forEach(b => b.classList.remove('color-btn--active'));
            selectedEmoji = '';
            selectedColor = '#3a3632';
            ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);

            // Scroll to the new card
            const firstCard = gbMessages.firstChild;
            if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (err) {
            console.error('Error posting guestbook:', err);
            alert('Failed to send message. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });

    // ═══════════════════════════════════════════
    // COUNTDOWN TIMER
    // ═══════════════════════════════════════════
    const weddingDate = new Date('2026-06-25T19:00:00');
    const cdDays = document.getElementById('cd-days');
    const cdHours = document.getElementById('cd-hours');
    const cdMinutes = document.getElementById('cd-minutes');
    const cdSeconds = document.getElementById('cd-seconds');

    function padZero(n) { return n < 10 ? '0' + n : String(n); }

    function updateCountdown() {
        const now = new Date();
        const diff = weddingDate - now;

        if (diff <= 0) {
            cdDays.textContent = '00';
            cdHours.textContent = '00';
            cdMinutes.textContent = '00';
            cdSeconds.textContent = '00';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        const newDays = padZero(days);
        const newHours = padZero(hours);
        const newMinutes = padZero(minutes);
        const newSeconds = padZero(seconds);

        // Flip animation on change
        if (cdDays.textContent !== newDays) { cdDays.classList.add('flip'); cdDays.textContent = newDays; }
        if (cdHours.textContent !== newHours) { cdHours.classList.add('flip'); cdHours.textContent = newHours; }
        if (cdMinutes.textContent !== newMinutes) { cdMinutes.classList.add('flip'); cdMinutes.textContent = newMinutes; }
        if (cdSeconds.textContent !== newSeconds) { cdSeconds.classList.add('flip'); cdSeconds.textContent = newSeconds; }

        // Remove flip class after animation
        [cdDays, cdHours, cdMinutes, cdSeconds].forEach(el => {
            el.addEventListener('animationend', () => el.classList.remove('flip'), { once: true });
        });
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);


    // ═══════════════════════════════════════════
    // RE-OBSERVE NEW SCROLL-REVEAL ELEMENTS
    // ═══════════════════════════════════════════
    document.querySelectorAll('.scroll-reveal:not(.revealed)').forEach(el => revealObserver.observe(el));

})();
