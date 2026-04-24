    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    // Clicking the drop zone opens the file picker
    dropZone.addEventListener('click', e => {
      // Don't trigger if user clicked a source chip link
      if (e.target.closest('.source-chip')) return;
      fileInput.click();
    });

    // After file selection (or cancel), go to next page
    fileInput.addEventListener('change', () => {
      dismissModal();
    });

    // Drag and drop
    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.style.background = '#efefed';
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.style.background = '';
    });
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.style.background = '';
      dismissModal();
    });

    function dismissModal() {
      const backdrop = document.querySelector('.modal-backdrop');
      backdrop.style.opacity = '0';
      backdrop.style.transition = 'opacity 0.2s ease';
      backdrop.style.pointerEvents = 'none';
      setTimeout(() => { backdrop.style.display = 'none'; }, 200);
      document.getElementById('atmOverlay').classList.add('visible');
      startDeck();
    }

    // Both buttons always proceed
    document.querySelector('.btn-later').addEventListener('click', dismissModal);
    document.querySelector('.btn-continue').addEventListener('click', dismissModal);

    // Sort btn: hover shows tooltip, click toggles popup
    const sortBtn    = document.getElementById('sortBtn');
    const sortPopup  = document.getElementById('sortPopup');
    const tooltipEl  = document.getElementById('tooltip');

    sortBtn.addEventListener('mouseenter', () => { tooltipEl.style.opacity = '1'; });
    sortBtn.addEventListener('mouseleave', () => {
      if (!tooltipEl.dataset.autoShow) tooltipEl.style.opacity = '0';
    });
    sortBtn.addEventListener('click', () => {
      sortPopup.style.display = sortPopup.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('#sortWrap')) sortPopup.style.display = 'none';
    });

    // ── Stacked deck animation (play once, ordered 1→6, fly to canvas slots) ──
    const DECK_IMAGES = [
      'Asstes/Referenceimg/Sable/Sable1.png',
      'Asstes/Referenceimg/Sable/Sable2.png',
      'Asstes/Referenceimg/Sable/Sable3.png',
      'Asstes/Referenceimg/Sable/Sable4.png',
      'Asstes/Referenceimg/Sable/Sable 5.png',
      'Asstes/Referenceimg/Sable/Sable6.png',
    ];
    const DECK_HEIGHTS = [400, 350, 450, 375, 425, 400];
    const VISIBLE   = 4;
    const CYCLE_MS  = 960;
    const TRANS_MS  = 552;
    const EASE      = 'cubic-bezier(0.25, 0.1, 0.25, 1)';

    // Read slot position directly from DOM (waterfall slots are absolutely positioned in .canvas-frame)
    function getSlotRect(idx) {
      const el = document.getElementById('slot-' + idx);
      const r  = el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    }

    let nextToAdd  = VISIBLE;
    let deckCards  = [];
    let deckInterval = null;
    let exitedCount  = 0; // which slot the next exiting card lands in

    function cardPositionStyle(pos, height) {
      const y     = pos * 28 - pos * pos * 4;
      const scale = 1 - pos * 0.06;
      const rotX  = pos * 5;
      const sh    = `0 ${30-pos*8}px ${60-pos*12}px -${15-pos*3}px rgba(0,0,0,${(0.15-pos*0.03).toFixed(2)}),0 0 ${20-pos*5}px rgba(0,0,0,0.05)`;
      return { opacity: 1 - pos * 0.25, y, scale, rotX, zIndex: VISIBLE - pos, sh, height };
    }

    function applyPos(el, pos, height, animated) {
      const p = cardPositionStyle(pos, height);
      el.style.transition = animated ? `all ${TRANS_MS}ms ${EASE}` : 'none';
      el.style.opacity    = p.opacity;
      el.style.height     = p.height + 'px';
      el.style.zIndex     = p.zIndex;
      el.style.boxShadow  = p.sh;
      el.style.transform  = `translateY(${p.y}px) scale(${p.scale}) rotateX(${p.rotX}deg)`;
    }

    function makeCard(imgIdx) {
      const el  = document.createElement('div');
      el.className = 'deck-card';
      const img = document.createElement('img');
      img.src   = DECK_IMAGES[imgIdx];
      img.alt   = '';
      el.appendChild(img);
      return el;
    }

    // Fly a card from its current viewport position into its canvas slot
    function flyCardToSlot(cardEl, imgIdx, slotIdx) {
      const rect   = cardEl.getBoundingClientRect();
      const slot   = getSlotRect(slotIdx);

      // Reparent to body as fixed at exact current visual position
      document.body.appendChild(cardEl);
      cardEl.style.transition     = 'none';
      cardEl.style.position       = 'fixed';
      cardEl.style.left           = rect.left + 'px';
      cardEl.style.top            = rect.top  + 'px';
      cardEl.style.width          = rect.width + 'px';
      cardEl.style.height         = rect.height + 'px';
      cardEl.style.transform      = 'none';
      cardEl.style.transformOrigin = 'center center';
      cardEl.style.margin         = '0';
      cardEl.style.zIndex         = '1100';
      cardEl.style.opacity        = '1';
      cardEl.style.boxShadow      = '0 20px 40px -10px rgba(0,0,0,0.15)';
      cardEl.style.borderRadius   = '12px';

      // Animate to slot position & size on next frame
      requestAnimationFrame(() => requestAnimationFrame(() => {
        cardEl.style.transition = `left ${TRANS_MS}ms ${EASE}, top ${TRANS_MS}ms ${EASE}, width ${TRANS_MS}ms ${EASE}, height ${TRANS_MS}ms ${EASE}, opacity ${TRANS_MS}ms ${EASE}, box-shadow ${TRANS_MS}ms ${EASE}, border-radius ${TRANS_MS}ms ${EASE}`;
        cardEl.style.left         = slot.left   + 'px';
        cardEl.style.top          = slot.top    + 'px';
        cardEl.style.width        = slot.width  + 'px';
        cardEl.style.height       = slot.height + 'px';
        cardEl.style.borderRadius = '10px';
        cardEl.style.boxShadow    = '0 4px 16px -4px rgba(0,0,0,0.1)';
      }));

      // After landing, swap to a permanent image inside the canvas slot
      setTimeout(() => {
        const slotEl = document.getElementById('slot-' + slotIdx);
        if (slotEl) {
          const img = document.createElement('img');
          img.src   = DECK_IMAGES[imgIdx];
          img.alt   = '';
          slotEl.appendChild(img);
          slotEl.classList.add('filled');
        }
        cardEl.remove();
      }, TRANS_MS + 80);
    }

    function initDeck() {
      const container = document.getElementById('deckContainer');
      container.innerHTML = '';
      deckCards = [];
      // Fill back-to-front so Sable1 (idx 0) is at front (pos 0)
      for (let i = VISIBLE - 1; i >= 0; i--) {
        const imgIdx = i;
        const height = DECK_HEIGHTS[imgIdx];
        const el = makeCard(imgIdx);
        el.style.transition = 'none';
        el.style.opacity    = '0';
        el.style.height     = height + 'px';
        el.style.transform  = 'translateY(120px) scale(0.8) rotateX(20deg)';
        container.appendChild(el);
        deckCards[i] = { el, imgIdx, height };
        const capturedI = i;
        setTimeout(() => {
          requestAnimationFrame(() => applyPos(el, capturedI, height, true));
        }, (VISIBLE - 1 - i) * 80);
      }
    }

    function cycleDeck() {
      const container = document.getElementById('deckContainer');
      const front  = deckCards[0];
      const slotIdx = exitedCount;
      exitedCount++;

      // Shift remaining cards forward one position first
      for (let i = 1; i < deckCards.length; i++) {
        applyPos(deckCards[i].el, i - 1, deckCards[i].height, true);
      }

      // Fly front card to its canvas slot
      flyCardToSlot(front.el, front.imgIdx, slotIdx);

      // Prepare next card entering at the back
      const hasNext = nextToAdd < DECK_IMAGES.length;
      let newEl = null;
      if (hasNext) {
        const newHeight = DECK_HEIGHTS[nextToAdd];
        newEl = makeCard(nextToAdd);
        newEl.style.transition = 'none';
        newEl.style.opacity    = '0';
        newEl.style.height     = newHeight + 'px';
        newEl.style.transform  = 'translateY(120px) scale(0.8) rotateX(20deg)';
        newEl.style.zIndex     = '1';
        container.appendChild(newEl);
      }

      setTimeout(() => {
        deckCards.shift();
        if (hasNext) {
          const newHeight = DECK_HEIGHTS[nextToAdd];
          const backPos   = deckCards.length;
          deckCards.push({ el: newEl, imgIdx: nextToAdd, height: newHeight });
          nextToAdd++;
          requestAnimationFrame(() => applyPos(newEl, backPos, newHeight, true));
        }
        if (deckCards.length === 0) {
          clearInterval(deckInterval);
          // All images landed — fade out gradient overlay, then reveal Sable frame, then teammates
          setTimeout(() => {
            const overlay = document.getElementById('atmOverlay');
            overlay.style.transition = 'opacity 0.72s ease';
            overlay.style.opacity = '0';
            setTimeout(() => {
              document.querySelector('.canvas-frame').style.background = 'rgba(249, 247, 247, 1)';
            }, 420);
            // 1 second after overlay finishes fading → start teammate boards
            setTimeout(() => {
              showTeammateBoards();
            }, 400 + 200);
          }, 200);
        }
      }, TRANS_MS);
    }

    function startDeck() {
      nextToAdd   = VISIBLE;
      exitedCount = 0;
      deckCards   = [];
      document.getElementById('canvasSection').classList.add('visible');
      initDeck();
      deckInterval = setInterval(cycleDeck, CYCLE_MS);
    }

    // ── Teammate boards ──
    const TEAMMATES_DATA = [
      {
        id: 'maya', label: "Maya's Creative Direction", frameH: 983,
        slots: [
          { src: 'Asstes/Referenceimg/Maya/Maya 1.png', left: 24,  top: 24,  w: 200, h: 200 },
          { src: 'Asstes/Referenceimg/Maya/Maya2.png',  left: 236, top: 24,  w: 200, h: 200 },
          { src: 'Asstes/Referenceimg/Maya/Maya 3.png', left: 24,  top: 236, w: 200, h: 300 },
          { src: 'Asstes/Referenceimg/Maya/Maya4.png',  left: 236, top: 236, w: 200, h: 200 },
          { src: 'Asstes/Referenceimg/Maya/Maya 5.png', left: 236, top: 448, w: 200, h: 299 },
          { src: 'Asstes/Referenceimg/Maya/Maya6.png',  left: 24,  top: 548, w: 200, h: 200 },
          { src: 'Asstes/Referenceimg/Maya/Maya 7.png',  left: 236, top: 759, w: 200, h: 200 },
          { src: 'Asstes/Referenceimg/Maya/Maya8.png',  left: 236, top: 759, w: 200, h: 200 },

        ],
      },
      {
        id: 'jin', label: "Jin's Website Inspiration", frameH: 805,
        slots: [
          { src: 'Asstes/Referenceimg/Jin/Jin1.png', left: 24,  top: 24,  w: 200, h: 355 },
          { src: 'Asstes/Referenceimg/Jin/Jin2.png', left: 236, top: 24,  w: 200, h: 356 },
          { src: 'Asstes/Referenceimg/Jin/Jin3.png', left: 24,  top: 391, w: 200, h: 390 },
        ],
      },
      {
        id: 'priya', label: "Priya's Branding Strategies", frameH: 1280,
        slots: [
          { src: 'Asstes/Referenceimg/Priya/Priya 1.png', left: 24,  top: 24,  w: 200, h: 200 },
          { src: 'Asstes/Referenceimg/Priya/Priya 2.png', left: 236, top: 24,  w: 200, h: 200 },
          { src: 'Asstes/Referenceimg/Priya/Priya 3.png', left: 24,  top: 236, w: 200, h: 356 },
        ],
        textCard: {
          cardTop: 604,
          title: 'Audiences',
          body: [
            { text: 'Millennial dog owners, 20–40, urban or urban-adjacent. They have a nickname for their dog\'s nickname. They buy the $14 olive oil. They have opinions about fonts. They follow small brands not because they\'re trendy but because they want to feel like they found something real.', dim: false },
            { text: 'They are not a demographic. They are an aesthetic stance. They distrust brands that try too hard to be charming. They also distrust brands that are so minimal they feel cold. The gap between those two failure modes is narrow. That\'s where Biscuit lives.', dim: true },
          ],
        },
      },
      {
        id: 'ren', label: "Ren's Motion Inspiration", frameH: 461,
        slots: [
          { src: 'Asstes/Referenceimg/Ren/Ren1.png', left: 24,  top: 24,  w: 200, h: 200 },
          { src: 'Asstes/Referenceimg/Ren/Ren2.png', left: 236, top: 24,  w: 200, h: 200 },
          { src: 'Asstes/Referenceimg/Ren/Ren3.png', left: 24,  top: 236, w: 200, h: 133 },
          { src: 'Asstes/Referenceimg/Ren/Ren4.png', left: 236, top: 236, w: 200, h: 201 },
        ],
      },
      {
        id: 'leo', label: "Leo's Copywriting", frameH: 420,
        slots: [],
        textCards: [
          {
            title: 'Direction 1 — Leo: Product-forward. Benefit-led. Easy to approve.',
            lines: [
              { text: 'Biscuit Originals. ', bold: true, suffix: 'Made from the good stuff. Made for dogs who deserve it.' },
              { text: 'Real ingredients. No fillers. One very happy dog.', dim: true },
              { text: 'The treat your dog wants. The label you\'re not embarrassed by.', dim: true },
            ],
          },
          {
            title: 'Direction 2 — Leo: Brand-voice. Emotion-led. Made to be remembered.',
            lines: [
              { text: 'Biscuit Originals. ', bold: true, suffix: 'Made from the good stuff. Made for dogs who deserve it.' },
              { text: 'Real ingredients. No fillers. One very happy dog.', dim: true },
              { text: 'The treat your dog wants. The label you\'re not embarrassed by.', dim: true },
            ],
          },
        ],
      },
    ];

    // Build all teammate board DOM nodes at load (hidden)
    function buildTeammateBoards() {
      TEAMMATES_DATA.forEach(data => {
        const section = document.createElement('div');
        section.className = 'teammate-section';
        section.id = 'board-' + data.id;

        const label = document.createElement('div');
        label.className = 'canvas-section-label';
        label.textContent = data.label;
        section.appendChild(label);

        const frame = document.createElement('div');
        frame.className = 'canvas-frame';
        frame.style.background = '#F9F7F7';
        frame.style.transition = 'none';

        const isTextBoard = data.slots.length === 0 && !!(data.textCard || data.textCards);
        if (isTextBoard) {
          frame.style.width = 'fit-content';
          frame.style.height = 'auto';
          frame.style.padding = '24px';
          frame.style.overflow = 'visible';
        } else {
          frame.style.width = '460px';
          frame.style.height = data.frameH + 'px';
        }

        data.slots.forEach(slot => {
          const slotEl = document.createElement('div');
          slotEl.className = 'canvas-slot';
          slotEl.style.cssText = `left:${slot.left}px;top:${slot.top}px;width:${slot.w}px;height:${slot.h}px;`;
          const img = document.createElement('img');
          img.src = slot.src;
          img.alt = '';
          slotEl.appendChild(img);
          frame.appendChild(slotEl);
        });

        // Single text card (Priya — may be below images or standalone)
        if (data.textCard) {
          const card = document.createElement('div');
          card.className = 'text-card priya-text-card';
          if (data.textCard.cardTop != null) {
            card.style.position = 'absolute';
            card.style.left = '24px';
            card.style.top  = data.textCard.cardTop + 'px';
          }
          const titleEl = document.createElement('div');
          titleEl.className = 'text-card-title';
          titleEl.textContent = data.textCard.title;
          card.appendChild(titleEl);
          const bodyEl = document.createElement('div');
          bodyEl.className = 'text-card-body';
          data.textCard.body.forEach((line, i) => {
            if (i > 0) { bodyEl.appendChild(document.createElement('br')); bodyEl.appendChild(document.createElement('br')); }
            const p = document.createElement('p');
            if (line.dim) p.classList.add('dim');
            p.style.marginTop = i > 0 ? '12px' : '0';
            p.textContent = line.text;
            bodyEl.appendChild(p);
          });
          card.appendChild(bodyEl);
          frame.appendChild(card);
          // Fit frame height exactly to card bottom + padding
          setTimeout(() => {
            const needed = data.textCard.cardTop + card.offsetHeight + 24;
            frame.style.height = needed + 'px';
          }, 0);
        }

        // Audience card (Copywriting board — Priya's quote, above Leo's directions)
        if (data.audienceCard) {
          const ac = document.createElement('div');
          ac.className = 'text-card';
          ac.style.marginBottom = '12px';
          ac.style.minWidth = '250px';
          ac.style.maxWidth = '662px'; // spans full width of two leo cards + gap
          const acTitle = document.createElement('div');
          acTitle.className = 'text-card-title';
          acTitle.textContent = data.audienceCard.title;
          ac.appendChild(acTitle);
          const acBody = document.createElement('div');
          acBody.className = 'text-card-body';
          data.audienceCard.body.forEach((line, i) => {
            const p = document.createElement('p');
            if (i > 0) p.style.marginTop = '12px';
            if (line.dim) p.classList.add('dim');
            p.textContent = line.text;
            acBody.appendChild(p);
          });
          ac.appendChild(acBody);
          frame.appendChild(ac);
        }

        // Two-column text cards (Leo / Copywriting)
        if (data.textCards) {
          const row = document.createElement('div');
          row.className = 'leo-cards-row';
          data.textCards.forEach(tc => {
            const card = document.createElement('div');
            card.className = 'text-card leo-text-card';
            const titleEl = document.createElement('div');
            titleEl.className = 'text-card-title';
            titleEl.textContent = tc.title;
            card.appendChild(titleEl);
            const bodyEl = document.createElement('div');
            bodyEl.className = 'text-card-body';
            tc.lines.forEach((line, i) => {
              const p = document.createElement('p');
              if (i > 0) p.style.marginTop = '10px';
              if (line.dim) p.classList.add('dim');
              if (line.bold) {
                const b = document.createElement('strong');
                b.textContent = line.text;
                p.appendChild(b);
                p.appendChild(document.createTextNode(line.suffix || ''));
              } else {
                p.textContent = line.text;
              }
              bodyEl.appendChild(p);
            });
            card.appendChild(bodyEl);
            row.appendChild(card);
          });
          frame.appendChild(row);
        }

        section.appendChild(frame);
        document.getElementById('canvasWorld').appendChild(section);
      });
    }

    // Position boards dynamically based on viewport width
    function positionTeammateBoards() {
      const SCALE    = 0.66;
      const SABLE_VIS_W = 460 * SCALE;
      const GAP      = 80;
      const ML       = 120;
      const ROW_TOP  = 160;
      const ROW_GAP  = 40;
      const LABEL_H  = 28;
      const SABLE_VIS_H = (LABEL_H + 928) * SCALE;

      let curX       = ML + SABLE_VIS_W + GAP;
      let curRowY    = ROW_TOP;
      let rowMaxVisH = SABLE_VIS_H;

      TEAMMATES_DATA.forEach(data => {
        const el    = document.getElementById('board-' + data.id);
        const frame = el.querySelector('.canvas-frame');
        const visW  = frame.offsetWidth * SCALE;
        const visH  = (LABEL_H + frame.offsetHeight) * SCALE;

        if (curX + visW > window.innerWidth - 20) {
          curRowY += rowMaxVisH + ROW_GAP;
          curX = ML;
          rowMaxVisH = 0;
        }

        el.style.left = curX + 'px';
        el.style.top  = curRowY + 'px';

        curX += visW + GAP;
        rowMaxVisH = Math.max(rowMaxVisH, visH);
      });
    }

    // Central zoom state — tracks current canvasWorld scale
    let worldZoom = 1.0;
    let zoomEnabled = false; // locked during loading animation
    const BSCALE  = 0.66;

    function setWorldZoom(z) {
      worldZoom = Math.max(0.2, Math.min(4.0, z));
      document.getElementById('canvasWorld').style.transform = `scale(${worldZoom})`;
      document.querySelector('.zoom-btn').textContent = Math.round(worldZoom * 100) + '%';
      // Enforce ≥ 10px rendered label size at all times
      const labelPx = Math.ceil(10 / (BSCALE * worldZoom));
      document.querySelectorAll('.canvas-section-label').forEach(el => {
        el.style.fontSize = labelPx + 'px';
      });
      // Enforce ≥ 12px for num/title, ≥ 10px for desc (theme view)
      const theme12Px = Math.ceil(12 / (BSCALE * worldZoom));
      document.querySelectorAll('.theme-board-num, .theme-board-title').forEach(el => {
        el.style.fontSize = theme12Px + 'px';
      });
      const theme10Px = Math.ceil(10 / (BSCALE * worldZoom));
      document.querySelectorAll('.theme-board-desc').forEach(el => {
        el.style.fontSize = theme10Px + 'px';
      });
      // Counter-scale todo card text so it always reads ≥8px in viewport
      const todoPx = Math.ceil(8 / (BSCALE * worldZoom));
      document.querySelectorAll('.theme-todo-badge,.theme-todo-title,.theme-todo-desc').forEach(el => {
        el.style.fontSize = todoPx + 'px';
      });
      // Counter-scale inline check icon in theme board num
      const numCheckPx = Math.ceil(16 / (BSCALE * worldZoom));
      const numGapPx   = Math.ceil(8  / (BSCALE * worldZoom));
      document.querySelectorAll('.num-check').forEach(img => {
        img.style.width      = numCheckPx + 'px';
        img.style.height     = numCheckPx + 'px';
        img.style.marginLeft = numGapPx   + 'px';
      });
    }

    // Ctrl/Cmd + scroll to zoom
    window.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (!zoomEnabled) return;
        const delta = -e.deltaY * 0.001;
        setWorldZoom(worldZoom * (1 + delta * 1.4));
      }
    }, { passive: false });

    // Ctrl/Cmd + = / - / 0 keyboard zoom
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') { e.preventDefault(); if (zoomEnabled) setWorldZoom(worldZoom * 1.12); }
        if (e.key === '-')                  { e.preventDefault(); if (zoomEnabled) setWorldZoom(worldZoom / 1.12); }
        if (e.key === '0')                  { e.preventDefault(); if (zoomEnabled) setWorldZoom(1.0); }
      }
    });

    // Zoom out canvasWorld so all content fits, keeping nav/toolbar untouched
    function computeAndApplyZoom() {
      const LABEL_H = 28;
      const PAD     = 40;

      let maxRight, maxBottom;

      if (currentView === 'theme') {
        maxRight  = 0;
        maxBottom = 0;
        THEME_DATA.forEach(data => {
          const el    = document.getElementById('tboard-' + data.id);
          if (!el || !el.style.left) return;
          const frame = el.querySelector('.canvas-frame');
          maxRight  = Math.max(maxRight,  parseFloat(el.style.left) + frame.offsetWidth  * BSCALE);
          maxBottom = Math.max(maxBottom, parseFloat(el.style.top)  + (LABEL_H + frame.offsetHeight) * BSCALE);
        });
      } else {
        maxRight  = 120 + 460 * BSCALE;
        maxBottom = 160 + (LABEL_H + 928) * BSCALE;
        TEAMMATES_DATA.forEach(data => {
          const el    = document.getElementById('board-' + data.id);
          const frame = el.querySelector('.canvas-frame');
          maxRight  = Math.max(maxRight,  parseFloat(el.style.left) + frame.offsetWidth  * BSCALE);
          maxBottom = Math.max(maxBottom, parseFloat(el.style.top)  + (LABEL_H + frame.offsetHeight) * BSCALE);
        });
      }

      maxRight += PAD;

      const targetBottom = window.innerHeight - (currentView === 'theme' ? 40 : 24);
      const zoomH = targetBottom / maxBottom;
      // Theme: ensure 120px rendered margin on both sides; person: keep existing 90px right margin
      const zoomW = currentView === 'theme'
        ? (window.innerWidth - 240) / (maxRight - 120) // 240 = 120px × 2; subtract ML already baked in
        : (window.innerWidth - 90) / maxRight;
      const zoom  = Math.min(zoomH, zoomW, 1.0);

      setWorldZoom(zoom);
    }

    // Fade in teammate boards one by one (2s apart)
    function showTeammateBoards() {
      positionTeammateBoards();
      TEAMMATES_DATA.forEach((data, i) => {
        setTimeout(() => {
          if (i === 4) computeAndApplyZoom(); // zoom out when Leo appears (last board)
          document.getElementById('board-' + data.id).classList.add('visible');
        }, i * 2000);
      });
      // Unlock user zoom after animation completes (Leo fade-in at 8000ms + 0.8s transition)
      setTimeout(() => { zoomEnabled = true; }, 4 * 2000 + 900);

      // After all boards visible, show tooltip + team cursors
      const T = document.getElementById('tooltip');
      const tooltipDelay = 4 * 2000 + 800 + 500;
      setTimeout(() => {
        // Show tooltip
        T.dataset.autoShow = '1';
        T.style.opacity = '1';
        setTimeout(() => {
          T.style.opacity = '0';
          delete T.dataset.autoShow;
        }, 5000);
        // Show all team cursors simultaneously — they stay visible permanently
        document.querySelectorAll('.team-cursor').forEach(c => c.classList.add('visible'));
      }, tooltipDelay);
    }

    // Build boards at load time (hidden, waiting to be positioned & shown)
    buildTeammateBoards();

    // ══════════════════════════════════════════════
    // THEME VIEW SYSTEM
    // ══════════════════════════════════════════════

    let currentView = 'person';
    let themeBuilt  = false;
    const THEME_SLOT_REFS = {}; // { themeId: [slotEl, ...] }

    const THEME_DATA = [
      {
        id: 'theme1', num: '01', title: 'Gestural Illustration',
        desc: 'Loose, expressive dog characters with graphic confidence. Line-led, not render-led.',
        images: [
          { src: 'Asstes/Referenceimg/Sable/Sable1.png',  h: 266 },
          { src: 'Asstes/Referenceimg/Sable/Sable4.png',  h: 250 },
          { src: 'Asstes/Referenceimg/Sable/Sable 5.png', h: 250 },
          { src: 'Asstes/Referenceimg/Sable/Sable6.png',  h: 250 },
        ],
      },
      {
        id: 'theme2', num: '02', title: 'Photorealistic / Product-first',
        desc: 'Real dogs. Real ingredients. Photography-led, often with stark backgrounds.',
        images: [
          { src: 'Asstes/Referenceimg/Sable/Sable2.png', h: 356 },
          { src: 'Asstes/Referenceimg/Ren/Ren4.png',     h: 201 },
        ],
      },
      {
        id: 'theme3', num: '03', title: 'Vintage / Heritage Packaging',
        desc: 'Skews premium and editorial. Warm nostalgia meets functional design.',
        images: [
          { src: 'Asstes/Referenceimg/Maya/Maya8.png', h: 300 },
          { src: 'Asstes/Referenceimg/Ren/Ren3.png',     h: 133 },
          { src: 'Asstes/Referenceimg/Priya/Priya4.png',     h: 200 },
        ],
      },
      {
        id: 'theme4', num: '04', title: 'Bold Graphic / Identity',
        desc: 'Strong typographic systems, grid logic, color blocking. Shelf-presence at scale.',
        images: [
          { src: 'Asstes/Referenceimg/Maya/Maya 1.png', h: 200 },
          { src: 'Asstes/Referenceimg/Maya/Maya 3.png', h: 300 },
           { src: 'Asstes/Referenceimg/Jin/Jin1.png',    h: 355 },
          { src: 'Asstes/Referenceimg/Jin/Jin2.png',    h: 356 },
        ],
      },
      {
        id: 'theme5', num: '05', title: 'Bright / Maximalist',
        desc: 'High chroma, loud palettes, expressive energy. Closest to the audience-first approach.',
        images: [
          { src: 'Asstes/Referenceimg/Maya/Maya2.png',    h: 200 },
          { src: 'Asstes/Referenceimg/Priya/Priya 1.png', h: 200 },
          { src: 'Asstes/Referenceimg/Priya/Priya 2.png', h: 200 },
          { src: 'Asstes/Referenceimg/Priya/Priya 3.png', h: 356 },
        ],
      },
    ];

    // Primary destination per image src (first theme it appears in)
    const IMAGE_PRIMARY_THEME = {
      'Asstes/Referenceimg/Sable/Sable1.png':  { id: 'theme1', si: 0 },
      'Asstes/Referenceimg/Sable/Sable4.png':  { id: 'theme1', si: 1 },
      'Asstes/Referenceimg/Sable/Sable 5.png': { id: 'theme1', si: 2 },
      'Asstes/Referenceimg/Sable/Sable6.png':  { id: 'theme1', si: 3 },
      'Asstes/Referenceimg/Maya/Maya 1.png':   { id: 'theme1', si: 4 },
      'Asstes/Referenceimg/Sable/Sable2.png':  { id: 'theme2', si: 0 },
      'Asstes/Referenceimg/Ren/Ren4.png':      { id: 'theme2', si: 1 },
      'Asstes/Referenceimg/Ren/Ren3.png':      { id: 'theme3', si: 1 },
      'Asstes/Referenceimg/Maya/Maya 3.png':   { id: 'theme4', si: 1 },
      'Asstes/Referenceimg/Jin/Jin1.png':      { id: 'theme4', si: 2 },
      'Asstes/Referenceimg/Jin/Jin2.png':      { id: 'theme4', si: 3 },
      'Asstes/Referenceimg/Maya/Maya2.png':    { id: 'theme5', si: 0 },
      'Asstes/Referenceimg/Priya/Priya 1.png': { id: 'theme5', si: 1 },
      'Asstes/Referenceimg/Priya/Priya 2.png': { id: 'theme5', si: 2 },
      'Asstes/Referenceimg/Priya/Priya 3.png': { id: 'theme5', si: 3 },
    };

    // Sable slot index → image src (only those mapped to themes)
    const SABLE_SLOT_SRCS = {
      0: 'Asstes/Referenceimg/Sable/Sable1.png',
      1: 'Asstes/Referenceimg/Sable/Sable2.png',
      3: 'Asstes/Referenceimg/Sable/Sable4.png',
      4: 'Asstes/Referenceimg/Sable/Sable 5.png',
      5: 'Asstes/Referenceimg/Sable/Sable6.png',
    };

    // Person board slot indices that map to themes
    const PERSON_BOARD_IMGS = {
      'board-maya': [
        { src: 'Asstes/Referenceimg/Maya/Maya 1.png', si: 0 },
        { src: 'Asstes/Referenceimg/Maya/Maya2.png',  si: 1 },
        { src: 'Asstes/Referenceimg/Maya/Maya 3.png', si: 2 },
      ],
      'board-jin': [
        { src: 'Asstes/Referenceimg/Jin/Jin1.png', si: 0 },
        { src: 'Asstes/Referenceimg/Jin/Jin2.png', si: 1 },
      ],
      'board-priya': [
        { src: 'Asstes/Referenceimg/Priya/Priya 1.png', si: 0 },
        { src: 'Asstes/Referenceimg/Priya/Priya 2.png', si: 1 },
        { src: 'Asstes/Referenceimg/Priya/Priya 3.png', si: 2 },
      ],
      'board-ren': [
        { src: 'Asstes/Referenceimg/Ren/Ren3.png', si: 2 },
        { src: 'Asstes/Referenceimg/Ren/Ren4.png', si: 3 },
      ],
    };

    function computeWaterfallSlots(images) {
      const PAD = 24, COL = 200, GAP = 12;
      let y0 = PAD, y1 = PAD;
      const slots = [];
      images.forEach(img => {
        if (y0 <= y1) {
          slots.push({ left: PAD, top: y0, w: COL, h: img.h });
          y0 += img.h + GAP;
        } else {
          slots.push({ left: PAD + COL + GAP, top: y1, w: COL, h: img.h });
          y1 += img.h + GAP;
        }
      });
      const totalH = Math.max(y0, y1) - GAP + PAD;
      return { slots, totalH };
    }

    function buildThemeBoards() {
      if (themeBuilt) return;
      themeBuilt = true;
      THEME_DATA.forEach(data => {
        THEME_SLOT_REFS[data.id] = [];

        const section = document.createElement('div');
        section.className = 'theme-section';
        section.id = 'tboard-' + data.id;

        const numEl = document.createElement('div');
        numEl.className = 'theme-board-num';
        numEl.textContent = data.num;
        section.appendChild(numEl);

        const titleEl2 = document.createElement('div');
        titleEl2.className = 'theme-board-title';
        titleEl2.textContent = data.title;
        section.appendChild(titleEl2);

        const descEl = document.createElement('div');
        descEl.className = 'theme-board-desc';
        descEl.textContent = data.desc;
        section.appendChild(descEl);

        const frame = document.createElement('div');
        frame.className = 'canvas-frame';
        frame.style.background = '#F9F7F7';
        frame.style.transition  = 'none';
        frame.style.width       = '460px';

        const { slots, totalH } = computeWaterfallSlots(data.images);
        let frameH = totalH;

        // Reserve space for text card if present
        if (data.textCard) frameH += 180;
        frame.style.height = frameH + 'px';

        slots.forEach((slot, i) => {
          const slotEl = document.createElement('div');
          slotEl.className = 'canvas-slot';
          slotEl.style.cssText = `left:${slot.left}px;top:${slot.top}px;width:${slot.w}px;height:${slot.h}px;`;
          const img = document.createElement('img');
          img.src = data.images[i].src;
          img.alt = '';
          img.style.opacity = '0'; // revealed after clone lands
          slotEl.appendChild(img);
          frame.appendChild(slotEl);
          THEME_SLOT_REFS[data.id].push(slotEl);
        });

        if (data.textCard) {
          const lastBottom = Math.max(...slots.map(s => s.top + s.h)) + 12;
          const card = document.createElement('div');
          card.className = 'text-card';
          card.style.cssText = `position:absolute;left:24px;top:${lastBottom}px;width:calc(100% - 48px);`;
          const titleEl = document.createElement('div');
          titleEl.className = 'text-card-title';
          titleEl.textContent = data.textCard.title;
          card.appendChild(titleEl);
          const bodyEl = document.createElement('div');
          bodyEl.className = 'text-card-body';
          data.textCard.body.forEach((line, i) => {
            const p = document.createElement('p');
            if (i > 0) p.style.marginTop = '12px';
            if (line.dim) p.classList.add('dim');
            p.textContent = line.text;
            bodyEl.appendChild(p);
          });
          card.appendChild(bodyEl);
          frame.appendChild(card);
        }

        section.appendChild(frame);
        document.getElementById('canvasWorld').appendChild(section);
      });
    }

    function positionThemeBoards() {
      // All 5 themes in a single horizontal row; zoom handles fitting to viewport
      const SCALE = 0.66, GAP = 60, ML = 120, ROW_TOP = 180;
      let curX = ML;
      THEME_DATA.forEach(data => {
        const el    = document.getElementById('tboard-' + data.id);
        const frame = el.querySelector('.canvas-frame');
        el.style.left = curX + 'px';
        el.style.top  = ROW_TOP + 'px';
        curX += frame.offsetWidth * SCALE + GAP;
      });
    }

    // ── Theme board hover tooltips & checked badges ───────────────────────────
    const _boardChecked = {};
    let   _tipCurrentId = null;
    let   _tipHideTimer = null;

    function _createThemeTip() {
      if (document.getElementById('theme-tip')) return;
      const tip = document.createElement('div');
      tip.id = 'theme-tip';
      tip.style.cssText = `
        position:fixed;display:flex;align-items:center;gap:12px;
        padding:8px 16px;background:#fff;
        border:0.848px solid rgba(0,0,0,0.1);border-radius:999px;
        box-shadow:0 2px 12px rgba(0,0,0,0.08);
        z-index:2500;opacity:0;pointer-events:none;
        transition:opacity 0.18s ease;white-space:nowrap;
      `;
      tip.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <img src="Asstes/Icons/Image Generate.png" style="width:20px;height:20px;display:block;" alt="">
          <span style="font-size:12px;font-weight:500;color:#000;">Generate</span>
        </div>
        <div style="width:1px;height:20px;background:rgba(0,0,0,0.12);flex-shrink:0;"></div>
        <img src="Asstes/Icons/Categorize.png" style="width:20px;height:20px;display:block;" alt="">
        <img id="tip-check" src="Asstes/Icons/Check_Unfilled.png"
             style="width:20px;height:20px;display:block;cursor:pointer;" alt="">
      `;
      document.body.appendChild(tip);

      document.getElementById('tip-check').addEventListener('click', function(e) {
        e.stopPropagation();
        if (!_tipCurrentId) return;
        _boardChecked[_tipCurrentId] = !_boardChecked[_tipCurrentId];
        this.src = _boardChecked[_tipCurrentId]
          ? 'Asstes/Icons/Check_Filled.png'
          : 'Asstes/Icons/Check_Unfilled.png';
      });

      tip.addEventListener('mouseenter', () => clearTimeout(_tipHideTimer));
      tip.addEventListener('mouseleave', () => {
        _tipHideTimer = setTimeout(_hideTip, 80);
      });
    }

    function _showTip(boardEl, themeId) {
      _tipCurrentId = themeId;
      clearTimeout(_tipHideTimer);
      // Hide inline num-check while tooltip is visible
      const boardEl2 = document.getElementById('tboard-' + themeId);
      if (boardEl2) {
        const nc = boardEl2.querySelector('.num-check');
        if (nc) nc.style.opacity = '0';
      }
      const checkImg = document.getElementById('tip-check');
      if (checkImg) checkImg.src = _boardChecked[themeId]
        ? 'Asstes/Icons/Check_Filled.png' : 'Asstes/Icons/Check_Unfilled.png';

      const tip  = document.getElementById('theme-tip');
      if (!tip) return;
      // Move off-screen first so we can measure width without flash
      tip.style.transition = 'none';
      tip.style.left = '-9999px';
      tip.style.top  = '-9999px';
      tip.style.opacity = '0';
      tip.style.pointerEvents = 'auto';

      requestAnimationFrame(() => {
        const rect = boardEl.getBoundingClientRect();
        const tw   = tip.offsetWidth;
        const th   = tip.offsetHeight;
        // Position: horizontally centered, 12px above the board's top (including labels)
        // Clamp so it never hides behind the nav (~64px)
        const rawTop = rect.top - th - 12;
        tip.style.left       = (rect.left + rect.width / 2 - tw / 2) + 'px';
        tip.style.top        = Math.max(64, rawTop) + 'px';
        tip.style.transition = 'opacity 0.18s ease';
        tip.style.opacity    = '1';
      });
    }

    function _hideTip() {
      const tip = document.getElementById('theme-tip');
      if (tip) { tip.style.opacity = '0'; tip.style.pointerEvents = 'none'; }
      if (_tipCurrentId && _boardChecked[_tipCurrentId]) _showNumCheck(_tipCurrentId);
      _tipCurrentId = null;
    }

    function _showNumCheck(themeId) {
      const boardEl = document.getElementById('tboard-' + themeId);
      if (!boardEl) return;
      const numEl = boardEl.querySelector('.theme-board-num');
      if (!numEl || numEl.querySelector('.num-check')) return;
      const iconPx = Math.ceil(16 / (BSCALE * worldZoom));
      const gapPx  = Math.ceil(8  / (BSCALE * worldZoom));
      const img = document.createElement('img');
      img.className = 'num-check';
      img.src = 'Asstes/Icons/Check_Filled.png';
      img.alt = '';
      img.style.cssText = `width:${iconPx}px;height:${iconPx}px;margin-left:${gapPx}px;opacity:0;transition:opacity 0.2s ease;`;
      numEl.appendChild(img);
      requestAnimationFrame(() => requestAnimationFrame(() => { img.style.opacity = '1'; }));
    }

    function initThemeBoardHovers() {
      _createThemeTip();
      THEME_DATA.forEach(data => {
        const boardEl = document.getElementById('tboard-' + data.id);
        if (!boardEl) return;
        boardEl.addEventListener('mouseenter', () => _showTip(boardEl, data.id));
        boardEl.addEventListener('mouseleave', () => {
          _tipHideTimer = setTimeout(() => {
            const tip = document.getElementById('theme-tip');
            if (tip && tip.matches(':hover')) return;
            _hideTip();
          }, 80);
        });
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    function switchToThemeView() {
      if (currentView === 'theme') return;
      currentView = 'theme';

      buildThemeBoards();
      positionThemeBoards();
      initThemeBoardHovers();

      const ANIM_MS = 348;
      const EASE    = 'cubic-bezier(0.4, 0, 0.2, 1)';

      // Collect flying image items: source slot → target theme slot
      const flyItems = [];

      // From Sable's board
      Object.entries(SABLE_SLOT_SRCS).forEach(([idx, src]) => {
        const slotEl = document.getElementById('slot-' + idx);
        if (!slotEl || !slotEl.classList.contains('filled')) return;
        const m = IMAGE_PRIMARY_THEME[src];
        if (!m) return;
        const tgt = THEME_SLOT_REFS[m.id]?.[m.si];
        if (tgt) flyItems.push({ src, srcEl: slotEl, targetEl: tgt });
      });

      // From person boards
      Object.entries(PERSON_BOARD_IMGS).forEach(([boardId, imgs]) => {
        const board = document.getElementById(boardId);
        if (!board || !board.classList.contains('visible')) return;
        const slots = board.querySelectorAll('.canvas-slot');
        imgs.forEach(({ src, si }) => {
          const slotEl = slots[si];
          if (!slotEl) return;
          const m = IMAGE_PRIMARY_THEME[src];
          if (!m) return;
          const tgt = THEME_SLOT_REFS[m.id]?.[m.si];
          if (tgt) flyItems.push({ src, srcEl: slotEl, targetEl: tgt });
        });
      });

      // Capture rects before any DOM changes
      const flyData = flyItems.map(item => ({
        ...item,
        srcRect: item.srcEl.getBoundingClientRect(),
        tgtRect: item.targetEl.getBoundingClientRect(),
      }));

      // Fade out person boards
      ['canvasSection', ...TEAMMATES_DATA.map(d => 'board-' + d.id)].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.transition = 'opacity 0.35s ease'; el.style.opacity = '0'; }
      });

      // Track which theme slots receive a flying clone
      const animatedSlots = new Set();

      // Create flying clones
      flyData.forEach((item, flyIdx) => {
        if (!item.srcRect || !item.tgtRect) return;
        animatedSlots.add(item.targetEl);
        const clone = document.createElement('img');
        clone.src = item.src;
        clone.style.cssText = `
          position:fixed;z-index:1200;border-radius:10px;object-fit:cover;pointer-events:none;
          left:${item.srcRect.left}px;top:${item.srcRect.top}px;
          width:${item.srcRect.width}px;height:${item.srcRect.height}px;
          transition:none;
        `;
        document.body.appendChild(clone);
        const delay = flyIdx * 30;
        setTimeout(() => {
          requestAnimationFrame(() => {
            clone.style.transition = `left ${ANIM_MS}ms ${EASE},top ${ANIM_MS}ms ${EASE},width ${ANIM_MS}ms ${EASE},height ${ANIM_MS}ms ${EASE}`;
            clone.style.left   = item.tgtRect.left   + 'px';
            clone.style.top    = item.tgtRect.top    + 'px';
            clone.style.width  = item.tgtRect.width  + 'px';
            clone.style.height = item.tgtRect.height + 'px';
          });
        }, delay);
        // On landing: remove clone, reveal the real slot image underneath
        setTimeout(() => {
          clone.remove();
          const tgtImg = item.targetEl.querySelector('img');
          if (tgtImg) tgtImg.style.opacity = '1';
        }, delay + ANIM_MS + 80);
      });

      // Fade in theme boards partway through; reveal non-animated slot images
      setTimeout(() => {
        THEME_DATA.forEach(data => {
          const el = document.getElementById('tboard-' + data.id);
          el.style.transition = 'opacity 0.5s ease';
          el.style.opacity    = '1';
          // Slots not receiving a clone: fade their image in with the board
          THEME_SLOT_REFS[data.id].forEach(slotEl => {
            if (!animatedSlots.has(slotEl)) {
              const img = slotEl.querySelector('img');
              if (img) { img.style.transition = 'opacity 0.5s ease'; img.style.opacity = '1'; }
            }
          });
        });
      }, ANIM_MS * 0.55);

      // Recompute zoom after everything settles
      setTimeout(() => computeAndApplyZoom(), ANIM_MS + 400);

      // Update radio
      document.getElementById('radioPerson').classList.remove('active');
      document.getElementById('radioTheme').classList.add('active');
      document.getElementById('sortOptPerson').classList.add('sort-popup-dim');
      document.getElementById('sortOptTheme').classList.remove('sort-popup-dim');

      // ── Focus Theme 1 (triggered by toast View button) ──────────────────
      window.focusTheme1 = function() {
        const toast = document.getElementById('theme-toast');
        if (toast) { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 420); }

        // Hide toolbar
        document.querySelector('.toolbar').style.transition = 'opacity 0.35s ease';
        document.querySelector('.toolbar').style.opacity = '0';
        document.querySelector('.toolbar').style.pointerEvents = 'none';

        // Hide team cursors during conflict detection
        document.querySelectorAll('.team-cursor').forEach(c => {
          c.style.transition = 'opacity 0.35s ease';
          c.classList.remove('visible');
        });

        // Hide all theme boards except theme1
        THEME_DATA.forEach(data => {
          if (data.id === 'theme1') return;
          const el = document.getElementById('tboard-' + data.id);
          if (el) { el.style.transition = 'opacity 0.35s ease'; el.style.opacity = '0'; }
        });

        // ── Phase 1: center theme1 at 1.4× zoom ──────────────────────────────
        const EASE = 'cubic-bezier(0.4,0,0.2,1)';
        const zoomA = worldZoom * 1.4;
        const el    = document.getElementById('tboard-theme1');
        const frame = el.querySelector('.canvas-frame');
        const frameW = frame.offsetWidth;
        const frameH = frame.offsetHeight;
        const labelH = el.offsetHeight - frameH;

        const centerLeft = window.innerWidth  / (2 * zoomA) - frameW * BSCALE / 2;
        const centerTop  = window.innerHeight / (2 * zoomA) - (labelH + frameH / 2) * BSCALE;

        el.style.transition = `left 0.55s ${EASE}, top 0.55s ${EASE}`;
        el.style.left = centerLeft + 'px';
        el.style.top  = centerTop  + 'px';

        document.getElementById('canvasWorld').style.transition = `transform 0.55s ${EASE}`;
        setWorldZoom(zoomA);

        // ── Phase 2: after pause, center board + panel together ──
        setTimeout(() => {
          const zoomB     = zoomA;
          const panelWidth = 380;
          const gap        = 40;
          // Visual width of the board at current zoom
          const boardVisW  = frameW * BSCALE * zoomB;
          // Total width of board + gap + panel, then center that in the viewport
          const totalW     = boardVisW + gap + panelWidth;
          const boardLeftVP = (window.innerWidth - totalW) / 2;
          const newLeft2   = boardLeftVP / zoomB;
          const panelLeft  = boardLeftVP + boardVisW + gap;

          el.style.transition = `left 0.65s ${EASE}, top 0.65s ${EASE}`;
          el.style.left = newLeft2 + 'px';

          const panel = document.getElementById('conflictPanel');
          panel.style.left = panelLeft + 'px';
          panel.classList.add('visible');
          const glow = document.getElementById('conflictGlow');
          if (glow) { glow.style.left = panelLeft + 'px'; glow.classList.add('visible'); }

          // Reset canvas transition
          setTimeout(() => {
            document.getElementById('canvasWorld').style.transition = 'transform 0.8s ease';
          }, 700);

          // ── Run the AI thinking sequence ──────────────────────────────────
          runConflictSequence();
        }, 1400);
      };

      // ── Conflict Detection: sequential AI thinking animation ──────────────
      const _cpTimers = {};
      const _cpCycling = {};
      let _cpStageEls = {};

      const CP_PHRASES = [
        ['Cracking open the brief...', 'Browsing Sable\'s reference collection...', 'Mapping creative territories...', 'Looking for where these paths cross...'],
        ['Hmm, spotting some divergence here...', 'These don\'t quite line up...', 'Noticing conflicting signals...', 'Something\'s pulling in different directions...'],
        ['Tracing where the paths diverge...', 'Identifying the decision points...', 'Figuring out which attributes are clashing...', 'Pinpointing the creative fork...', 'Mapping what\'s incompatible...'],
        ['Figuring out what this actually means for the work...', 'Connecting the dots between these quotes...', 'Unpacking the creative implications...', 'Translating this into illustration decisions...', 'Working out where this leads...', 'Piecing together the real conflict...'],
        ['Writing this up...', 'Packaging the options...', 'Organizing the recommendation...', 'Polishing the paths forward...', 'Finalizing the resolution choices...'],
      ];
      const CP_SUCCESS = [
        'Brief and references mapped',
        'Tension mapped, mismatch identified',
        'Sources located, quotes pulled',
        'Conflict analyzed, resolutions forming',
        'Analysis complete',
      ];
      const CP_DURATIONS = [2880, 2520, 3240, 4320, 2880];
      const CP_CYCLE_INTERVAL = 900;

      const RADIO_ON  = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#000" stroke-width="2"/><circle cx="10" cy="10" r="5" fill="#000"/></svg>`;
      const RADIO_OFF = `<svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="8.5" r="7.5" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/></svg>`;

      function cpRaf2(fn) { requestAnimationFrame(() => requestAnimationFrame(fn)); }
      function cpScrollBottom() {
        const el = document.getElementById('cpBody');
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }

      function cpTypeInto(el, text, onDone) {
        const key = el.id || Math.random();
        clearTimeout(_cpTimers[key]);
        const old = el.textContent;
        let pos = old.length;
        function erase() {
          if (pos > 0) { el.textContent = old.slice(0, --pos); _cpTimers[key] = setTimeout(erase, 2); }
          else type();
        }
        function type() {
          el.textContent = text.slice(0, ++pos);
          if (pos < text.length) _cpTimers[key] = setTimeout(type, 7);
          else if (onDone) onDone();
        }
        erase();
      }

      function cpStartCycling(idx, textEl) {
        const phrases = CP_PHRASES[idx];
        _cpCycling[idx] = true;
        let i = 0;
        textEl.textContent = phrases[0];
        function next() {
          if (!_cpCycling[idx]) return;
          setTimeout(() => {
            if (!_cpCycling[idx]) return;
            i = (i + 1) % phrases.length;
            cpTypeInto(textEl, phrases[i], () => { if (_cpCycling[idx]) next(); });
          }, CP_CYCLE_INTERVAL);
        }
        next();
      }

      function cpAppendStage(idx) {
        const cpBody = document.getElementById('cpBody');
        const stage = document.createElement('div');
        stage.className = 'cp-stage'; stage.id = 'cpStage' + idx;
        const row = document.createElement('div'); row.className = 'cp-thinking';
        const dot = document.createElement('div'); dot.className = 'cp-thinking-dot'; dot.id = 'cpDot' + idx;
        const txt = document.createElement('span'); txt.className = 'cp-thinking-text'; txt.id = 'cpThink' + idx;
        txt.textContent = CP_PHRASES[idx][0];
        row.appendChild(dot); row.appendChild(txt);
        stage.appendChild(row);
        cpBody.appendChild(stage);
        cpRaf2(() => { stage.classList.add('show'); cpScrollBottom(); });
        return stage;
      }

      function cpAppendNarrative(parent, html, delay) {
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = 'cp-narrative'; el.innerHTML = html;
          parent.appendChild(el);
          cpRaf2(() => { el.classList.add('show'); cpScrollBottom(); });
        }, delay || 0);
      }

      function cpAppendQuotes(parent, pairs, startDelay) {
        const wrap = document.createElement('div');
        wrap.className = 'cp-quotes';
        parent.appendChild(wrap);
        pairs.forEach(([quoteHtml, attr, avatarSrc], i) => {
          setTimeout(() => {
            const card = document.createElement('div');
            card.className = 'fig-quote';
            card.innerHTML = `
              <div class="fig-quote-text">${quoteHtml}</div>
              <div class="fig-quote-footer">
                <div class="fig-quote-avatar"><img src="${avatarSrc}" alt="" /></div>
                <span class="fig-quote-attr">${attr}</span>
              </div>
              <button class="fig-quote-arrow" aria-label="View source">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 9.5L9.5 1.5M9.5 1.5H3.5M9.5 1.5V7.5" stroke="rgba(0,0,0,0.4)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>`;
            wrap.appendChild(card);
            cpRaf2(() => { card.classList.add('show'); cpScrollBottom(); });
          }, (startDelay || 0) + i * 320);
        });
      }

      function cpAppendOptions(parent, startDelay) {
        setTimeout(() => {
          const wrap = document.createElement('div');
          wrap.className = 'cp-opt-wrap';
          for (let i = 0; i < 2; i++) {
            const skel = document.createElement('div');
            skel.className = 'opt-skel';
            skel.innerHTML = `<div class="skel-line skel-title"></div><div class="skel-line skel-desc"></div><div class="skel-line skel-desc"></div>`;
            wrap.appendChild(skel);
          }
          parent.appendChild(wrap);
          cpRaf2(() => { wrap.classList.add('show'); cpScrollBottom(); });

          setTimeout(() => {
            wrap.style.cssText += 'opacity:0;transform:translateY(3px);transition:opacity 0.25s ease,transform 0.25s ease;';
            setTimeout(() => {
              wrap.innerHTML = '';
              const OPTIONS = [
                { title: 'Illustration as style, dog as subject', desc: 'Gestural line work applied to a specific, recognizable animal. Warmth through specificity, not cuteness.', selected: true },
                { title: 'Photography primary, illustration as accent', desc: 'Real dog in campaign images. Illustration reserved for packaging details and secondary materials.', selected: false },
              ];
              const cardEls = OPTIONS.map((opt, i) => {
                const card = document.createElement('div');
                card.className = 'opt-card' + (opt.selected ? ' selected' : '');
                card.innerHTML = `
                  <div class="opt-card-text">
                    <div class="opt-card-title">${opt.title}</div>
                    <div class="opt-card-desc">${opt.desc}</div>
                  </div>
                  <div class="opt-radio">${opt.selected ? RADIO_ON : RADIO_OFF}</div>`;
                wrap.appendChild(card);
                setTimeout(() => cpRaf2(() => card.classList.add('show')), i * 140);
                return card;
              });
              cardEls.forEach((card, i) => {
                card.addEventListener('click', () => {
                  const other = cardEls[1 - i];
                  card.classList.add('selected'); other.classList.remove('selected');
                  card.querySelector('.opt-radio').innerHTML = RADIO_ON;
                  other.querySelector('.opt-radio').innerHTML = RADIO_OFF;
                });
              });
              wrap.style.opacity = '1'; wrap.style.transform = 'translateY(0)';
              cpScrollBottom();
            }, 280);
          }, 2400);
        }, startDelay || 0);
      }

      function cpAppendActionBar(parent, delay) {
        setTimeout(() => {
          // Scroll body to bottom so user sees the final stage content
          cpScrollBottom();
          // Append bar to cp-inner (outside the scroll body) so it's always visible
          const cpInner = document.querySelector('.cp-inner');
          const bar = document.createElement('div');
          bar.className = 'cp-action-bar';
          bar.innerHTML = `
            <button class="cp-btn-back">Back</button>
            <button class="cp-btn-save">
              <div class="cp-btn-save-avatar"><img src="Asstes/Navbar/Sable.png" alt="" /></div>
              Save as Todo
            </button>`;
          (cpInner || parent).appendChild(bar);
          cpRaf2(() => bar.classList.add('show'));
          bar.querySelector('.cp-btn-save').addEventListener('click', saveTodo);
        }, delay || 0);
      }

      function saveTodo() {
        const EASE2 = 'cubic-bezier(0.4,0,0.2,1)';
        const cw    = document.getElementById('canvasWorld');

        // ── Step 1: Fade out conflict panel + glow ───────────────────────────
        const panel = document.getElementById('conflictPanel');
        panel.style.transition = 'opacity 0.35s ease';
        panel.style.opacity    = '0';
        const glow = document.getElementById('conflictGlow');
        if (glow) { glow.style.transition = 'opacity 0.35s ease'; glow.style.opacity = '0'; }

        setTimeout(() => {
          panel.classList.remove('visible');
          panel.style.transition = '';
          panel.style.opacity    = '';
          panel.style.left       = '';    // CSS default restores off-screen position
          if (glow) {
            glow.classList.remove('visible');
            glow.style.transition = '';
            glow.style.opacity    = '';
            glow.style.left       = '';
          }
        }, 400);

        // ── Step 2: Restore toolbar + team cursors ───────────────────────────
        const toolbar = document.querySelector('.toolbar');
        toolbar.style.transition    = 'opacity 0.4s ease';
        toolbar.style.opacity       = '1';
        toolbar.style.pointerEvents = 'auto';

        // Restore team cursors with a short delay so they don't pop in simultaneously
        setTimeout(() => {
          document.querySelectorAll('.team-cursor').forEach(c => {
            c.style.transition = 'opacity 0.6s ease';
            c.classList.add('visible');
          });
        }, 600);

        // ── Step 3: Fade all other boards back in ────────────────────────────
        THEME_DATA.forEach(data => {
          if (data.id === 'theme1') return;
          const b = document.getElementById('tboard-' + data.id);
          if (b) { b.style.transition = 'opacity 0.55s ease'; b.style.opacity = '1'; }
        });

        // ── Step 4: Reset ALL boards to original row positions ───────────────
        // Hard-code the layout math so offsetWidth timing can't cause stacking bugs
        const BW = 460, BS = 0.66, BG = 60, BML = 120, BTOP = 180;
        let bx = BML;
        THEME_DATA.forEach((data, idx) => {
          const b = document.getElementById('tboard-' + data.id);
          if (!b) { bx += BW * BS + BG; return; }
          // Only theme1 gets a smooth transition — others are already at correct pos
          b.style.transition = (idx === 0)
            ? `left 0.75s ${EASE2}, top 0.75s ${EASE2}`
            : 'none';
          b.style.left = bx + 'px';
          b.style.top  = BTOP + 'px';
          bx += BW * BS + BG;
        });
        // Clear instant-snap transitions after 1 tick so future moves animate
        setTimeout(() => {
          THEME_DATA.forEach(data => {
            if (data.id === 'theme1') return;
            const b = document.getElementById('tboard-' + data.id);
            if (b) b.style.transition = '';
          });
        }, 50);

        // ── Step 5: Reset zoom ───────────────────────────────────────────────
        cw.style.transition = `transform 0.75s ${EASE2}`;
        setTimeout(() => computeAndApplyZoom(), 60);

        // ── Step 6: After layout settles, attach connector line + todo card as board children ─────
        setTimeout(() => {
          const liveEl = document.getElementById('tboard-theme1');
          if (!liveEl) return;
          // Remove any pre-existing connector
          const prev = liveEl.querySelector('.theme-todo-connector');
          if (prev) prev.remove();

          const connector = document.createElement('div');
          connector.className = 'theme-todo-connector';
          connector.innerHTML = `
            <div class="theme-todo-line"></div>
            <div class="theme-todo-card">
              <div class="theme-todo-badge">TO-DO</div>
              <div class="theme-todo-title">Illustration as style, dog as subject</div>
              <div class="theme-todo-desc">Resolve conflict between Jordan's request for a specific, recognizable dog and the brand-strategic need for emotional restraint.</div>
            </div>`;
          liveEl.appendChild(connector);

          // Trigger line growth
          requestAnimationFrame(() => requestAnimationFrame(() => {
            connector.querySelector('.theme-todo-line').classList.add('grow');
          }));

          // Show card after line finishes, then counter-scale fonts
          setTimeout(() => {
            connector.querySelector('.theme-todo-card').classList.add('show');
            setWorldZoom(worldZoom);
          }, 450);
        }, 1150);
      }

      function cpMarkDone(idx, onDone) {
        const dot = document.getElementById('cpDot' + idx);
        const textEl = document.getElementById('cpThink' + idx);
        if (dot) dot.classList.add('done');
        if (textEl) { textEl.classList.add('done'); cpTypeInto(textEl, CP_SUCCESS[idx], onDone); }
        else if (onDone) onDone();
      }

      function cpRevealContent(idx, stage, onDone) {
        switch (idx) {
          case 0:
            if (onDone) onDone(); break;
          case 1:
            cpAppendNarrative(stage, 'Found where they split. Let me pinpoint the specific creative choices where this matters.', 350);
            setTimeout(onDone, 600); break;
          case 2:
            cpAppendNarrative(stage, 'Here\'s what I found. Two different stories about what this dog should be:', 300);
            cpAppendQuotes(stage, [
              ['"I don\'t want a cute dog. I want <em>my</em> dog. There\'s a difference and I can feel it immediately when I see a sketch."',
               'Jordan Ellis, Founder — Biscuit', 'Asstes/Client.png'],
              ['"The work must earn its warmth. This audience reads manufactured emotion immediately — and disengages just as fast."',
               'Priya S., Brand Strategist', 'Asstes/Navbar/Priya.png'],
            ], 600);
            setTimeout(onDone, 1300); break;
          case 3:
            cpAppendNarrative(stage, 'I\'m surfacing two ways forward that both stay true to the brief. One leans into what Jordan said about wanting to recognize their actual dog — that\'s the one I\'d recommend.', 350);
            setTimeout(onDone, 700); break;
          case 4:
            cpAppendNarrative(stage, 'Here are two paths that work within Jordan\'s brief:', 300);
            cpAppendOptions(stage, 600);
            cpAppendNarrative(stage, 'Option 1 matches what Jordan emphasized — you\'d recognize the real dog, it feels warm, not generic.', 3800);
            cpAppendActionBar(stage, 4400);
            break;
        }
      }

      function cpRunPhase(idx) {
        const stage = cpAppendStage(idx);
        _cpStageEls[idx] = stage;
        const textEl = document.getElementById('cpThink' + idx);
        cpStartCycling(idx, textEl);
        setTimeout(() => {
          _cpCycling[idx] = false;
          cpMarkDone(idx, () => {
            setTimeout(() => {
              cpRevealContent(idx, stage, () => {
                if (idx < 4) setTimeout(() => cpRunPhase(idx + 1), 500);
              });
            }, 200);
          });
        }, CP_DURATIONS[idx]);
      }

      function runConflictSequence() {
        // Clear dynamically-added stages from any previous run
        const cpBody = document.getElementById('cpBody');
        Array.from(cpBody.children).forEach(el => {
          if (!el.classList.contains('cp-spacer')) el.remove();
        });
        // Also remove any leftover action bar appended to cp-inner
        const cpInner = document.querySelector('.cp-inner');
        if (cpInner) {
          cpInner.querySelectorAll('.cp-action-bar').forEach(b => b.remove());
        }
        Object.keys(_cpCycling).forEach(k => { _cpCycling[k] = false; });
        Object.keys(_cpTimers).forEach(k => clearTimeout(_cpTimers[k]));
        _cpStageEls = {};
        cpRunPhase(0);
      }

      // Toast notification — design from Figma node 119:9238
      const prev = document.getElementById('theme-toast');
      if (prev) prev.remove();
      const toast = document.createElement('div');
      toast.id = 'theme-toast';
      // Pill shape, white + red blush gradient on right, thin border, soft shadow — matching Figma design
      toast.style.cssText = `
        position:fixed; bottom:100px; left:50%; z-index:2000;
        transform:translateX(-50%) translateY(20px); opacity:0;
        background-image: linear-gradient(90deg, #fff 66%, rgba(255,0,0,0.07) 100%), linear-gradient(90deg,#fff,#fff);
        border:1px solid rgba(0,0,0,0.05);
        border-radius:999px;
        padding:7px 7px 7px 13px;
        font-family:-apple-system,'SF Pro',sans-serif;
        font-size:12px; font-weight:500; color:#000;
        box-shadow:0 4px 20px rgba(0,0,0,0.04);
        display:flex; align-items:center; gap:10px; white-space:nowrap;
        pointer-events:all;
        transition:opacity 0.4s cubic-bezier(0.23,1,0.32,1), transform 0.4s cubic-bezier(0.23,1,0.32,1);
      `;
      toast.innerHTML = `
        <span style="font-variation-settings:'wdth' 100;">1 Direction Mismatch Detected</span>
        <button onclick="focusTheme1()"
           style="background:#e61d1d;color:#fff;border-radius:100px;padding:8px 12px;
                  font-size:12px;font-weight:500;font-variation-settings:'wdth' 100;font-family:inherit;
                  border:none;cursor:pointer;display:inline-flex;align-items:center;line-height:1;white-space:nowrap;">
          View
        </button>
      `;
      document.body.appendChild(toast);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
      }));
      setTimeout(() => {
        toast.style.transsform = 'translateX(-50%) translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 420);
      }, 6000);
    }

    function switchToPersonView() {
      if (currentView === 'person') return;
      currentView = 'person';

      const ANIM_MS = 348;
      const EASE    = 'cubic-bezier(0.4, 0, 0.2, 1)';

      // Collect reverse fly items: theme slot → person/sable slot
      const flyItems = [];

      // Person boards → their slots
      Object.entries(PERSON_BOARD_IMGS).forEach(([boardId, imgs]) => {
        const board = document.getElementById(boardId);
        if (!board || !board.classList.contains('visible')) return;
        const slots = board.querySelectorAll('.canvas-slot');
        imgs.forEach(({ src, si }) => {
          const tgtSlot = slots[si];
          if (!tgtSlot) return;
          const m = IMAGE_PRIMARY_THEME[src];
          if (!m) return;
          const srcSlot = THEME_SLOT_REFS[m.id]?.[m.si];
          if (srcSlot) flyItems.push({ src, srcEl: srcSlot, targetEl: tgtSlot });
        });
      });

      // Sable slots
      Object.entries(SABLE_SLOT_SRCS).forEach(([idx, src]) => {
        const tgtSlot = document.getElementById('slot-' + idx);
        if (!tgtSlot || !tgtSlot.classList.contains('filled')) return;
        const m = IMAGE_PRIMARY_THEME[src];
        if (!m) return;
        const srcSlot = THEME_SLOT_REFS[m.id]?.[m.si];
        if (srcSlot) flyItems.push({ src, srcEl: srcSlot, targetEl: tgtSlot });
      });

      // Capture rects before any DOM changes
      const flyData = flyItems.map(item => ({
        ...item,
        srcRect: item.srcEl.getBoundingClientRect(),
        tgtRect: item.targetEl.getBoundingClientRect(),
      }));

      // Track which person/sable slots will receive a flying clone
      const animatedTargets = new Set(flyData.map(d => d.targetEl));

      // Temporarily hide images in target slots so clone lands cleanly
      animatedTargets.forEach(slotEl => {
        const img = slotEl.querySelector('img');
        if (img) { img.style.transition = 'none'; img.style.opacity = '0'; }
      });

      // Fade out theme boards (structure fades; images fly separately)
      THEME_DATA.forEach(data => {
        const el = document.getElementById('tboard-' + data.id);
        if (el) { el.style.transition = 'opacity 0.35s ease'; el.style.opacity = '0'; }
      });

      // Fade in person boards
      const sable = document.getElementById('canvasSection');
      if (sable) { sable.style.transition = 'opacity 0.5s ease'; sable.style.opacity = '1'; }
      TEAMMATES_DATA.forEach(data => {
        const board = document.getElementById('board-' + data.id);
        if (board && board.classList.contains('visible')) {
          board.style.transition = 'opacity 0.5s ease';
          board.style.opacity    = '1';
        }
      });

      // Create flying clones: theme slot → person slot
      flyData.forEach((item, flyIdx) => {
        if (!item.srcRect || !item.tgtRect) return;
        const clone = document.createElement('img');
        clone.src = item.src;
        clone.style.cssText = `
          position:fixed;z-index:1200;border-radius:10px;object-fit:cover;pointer-events:none;
          left:${item.srcRect.left}px;top:${item.srcRect.top}px;
          width:${item.srcRect.width}px;height:${item.srcRect.height}px;
          transition:none;
        `;
        document.body.appendChild(clone);
        const delay = flyIdx * 30;
        setTimeout(() => {
          requestAnimationFrame(() => {
            clone.style.transition = `left ${ANIM_MS}ms ${EASE},top ${ANIM_MS}ms ${EASE},width ${ANIM_MS}ms ${EASE},height ${ANIM_MS}ms ${EASE}`;
            clone.style.left   = item.tgtRect.left   + 'px';
            clone.style.top    = item.tgtRect.top    + 'px';
            clone.style.width  = item.tgtRect.width  + 'px';
            clone.style.height = item.tgtRect.height + 'px';
          });
        }, delay);
        setTimeout(() => {
          clone.remove();
          const tgtImg = item.targetEl.querySelector('img');
          if (tgtImg) { tgtImg.style.transition = 'opacity 0.2s ease'; tgtImg.style.opacity = '1'; }
        }, delay + ANIM_MS + 60);
      });

      // Reset theme slot images after animation completes (ready for next theme-view entry)
      setTimeout(() => {
        THEME_DATA.forEach(data => {
          (THEME_SLOT_REFS[data.id] || []).forEach(slotEl => {
            const img = slotEl.querySelector('img');
            if (img) { img.style.transition = 'none'; img.style.opacity = '0'; }
          });
        });
      }, ANIM_MS + 400);

      setTimeout(() => computeAndApplyZoom(), ANIM_MS + 400);

      // Update radio
      document.getElementById('radioTheme').classList.remove('active');
      document.getElementById('radioPerson').classList.add('active');
      document.getElementById('sortOptTheme').classList.add('sort-popup-dim');
      document.getElementById('sortOptPerson').classList.remove('sort-popup-dim');
    }

    // Wire up sort options
    document.getElementById('sortOptPerson').addEventListener('click', () => {
      switchToPersonView();
      document.getElementById('sortPopup').style.display = 'none';
    });
    document.getElementById('sortOptTheme').addEventListener('click', () => {
      if (!zoomEnabled) return; // block during loading animation
      switchToThemeView();
      document.getElementById('sortPopup').style.display = 'none';
    });

    // ── Export panels ────────────────────────────────────────────────────────
    const exportBackdrop = document.getElementById('exportBackdrop');
    const exportPanel1   = document.getElementById('exportPanel1');
    const exportPanel2   = document.getElementById('exportPanel2');

    // Both panels are always in the DOM (no display:none); cross-fade via opacity + pointer-events
    exportPanel1.style.display = '';
    exportPanel2.style.display = '';

    function showExport() {
      exportPanel1.classList.add('active');
      exportPanel2.classList.remove('active');
      // panel2 sits behind panel1 via z-index when both visible
      exportPanel1.style.zIndex = '2';
      exportPanel2.style.zIndex = '1';
      requestAnimationFrame(() => exportBackdrop.classList.add('visible'));
    }

    function closeExport() {
      exportBackdrop.classList.remove('visible');
      setTimeout(() => {
        exportPanel1.classList.remove('active');
        exportPanel2.classList.remove('active');
      }, 280);
    }

    function showPanel2() {
      exportPanel2.style.zIndex = '2';
      exportPanel1.style.zIndex = '1';
      exportPanel2.classList.add('active');
      exportPanel1.classList.remove('active');
    }

    function showPanel1() {
      exportPanel1.style.zIndex = '2';
      exportPanel2.style.zIndex = '1';
      exportPanel1.classList.add('active');
      exportPanel2.classList.remove('active');
    }

    // Open on Export button click
    document.querySelector('.btn-export').addEventListener('click', showExport);

    // Discard / click outside → close
    document.getElementById('exportDiscard').addEventListener('click', closeExport);
    exportBackdrop.addEventListener('click', e => {
      if (e.target === exportBackdrop) closeExport();
    });

    // Continue → panel 2
    document.getElementById('exportContinue').addEventListener('click', showPanel2);

    // Back → panel 1
    document.getElementById('exportBack').addEventListener('click', showPanel1);

    // Method selection toggle
    document.getElementById('methodBridge').addEventListener('click', () => {
      document.getElementById('methodBridge').classList.add('selected');
      document.getElementById('methodBridge').classList.remove('not-selected');
      document.getElementById('methodPDF').classList.remove('selected');
      document.getElementById('methodPDF').classList.add('not-selected');
    });
    document.getElementById('methodPDF').addEventListener('click', () => {
      document.getElementById('methodPDF').classList.add('selected');
      document.getElementById('methodPDF').classList.remove('not-selected');
      document.getElementById('methodBridge').classList.remove('selected');
      document.getElementById('methodBridge').classList.add('not-selected');
    });

    // Export context button (placeholder)
    document.getElementById('exportFinal').addEventListener('click', closeExport);

