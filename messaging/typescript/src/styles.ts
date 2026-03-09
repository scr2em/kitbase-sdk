/** Scoped CSS injected into the shadow DOM */
export const STYLES = /* css */ `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ============================== Overlay ============================== */

.kb-overlay {
  position: fixed;
  inset: 0;
  z-index: 999999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: kb-fade-in 200ms ease-out;
}
.kb-overlay.kb-exit {
  animation: kb-fade-out 150ms ease-in forwards;
}

/* ============================== Modal ============================== */

.kb-modal {
  position: relative;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 480px;
  width: 100%;
  overflow: hidden;
  animation: kb-scale-in 200ms ease-out;
}
.kb-overlay.kb-exit .kb-modal {
  animation: kb-scale-out 150ms ease-in forwards;
}

/* ============================== Banner ============================== */

.kb-banner-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999998;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.kb-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: #4F46E5;
  color: #fff;
  pointer-events: auto;
  animation: kb-slide-down 250ms ease-out;
}
.kb-banner.kb-exit {
  animation: kb-slide-up-exit 150ms ease-in forwards;
}
.kb-banner .kb-content {
  flex: 1;
  min-width: 0;
}
.kb-banner .kb-title {
  font-weight: 600;
  font-size: 14px;
}
.kb-banner .kb-body {
  font-size: 13px;
  opacity: 0.9;
  color: inherit;
  margin: 0;
}
.kb-banner .kb-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.kb-banner .kb-btn-action {
  background: rgba(255,255,255,0.2);
  color: #fff;
}
.kb-banner .kb-btn-secondary {
  background: transparent;
  color: rgba(255,255,255,0.8);
}
.kb-banner .kb-close {
  position: static;
  background: rgba(255,255,255,0.15);
  color: #fff;
}
.kb-banner .kb-close:hover {
  background: rgba(255,255,255,0.25);
}

/* ============================== Card ============================== */

.kb-card-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999997;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 360px;
  pointer-events: none;
}

.kb-card {
  position: relative;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
  overflow: hidden;
  pointer-events: auto;
  animation: kb-slide-up 250ms ease-out;
}
.kb-card.kb-exit {
  animation: kb-slide-down-exit 150ms ease-in forwards;
}

/* ============================== Image (fullscreen) ============================== */

.kb-image-msg {
  position: relative;
  max-width: 600px;
  width: 100%;
  animation: kb-scale-in 200ms ease-out;
}
.kb-overlay.kb-exit .kb-image-msg {
  animation: kb-scale-out 150ms ease-in forwards;
}
.kb-image-msg > img {
  display: block;
  width: 100%;
  border-radius: 16px;
}
.kb-image-msg .kb-buttons {
  margin-top: 12px;
  justify-content: center;
}

/* ============================== Shared ============================== */

.kb-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.06);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: #666;
  transition: background 150ms, color 150ms;
  z-index: 1;
}
.kb-close:hover {
  background: rgba(0,0,0,0.12);
  color: #333;
}
.kb-overlay .kb-close {
  background: rgba(255,255,255,0.15);
  color: #fff;
}
.kb-overlay .kb-close:hover {
  background: rgba(255,255,255,0.25);
}

.kb-msg-image {
  display: block;
  width: 100%;
}

.kb-content {
  padding: 20px;
}

.kb-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 6px;
}

.kb-body {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  margin-bottom: 16px;
  white-space: pre-wrap;
}

.kb-buttons {
  display: flex;
  gap: 8px;
}

.kb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 150ms;
  font-family: inherit;
  line-height: 1;
}
.kb-btn:hover {
  opacity: 0.88;
}

.kb-btn-action {
  background: #4F46E5;
  color: #fff;
}

.kb-btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

/* ============================== Animations ============================== */

@keyframes kb-fade-in {
  from { opacity: 0 } to { opacity: 1 }
}
@keyframes kb-fade-out {
  from { opacity: 1 } to { opacity: 0 }
}
@keyframes kb-scale-in {
  from { transform: scale(0.95); opacity: 0 }
  to   { transform: scale(1);    opacity: 1 }
}
@keyframes kb-scale-out {
  from { transform: scale(1);    opacity: 1 }
  to   { transform: scale(0.95); opacity: 0 }
}
@keyframes kb-slide-down {
  from { transform: translateY(-100%) }
  to   { transform: translateY(0) }
}
@keyframes kb-slide-up-exit {
  from { transform: translateY(0) }
  to   { transform: translateY(-100%) }
}
@keyframes kb-slide-up {
  from { transform: translateY(20px); opacity: 0 }
  to   { transform: translateY(0);    opacity: 1 }
}
@keyframes kb-slide-down-exit {
  from { transform: translateY(0);    opacity: 1 }
  to   { transform: translateY(20px); opacity: 0 }
}

/* ============================== Responsive ============================== */

@media (max-width: 480px) {
  .kb-card-container {
    left: 12px;
    right: 12px;
    bottom: 12px;
    max-width: none;
  }
  .kb-modal {
    max-width: none;
  }
}
`;
