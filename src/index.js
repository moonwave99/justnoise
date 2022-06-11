const { Filter, Gain, Reverb, Noise, Destination } = window.Tone;

const FADE_IN_TIME = 1;
const FADE_OUT_TIME = 2;
const MIN_FREQUENCY = 100;
const MAX_FREQUENCY = 20000;

const NOISE_TYPES = ["white", "pink", "brown"];

const DEFAULT_VALUES = {
    filter: 4186,
    volume: 0.5,
    type: NOISE_TYPES[1],
};

const filter = new Filter(DEFAULT_VALUES.filter, "lowpass");
const gainNode = new Gain(DEFAULT_VALUES.volume);
const reverb = new Reverb();
const noise = new Noise(DEFAULT_VALUES.type);

noise.chain(gainNode, filter, reverb, Destination);

const $form = document.querySelector("form");
const { filter: $filter, volume: $volume, type: $type } = $form;

function frequencyToRange(frequency) {
    return (
        ((frequency - MIN_FREQUENCY) / (MAX_FREQUENCY - MIN_FREQUENCY)) * 100
    );
}

function rangeToFrequency(value) {
    return (value / 100) * (MAX_FREQUENCY - MIN_FREQUENCY) + MIN_FREQUENCY;
}

function changeVolume(value) {
    const gain = +value / 100;
    gainNode.set({ gain });
}

function changeFilter(value) {
    const frequency = rangeToFrequency(value);
    filter.set({ frequency });
}

function changeNoiseType(type) {
    noise.set({ type });
    NOISE_TYPES.forEach((x) =>
        document.body.classList.toggle(`color-${x}`, x === type)
    );
}

const handlers = {
    handleVolume: (event) => changeVolume(+event.target.value),
    handleFilter: (event) => changeFilter(+event.target.value),
    handleType: (event) => changeNoiseType(event.target.value),
    handleToggle: (event) => {
        event.preventDefault();
        if (noise.state === "stopped") {
            noise.start();
            const volume = $volume.value / 100;
            gainNode.set({ gain: 0 });
            gainNode.gain.rampTo(volume, FADE_IN_TIME);
            event.target.start.value = "Stop";
            return;
        }
        gainNode.gain.rampTo(0, FADE_OUT_TIME);
        noise.stop();
        event.target.start.value = "Start";
    },
};

function setInitialValues() {
    let values = {};
    try {
        values = JSON.parse(localStorage.getItem("settings")) || {};
    } catch (error) {
        console.error("Error retrieving settings form localStorage", error);
    }
    values = {
        ...DEFAULT_VALUES,
        ...values,
    };

    $filter.value = frequencyToRange(values.filter);
    filter.set({ frequency: values.filter });
    $volume.value = values.volume * 100;
    $type.value = values.type;
    changeNoiseType(values.type);
}

function initHandlers() {
    document.querySelectorAll("[data-action]").forEach((el) => {
        const [eventType, handlerName] = el.dataset?.action?.split("-");
        const handler = handlers[handlerName];
        if (!handler) {
            console.warn(`No handler found for ${eventType} / ${handlerName}`);
            return;
        }
        el.addEventListener(eventType, handler);
    });
}

setInitialValues();
initHandlers();
$form.classList.toggle("loaded");
window.onbeforeunload = (event) => {
    window.localStorage.setItem(
        "settings",
        JSON.stringify({
            filter: rangeToFrequency(+$filter.value),
            volume: $volume.value / 100,
            type: $type.value,
        })
    );
};
