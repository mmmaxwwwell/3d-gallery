// SPDX-License-Identifier: MIT
/**
 * Home's entry. An old `/?model=…` link must leave before anything renders, so
 * the forward runs first and the page itself is only loaded if it stays.
 */
import { forwardLegacyRoute } from '../shell/legacy-routes.js';

if (!forwardLegacyRoute()) {
  void import('./mount.js').then(({ mountHome }) => mountHome());
}
