/*
 * Copyright 2018 Valery Leontyev. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 /**
  * Simple classical stack implementation
  */
export default class {
    constructor() {
        this.stack = [];
    }

    push(value) {
        this.stack.push(value);
    }

    pushOnTop(value) {
        this.remove(value);
        this.stack.push(value);
    }

    pop() {
        return this.stack.pop();
    }

    getTopmost() {
        return this.stack[this.stack.length - 1];
    }

    remove(value) {
        let index = this.stack.indexOf(value);
        if (index !== -1) {
            this.stack.splice(index, 1);
        }
    }

    has(value) {
        return this.stack.indexOf(value) !== -1;
    }
}