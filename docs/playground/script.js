const typeChar = (char) => {
  const { selectionStart, selectionEnd, value } = textarea;

  textarea.value = `${value.slice(0, selectionStart)}${char}${value.slice(
    selectionEnd
  )}`;

  textarea.selectionStart = selectionStart + 1;
  textarea.selectionEnd = selectionStart + 1;
};

const backspace = () => {
  const { selectionStart, selectionEnd, value } = textarea;

  if (selectionStart !== selectionEnd) {
    textarea.value = `${value.slice(0, selectionStart)}${value.slice(
      selectionEnd
    )}`;
    textarea.selectionEnd = selectionStart;

    return;
  }

  if (selectionStart === 0) {
    return;
  }

  textarea.value = `${value.slice(0, selectionStart - 1)}${value.slice(
    selectionEnd
  )}`;

  textarea.selectionStart = selectionStart - 1;
  textarea.selectionEnd = selectionStart - 1;
};

// Physical keyboard

const RU_TYPO_KEYMAP = {
  Backquote: ["ё", "Ё", "`", "~"],
  Digit1: ["1", "!", "•", ""],
  Digit2: ["2", '"', "@", "'"],
  Digit3: ["3", "№", "#", "§"],
  Digit4: ["4", ";", "$", ""],
  Digit5: ["5", "%"],
  Digit6: ["6", ":", "^", "́"],
  Digit7: ["7", "?", "&", ""],
  Digit8: ["8", "*", "₽", ""],
  Digit9: ["9", "(", "<", ""],
  Digit0: ["0", ")", ">", ""],
  Minus: ["-", "_", "—", "–"],
  Equal: ["=", "+"],
  KeyQ: ["й", "Й"],
  KeyW: ["ц", "Ц"],
  KeyE: ["у", "У"],
  KeyR: ["к", "К"],
  KeyT: ["е", "Е"],
  KeyY: ["н", "Н"],
  KeyU: ["г", "Г"],
  KeyI: ["ш", "Ш"],
  KeyO: ["щ", "Щ"],
  KeyP: ["з", "З"],
  BracketLeft: ["х", "Х", "[", "{"],
  BracketRight: ["ъ", "Ъ", "]", "}"],
  Backslash: ["\\", "/"],
  KeyA: ["ф", "Ф"],
  KeyS: ["ы", "Ы"],
  KeyD: ["в", "В"],
  KeyF: ["а", "А"],
  KeyG: ["п", "П"],
  KeyH: ["р", "Р"],
  KeyJ: ["о", "О"],
  KeyK: ["л", "Л"],
  KeyL: ["д", "Д"],
  Semicolon: ["ж", "Ж"],
  Quote: ["э", "Э"],
  KeyZ: ["я", "Я"],
  KeyX: ["ч", "Ч"],
  KeyC: ["с", "С"],
  KeyV: ["м", "М"],
  KeyB: ["и", "И"],
  KeyN: ["т", "Т"],
  KeyM: ["ь", "Ь"],
  Comma: ["б", "Б", "«", "„"],
  Period: ["ю", "Ю", "»", "“"],
  Slash: [".", ",", "…", "’"],
};

const RTU_KEYMAP = {
  ...RU_TYPO_KEYMAP,
  KeyE: ["у", "У", "ү", "Ү"],
  KeyY: ["н", "Н", "ң", "Ң"],
  BracketLeft: ["х", "Х", "һ", "Һ"],
  KeyF: ["а", "А", "ә", "Ә"],
  KeyJ: ["о", "О", "ө", "Ө"],
  Semicolon: ["ж", "Ж", "җ", "Ж"],
  Quote: ["э", "Э", "[", "{"],
};

const keymap = RTU_KEYMAP;

let raltPressed = false;

document.addEventListener("keydown", ({ code }) => {
  if (code !== "AltRight") {
    return;
  }

  raltPressed = true;
});

document.addEventListener("keyup", ({ code }) => {
  if (code !== "AltRight") {
    return;
  }

  raltPressed = false;
});

const getChar = ({ code, shiftKey }) => {
  const layer = (shiftKey ? 1 : 0) + (raltPressed ? 2 : 0);

  return keymap[code]?.[layer] ?? keymap[code]?.[layer - 2];
};

document.addEventListener("keypress", (e) => {
  if (document.activeElement !== textarea) {
    return;
  }

  const char = getChar(e);

  if (char === undefined) {
    return;
  }

  e.preventDefault();

  typeChar(char);
});

// On-screen keyboard

let currentPointerId = undefined;
let pressTimeout = undefined;
let repeatInterval = undefined;
let activeElement = undefined;

const clearActiveElement = () => {
  delete activeElement?.dataset?.active;
  activeElement = undefined;
};

const setActiveElement = (element) => {
  clearActiveElement();
  element.dataset.active = true;
  activeElement = element;
};

const getCurrentChar = () => {
  const { chars } = activeElement?.dataset ?? {};

  if (!chars) {
    return undefined;
  }

  const symbol = chars[keyboard.dataset.longpress ? 1 : 0] ?? chars[0];

  return keyboard.dataset.shift ? symbol.toUpperCase() : symbol;
};

const clearPress = () => {
  clearTimeout(pressTimeout);
  clearInterval(repeatInterval);
  pressTimeout = undefined;
  repeatInterval = undefined;
};

const resetPress = () => {
  clearPress();
  pressTimeout = setTimeout(() => {
    if (activeElement?.dataset.role === "backspace") {
      repeatInterval = setInterval(backspace, 50);
    }
    keyboard.dataset.longpress = true;

    const char = getCurrentChar();

    if (char === "\\") {
      keyboard.style = `--char: '\\005C'`;

      return;
    }

    keyboard.style = `--char: "${char}"`;
  }, 300);
};

const handleActiveButton = () => {
  const char = getCurrentChar();

  if (!activeElement) {
    return;
  }

  const target = activeElement;

  clearPress();
  clearActiveElement();
  delete keyboard.dataset.longpress;
  const shiftWasPressed = keyboard.dataset.shift;
  delete keyboard.dataset.shift;
  currentPointerId = undefined;

  if (char) {
    typeChar(char);

    if (char === " ") {
      delete keyboard.dataset.symbols;
    }

    return;
  }

  const { role } = target?.dataset ?? {};

  if (role === "shift") {
    if (shiftWasPressed) {
      delete keyboard.dataset.shift;

      return;
    }

    keyboard.dataset.shift = true;

    return;
  }

  if (role === "backspace") {
    backspace();

    return;
  }

  if (role === "symbols") {
    if (keyboard.dataset.symbols) {
      delete keyboard.dataset.symbols;

      return;
    }

    keyboard.dataset.symbols = true;

    return;
  }

  if (role === "enter") {
    typeChar("\r\n");

    return;
  }
};

const toCenter = () => {
  if (document.body.dataset.textareaFocused && document.body.dataset.touch) {
    textareaScroller.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

const onRelease = (e) => {
  e.preventDefault();
  e.stopPropagation();

  const { pointerId } = e;

  if (pointerId !== currentPointerId) {
    return;
  }

  handleActiveButton();
};

document.addEventListener("pointerup", onRelease);
document.body.addEventListener("pointerleave", onRelease);
document.body.addEventListener("pointercancel", onRelease);

document.addEventListener("keydown", () => {
  delete document.body.dataset.touch;
});

document.addEventListener("pointerdown", ({ pointerType }) => {
  if (pointerType === "mouse") {
    delete document.body.dataset.touch;

    return;
  }

  document.body.dataset.touch = true;
});

textarea.addEventListener("focus", () => {
  document.body.dataset.textareaFocused = true;
  toCenter();
});

// for Firefox
keyboard.addEventListener("focusin", () => textarea.focus());

textarea.addEventListener("blur", () => {
  delete document.body.dataset.textareaFocused;

  clearPress();

  delete keyboard.dataset.longpress;
  delete keyboard.dataset.shift;
  delete keyboard.dataset.symbols;
});

keyboard.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();

  const { target, pointerId } = e;

  if (pointerId !== currentPointerId) {
    handleActiveButton();
  }

  currentPointerId = pointerId;
  resetPress();
  setActiveElement(target);

  const char = getCurrentChar();

  if (!char) {
    return;
  }

  if (char === '"') {
    keyboard.style = `--char: '"'`;

    return;
  }

  if (char === "\\") {
    keyboard.style = `--char: '\\005C'`;

    return;
  }

  keyboard.style = `--char: "${char}"`;
});

// Clipboard
if (navigator.clipboard) {
  document.body.dataset.clipboardSupported = true;
}

copyButton.addEventListener("click", () =>
  navigator.clipboard.writeText(textarea.value)
);

// Search
textarea.addEventListener("blur", (e) => {
  const text = encodeURIComponent(e.target.value);

  yaLink.href = `https://ya.ru/search/?text=${text}`;
  gooLink.href = `https://www.google.com/search?q=${text}`;
  yaTranslate.href = `https://translate.yandex.ru/?text=${text}&source_lang=tt`;
  gooTranslate.href = `https://translate.google.com/?text=${text}&sl=tt`;
});
