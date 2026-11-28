import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import { registerDictionary } from '../i18n/core';
import { VI } from '../i18n/vi';

// Tests switch languages synchronously, so the dictionary is registered up front.
registerDictionary(VI);

// happy-dom's <dialog> lacks modal behaviour in some versions; emulate the open state only.
if (typeof HTMLDialogElement !== 'undefined') {
  const proto = HTMLDialogElement.prototype;
  proto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}

// findBy*/waitFor default to 1 s, too tight when ~100 test files run in parallel (300-word lists, engines).
configure({ asyncUtilTimeout: 10_000 });

afterEach(() => {
  cleanup();
});
