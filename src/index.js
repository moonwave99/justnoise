import * as Tone from "tone";

const FADE_IN_TIME = 1;
const FADE_OUT_TIME = 2;
const MIN_FREQUENCY = 100;
const MAX_FREQUENCY = 20000;
const INITIAL_FREQUENCY = 5000;
const INITIAL_VOLUME = 0.9;

const NOISE_TYPES = ["white", "pink", "brown"];

const filter = new Tone.Filter(INITIAL_FREQUENCY, "lowpass");
const gainNode = new Tone.Gain(INITIAL_VOLUME);
const reverb = new Tone.Reverb();
const noise = new Tone.Noise(NOISE_TYPES[0]);

noise.chain(gainNode, filter, reverb, Tone.Destination);

const $form = document.querySelector("form");
const { filter: $filter, volume: $volume, type: $type } = $form;

function frequencyToRange(frequency) {
  return ((frequency - MIN_FREQUENCY) / (MAX_FREQUENCY - MIN_FREQUENCY)) * 100;
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
  }
};

setInitialValues();
initHandlers();

function setInitialValues() {
  const defaultValues = {
    filter: INITIAL_FREQUENCY,
    volume: INITIAL_VOLUME,
    type: NOISE_TYPES[0]
  };
  let values = {};
  try {
    values = JSON.parse(localStorage.getItem("settings")) || {};
  } catch (error) {
    console.error("Error retrieving settings form localStorage", error);
  }
  values = {
    ...defaultValues,
    ...values
  };

  $filter.value = frequencyToRange(values.filter);
  filter.set({ frequency: values.filter });
  $volume.value = values.volume * 100;
  $type.value = values.type;
  changeNoiseType(values.type);
}

window.onbeforeunload = () => {
  localStorage.setItem(
    "settings",
    JSON.stringify({
      filter: rangeToFrequency(+$filter.value),
      volume: $volume.value / 100,
      type: $type.value
    })
  );
};

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
