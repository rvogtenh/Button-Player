import { LitElement, html, css } from 'lit';

/**
 * Landing page shown to audience members before joining the performance.
 * Emits a 'join' event when the user taps "bitte beitreten".
 */
class SwLanding extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      width: 100%;
      background-color: var(--sw-background-color, #000);
      color: var(--sw-font-color, #fff);
      font-family: var(--sw-font-family, monospace);
      text-align: center;
      padding: 20px;
      box-sizing: border-box;
    }

    h1 {
      font-size: 2.4rem;
      letter-spacing: 0.1em;
      margin: 0 0 1.6rem;
      font-weight: normal;
      text-transform: uppercase;
    }

    .join-btn {
      font-size: 1.4rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      padding: 1.4rem 3rem;
      border-radius: 4px;
      border: 1px solid var(--sw-lighter-background-color, #363636);
      background-color: var(--sw-light-background-color, #242424);
      color: var(--sw-font-color, #fff);
      cursor: pointer;
      touch-action: none;
      user-select: none;
      transition: background-color 60ms ease, transform 60ms ease;
    }

    .join-btn:active {
      background-color: var(--sw-lighter-background-color, #363636);
      transform: scale(0.97);
    }
  `;

  _onJoin() {
    this.dispatchEvent(new CustomEvent('join', { bubbles: true, composed: true }));
  }

  render() {
    return html`
      <h1>Responsive Space</h1>
      <button class="join-btn" @pointerdown=${this._onJoin}>
        bitte beitreten
      </button>
    `;
  }
}

customElements.define('sw-landing', SwLanding);
