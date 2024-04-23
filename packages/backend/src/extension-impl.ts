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

import { Uri, window, version } from '@podman-desktop/api';
import { satisfies, minVersion, coerce } from 'semver';
import type {
  ExtensionContext,
  WebviewOptions,
  WebviewPanel,
} from '@podman-desktop/api';
import { RpcExtension } from '@shared/src/messages/MessageProxy';
import { ExtensionApiImpl } from './extension-api-impl';
import fs from 'node:fs';
import { engines } from '../package.json';

export class ExtensionImpl {
  readonly #extensionContext: ExtensionContext;
  #panel: WebviewPanel | undefined;

  #rpcExtension: RpcExtension | undefined;
  #extensionApi: ExtensionApiImpl | undefined;

  constructor(readonly extensionContext: ExtensionContext) {
    this.#extensionContext = extensionContext;
  }

  private checkVersion(): boolean {
    if (!version) return false;

    const current = coerce(version);
    if (!current) return false;

    if (current.major === 0 && current.minor === 0) {
      console.warn('nightlies version are not subject to version verification.');
      return true;
    }

    return satisfies(current, engines['podman-desktop']);
  }

  public async activate(): Promise<void> {
    console.log('starting extension template');

    if (!this.checkVersion()) {
      const min = minVersion(engines['podman-desktop']) ?? { version: 'unknown' };
      const current = version ?? 'unknown';
      throw new Error(
        `Extension is not compatible with Podman Desktop version below ${min.version}. Current ${current}`,
      );
    }

    const extensionUri = this.#extensionContext.extensionUri;

    // register webview
    this.#panel = window.createWebviewPanel('studio', '✨ Extension template', this.getWebviewOptions(extensionUri));
    this.#extensionContext.subscriptions.push(this.#panel);

    this.#rpcExtension = new RpcExtension(this.#panel.webview);

    // update html

    const indexHtmlUri = Uri.joinPath(extensionUri, 'media', 'index.html');
    const indexHtmlPath = indexHtmlUri.fsPath;

    let indexHtml = await fs.promises.readFile(indexHtmlPath, 'utf8');

    // replace links with webView Uri links
    // in the content <script type="module" crossorigin src="./index-RKnfBG18.js"></script> replace src with webview.asWebviewUri
    const scriptLink = indexHtml.match(/<script.*?src="(.*?)".*?>/g);
    if (scriptLink) {
      scriptLink.forEach(link => {
        const src = link.match(/src="(.*?)"/);
        if (src) {
          const webviewSrc = this.#panel?.webview.asWebviewUri(Uri.joinPath(extensionUri, 'media', src[1]));
          if (!webviewSrc) throw new Error('undefined webviewSrc');
          indexHtml = indexHtml.replace(src[1], webviewSrc.toString());
        }
      });
    }

    // and now replace for css file as well
    const cssLink = indexHtml.match(/<link.*?href="(.*?)".*?>/g);
    if (cssLink) {
      cssLink.forEach(link => {
        const href = link.match(/href="(.*?)"/);
        if (href) {
          const webviewHref = this.#panel?.webview.asWebviewUri(Uri.joinPath(extensionUri, 'media', href[1]));
          if (!webviewHref)
            throw new Error('Something went wrong while replacing links with webView Uri links: undefined webviewHref');
          indexHtml = indexHtml.replace(href[1], webviewHref.toString());
        }
      });
    }

    this.#panel.webview.html = indexHtml;

    // Creating ExtensionApiImpl
    this.#extensionApi = new ExtensionApiImpl(this.#panel.webview);

    // Register the instance
    this.#rpcExtension.registerInstance<ExtensionApiImpl>(ExtensionApiImpl, this.#extensionApi);
  }

  public async deactivate(): Promise<void> {
    console.log('stopping AI Lab extension');
  }

  getWebviewOptions(extensionUri: Uri): WebviewOptions {
    return {
      // Enable javascript in the webview
      // enableScripts: true,

      // And restrict the webview to only loading content from our extension's `media` directory.
      localResourceRoots: [Uri.joinPath(extensionUri, 'media')],
    };
  }
}
