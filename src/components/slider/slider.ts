export type OreSliderColor =
  | "destructive"
  | "dungeons"
  | "gold"
  | "legends"
  | "primary"
  | "realms"
  | "secondary";
export type OreSliderVariant = "default" | "segmented";
export type OreSliderOrientation = "horizontal" | "vertical";

const sliderSelector = "input.ore-slider";
const sliderAttributes = ["max", "min", "step", "value"];

interface SliderState {
  form?: HTMLFormElement;
  handleInput: () => void;
  handleReset?: () => void;
  mutationObserver: MutationObserver;
  progressEnd: string;
  segmentSize: string;
  initialized: string | null;
}

const states = new WeakMap<HTMLInputElement, SliderState>();

export function syncSlider(slider: HTMLInputElement): void {
  const minValue = Number(slider.min);
  const maxValue = Number(slider.max);
  const min = slider.min !== "" && Number.isFinite(minValue) ? minValue : 0;
  const max = slider.max !== "" && Number.isFinite(maxValue) ? maxValue : 100;
  const value = slider.valueAsNumber;
  const size = max - min;
  const progress = size > 0 ? (value - min) / size : 0;
  const stepValue = Number(slider.step);
  const step =
    slider.step === "any"
      ? size
      : slider.step !== "" && Number.isFinite(stepValue)
        ? stepValue
        : 1;
  const segmentSize = size > 0 && step > 0 ? Math.min(step / size, 1) : 1;

  slider.style.setProperty(
    "--ore-slider-progress-end",
    String(Math.min(1, Math.max(0, progress))),
  );
  slider.style.setProperty(
    "--ore-slider-segment-size",
    `${segmentSize * 100}%`,
  );
}

function initSlider(slider: HTMLInputElement): void {
  if (states.has(slider)) {
    syncSlider(slider);
    return;
  }

  const ownerWindow = slider.ownerDocument.defaultView;
  if (!ownerWindow) {
    return;
  }

  const handleInput = (): void => syncSlider(slider);
  const handleReset = slider.form
    ? (): void => queueMicrotask(() => syncSlider(slider))
    : undefined;
  const state: SliderState = {
    form: slider.form ?? undefined,
    handleInput,
    handleReset,
    mutationObserver: new ownerWindow.MutationObserver(() =>
      syncSlider(slider),
    ),
    progressEnd: slider.style.getPropertyValue("--ore-slider-progress-end"),
    segmentSize: slider.style.getPropertyValue("--ore-slider-segment-size"),
    initialized: slider.getAttribute("data-ore-initialized"),
  };

  states.set(slider, state);
  slider.dataset.oreInitialized = "slider";
  slider.addEventListener("input", handleInput);
  if (state.form && handleReset) {
    state.form.addEventListener("reset", handleReset);
  }
  state.mutationObserver.observe(slider, {
    attributes: true,
    attributeFilter: sliderAttributes,
  });
  syncSlider(slider);
}

export function destroySlider(slider: HTMLInputElement): void {
  const state = states.get(slider);
  if (!state) {
    return;
  }

  slider.removeEventListener("input", state.handleInput);
  if (state.form && state.handleReset) {
    state.form.removeEventListener("reset", state.handleReset);
  }
  state.mutationObserver.disconnect();
  if (state.progressEnd) {
    slider.style.setProperty("--ore-slider-progress-end", state.progressEnd);
  } else {
    slider.style.removeProperty("--ore-slider-progress-end");
  }
  if (state.segmentSize) {
    slider.style.setProperty("--ore-slider-segment-size", state.segmentSize);
  } else {
    slider.style.removeProperty("--ore-slider-segment-size");
  }
  if (state.initialized === null) {
    slider.removeAttribute("data-ore-initialized");
  } else {
    slider.setAttribute("data-ore-initialized", state.initialized);
  }
  states.delete(slider);
}

export function destroySliders(root: ParentNode): void {
  if (
    (root as Node).nodeType === 1 &&
    (root as Element).localName === "input" &&
    (root as Element).matches(sliderSelector)
  ) {
    destroySlider(root as HTMLInputElement);
  }

  for (const slider of root.querySelectorAll<HTMLInputElement>(
    sliderSelector,
  )) {
    destroySlider(slider);
  }
}

export function initSliders(root: ParentNode): void {
  if (
    (root as Node).nodeType === 1 &&
    (root as Element).localName === "input" &&
    (root as Element).matches(sliderSelector)
  ) {
    initSlider(root as HTMLInputElement);
  }

  for (const slider of root.querySelectorAll<HTMLInputElement>(
    sliderSelector,
  )) {
    initSlider(slider);
  }
}
