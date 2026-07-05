/* ═══════════════════════════════════════════════════════════════
   BRANZLY — MAIN ENTRY
   Wires WebGL scene, objects, animations + UI (loader, cursor,
   nav, reveal) and drives the render loop.
   ═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';

import { SceneManager }    from './webgl/scene.js';
import { createAllObjects } from './webgl/objects.js';
import { SceneAnimator }   from './webgl/animations.js';

import { runLoader }       from './ui/loader.js';
import { initCursor }      from './ui/cursor.js';
import { NavManager }      from './ui/nav.js';
import { splitText, revealSection } from './ui/reveal.js';

class App {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.clock  = new THREE.Clock();

    this._initWebGL();
    this._initUI();
    this._bindEvents();
    this._tick();

    runLoader(() => this._start());
  }

  _initWebGL() {
    this.scene    = new SceneManager(this.canvas);
    this.refs     = createAllObjects(this.scene.scene);
    this.animator = new SceneAnimator(this.scene, this.refs);
  }

  _initUI() {
    splitText(document);
    initCursor();
  }

  _start() {
    // build navigation once the intro is done
    this.nav = new NavManager({
      onSectionChange: (idx) => this.animator.morphOnSectionChange(idx),
      onReveal: (section) => revealSection(section),
    });
  }

  _bindEvents() {
    // mouse → webgl parallax
    window.addEventListener('mousemove', (e) => {
      const nx =  (e.clientX / window.innerWidth)  * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      this.animator.onMouseMove(nx, ny);
    });

    // resize
    window.addEventListener('resize', () => {
      this.scene.resize();
      if (this.refs.particleUniforms) {
        this.refs.particleUniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      }
    });

    // contact form → notification
    const form  = document.getElementById('contactForm');
    const notif = document.getElementById('notif');
    if (form && notif) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        notif.classList.add('show');
        form.reset();
        setTimeout(() => notif.classList.remove('show'), 3500);
      });
    }
  }

  _tick() {
    requestAnimationFrame(() => this._tick());
    if (document.hidden) return;
    const elapsed = this.clock.getElapsedTime();
    this.animator.update(elapsed);
    this.scene.render();
  }
}

document.addEventListener('DOMContentLoaded', () => new App());
