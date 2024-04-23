/**********************************************************************
 * Copyright (C) 2024 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import { writable, type Invalidator, type Subscriber, type Unsubscriber, type Readable } from 'svelte/store';
import { rpcBrowser } from '../utils/client';
import type { Subscriber as SharedSubscriber } from '@shared/src/messages/MessageProxy';

export function RPCReadable<T>(
  value: T,
  // The event used to subscribe to a webview postMessage event
  subscriptionEvents: string[],
  // The initialization function that will be called to update the store at creation.
  // For example, you can pass in a custom function such as "getPullingStatuses".
  updater: () => Promise<T>,
): Readable<T> {
  const origWritable = writable(value);

  function subscribe(this: void, run: Subscriber<T>, invalidate?: Invalidator<T>): Unsubscriber {
    const rcpSubscribes: SharedSubscriber[] = [];

    for (const subscriptionEvent of subscriptionEvents) {
      const rcpSubscribe = rpcBrowser.subscribe(subscriptionEvent, (_: unknown) => {
        updater().then(result => origWritable.set(result))
      });
      rcpSubscribes.push(rcpSubscribe);
    }

    updater()
      .then(v => origWritable.set(v))
      .catch((e: unknown) => console.error('failed at init store', String(e)));

    const unsubscribe = origWritable.subscribe(run, invalidate);
    return () => {
      rcpSubscribes.forEach(r => r.unsubscribe());
      unsubscribe();
    };
  }
  return {
    subscribe,
  };
}
