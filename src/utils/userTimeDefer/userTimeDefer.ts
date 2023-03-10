import { cForEach } from 'src/utils/array';
import { isIE } from 'src/utils/browser';
import { clearDefer, setDefer } from 'src/utils/defer';
import { cEvent } from 'src/utils/events';
import { getMs, TimeOne } from 'src/utils/time';

// Это скорректированный таймаут который перезапускает таймер если всякие блюры были
// Потому что таймауты работают фигово, если окно рефокусится и блюрится
// Причём если был блюр, пользовательским временем считается только время после
export function setUserTimeDefer(
    ctx: Window,
    callback: (...args: any[]) => any,
    time: number,
) {
    let id = 0;
    let executedOrCleared = false;
    const destroyTimer = () => {
        clearDefer(ctx, id);
        // eslint-disable-next-line no-use-before-define
        setEvents(false);
    };

    // В разных версиях IE есть сложности с точным определением состояний с focus и blur окна
    if (isIE(ctx)) {
        id = setDefer(ctx, callback, time, 'u.t.d');
        return destroyTimer;
    }

    const timer = TimeOne(ctx);
    let wasBlur = false;
    let wasAction = false;
    let isBlurred = true;
    let addedTime = 0;
    let startTime = timer(getMs);
    const eventsEmitter = cEvent(ctx);

    function onAction() {
        if (!wasAction) {
            wasBlur = true;
            isBlurred = false;
            wasAction = true;
            // eslint-disable-next-line no-use-before-define
            onCommon();
        }
    }

    function calcTime() {
        if (isBlurred) {
            return addedTime;
        }

        return addedTime + timer(getMs) - startTime;
    }

    function executeCallback() {
        executedOrCleared = true;
        // eslint-disable-next-line no-use-before-define
        setEvents(false);
        callback();
    }

    function onCommon() {
        clearDefer(ctx, id);
        if (executedOrCleared) {
            // eslint-disable-next-line no-use-before-define
            setEvents(false);
            return;
        }

        const delta = Math.max(0, time - calcTime());
        if (delta) {
            id = setDefer(ctx, executeCallback, delta, 'u.t.d.c');
        } else {
            executeCallback();
        }
    }

    function onBlur() {
        wasAction = true;
        wasBlur = true;
        isBlurred = true;

        addedTime += timer(getMs) - startTime;
        startTime = timer(getMs);
        onCommon();
    }

    function onFocus() {
        if (!wasBlur && !wasAction) {
            addedTime = 0;
        }

        startTime = timer(getMs);

        wasAction = true;
        wasBlur = true;
        isBlurred = false;
        onCommon();
    }

    const events: [Window | Document, string[], Function][] = [
        [ctx, ['blur'], onBlur],
        [ctx, ['focus'], onFocus],
        [ctx.document, ['click', 'mousemove', 'keydown', 'scroll'], onAction],
    ];

    function setEvents(add: boolean) {
        cForEach(([context, eventName, cb]) => {
            if (add) {
                eventsEmitter.on(context, eventName, cb);
            } else {
                eventsEmitter.un(context, eventName, cb);
            }
        }, events);
    }

    setEvents(true);
    onCommon();

    return destroyTimer;
}
