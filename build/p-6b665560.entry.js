import { h, F as Fragment, r as registerInstance, g as getElement } from './p-06d04c4b.js';
import { a as defaultApiKeyHolder, b as defaultCustomParametersHolder, d as defaultTheme } from './p-3b493ca1.js';

function isFunction(value) {
    return typeof value === 'function';
}

function createErrorClass(createImpl) {
    const _super = (instance) => {
        Error.call(instance);
        instance.stack = new Error().stack;
    };
    const ctorFunc = createImpl(_super);
    ctorFunc.prototype = Object.create(Error.prototype);
    ctorFunc.prototype.constructor = ctorFunc;
    return ctorFunc;
}

const UnsubscriptionError = createErrorClass((_super) => function UnsubscriptionErrorImpl(errors) {
    _super(this);
    this.message = errors
        ? `${errors.length} errors occurred during unsubscription:
${errors.map((err, i) => `${i + 1}) ${err.toString()}`).join('\n  ')}`
        : '';
    this.name = 'UnsubscriptionError';
    this.errors = errors;
});

function arrRemove(arr, item) {
    if (arr) {
        const index = arr.indexOf(item);
        0 <= index && arr.splice(index, 1);
    }
}

class Subscription {
    constructor(initialTeardown) {
        this.initialTeardown = initialTeardown;
        this.closed = false;
        this._parentage = null;
        this._finalizers = null;
    }
    unsubscribe() {
        let errors;
        if (!this.closed) {
            this.closed = true;
            const { _parentage } = this;
            if (_parentage) {
                this._parentage = null;
                if (Array.isArray(_parentage)) {
                    for (const parent of _parentage) {
                        parent.remove(this);
                    }
                }
                else {
                    _parentage.remove(this);
                }
            }
            const { initialTeardown: initialFinalizer } = this;
            if (isFunction(initialFinalizer)) {
                try {
                    initialFinalizer();
                }
                catch (e) {
                    errors = e instanceof UnsubscriptionError ? e.errors : [e];
                }
            }
            const { _finalizers } = this;
            if (_finalizers) {
                this._finalizers = null;
                for (const finalizer of _finalizers) {
                    try {
                        execFinalizer(finalizer);
                    }
                    catch (err) {
                        errors = errors !== null && errors !== void 0 ? errors : [];
                        if (err instanceof UnsubscriptionError) {
                            errors = [...errors, ...err.errors];
                        }
                        else {
                            errors.push(err);
                        }
                    }
                }
            }
            if (errors) {
                throw new UnsubscriptionError(errors);
            }
        }
    }
    add(teardown) {
        var _a;
        if (teardown && teardown !== this) {
            if (this.closed) {
                execFinalizer(teardown);
            }
            else {
                if (teardown instanceof Subscription) {
                    if (teardown.closed || teardown._hasParent(this)) {
                        return;
                    }
                    teardown._addParent(this);
                }
                (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
            }
        }
    }
    _hasParent(parent) {
        const { _parentage } = this;
        return _parentage === parent || (Array.isArray(_parentage) && _parentage.includes(parent));
    }
    _addParent(parent) {
        const { _parentage } = this;
        this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
    }
    _removeParent(parent) {
        const { _parentage } = this;
        if (_parentage === parent) {
            this._parentage = null;
        }
        else if (Array.isArray(_parentage)) {
            arrRemove(_parentage, parent);
        }
    }
    remove(teardown) {
        const { _finalizers } = this;
        _finalizers && arrRemove(_finalizers, teardown);
        if (teardown instanceof Subscription) {
            teardown._removeParent(this);
        }
    }
}
Subscription.EMPTY = (() => {
    const empty = new Subscription();
    empty.closed = true;
    return empty;
})();
const EMPTY_SUBSCRIPTION = Subscription.EMPTY;
function isSubscription(value) {
    return (value instanceof Subscription ||
        (value && 'closed' in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe)));
}
function execFinalizer(finalizer) {
    if (isFunction(finalizer)) {
        finalizer();
    }
    else {
        finalizer.unsubscribe();
    }
}

const config$1 = {
    onUnhandledError: null,
    onStoppedNotification: null,
    Promise: undefined,
    useDeprecatedSynchronousErrorHandling: false,
    useDeprecatedNextContext: false,
};

const timeoutProvider = {
    setTimeout(handler, timeout, ...args) {
        const { delegate } = timeoutProvider;
        if (delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) {
            return delegate.setTimeout(handler, timeout, ...args);
        }
        return setTimeout(handler, timeout, ...args);
    },
    clearTimeout(handle) {
        const { delegate } = timeoutProvider;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearTimeout) || clearTimeout)(handle);
    },
    delegate: undefined,
};

function reportUnhandledError(err) {
    timeoutProvider.setTimeout(() => {
        const { onUnhandledError } = config$1;
        if (onUnhandledError) {
            onUnhandledError(err);
        }
        else {
            throw err;
        }
    });
}

function noop() { }

const COMPLETE_NOTIFICATION = (() => createNotification('C', undefined, undefined))();
function errorNotification(error) {
    return createNotification('E', undefined, error);
}
function nextNotification(value) {
    return createNotification('N', value, undefined);
}
function createNotification(kind, value, error) {
    return {
        kind,
        value,
        error,
    };
}

function errorContext(cb) {
    {
        cb();
    }
}

class Subscriber extends Subscription {
    constructor(destination) {
        super();
        this.isStopped = false;
        if (destination) {
            this.destination = destination;
            if (isSubscription(destination)) {
                destination.add(this);
            }
        }
        else {
            this.destination = EMPTY_OBSERVER;
        }
    }
    static create(next, error, complete) {
        return new SafeSubscriber(next, error, complete);
    }
    next(value) {
        if (this.isStopped) {
            handleStoppedNotification(nextNotification(value), this);
        }
        else {
            this._next(value);
        }
    }
    error(err) {
        if (this.isStopped) {
            handleStoppedNotification(errorNotification(err), this);
        }
        else {
            this.isStopped = true;
            this._error(err);
        }
    }
    complete() {
        if (this.isStopped) {
            handleStoppedNotification(COMPLETE_NOTIFICATION, this);
        }
        else {
            this.isStopped = true;
            this._complete();
        }
    }
    unsubscribe() {
        if (!this.closed) {
            this.isStopped = true;
            super.unsubscribe();
            this.destination = null;
        }
    }
    _next(value) {
        this.destination.next(value);
    }
    _error(err) {
        try {
            this.destination.error(err);
        }
        finally {
            this.unsubscribe();
        }
    }
    _complete() {
        try {
            this.destination.complete();
        }
        finally {
            this.unsubscribe();
        }
    }
}
const _bind = Function.prototype.bind;
function bind(fn, thisArg) {
    return _bind.call(fn, thisArg);
}
class ConsumerObserver {
    constructor(partialObserver) {
        this.partialObserver = partialObserver;
    }
    next(value) {
        const { partialObserver } = this;
        if (partialObserver.next) {
            try {
                partialObserver.next(value);
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
    }
    error(err) {
        const { partialObserver } = this;
        if (partialObserver.error) {
            try {
                partialObserver.error(err);
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
        else {
            handleUnhandledError(err);
        }
    }
    complete() {
        const { partialObserver } = this;
        if (partialObserver.complete) {
            try {
                partialObserver.complete();
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
    }
}
class SafeSubscriber extends Subscriber {
    constructor(observerOrNext, error, complete) {
        super();
        let partialObserver;
        if (isFunction(observerOrNext) || !observerOrNext) {
            partialObserver = {
                next: (observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : undefined),
                error: error !== null && error !== void 0 ? error : undefined,
                complete: complete !== null && complete !== void 0 ? complete : undefined,
            };
        }
        else {
            let context;
            if (this && config$1.useDeprecatedNextContext) {
                context = Object.create(observerOrNext);
                context.unsubscribe = () => this.unsubscribe();
                partialObserver = {
                    next: observerOrNext.next && bind(observerOrNext.next, context),
                    error: observerOrNext.error && bind(observerOrNext.error, context),
                    complete: observerOrNext.complete && bind(observerOrNext.complete, context),
                };
            }
            else {
                partialObserver = observerOrNext;
            }
        }
        this.destination = new ConsumerObserver(partialObserver);
    }
}
function handleUnhandledError(error) {
    {
        reportUnhandledError(error);
    }
}
function defaultErrorHandler(err) {
    throw err;
}
function handleStoppedNotification(notification, subscriber) {
    const { onStoppedNotification } = config$1;
    onStoppedNotification && timeoutProvider.setTimeout(() => onStoppedNotification(notification, subscriber));
}
const EMPTY_OBSERVER = {
    closed: true,
    next: noop,
    error: defaultErrorHandler,
    complete: noop,
};

const observable = (() => (typeof Symbol === 'function' && Symbol.observable) || '@@observable')();

function identity(x) {
    return x;
}

function pipeFromArray(fns) {
    if (fns.length === 0) {
        return identity;
    }
    if (fns.length === 1) {
        return fns[0];
    }
    return function piped(input) {
        return fns.reduce((prev, fn) => fn(prev), input);
    };
}

class Observable {
    constructor(subscribe) {
        if (subscribe) {
            this._subscribe = subscribe;
        }
    }
    lift(operator) {
        const observable = new Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    }
    subscribe(observerOrNext, error, complete) {
        const subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
        errorContext(() => {
            const { operator, source } = this;
            subscriber.add(operator
                ?
                    operator.call(subscriber, source)
                : source
                    ?
                        this._subscribe(subscriber)
                    :
                        this._trySubscribe(subscriber));
        });
        return subscriber;
    }
    _trySubscribe(sink) {
        try {
            return this._subscribe(sink);
        }
        catch (err) {
            sink.error(err);
        }
    }
    forEach(next, promiseCtor) {
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor((resolve, reject) => {
            const subscriber = new SafeSubscriber({
                next: (value) => {
                    try {
                        next(value);
                    }
                    catch (err) {
                        reject(err);
                        subscriber.unsubscribe();
                    }
                },
                error: reject,
                complete: resolve,
            });
            this.subscribe(subscriber);
        });
    }
    _subscribe(subscriber) {
        var _a;
        return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
    }
    [observable]() {
        return this;
    }
    pipe(...operations) {
        return pipeFromArray(operations)(this);
    }
    toPromise(promiseCtor) {
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor((resolve, reject) => {
            let value;
            this.subscribe((x) => (value = x), (err) => reject(err), () => resolve(value));
        });
    }
}
Observable.create = (subscribe) => {
    return new Observable(subscribe);
};
function getPromiseCtor(promiseCtor) {
    var _a;
    return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config$1.Promise) !== null && _a !== void 0 ? _a : Promise;
}
function isObserver(value) {
    return value && isFunction(value.next) && isFunction(value.error) && isFunction(value.complete);
}
function isSubscriber(value) {
    return (value && value instanceof Subscriber) || (isObserver(value) && isSubscription(value));
}

function hasLift(source) {
    return isFunction(source === null || source === void 0 ? void 0 : source.lift);
}
function operate(init) {
    return (source) => {
        if (hasLift(source)) {
            return source.lift(function (liftedSource) {
                try {
                    return init(liftedSource, this);
                }
                catch (err) {
                    this.error(err);
                }
            });
        }
        throw new TypeError('Unable to lift unknown Observable type');
    };
}

function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
    return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
}
class OperatorSubscriber extends Subscriber {
    constructor(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
        super(destination);
        this.onFinalize = onFinalize;
        this.shouldUnsubscribe = shouldUnsubscribe;
        this._next = onNext
            ? function (value) {
                try {
                    onNext(value);
                }
                catch (err) {
                    destination.error(err);
                }
            }
            : super._next;
        this._error = onError
            ? function (err) {
                try {
                    onError(err);
                }
                catch (err) {
                    destination.error(err);
                }
                finally {
                    this.unsubscribe();
                }
            }
            : super._error;
        this._complete = onComplete
            ? function () {
                try {
                    onComplete();
                }
                catch (err) {
                    destination.error(err);
                }
                finally {
                    this.unsubscribe();
                }
            }
            : super._complete;
    }
    unsubscribe() {
        var _a;
        if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
            const { closed } = this;
            super.unsubscribe();
            !closed && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
        }
    }
}

const ObjectUnsubscribedError = createErrorClass((_super) => function ObjectUnsubscribedErrorImpl() {
    _super(this);
    this.name = 'ObjectUnsubscribedError';
    this.message = 'object unsubscribed';
});

class Subject extends Observable {
    constructor() {
        super();
        this.closed = false;
        this.currentObservers = null;
        this.observers = [];
        this.isStopped = false;
        this.hasError = false;
        this.thrownError = null;
    }
    lift(operator) {
        const subject = new AnonymousSubject(this, this);
        subject.operator = operator;
        return subject;
    }
    _throwIfClosed() {
        if (this.closed) {
            throw new ObjectUnsubscribedError();
        }
    }
    next(value) {
        errorContext(() => {
            this._throwIfClosed();
            if (!this.isStopped) {
                if (!this.currentObservers) {
                    this.currentObservers = Array.from(this.observers);
                }
                for (const observer of this.currentObservers) {
                    observer.next(value);
                }
            }
        });
    }
    error(err) {
        errorContext(() => {
            this._throwIfClosed();
            if (!this.isStopped) {
                this.hasError = this.isStopped = true;
                this.thrownError = err;
                const { observers } = this;
                while (observers.length) {
                    observers.shift().error(err);
                }
            }
        });
    }
    complete() {
        errorContext(() => {
            this._throwIfClosed();
            if (!this.isStopped) {
                this.isStopped = true;
                const { observers } = this;
                while (observers.length) {
                    observers.shift().complete();
                }
            }
        });
    }
    unsubscribe() {
        this.isStopped = this.closed = true;
        this.observers = this.currentObservers = null;
    }
    get observed() {
        var _a;
        return ((_a = this.observers) === null || _a === void 0 ? void 0 : _a.length) > 0;
    }
    _trySubscribe(subscriber) {
        this._throwIfClosed();
        return super._trySubscribe(subscriber);
    }
    _subscribe(subscriber) {
        this._throwIfClosed();
        this._checkFinalizedStatuses(subscriber);
        return this._innerSubscribe(subscriber);
    }
    _innerSubscribe(subscriber) {
        const { hasError, isStopped, observers } = this;
        if (hasError || isStopped) {
            return EMPTY_SUBSCRIPTION;
        }
        this.currentObservers = null;
        observers.push(subscriber);
        return new Subscription(() => {
            this.currentObservers = null;
            arrRemove(observers, subscriber);
        });
    }
    _checkFinalizedStatuses(subscriber) {
        const { hasError, thrownError, isStopped } = this;
        if (hasError) {
            subscriber.error(thrownError);
        }
        else if (isStopped) {
            subscriber.complete();
        }
    }
    asObservable() {
        const observable = new Observable();
        observable.source = this;
        return observable;
    }
}
Subject.create = (destination, source) => {
    return new AnonymousSubject(destination, source);
};
class AnonymousSubject extends Subject {
    constructor(destination, source) {
        super();
        this.destination = destination;
        this.source = source;
    }
    next(value) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.call(_a, value);
    }
    error(err) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.call(_a, err);
    }
    complete() {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.complete) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    _subscribe(subscriber) {
        var _a, _b;
        return (_b = (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber)) !== null && _b !== void 0 ? _b : EMPTY_SUBSCRIPTION;
    }
}

class BehaviorSubject extends Subject {
    constructor(_value) {
        super();
        this._value = _value;
    }
    get value() {
        return this.getValue();
    }
    _subscribe(subscriber) {
        const subscription = super._subscribe(subscriber);
        !subscription.closed && subscriber.next(this._value);
        return subscription;
    }
    getValue() {
        const { hasError, thrownError, _value } = this;
        if (hasError) {
            throw thrownError;
        }
        this._throwIfClosed();
        return _value;
    }
    next(value) {
        super.next((this._value = value));
    }
}

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

const isArrayLike = ((x) => x && typeof x.length === 'number' && typeof x !== 'function');

function isPromise(value) {
    return isFunction(value === null || value === void 0 ? void 0 : value.then);
}

function isInteropObservable(input) {
    return isFunction(input[observable]);
}

function isAsyncIterable(obj) {
    return Symbol.asyncIterator && isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
}

function createInvalidObservableTypeError(input) {
    return new TypeError(`You provided ${input !== null && typeof input === 'object' ? 'an invalid object' : `'${input}'`} where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.`);
}

function getSymbolIterator() {
    if (typeof Symbol !== 'function' || !Symbol.iterator) {
        return '@@iterator';
    }
    return Symbol.iterator;
}
const iterator = getSymbolIterator();

function isIterable(input) {
    return isFunction(input === null || input === void 0 ? void 0 : input[iterator]);
}

function readableStreamLikeToAsyncGenerator(readableStream) {
    return __asyncGenerator(this, arguments, function* readableStreamLikeToAsyncGenerator_1() {
        const reader = readableStream.getReader();
        try {
            while (true) {
                const { value, done } = yield __await(reader.read());
                if (done) {
                    return yield __await(void 0);
                }
                yield yield __await(value);
            }
        }
        finally {
            reader.releaseLock();
        }
    });
}
function isReadableStreamLike(obj) {
    return isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
}

function innerFrom(input) {
    if (input instanceof Observable) {
        return input;
    }
    if (input != null) {
        if (isInteropObservable(input)) {
            return fromInteropObservable(input);
        }
        if (isArrayLike(input)) {
            return fromArrayLike(input);
        }
        if (isPromise(input)) {
            return fromPromise(input);
        }
        if (isAsyncIterable(input)) {
            return fromAsyncIterable(input);
        }
        if (isIterable(input)) {
            return fromIterable(input);
        }
        if (isReadableStreamLike(input)) {
            return fromReadableStreamLike(input);
        }
    }
    throw createInvalidObservableTypeError(input);
}
function fromInteropObservable(obj) {
    return new Observable((subscriber) => {
        const obs = obj[observable]();
        if (isFunction(obs.subscribe)) {
            return obs.subscribe(subscriber);
        }
        throw new TypeError('Provided object does not correctly implement Symbol.observable');
    });
}
function fromArrayLike(array) {
    return new Observable((subscriber) => {
        for (let i = 0; i < array.length && !subscriber.closed; i++) {
            subscriber.next(array[i]);
        }
        subscriber.complete();
    });
}
function fromPromise(promise) {
    return new Observable((subscriber) => {
        promise
            .then((value) => {
            if (!subscriber.closed) {
                subscriber.next(value);
                subscriber.complete();
            }
        }, (err) => subscriber.error(err))
            .then(null, reportUnhandledError);
    });
}
function fromIterable(iterable) {
    return new Observable((subscriber) => {
        for (const value of iterable) {
            subscriber.next(value);
            if (subscriber.closed) {
                return;
            }
        }
        subscriber.complete();
    });
}
function fromAsyncIterable(asyncIterable) {
    return new Observable((subscriber) => {
        process(asyncIterable, subscriber).catch((err) => subscriber.error(err));
    });
}
function fromReadableStreamLike(readableStream) {
    return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream));
}
function process(asyncIterable, subscriber) {
    var asyncIterable_1, asyncIterable_1_1;
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            for (asyncIterable_1 = __asyncValues(asyncIterable); asyncIterable_1_1 = yield asyncIterable_1.next(), !asyncIterable_1_1.done;) {
                const value = asyncIterable_1_1.value;
                subscriber.next(value);
                if (subscriber.closed) {
                    return;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return)) yield _a.call(asyncIterable_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        subscriber.complete();
    });
}

function executeSchedule(parentSubscription, scheduler, work, delay = 0, repeat = false) {
    const scheduleSubscription = scheduler.schedule(function () {
        work();
        if (repeat) {
            parentSubscription.add(this.schedule(null, delay));
        }
        else {
            this.unsubscribe();
        }
    }, delay);
    parentSubscription.add(scheduleSubscription);
    if (!repeat) {
        return scheduleSubscription;
    }
}

function observeOn(scheduler, delay = 0) {
    return operate((source, subscriber) => {
        source.subscribe(createOperatorSubscriber(subscriber, (value) => executeSchedule(subscriber, scheduler, () => subscriber.next(value), delay), () => executeSchedule(subscriber, scheduler, () => subscriber.complete(), delay), (err) => executeSchedule(subscriber, scheduler, () => subscriber.error(err), delay)));
    });
}

function subscribeOn(scheduler, delay = 0) {
    return operate((source, subscriber) => {
        subscriber.add(scheduler.schedule(() => source.subscribe(subscriber), delay));
    });
}

function scheduleObservable(input, scheduler) {
    return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}

function schedulePromise(input, scheduler) {
    return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}

function scheduleArray(input, scheduler) {
    return new Observable((subscriber) => {
        let i = 0;
        return scheduler.schedule(function () {
            if (i === input.length) {
                subscriber.complete();
            }
            else {
                subscriber.next(input[i++]);
                if (!subscriber.closed) {
                    this.schedule();
                }
            }
        });
    });
}

function scheduleIterable(input, scheduler) {
    return new Observable((subscriber) => {
        let iterator$1;
        executeSchedule(subscriber, scheduler, () => {
            iterator$1 = input[iterator]();
            executeSchedule(subscriber, scheduler, () => {
                let value;
                let done;
                try {
                    ({ value, done } = iterator$1.next());
                }
                catch (err) {
                    subscriber.error(err);
                    return;
                }
                if (done) {
                    subscriber.complete();
                }
                else {
                    subscriber.next(value);
                }
            }, 0, true);
        });
        return () => isFunction(iterator$1 === null || iterator$1 === void 0 ? void 0 : iterator$1.return) && iterator$1.return();
    });
}

function scheduleAsyncIterable(input, scheduler) {
    if (!input) {
        throw new Error('Iterable cannot be null');
    }
    return new Observable((subscriber) => {
        executeSchedule(subscriber, scheduler, () => {
            const iterator = input[Symbol.asyncIterator]();
            executeSchedule(subscriber, scheduler, () => {
                iterator.next().then((result) => {
                    if (result.done) {
                        subscriber.complete();
                    }
                    else {
                        subscriber.next(result.value);
                    }
                });
            }, 0, true);
        });
    });
}

function scheduleReadableStreamLike(input, scheduler) {
    return scheduleAsyncIterable(readableStreamLikeToAsyncGenerator(input), scheduler);
}

function scheduled(input, scheduler) {
    if (input != null) {
        if (isInteropObservable(input)) {
            return scheduleObservable(input, scheduler);
        }
        if (isArrayLike(input)) {
            return scheduleArray(input, scheduler);
        }
        if (isPromise(input)) {
            return schedulePromise(input, scheduler);
        }
        if (isAsyncIterable(input)) {
            return scheduleAsyncIterable(input, scheduler);
        }
        if (isIterable(input)) {
            return scheduleIterable(input, scheduler);
        }
        if (isReadableStreamLike(input)) {
            return scheduleReadableStreamLike(input, scheduler);
        }
    }
    throw createInvalidObservableTypeError(input);
}

function from(input, scheduler) {
    return scheduler ? scheduled(input, scheduler) : innerFrom(input);
}

function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
    const buffer = [];
    let active = 0;
    let index = 0;
    let isComplete = false;
    const checkComplete = () => {
        if (isComplete && !buffer.length && !active) {
            subscriber.complete();
        }
    };
    const outerNext = (value) => (active < concurrent ? doInnerSub(value) : buffer.push(value));
    const doInnerSub = (value) => {
        expand && subscriber.next(value);
        active++;
        let innerComplete = false;
        innerFrom(project(value, index++)).subscribe(createOperatorSubscriber(subscriber, (innerValue) => {
            onBeforeNext === null || onBeforeNext === void 0 ? void 0 : onBeforeNext(innerValue);
            if (expand) {
                outerNext(innerValue);
            }
            else {
                subscriber.next(innerValue);
            }
        }, () => {
            innerComplete = true;
        }, undefined, () => {
            if (innerComplete) {
                try {
                    active--;
                    while (buffer.length && active < concurrent) {
                        const bufferedValue = buffer.shift();
                        if (innerSubScheduler) {
                            executeSchedule(subscriber, innerSubScheduler, () => doInnerSub(bufferedValue));
                        }
                        else {
                            doInnerSub(bufferedValue);
                        }
                    }
                    checkComplete();
                }
                catch (err) {
                    subscriber.error(err);
                }
            }
        }));
    };
    source.subscribe(createOperatorSubscriber(subscriber, outerNext, () => {
        isComplete = true;
        checkComplete();
    }));
    return () => {
        additionalFinalizer === null || additionalFinalizer === void 0 ? void 0 : additionalFinalizer();
    };
}

function mergeScan(accumulator, seed, concurrent = Infinity) {
    return operate((source, subscriber) => {
        let state = seed;
        return mergeInternals(source, subscriber, (value, index) => accumulator(state, value, index), concurrent, (value) => {
            state = value;
        }, false, undefined, () => (state = null));
    });
}

var SeatClass$1;
(function (SeatClass) {
  SeatClass["Economy"] = "ECONOMY";
  SeatClass["PremiumEconomy"] = "PREMIUM_ECONOMY";
  SeatClass["ComfortEconomy"] = "COMFORT_ECONOMY";
  SeatClass["Business"] = "BUSINESS";
  SeatClass["First"] = "FIRST";
})(SeatClass$1 || (SeatClass$1 = {}));
const defaultOpts = {
  basicSearch: true,
  airline: "",
  flightNumber: "",
  numberOfFlights: 1,
  seatClass: SeatClass$1.Economy,
  numberOfPassengers: 1,
  departureAirport: "",
  arrivalAirport: "",
};
class SearchFlights {
  constructor(opts = {}) {
    const options = Object.assign(Object.assign({}, defaultOpts), opts);
    this._airline = options.airline;
    this._flightNumber = options.flightNumber;
    this._numberOfFlights = options.numberOfFlights;
    this._seatClass = options.seatClass;
    this._numberOfPassengers = options.numberOfPassengers;
    this._departureAirport = options.departureAirport;
    this._arrivalAirport = options.arrivalAirport;
    this._basicSearch = options.basicSearch;
  }
  toOpts() {
    return {
      airline: this._airline,
      flightNumber: this._flightNumber,
      numberOfFlights: +this._numberOfFlights,
      seatClass: this._seatClass,
      numberOfPassengers: +this._numberOfPassengers,
      departureAirport: this._departureAirport,
      arrivalAirport: this._arrivalAirport,
      basicSearch: this._basicSearch,
    };
  }
  get airline() {
    return this._airline;
  }
  set airline(airline) {
    this._airline = airline;
  }
  get flightNumber() {
    return this._flightNumber;
  }
  set flightNumber(flightNumber) {
    this._flightNumber = flightNumber;
  }
  get numberOfFlights() {
    return this._numberOfFlights;
  }
  set numberOfFlights(numberOfFlights) {
    this._numberOfFlights = numberOfFlights;
  }
  get seatClass() {
    return this._seatClass;
  }
  set seatClass(seatClass) {
    this._seatClass = seatClass;
  }
  get numberOfPassengers() {
    return this._numberOfPassengers;
  }
  set numberOfPassengers(numberOfPassengers) {
    this._numberOfPassengers = numberOfPassengers;
  }
  get departureAirport() {
    return this._departureAirport;
  }
  set departureAirport(departureAirport) {
    this._departureAirport = departureAirport;
  }
  set arrivalAirport(arrivalAirport) {
    this._arrivalAirport = arrivalAirport;
  }
  get arrivalAirport() {
    return this._arrivalAirport;
  }
  get basicSearch() {
    return this._basicSearch;
  }
  set basicSearch(basicSearch) {
    this._basicSearch = basicSearch;
  }
  sanitize() {
    return new SearchFlights({
      airline: this._airline,
      flightNumber: this._flightNumber,
      numberOfFlights: Math.max(+this._numberOfFlights, defaultOpts.numberOfFlights),
      seatClass: this._seatClass,
      numberOfPassengers: Math.max(+this._numberOfPassengers, defaultOpts.numberOfPassengers),
      departureAirport: this._departureAirport,
      arrivalAirport: this._arrivalAirport,
      basicSearch: this._basicSearch,
    });
  }
}

const defaultSeatClassOpts = {
  name: "",
  seats: 0,
  emissionsPerSeat: 0,
};
const defaultSearchResultsOpts = {
  emissionsPerPassenger: 0,
  emissionsTotal: 0,
  aircraftTypeName: "",
  distance: 0,
  aircraftRegistration: "",
  flightsOver12Months: 0,
  seatClasses: [],
};
class SeatClass {
  constructor(opts = {}) {
    const options = Object.assign(Object.assign({}, defaultSeatClassOpts), opts);
    this._name = options.name;
    this._seats = options.seats;
    this._emissionsPerSeat = options.emissionsPerSeat;
  }
  toOpts() {
    return {
      name: this._name,
      seats: this._seats,
      emissionsPerSeat: this._emissionsPerSeat,
    };
  }
  get name() {
    return this._name;
  }
  get seats() {
    return this._seats;
  }
  get emissionsPerSeat() {
    return this._emissionsPerSeat;
  }
}
class SearchResults {
  constructor(opts = {}) {
    const options = Object.assign(Object.assign({}, defaultSearchResultsOpts), opts);
    this._emissionsPerPassenger = options.emissionsPerPassenger;
    this._emissionsTotal = options.emissionsTotal;
    this._aircraftTypeName = options.aircraftTypeName;
    this._distance = options.distance;
    this._aircraftRegistration = options.aircraftRegistration;
    this._flightsOver12Months = options.flightsOver12Months;
    this._seatClasses = (options.seatClasses || []).map((seatClass) => new SeatClass(seatClass));
  }
  toOpts() {
    return {
      emissionsPerPassenger: this._emissionsPerPassenger,
      emissionsTotal: this._emissionsTotal,
      aircraftTypeName: this._aircraftTypeName,
      distance: this._distance,
      aircraftRegistration: this._aircraftRegistration,
      flightsOver12Months: this._flightsOver12Months,
      seatClasses: this._seatClasses.map((seatClass) => seatClass.toOpts()),
    };
  }
  get emissionsPerPassenger() {
    return this._emissionsPerPassenger;
  }
  get emissionsTotal() {
    return this._emissionsTotal;
  }
  get aircraftTypeName() {
    return this._aircraftTypeName;
  }
  get distance() {
    return this._distance;
  }
  get aircraftRegistration() {
    return this._aircraftRegistration;
  }
  get flightsOver12Months() {
    return this._flightsOver12Months;
  }
  get seatClasses() {
    return [...this._seatClasses];
  }
}

class Logger {
  constructor(prefix) {
    this._prefix = prefix;
  }
  log(message) {
  }
  error(message) {
  }
  warn(message) {
  }
}
function createLogger(prefix) {
  return new Logger(prefix);
}

const config = {
  serviceBaseUrl: "https://api.pace-esg.com/co2footprint/v1/api",
};

const RESPONSE_OK = 200;
const DEFAULT_ERROR_MESSAGE = "Request could not be performed.";
const NO_CONTENT = {
  statusCode: 204,
  message: "We're sorry, we are unable to locate this route on any commercial aircraft.",
};
const MULTIPLE_CONTENT = {
  statusCode: 207,
  message: "It looks like the airline in question has used this flight number on multiple routes. Please enter in the route details manually.",
};
const BAD_REQUEST = {
  statusCode: 400,
  message: "Invalid input: Please ensure all input fields have been populated.",
};
const NOT_FOUND = {
  statusCode: 404,
  message: "Flight number does not exist. Please enter in the route details manually.",
};
const TRIAL_EXCEEDED = {
  statusCode: 429,
  message: "Trial usage exceeded",
};
const SERVER_ERROR = {
  statusCode: 500,
  message: "Looks like we have hit some turbulence! Please try again soon.",
};
const ERROR_RESPONSES = [
  NO_CONTENT,
  MULTIPLE_CONTENT,
  BAD_REQUEST,
  TRIAL_EXCEEDED,
  NOT_FOUND,
  SERVER_ERROR,
];

class SearchService {
  constructor(_config, apiKeyHolder, customParamentersHolder) {
    this._config = _config;
    this.apiKeyHolder = apiKeyHolder;
    this.customParamentersHolder = customParamentersHolder;
    this.logger = createLogger("SearchService");
  }
  async search(params) {
    let response;
    if (params.basicSearch) {
      response = await this.searchByFlightNumber(params);
    }
    else {
      response = await this.searchByRoute(params);
    }
    return {
      flightNumber: response.sourceFlightNumber,
      aircraftTypeName: response.aircraftModel,
      distance: response.distanceKm,
      flightsOver12Months: response.flightCycles,
      aircraftRegistration: response.aircraftRegistration,
      seatClasses: [
        {
          name: "First class",
          emissionsPerSeat: response.cO2PerSeatFirst,
          seats: response.seatsFirstClass,
          type: SeatClass$1.First,
        },
        {
          name: "Business class",
          emissionsPerSeat: response.cO2PerSeatBusiness,
          seats: response.seatsBusiness,
          type: SeatClass$1.Business,
        },
        {
          name: "Premium economy",
          emissionsPerSeat: response.cO2PerSeatPremiumEconomy,
          seats: response.seatsPremiumEconomy,
          type: SeatClass$1.PremiumEconomy,
        },
        {
          name: "Comfort economy",
          emissionsPerSeat: response.cO2PerSeatEconomyComfort,
          seats: response.seatsEconomyComfort,
          type: SeatClass$1.ComfortEconomy,
        },
        {
          name: "Economy",
          emissionsPerSeat: response.cO2PerSeatEconomy,
          seats: response.seatsEconomy,
          type: SeatClass$1.Economy,
        },
      ],
      airline: { name: response.airline, code: response.airlineIataCode },
      originAirport: {
        name: response.originCity,
        code: response.originAirportCode,
      },
      destinationAirport: {
        name: response.destinationCity,
        code: response.destinationAirportCode,
      },
      errorMessage: response.errorMessage,
    };
  }
  async searchByFlightNumber(params) {
    this.logger.log(`searching flights by flight number with ${JSON.stringify(params)}`);
    const response = await fetch(`${this._config.serviceBaseUrl}/co2footprint/calculate?flightNumber=${params.flightNumber}&applyLoadFactor=${this.customParamentersHolder.isLoadFactorApplicable()}`, {
      headers: {
        "x-api-key": this.apiKeyHolder.getApiKey(),
      },
    });
    return await this.handleResponse(response);
  }
  async searchByRoute(params) {
    this.logger.log(`searching flights by route with ${JSON.stringify(params)}`);
    const response = await fetch(`${this._config.serviceBaseUrl}/co2footprint/calculate?airline=${params.airline}&origin=${params.departureAirport}&destination=${params.arrivalAirport}&applyLoadFactor=${this.customParamentersHolder.isLoadFactorApplicable()}`, {
      headers: {
        "x-api-key": this.apiKeyHolder.getApiKey(),
      },
    });
    return await this.handleResponse(response);
  }
  async handleResponse(response) {
    if (response.status === RESPONSE_OK) {
      return await response.json();
    }
    const error = ERROR_RESPONSES.filter((error) => error.statusCode === response.status);
    if (error.length > 0) {
      return {
        errorMessage: error[0],
      };
    }
    return {
      errorMessage: {
        statusCode: response.status,
        message: DEFAULT_ERROR_MESSAGE,
      },
    };
  }
}
const searchService = new SearchService(config, defaultApiKeyHolder, defaultCustomParametersHolder);

class AirportService {
  constructor(_config, apiKeyHolder) {
    this._config = _config;
    this.apiKeyHolder = apiKeyHolder;
    this.allAirports = null;
  }
  async loadAllAirlines() {
    if (this.allAirports === null) {
      this.allAirports = fetch(`${this._config.serviceBaseUrl}/co2footprint/airports`, {
        headers: {
          "x-api-key": this.apiKeyHolder.getApiKey(),
        },
      }).then((res) => res.json());
    }
    return this.allAirports;
  }
  async search(query = "") {
    const allAirlines = await this.loadAllAirlines();
    return allAirlines.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.iataCode.toLowerCase().includes(query.toLowerCase()));
  }
}
const defaultAirportService = new AirportService(config, defaultApiKeyHolder);

class AirlineService {
  constructor(_config, apiKeyHolder) {
    this._config = _config;
    this.apiKeyHolder = apiKeyHolder;
    this.allAirlines = null;
  }
  async loadAllAirlines() {
    if (this.allAirlines === null) {
      this.allAirlines = fetch(`${this._config.serviceBaseUrl}/co2footprint/airlines`, {
        headers: {
          "x-api-key": this.apiKeyHolder.getApiKey(),
        },
      }).then((res) => res.json());
    }
    return this.allAirlines;
  }
  async search(query = "") {
    const allAirlines = await this.loadAllAirlines();
    return allAirlines.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.icaoCode.toLowerCase().includes(query.toLowerCase()));
  }
}
const defaultAirlineService = new AirlineService(config, defaultApiKeyHolder);

const initialSearchFlightState = {
  basicSearch: true,
  seatClass: SeatClass$1.Economy,
  numberOfFlights: 1,
  numberOfPassengers: 1,
};
const initialState = {
  searchFlight: new SearchFlights(initialSearchFlightState),
  originAirports: [],
  destinationAirports: [],
  airlines: [],
  loading: false,
  loadingAirlines: false,
  loadingOriginAirports: false,
  loadingDestinationAirports: false,
  submitted: false,
  displayAircraftDiagram: false,
  results: new SearchResults(),
  error: undefined,
};
var ActionTypes;
(function (ActionTypes) {
  ActionTypes["SEARCH_FLIGHTS"] = "SEARCH_FLIGHTS";
  ActionTypes["UPDATE_SEARCH_FLIGHTS"] = "UPDATE_SEARCH_FLIGHTS";
  ActionTypes["SEARCH_ORIGIN_AIRPORT"] = "SEARCH_ORIGIN_AIRPORT";
  ActionTypes["SEARCH_DESTINATION_AIRPORT"] = "SEARCH_DESTINATION_AIRPORT";
  ActionTypes["SEARCH_AIRLINES"] = "SEARCH_AIRLINES";
  ActionTypes["RESET"] = "RESET";
  ActionTypes["SWITCH_RESULTS_TAB"] = "SWITCH_RESULTS_TAB";
  ActionTypes["HIDE_MODAL"] = "HIDE_MODAL";
})(ActionTypes || (ActionTypes = {}));
class SearchFlightsStore {
  constructor(initial = initialState, _searchService = searchService, _airportService = defaultAirportService, _airlineService = defaultAirlineService, _logger = createLogger("SearchFlightsStore")) {
    this._searchService = _searchService;
    this._airportService = _airportService;
    this._airlineService = _airlineService;
    this._logger = _logger;
    this.actionSubject = new Subject();
    this._state = new BehaviorSubject(initial);
    this.actionSubject
      .pipe(mergeScan((acc, value) => from(this.handleAction(acc, value)), this._state.getValue()))
      .subscribe((newState) => {
      this._state.next(newState);
    });
  }
  async handleAction(state, action) {
    const newState = {};
    switch (action.type) {
      case ActionTypes.SEARCH_FLIGHTS:
        this.setLoading("loading");
        const searchResultState = await this.searchFlights(state.searchFlight);
        Object.assign(newState, searchResultState);
        break;
      case ActionTypes.UPDATE_SEARCH_FLIGHTS:
        newState.searchFlight = this.updateSearchFlights(state.searchFlight, action.payload);
        break;
      case ActionTypes.RESET:
        Object.assign(newState, initialState);
        break;
      case ActionTypes.SEARCH_ORIGIN_AIRPORT:
        this.setLoading("loadingOriginAirports");
        newState.originAirports = await this.searchAirport(action.payload);
        newState.loadingOriginAirports = false;
        break;
      case ActionTypes.SEARCH_DESTINATION_AIRPORT:
        this.setLoading("loadingDestinationAirports");
        newState.destinationAirports = await this.searchAirport(action.payload);
        newState.loadingDestinationAirports = false;
        break;
      case ActionTypes.SEARCH_AIRLINES:
        this.setLoading("loadingAirlines");
        newState.airlines = await this.searchAirline(action.payload);
        newState.loadingAirlines = false;
        break;
      case ActionTypes.SWITCH_RESULTS_TAB:
        newState.displayAircraftDiagram = !state.displayAircraftDiagram;
        break;
      case ActionTypes.HIDE_MODAL:
        Object.assign(newState, initialState, {
          searchFlight: new SearchFlights(Object.assign(Object.assign({}, initialSearchFlightState), action.payload)),
          error: undefined,
        });
        break;
    }
    return Object.assign(Object.assign({}, state), newState);
  }
  subscribe(observerOrNext) {
    return this._state.subscribe(observerOrNext);
  }
  dispatch(action) {
    this.actionSubject.next(action);
  }
  // actions
  setLoading(property) {
    const currentState = Object.assign({}, this._state.getValue());
    currentState[property] = true;
    this._state.next(currentState);
  }
  updateSearchFlights(state, update) {
    return new SearchFlights(Object.assign(Object.assign({}, state.toOpts()), update)).sanitize();
  }
  async searchAirport(query) {
    const airports = await this._airportService.search(query);
    return airports.map((airport) => ({
      name: airport.name,
      code: airport.iataCode,
    }));
  }
  async searchAirline(query) {
    const airlines = await this._airlineService.search(query);
    return airlines.map((airline) => ({
      name: airline.name,
      code: airline.icaoCode,
    }));
  }
  async searchFlights(searchFlights) {
    try {
      const results = await this._searchService.search(searchFlights);
      if (results.errorMessage) {
        return {
          submitted: true,
          loading: false,
          error: results.errorMessage,
        };
      }
      const emissionsPerPassenger = results.seatClasses.find((x) => x.type === searchFlights.seatClass).emissionsPerSeat;
      return {
        submitted: true,
        loading: false,
        airlines: [{ name: results.airline.name, code: results.airline.code }],
        originAirports: [
          {
            name: results.originAirport.name,
            code: results.originAirport.code,
          },
        ],
        destinationAirports: [
          {
            name: results.destinationAirport.name,
            code: results.destinationAirport.code,
          },
        ],
        searchFlight: new SearchFlights(Object.assign(Object.assign({}, searchFlights.toOpts()), { airline: results.airline.code, arrivalAirport: results.destinationAirport.code, departureAirport: results.originAirport.code, basicSearch: false, flightNumber: results.flightNumber })),
        results: new SearchResults({
          aircraftTypeName: results.aircraftTypeName,
          distance: results.distance,
          emissionsPerPassenger: emissionsPerPassenger,
          emissionsTotal: emissionsPerPassenger *
            searchFlights.numberOfFlights *
            searchFlights.numberOfPassengers,
          flightsOver12Months: results.flightsOver12Months,
          aircraftRegistration: results.aircraftRegistration,
          seatClasses: results.seatClasses.map((seatClassResult) => {
            return {
              name: seatClassResult.name,
              emissionsPerSeat: seatClassResult.emissionsPerSeat,
              seats: seatClassResult.seats,
            };
          }),
        }),
      };
    }
    catch (err) {
      this._logger.error(err);
      return {
        error: err,
      };
    }
  }
}
const searchFlightStore = new SearchFlightsStore();
const dispatch = (action) => searchFlightStore.dispatch(action);

const ModalBox = (props) => (h(Fragment, null,
  h("div", { class: "row" },
    h("div", { class: "col-8" },
      h("div", { class: "modal-container__message" }, props.message),
      h("button", { class: "button button-primary", style: defaultTheme.getPrimaryButtonStyle(), onClick: () => dispatch({
          type: ActionTypes.HIDE_MODAL,
          payload: props.payload,
        }) }, "Close")))));

const messageBoxCss = ":host{color:#435266;font-family:\"Open Sans\", sans-serif}.select-arrow svg{cursor:pointer}.select-arrow svg:hover{fill:#f2f6f4;background-color:#435266;opacity:80%;border-radius:10px}input[type=text],input[type=number],select{padding:20px 15px;border-radius:10px;background-color:#f2f6f4;border:0;font-family:\"Open Sans\", sans-serif;font-size:1em}label{margin-bottom:5px}.form-control{display:flex;flex-direction:column}.form-control a{margin-top:5px}input[type=submit]{margin-top:20px}button,.button{width:100%;border:0;padding:20px 10px;border-radius:10px;margin-top:10px;cursor:pointer;font-weight:bold}button.button-primary,.button.button-primary{color:#ffffff;background-color:#2d9395}button.button-secondary,.button.button-secondary{border:1px solid #2d9395;color:#2d9395;background-color:#ffffff}a{text-decoration:underline;color:#2d9395;cursor:pointer}a:visited{color:#2d9395}.align-bottom{display:flex;align-items:self-end}.modal-container{position:absolute;top:0;left:0;padding:6px;height:100%;width:100%}.modal-container__content{z-index:2;position:relative;padding:2%;border-radius:10px;background-color:#f2f6f4;text-align:center;max-width:80%;left:8%;margin-top:10%}.modal-container__message{padding:25px}.modal-container__wrapper{position:absolute;top:0;left:0;width:100%;height:100%;background-color:#555;opacity:0.9;z-index:1;border-radius:10px}";

const MessageBoxComponent = class {
  constructor(hostRef) {
    registerInstance(this, hostRef);
    this.searchFlights = undefined;
  }
  componentWillLoad() {
    searchFlightStore.subscribe((searchFlights) => {
      this.searchFlights = Object.assign({}, searchFlights);
    });
  }
  requiresAdvanceSearch() {
    const advanceSearchCodes = [
      MULTIPLE_CONTENT.statusCode,
      NOT_FOUND.statusCode,
    ];
    return advanceSearchCodes.includes(this.searchFlights.error.statusCode);
  }
  render() {
    if (this.searchFlights.error) {
      // this.searchFlights.error.message
      const basicSearch = this.searchFlights.searchFlight.basicSearch, actionPayload = {
        basicSearch: basicSearch && !this.requiresAdvanceSearch(),
      };
      return (h("div", { class: "modal-container" }, h("div", { class: "modal-container__wrapper" }), h("div", { class: "modal-container__content", style: defaultTheme.getContentStyle() }, h(ModalBox, { message: this.searchFlights.error.message, payload: actionPayload }))));
    }
  }
  get el() { return getElement(this); }
};
MessageBoxComponent.style = messageBoxCss;

function floatToLocaleString(number) {
  return number === null || number === void 0 ? void 0 : number.toLocaleString(window.navigator.language, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
const EmissionsBoxComponent = ({ results, onAircraftTypeClick }) => {
  var _a;
  return (h(Fragment, null,
    h("div", { class: "row no-spacing" },
      h("div", { class: "col-8" },
        h("h2", null, "CO2 (KG)"))),
    h("div", { class: "row no-spacing" },
      h("div", { class: "col-8 emissions-figure" },
        h("span", { class: `digits-${floatToLocaleString(results.emissionsTotal).length}` }, floatToLocaleString(results.emissionsTotal))),
      h("div", { class: "col-8" },
        h("p", null,
          "Per passenger per flight:",
          " ", (_a = results.emissionsPerPassenger) === null || _a === void 0 ? void 0 :
          _a.toLocaleString(window.navigator.language, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          " ",
          "CO2 (KG)"))),
    h("div", { class: "row" }),
    h("div", { class: "row" },
      h("div", { class: "col-8" },
        h("h2", null, "AIRCRAFT TYPE"),
        h("p", null, "(Click below to see the aircraft details)"),
        h("p", null,
          h("a", { style: defaultTheme.getLinkStyle(), onClick: () => onAircraftTypeClick() }, results.aircraftTypeName)))),
    h("div", { class: "row" },
      h("div", { class: "col-8" },
        h("h2", null, "DISTANCE"),
        h("p", null,
          results.distance.toLocaleString(),
          " KM")))));
};

const EmptyBoxComponent = () => (h(Fragment, null,
  h("div", { slot: "inner-box" },
    h("div", { class: "row" },
      h("div", { class: "col-8" },
        h("h2", null, "CO2 (KG)"))),
    h("div", { class: "row" },
      h("div", { class: "col-8 emissions-figure" },
        h("span", null, "00.00"))))));

const SeatsBoxComponent = ({ results, }) => (h(Fragment, null,
  h("div", { class: "row no-spacing" },
    h("div", { class: "col-8" },
      h("h2", null, "AIRCRAFT DETAILS"))),
  h("div", { class: "row no-spacing" },
    h("div", { class: "col-8" },
      h("p", { class: "aircraft-name" }, results.aircraftTypeName))),
  h("div", { class: "row no-spacing align-bottom" },
    h("div", { class: "col-sm-4" },
      h("h3", { class: "long-title" }, "AIRCRAFT REGISTRATION")),
    h("div", { class: "col-sm-4" },
      h("h3", { class: "long-title" }, "FLIGHTS ON THIS ROUTE OVER THE LAST 12 MONTHS"))),
  h("div", { class: "row narrow" },
    h("div", { class: "col-sm-4" },
      h("p", null, results.aircraftRegistration)),
    h("div", { class: "col-sm-4" },
      h("p", null, results.flightsOver12Months))),
  h("div", { class: "airplane row" },
    h("div", { class: "col-sm-4" },
      h("p", { class: "seats__title" }, "SEAT CONFIGURATION"),
      h("div", { class: "seats-column left" }, results.seatClasses.map((seatClass) => (h("div", { key: seatClass.name },
        h("p", null, seatClass.name),
        h("p", null, seatClass.seats)))))),
    h("div", { class: "col-sm-4" },
      h("p", { class: "seats__title" }, "CO2 (KG) PER AVAILABLE SEAT"),
      h("div", { class: "seats-column right" }, results.seatClasses.map((seatClass) => {
        var _a;
        return (h("div", { key: seatClass.name },
          h("p", null, seatClass.name),
          h("p", null, (_a = seatClass.emissionsPerSeat) === null || _a === void 0 ? void 0 : _a.toLocaleString(window.navigator.language, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }))));
      }))))));

const CAR_KG = {
  icon: "car",
  rate: 8.620689655,
  regionMetricRate: {
    metric: 1,
    imperial: 1,
  },
  title: "km",
  message: "Driven by an average new passenger car",
};
const COAL_KG = {
  icon: "fire",
  rate: 1.962114133,
  regionMetricRate: {
    metric: 1,
    imperial: 1,
  },
  title: "kg",
  message: "Of coal burned",
};
const SMARTPHONES_CHARGED = {
  icon: "battery",
  rate: 121.654501216545,
  message: "Smartphones charged",
};
const BAGS_RECYCLED = {
  icon: "recycle",
  rate: 0.043290043,
  message: "Bags of household waste recycled instead of dumped",
};
const TREE_GROWN = {
  icon: "seed",
  rate: 0.016666667,
  message: "Tree seedlings grown for 10 years",
};
const EQUIVALENT_EMISSIONS = [CAR_KG, COAL_KG, SMARTPHONES_CHARGED];
const EQUIVALENT_OFFSET = [BAGS_RECYCLED, TREE_GROWN];

function getResourceIcon(name) {
  const icons = {
    car: (h("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19 16.625" },
      h("path", { d: "M17.471-9.337,16.25-13a3.564,3.564,0,0,0-3.38-2.437H6.13A3.564,3.564,0,0,0,2.751-13L1.529-9.337A2.368,2.368,0,0,0,0-7.125V0A1.188,1.188,0,0,0,1.187,1.188H2.375A1.188,1.188,0,0,0,3.562,0V-1.781H15.437V0a1.188,1.188,0,0,0,1.187,1.188h1.188A1.188,1.188,0,0,0,19,0V-7.125a2.371,2.371,0,0,0-1.529-2.212ZM5-12.25a1.189,1.189,0,0,1,1.128-.813H12.87A1.186,1.186,0,0,1,14-12.251L14.914-9.5H4.086L5-12.25Zm-1.44,7.5A1.188,1.188,0,0,1,2.375-5.937,1.188,1.188,0,0,1,3.562-7.125,1.188,1.188,0,0,1,4.75-5.937,1.186,1.186,0,0,1,3.562-4.75ZM14.25-5.937a1.188,1.188,0,0,1,1.188-1.187,1.188,1.188,0,0,1,1.187,1.188A1.188,1.188,0,0,1,15.437-4.75,1.187,1.187,0,0,1,14.25-5.937Z", transform: "translate(0 15.438)" }))),
    battery: (h("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 21.375 16.626" },
      h("path", { d: "M14.766-7.492a.931.931,0,0,0-.813-.523H11.361L13.6-14.246a.891.891,0,0,0-.385-1.068.892.892,0,0,0-1.123.178L5.565-7.714a.9.9,0,0,0-.144.957.859.859,0,0,0,.813.523H8.826L6.583,0a.891.891,0,0,0,.385,1.068.9.9,0,0,0,.453.123.894.894,0,0,0,.669-.3l6.531-7.422A.888.888,0,0,0,14.766-7.492Zm-12.391-3.2H5.809L7.9-13.062H2.375A2.376,2.376,0,0,0,0-10.687v7.125A2.375,2.375,0,0,0,2.375-1.187H5.116l.855-2.375h-3.6ZM20.188-9.5v-1.187a2.375,2.375,0,0,0-2.375-2.375H15.071l-.855,2.375h3.6v7.125H14.378l-2.09,2.375h5.525a2.375,2.375,0,0,0,2.375-2.375V-4.75a1.188,1.188,0,0,0,1.188-1.187V-8.312A1.186,1.186,0,0,0,20.188-9.5Z", transform: "translate(0 15.438)" }))),
    fire: (h("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 16.625 19" },
      h("path", { d: "M12-14.723A22.254,22.254,0,0,0,9.923-12.5a29.151,29.151,0,0,0-3.689-4.123C2.588-13.244,0-8.832,0-6.175a8.43,8.43,0,0,0,8.313,8.55,8.43,8.43,0,0,0,8.313-8.55C16.625-8.149,14.7-12.228,12-14.723Zm-.72,12.641a5,5,0,0,1-2.865.894A4.571,4.571,0,0,1,3.563-5.834c0-1.434.9-2.7,2.7-4.854.26.3,3.669,4.654,3.669,4.654l2.176-2.482c.153.25.292.5.417.738a4.425,4.425,0,0,1-1.239,5.7Z", transform: "translate(0 16.625)" }))),
    recycle: (h("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19 16.625" },
      h("path", { d: "M5.908-11a.6.6,0,0,0-.716-.447L1.8-10.662a.893.893,0,0,0-.272,1.625l.9.568L.545-5.447A3.563,3.563,0,0,0,3.568,0H4.753A1.19,1.19,0,0,0,5.939-1.189,1.187,1.187,0,0,0,4.753-2.375H3.564A1.188,1.188,0,0,1,2.557-4.192L4.446-7.214l.9.564A.89.89,0,0,0,6.687-7.6Zm4.6-2.7,1.531,2.454-.9.56a.891.891,0,0,0,.27,1.624l3.392.785a.594.594,0,0,0,.713-.446l.781-3.393a.891.891,0,0,0-1.339-.956l-.9.564L12.521-14.95a3.563,3.563,0,0,0-6.041,0l-.275.439a1.192,1.192,0,0,0,.375,1.633,1.189,1.189,0,0,0,1.637-.373l.276-.441A1.188,1.188,0,0,1,10.506-13.695Zm7.949,8.251-.63-1.012a1.186,1.186,0,0,0-1.634-.379A1.189,1.189,0,0,0,15.812-5.2l.63,1.008a1.188,1.188,0,0,1-1.007,1.818H11.873V-3.439a.891.891,0,0,0-1.52-.63L7.889-1.6a.6.6,0,0,0,0,.84L10.354,1.7a.89.89,0,0,0,1.52-.63V0H15.43A3.562,3.562,0,0,0,18.454-5.444Z", transform: "translate(0 16.625)" }))),
    seed: (h("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19 16.625" },
      h("path", { d: "M2.375-13.1H0A8.311,8.311,0,0,0,8.313-4.783v4.75A1.193,1.193,0,0,0,9.467,1.188,1.243,1.243,0,0,0,10.688,0V-4.75A8.342,8.342,0,0,0,2.375-13.1Zm14.25-2.342a8.31,8.31,0,0,0-7.266,4.279A9.46,9.46,0,0,1,11.548-7.17,8.315,8.315,0,0,0,19-15.437Z", transform: "translate(0 15.438)" }))),
  };
  return icons[name];
}

function renderMessage(resource, emissionsTotal) {
  if (resource.title) {
    return (h(Fragment, null,
      h("div", { class: "results-equivalents__resource row" },
        h("div", { class: "results-equivalents__icon col-icon", style: defaultTheme.getIconStyle() }, getResourceIcon(resource.icon)),
        h("div", { class: "results-equivalents__value col-value" }, calculateResourceFootprint(emissionsTotal, resource.rate)),
        h("div", { class: "results-equivalents__value-title col-title" }, resource.title)),
      h("div", { class: "results-equivalents__resource row mt-0" },
        h("div", { class: "results-equivalents__value-message col-message mt" }, resource.message))));
  }
  return (h("div", { class: "results-equivalents__resource" },
    h("div", { class: "results-equivalents__icon col-icon", style: defaultTheme.getIconStyle() }, getResourceIcon(resource.icon)),
    h("div", { class: "results-equivalents__value col-value" }, calculateResourceFootprint(emissionsTotal, resource.rate)),
    h("div", { class: "results-equivalents__value-message col-message ml-1" }, resource.message)));
}
function calculateResourceFootprint(emissionsTotal, rate) {
  return (emissionsTotal * rate).toLocaleString(window.navigator.language, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
function renderEquivalentValues(results, equivalentResourcesRates) {
  if (results && results.emissionsTotal) {
    return Object.entries(equivalentResourcesRates).map(([_, resource]) => renderMessage(resource, results.emissionsTotal));
  }
}
const EquivalentsBoxComponent = ({ results }) => (h(Fragment, null,
  h("div", { class: "row no-spacing" },
    h("div", { class: "col-8 " },
      h("div", { class: "results-equivalents__header" }, "Carbon Emissions Equivalents"),
      h("div", { class: "results-equivalents__content" },
        h("div", { class: "results-equivalents__subtitle" }, "Your flight emissions above are equivalent to:"),
        renderEquivalentValues(results, EQUIVALENT_EMISSIONS),
        h("div", { class: "results-equivalents__subtitle" }, "Your flight emissions above are offset by:"),
        renderEquivalentValues(results, EQUIVALENT_OFFSET))))));

const resultBoxCss = ":host {\n  color: #435266;\n  font-family: \"Open Sans\", sans-serif;\n}\n\n.select-arrow svg {\n  cursor: pointer;\n}\n.select-arrow svg:hover {\n  fill: #f2f6f4;\n  background-color: #435266;\n  opacity: 80%;\n  border-radius: 10px;\n}\n\ninput[type=text],\ninput[type=number],\nselect {\n  padding: 20px 15px;\n  border-radius: 10px;\n  background-color: #f2f6f4;\n  border: 0;\n  font-family: \"Open Sans\", sans-serif;\n  font-size: 1em;\n}\n\nlabel {\n  margin-bottom: 5px;\n}\n\n.form-control {\n  display: flex;\n  flex-direction: column;\n}\n.form-control a {\n  margin-top: 5px;\n}\n\ninput[type=submit] {\n  margin-top: 20px;\n}\n\nbutton,\n.button {\n  width: 100%;\n  border: 0;\n  padding: 20px 10px;\n  border-radius: 10px;\n  margin-top: 10px;\n  cursor: pointer;\n  font-weight: bold;\n}\nbutton.button-primary,\n.button.button-primary {\n  color: #ffffff;\n  background-color: #2d9395;\n}\nbutton.button-secondary,\n.button.button-secondary {\n  border: 1px solid #2d9395;\n  color: #2d9395;\n  background-color: #ffffff;\n}\n\na {\n  text-decoration: underline;\n  color: #2d9395;\n  cursor: pointer;\n}\na:visited {\n  color: #2d9395;\n}\n\n.align-bottom {\n  display: flex;\n  align-items: self-end;\n}\n\nsection.results {\n  padding: 5px;\n  border-radius: 10px;\n  background-color: #f2f6f4;\n}\n\nh2 {\n  font-size: 1em;\n  font-weight: bold;\n  width: 100%;\n  text-align: center;\n}\n\n.emissions-figure {\n  text-align: center;\n  container: emissions/inline-size;\n}\n.emissions-figure span:first-child {\n  font-weight: bold;\n  display: block;\n  font-size: 6em;\n}\n.emissions-figure span:first-child.digits-7 {\n  font-size: 5em;\n}\n.emissions-figure span:first-child.digits-8 {\n  font-size: 5em;\n}\n.emissions-figure span:first-child.digits-9 {\n  font-size: 4.5em;\n}\n.emissions-figure span:first-child.digits-10 {\n  font-size: 4.5em;\n}\n@container emissions (max-width: 420px) {\n  .emissions-figure span:first-child {\n    font-size: 4.5em;\n  }\n  .emissions-figure span:first-child.digits-7 {\n    font-size: 4em;\n  }\n  .emissions-figure span:first-child.digits-8 {\n    font-size: 4.2em;\n  }\n  .emissions-figure span:first-child.digits-9 {\n    font-size: 3.5em;\n  }\n  .emissions-figure span:first-child.digits-10 {\n    font-size: 3em;\n  }\n  .emissions-figure span:nth-child(2) {\n    font-size: 1.5em;\n  }\n}\n\np,\nh3 {\n  text-align: center;\n}\n\nh3 {\n  margin-bottom: 0;\n}\nh3.long-title {\n  font-size: 0.8em;\n}\n\n.airplane {\n  margin-top: 10px;\n  min-height: 400px;\n  background: url(\"https://storage.googleapis.com/carbon-calculator-widget/assets/aircraft.png\") center center;\n  background-size: contain;\n  background-repeat: no-repeat;\n  container: airplane/inline-size;\n}\n.airplane > div > p {\n  font-size: 0.7em;\n  font-weight: 600;\n  text-align: center;\n}\n.airplane .seats-column {\n  background-color: rgba(255, 255, 255, 0.7);\n  margin: 0 40px;\n  padding: 0 10px;\n  box-sizing: content-box;\n  border-radius: 10px;\n}\n.airplane .seats-column.left {\n  box-shadow: -6px 6px 1px 1px #ededed;\n}\n.airplane .seats-column.right {\n  box-shadow: 6px 6px 2px 1px #ededed;\n}\n.airplane .seats-column div {\n  padding: 10px 0;\n}\n.airplane .seats-column div p:first-child {\n  margin: 0;\n  font-weight: 100;\n}\n.airplane .seats-column div p:nth-child(2) {\n  margin-top: 5px;\n  font-weight: 600;\n}\n\n@media only screen and (max-width: 480px) {\n  .airplane .seats-column {\n    margin: 0 10px;\n  }\n}\n@container airplane (max-width: 480px) {\n  .seats__title {\n    font-size: 9px !important;\n  }\n}\n.results {\n  position: relative;\n  container: results/inline-size;\n}\n.results p {\n  text-align: center;\n}\n.results p.aircraft-name {\n  font-size: 1.5em;\n  font-weight: bold;\n  margin: 0;\n}\n.results--equivalents {\n  text-align: center;\n  border-radius: 10px;\n  margin: 1em 0;\n}\n.results--methodology {\n  text-align: center;\n  margin: 2em 0 3em;\n}\n\n.results-equivalents__header {\n  font-weight: bold;\n  margin: 1em 0;\n  text-transform: uppercase;\n}\n.results-equivalents__subtitle {\n  margin: 2em 0 1em 0.5em;\n  font-weight: bold;\n}\n.results-equivalents__content {\n  text-align: left;\n  container: equivalents/inline-size;\n}\n.results-equivalents__resource {\n  margin: 1em 0 0 10%;\n  max-width: 80%;\n  display: grid !important;\n  grid-template-columns: 30px auto 1fr;\n  grid-template-areas: \"col-icon col-value col-title\" \"col-icon col-value col-message\";\n}\n.results-equivalents__resource.mt-0 {\n  margin-top: 0;\n}\n.results-equivalents__resource .col-icon {\n  grid-area: col-icon;\n  display: grid;\n  align-items: center;\n  height: 34px;\n}\n.results-equivalents__resource .col-value {\n  grid-area: col-value;\n}\n.results-equivalents__resource .col-message {\n  grid-area: col-message;\n}\n.results-equivalents__resource .col-title {\n  grid-area: col-title;\n  display: grid;\n  align-items: end;\n  height: 34px;\n}\n@container equivalents (max-width: 320px) {\n  .results-equivalents__resource .results-equivalents__value {\n    font-size: 1em;\n    line-height: 2em;\n  }\n  .results-equivalents__resource .results-equivalents__value-title {\n    font-size: 0.6em;\n    height: 23px;\n  }\n  .results-equivalents__resource .results-equivalents__value-message {\n    font-size: 0.75em;\n  }\n}\n@container equivalents (min-width: 320px) {\n  .results-equivalents__resource .results-equivalents__value {\n    font-size: 2em;\n    line-height: 1em;\n  }\n  .results-equivalents__resource .results-equivalents__value-title {\n    font-size: 1.2em;\n  }\n  .results-equivalents__resource .results-equivalents__value-message {\n    font-size: 0.9em;\n  }\n}\n.results-equivalents__resource .results-equivalents__value {\n  font-weight: bold;\n  margin-left: 15px;\n}\n.results-equivalents__resource .results-equivalents__value-title {\n  font-weight: bold;\n  margin-left: 0.5em;\n  text-transform: uppercase;\n}\n.results-equivalents__resource .results-equivalents__value-message {\n  margin-left: 15px;\n}\n.results-equivalents__resource .results-equivalents__value-message.ml-1 {\n  margin: 0 0.5em 0;\n  height: 34px;\n  display: grid;\n  align-items: center;\n  padding-bottom: 4px;\n}\n\n.cover-spin {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  left: 0;\n  right: 0;\n  top: 0;\n  bottom: 0;\n  background-color: rgba(255, 255, 255, 0.7);\n  z-index: 9999;\n}\n.cover-spin:after {\n  content: \"\";\n  display: block;\n  position: absolute;\n  left: 48%;\n  top: 40%;\n  width: 40px;\n  height: 40px;\n  border-style: solid;\n  border-color: black;\n  border-top-color: transparent;\n  border-width: 4px;\n  border-radius: 50%;\n  -webkit-animation: spin 0.8s linear infinite;\n  animation: spin 0.8s linear infinite;\n}\n\n@-webkit-keyframes spin {\n  from {\n    -webkit-transform: rotate(0deg);\n  }\n  to {\n    -webkit-transform: rotate(360deg);\n  }\n}\n@keyframes spin {\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n}";

const ResultBoxComponent = class {
  constructor(hostRef) {
    registerInstance(this, hostRef);
    this.methodologyDocument = "https://storage.googleapis.com/pace-eu-documents/PACE-PAX-Widget-Methodology.pdf";
    this.searchFlights = undefined;
    this.showEquivalents = true;
  }
  componentWillLoad() {
    searchFlightStore.subscribe((searchFlights) => {
      this.searchFlights = Object.assign({}, searchFlights);
    });
  }
  render() {
    const results = this.searchFlights.results;
    return (h(Fragment, null, h("section", { class: `results ${defaultTheme.getSectionClass(4)}`, style: defaultTheme.getContentStyle() }, this.searchFlights.loading && h("div", { class: "cover-spin" }), !this.searchFlights.submitted && h(EmptyBoxComponent, null), this.searchFlights.submitted &&
      !this.searchFlights.displayAircraftDiagram && (h(EmissionsBoxComponent, { results: results, onAircraftTypeClick: () => dispatch({ type: ActionTypes.SWITCH_RESULTS_TAB }) })), this.searchFlights.submitted &&
      this.searchFlights.displayAircraftDiagram && (h(SeatsBoxComponent, { results: results }))), this.showEquivalents && this.searchFlights.submitted && (h("section", { class: `results--equivalents ${defaultTheme.getSectionClass(4)}`, style: defaultTheme.getContentStyle() }, h(EquivalentsBoxComponent, { results: results }))), this.searchFlights.submitted && (h("section", { class: "results--methodology", style: defaultTheme.getContentSecondaryStyle() }, h("span", null, h("a", { style: defaultTheme.getLinkStyle(), href: this.methodologyDocument, target: "_blank", rel: "noopener noreferrer" }, "Click here"), " ", "to find out more about our PACE methodology.")))));
  }
  get el() { return getElement(this); }
};
ResultBoxComponent.style = resultBoxCss;

const Input = (props) => {
  return (h(Fragment, null,
    h("label", { htmlFor: props.key }, props.label),
    h("input", { style: props.style, autocomplete: "off", type: props.type, id: props.key, name: props.key, min: props.min, max: props.max, required: props.required, value: props.value, readOnly: props.readonly, onChange: props.onChange })));
};

const searchFormCss = ".row{display:flex;flex-direction:row;justify-content:space-between;flex-wrap:wrap;margin-bottom:15px}.row.no-spacing{margin-bottom:0}.row.narrow{margin-top:0;margin-bottom:0}.row.narrow p{margin-top:0;margin-bottom:0}.col-2,.col-sm-2{flex:0 0 auto;width:calc(25% - 10px);padding:5px}.col-3,.col-sm-3{flex:0 0 auto;width:calc(37.5% - 10px);padding:5px}.col-4,.col-sm-4{flex:0 0 auto;width:calc(50% - 10px);padding:5px}.col-5,.col-sm-5{flex:0 0 auto;width:calc(62.5% - 10px);padding:5px}.col-6,.col-sm-6{flex:0 0 auto;width:calc(75% - 10px);padding:5px}.col-8,.col-sm-8{flex:0 0 auto;width:calc(100% - 10px);padding:5px}@media only screen and (max-width: 480px){.row .col-2,.row .col-4,.row .col-8{width:100%}}:host{color:#435266;font-family:\"Open Sans\", sans-serif}.select-arrow svg{cursor:pointer}.select-arrow svg:hover{fill:#f2f6f4;background-color:#435266;opacity:80%;border-radius:10px}input[type=text],input[type=number],select{padding:20px 15px;border-radius:10px;background-color:#f2f6f4;border:0;font-family:\"Open Sans\", sans-serif;font-size:1em}label{margin-bottom:5px}.form-control{display:flex;flex-direction:column}.form-control a{margin-top:5px}input[type=submit]{margin-top:20px}button,.button{width:100%;border:0;padding:20px 10px;border-radius:10px;margin-top:10px;cursor:pointer;font-weight:bold}button.button-primary,.button.button-primary{color:#ffffff;background-color:#2d9395}button.button-secondary,.button.button-secondary{border:1px solid #2d9395;color:#2d9395;background-color:#ffffff}a{text-decoration:underline;color:#2d9395;cursor:pointer}a:visited{color:#2d9395}.align-bottom{display:flex;align-items:self-end}input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}";

const SearchFormComponent = class {
  constructor(hostRef) {
    registerInstance(this, hostRef);
    this.logger = createLogger(this.constructor.name);
    this.searchFlights = undefined;
  }
  componentWillLoad() {
    searchFlightStore.subscribe((searchFlights) => {
      this.searchFlights = Object.assign({}, searchFlights);
    });
  }
  async handleSubmit(event) {
    event.preventDefault();
    dispatch({ type: ActionTypes.SEARCH_FLIGHTS });
  }
  async handleReset(event) {
    event.preventDefault();
    this.logger.log("Resetting form...");
    dispatch({ type: ActionTypes.RESET });
  }
  mapAirports(airports) {
    return airports.map((airport) => {
      return {
        value: airport.code,
        label: `${airport.name} (${airport.code})`,
      };
    });
  }
  getSelectStyle() {
    return {
      input: defaultTheme.getInputStyle(),
      options: defaultTheme.getOptionsStyle(),
      selectedOption: defaultTheme.getContentStyle(),
      highlightedOption: defaultTheme.getHighlightedOptionStyle(),
    };
  }
  renderFlightNumberInputs() {
    var _a, _b;
    return (h(Fragment, null, h("div", { class: "row" }, h("div", { class: "form-control col-4" }, h(Input, { style: defaultTheme.getInputStyle(), type: "text", label: "Flight Number", key: "flightnumber", value: (_a = this.searchFlights) === null || _a === void 0 ? void 0 : _a.searchFlight.flightNumber, readonly: this.searchFlights.submitted, required: true, onChange: (e) => dispatch({
        type: ActionTypes.UPDATE_SEARCH_FLIGHTS,
        payload: {
          flightNumber: e.target.value,
        },
      }) }), h("a", { style: defaultTheme.getLinkStyle(), onClick: () => dispatch({
        type: ActionTypes.UPDATE_SEARCH_FLIGHTS,
        payload: {
          basicSearch: false,
        },
      }) }, "I don't know the flight number")), h("div", { class: "form-control col-4" }, h(Input, { style: defaultTheme.getInputStyle(), type: "number", label: "Number of Flights", key: "numberofflights", min: 1, max: 5, required: true, value: (_b = this.searchFlights) === null || _b === void 0 ? void 0 : _b.searchFlight.numberOfFlights, readonly: this.searchFlights.submitted, onChange: (e) => dispatch({
        type: ActionTypes.UPDATE_SEARCH_FLIGHTS,
        payload: {
          numberOfFlights: e.target.value,
        },
      }) })))));
  }
  renderAirportInputs() {
    var _a, _b, _c, _d;
    return (h(Fragment, null, h("div", { class: "row" }, h("pace-select", { class: "form-control col-4", label: "Airline", name: "airline", selectStyle: this.getSelectStyle(), searchable: true, required: true, value: (_a = this.searchFlights) === null || _a === void 0 ? void 0 : _a.searchFlight.airline, readonly: this.searchFlights.submitted, options: this.searchFlights.airlines.map((airline) => {
        return {
          value: airline.code,
          label: airline.name,
        };
      }), loading: this.searchFlights.loadingAirlines, onChange: (e) => dispatch({
        type: ActionTypes.UPDATE_SEARCH_FLIGHTS,
        payload: {
          airline: e.target.value,
        },
      }), onInput: (e) => dispatch({
        type: ActionTypes.SEARCH_AIRLINES,
        payload: e.target.value,
      }) }), h("div", { class: "form-control col-4" }, h(Input, { style: defaultTheme.getInputStyle(), type: "number", label: "Number of Flights", key: "numberofflights", min: 1, max: 5, required: true, value: (_b = this.searchFlights) === null || _b === void 0 ? void 0 : _b.searchFlight.numberOfFlights, readonly: this.searchFlights.submitted, onChange: (e) => dispatch({
        type: ActionTypes.UPDATE_SEARCH_FLIGHTS,
        payload: {
          numberOfFlights: e.target.value,
        },
      }) }))), h("div", { class: "row" }, h("pace-select", { class: "form-control col-4", label: "From", name: "from", selectStyle: this.getSelectStyle(), searchable: true, required: true, value: (_c = this.searchFlights) === null || _c === void 0 ? void 0 : _c.searchFlight.departureAirport, readonly: this.searchFlights.submitted, options: this.mapAirports(this.searchFlights.originAirports), loading: this.searchFlights.loadingOriginAirports, onChange: (e) => dispatch({
        type: ActionTypes.UPDATE_SEARCH_FLIGHTS,
        payload: {
          departureAirport: e.target.value,
        },
      }), onInput: (e) => dispatch({
        type: ActionTypes.SEARCH_ORIGIN_AIRPORT,
        payload: e.target.value,
      }) }), h("pace-select", { class: "form-control col-4", label: "To", name: "to", selectStyle: this.getSelectStyle(), searchable: true, required: true, value: (_d = this.searchFlights) === null || _d === void 0 ? void 0 : _d.searchFlight.arrivalAirport, readonly: this.searchFlights.submitted, options: this.mapAirports(this.searchFlights.destinationAirports), loading: this.searchFlights.loadingDestinationAirports, onChange: (e) => dispatch({
        type: ActionTypes.UPDATE_SEARCH_FLIGHTS,
        payload: {
          arrivalAirport: e.target.value,
        },
      }), onInput: (e) => dispatch({
        type: ActionTypes.SEARCH_DESTINATION_AIRPORT,
        payload: e.target.value,
      }) }))));
  }
  render() {
    var _a, _b, _c, _d, _e;
    return (h(Fragment, null, h("form", { onSubmit: async (e) => await this.handleSubmit(e), class: "container" }, ((_a = this.searchFlights) === null || _a === void 0 ? void 0 : _a.searchFlight.basicSearch) &&
      this.renderFlightNumberInputs(), !((_b = this.searchFlights) === null || _b === void 0 ? void 0 : _b.searchFlight.basicSearch) &&
      this.renderAirportInputs(), h("div", { class: "row" }, h("pace-select", { class: "form-control col-4", label: "Seat Class", name: "seatclass", selectStyle: this.getSelectStyle(), required: true, value: (_d = (_c = this.searchFlights) === null || _c === void 0 ? void 0 : _c.searchFlight.seatClass) === null || _d === void 0 ? void 0 : _d.valueOf(), readonly: this.searchFlights.submitted, options: [
        { value: SeatClass$1.Economy.valueOf(), label: "Economy" },
        {
          value: SeatClass$1.ComfortEconomy.valueOf(),
          label: "Comfort Economy",
        },
        {
          value: SeatClass$1.PremiumEconomy.valueOf(),
          label: "Premium Economy",
        },
        { value: SeatClass$1.Business.valueOf(), label: "Business" },
        { value: SeatClass$1.First.valueOf(), label: "First" },
      ], onChange: (e) => dispatch({
        type: ActionTypes.UPDATE_SEARCH_FLIGHTS,
        payload: {
          seatClass: e.target.value,
        },
      }) }), h("div", { class: "form-control col-4" }, h(Input, { style: defaultTheme.getInputStyle(), type: "number", label: "Number of passengers", key: "numberofpassengers", value: (_e = this.searchFlights) === null || _e === void 0 ? void 0 : _e.searchFlight.numberOfPassengers, readonly: this.searchFlights.submitted, min: 1, max: 5, required: true, onChange: (e) => dispatch({
        type: ActionTypes.UPDATE_SEARCH_FLIGHTS,
        payload: {
          numberOfPassengers: e.target.value,
        },
      }) }))), !this.searchFlights.submitted && (h("div", { class: "row" }, h("div", { class: "col-8" }, h("button", { style: defaultTheme.getSecondaryButtonStyle(), type: "button", hidden: this.searchFlights.searchFlight.basicSearch, onClick: (e) => this.handleReset(e), class: "button button-secondary" }, "Back"), h("input", { style: defaultTheme.getPrimaryButtonStyle(), type: "submit", class: "button button-primary", value: "Calculate" }))))), h("section", { class: "buttons row" }, h("div", { class: "col-8" }, h("button", { class: "button button-secondary", style: defaultTheme.getSecondaryButtonStyle(), hidden: !this.searchFlights.displayAircraftDiagram, onClick: () => dispatch({ type: ActionTypes.SWITCH_RESULTS_TAB }) }, "Back"), h("button", { class: "button button-primary", style: defaultTheme.getPrimaryButtonStyle(), hidden: !this.searchFlights.submitted, onClick: () => dispatch({ type: ActionTypes.RESET }) }, "Start again")))));
  }
};
SearchFormComponent.style = searchFormCss;

export { MessageBoxComponent as pace_message_box, ResultBoxComponent as pace_result_box, SearchFormComponent as pace_search_form };

//# sourceMappingURL=p-6b665560.entry.js.map