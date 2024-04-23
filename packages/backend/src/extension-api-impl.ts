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

import type { ExtensionApi } from '@shared/src/ExtensionApi';
import type { ICounter } from '@shared/src/models/ICounter';
import type { Webview } from '@podman-desktop/api';
import { Messages } from '@shared/Messages';

export class ExtensionApiImpl implements ExtensionApi {
  #counters: ICounter[] = [{
    id: '0',
    value: 5,
  }];

  constructor(private webview: Webview) {}

  async ping(): Promise<string> {
    return 'pong';
  }

  async getCounters(): Promise<ICounter[]> {
    return this.#counters;
  }

  async incrementCounter(counterId: string): Promise<void> {
    const counter = this.#counters.find(counter => counter.id = counterId);
    if(counter === undefined)
      return;
    counter.value++;

    this.notifyCounter();
  }

  async decrementCounter(counterId: string): Promise<void> {
    const counter = this.#counters.find(counter => counter.id = counterId);
    if(counter === undefined)
      return;
    counter.value--;

    this.notifyCounter();
  }

  private notifyCounter(): void {
    this.webview.postMessage({
      id: Messages.EVENT_COUNTER_UPDATE,
      body: this.#counters,
    }).catch((err: unknown) => {
      console.error('Something went wrong', err);
    });
  }
}
