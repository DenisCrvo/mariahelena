"use strict";

const EVENT_CONFIG = Object.freeze({
  partyDate: "2026-12-19",
  timeZone: "America/Recife",
  officialTime: null,
  maxAttendees: 8,
  appsScriptUrl: ""
});

const form = document.querySelector("#rsvp-form");
const nameInput = document.querySelector("#guest-name");
const countInput = document.querySelector("#guest-count");
const submitButton = document.querySelector("#submit-button");
const statusMessage = document.querySelector("#form-status");
const nameError = document.querySelector("#name-error");
const countError = document.querySelector("#count-error");
const countdownValue = document.querySelector("#days-value");
const countdownLabel = document.querySelector("#countdown-label");
const countdownNote = document.querySelector("#countdown-note");

countInput.max = String(EVENT_CONFIG.maxAttendees);
document.querySelector("#count-hint").textContent =
  `Inclua você na contagem (máximo de ${EVENT_CONFIG.maxAttendees} pessoas).`;

function dateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function updateCountdown() {
  if (EVENT_CONFIG.officialTime) {
    countdownValue.textContent = "—";
    countdownLabel.textContent = "contagem desativada";
    countdownNote.textContent = "A contagem regressiva será ativada quando o horário oficial for confirmado.";
    return;
  }

  const today = dateInTimeZone(new Date(), EVENT_CONFIG.timeZone);
  const [year, month, day] = EVENT_CONFIG.partyDate.split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  const remaining = Math.ceil(
    (Date.UTC(year, month - 1, day) - Date.UTC(todayYear, todayMonth - 1, todayDay)) / 86400000
  );

  if (remaining === 0) {
    countdownValue.textContent = "";
    countdownLabel.textContent = "Hoje é dia de comemorar! Viva, Maria Helena!";
    countdownNote.textContent = "";
    return;
  }

  if (remaining < 0) {
    countdownValue.textContent = "";
    countdownLabel.textContent = "Obrigada por celebrar esse dia tão especial com a gente!";
    countdownNote.textContent = "";
    return;
  }

  countdownValue.textContent = String(remaining);
  countdownLabel.textContent = remaining === 1 ? "dia para a festa" : "dias para a festa";
  countdownNote.textContent = "Contagem em dias; o horário da festa ainda não foi confirmado.";
}

updateCountdown();
window.setInterval(updateCountdown, 60_000);

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

function setFieldError(input, element, message) {
  element.textContent = message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
}

function validateForm() {
  const guestName = nameInput.value.trim();
  const attendeeCount = Number(countInput.value);
  let valid = true;
  setFieldError(nameInput, nameError, "");
  setFieldError(countInput, countError, "");

  if (!guestName) {
    setFieldError(nameInput, nameError, "Informe o nome do responsável ou convidado.");
    valid = false;
  } else if (guestName.length > 120) {
    setFieldError(nameInput, nameError, "O nome deve ter no máximo 120 caracteres.");
    valid = false;
  }

  if (!Number.isInteger(attendeeCount) || attendeeCount < 1) {
    setFieldError(countInput, countError, "Informe uma quantidade inteira de pelo menos 1 pessoa.");
    valid = false;
  } else if (attendeeCount > EVENT_CONFIG.maxAttendees) {
    setFieldError(countInput, countError, `A quantidade máxima é ${EVENT_CONFIG.maxAttendees} pessoas.`);
    valid = false;
  }
  return valid;
}

nameInput.addEventListener("input", () => setFieldError(nameInput, nameError, ""));
countInput.addEventListener("input", () => setFieldError(countInput, countError, ""));

function setFormBusy(isBusy) {
  submitButton.disabled = isBusy;
  submitButton.classList.toggle("is-loading", isBusy);
  submitButton.setAttribute("aria-busy", String(isBusy));
  submitButton.innerHTML = isBusy
    ? 'Enviando confirmação <span aria-hidden="true"> </span>'
    : 'Confirmar presença <span aria-hidden="true">→</span>';
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `form-status is-${type}`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (submitButton.disabled) return;
  if (!validateForm()) {
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  if (!EVENT_CONFIG.appsScriptUrl) {
    showStatus("As confirmações ainda não estão habilitadas. A família precisa configurar o serviço de recebimento.", "error");
    return;
  }

  showStatus("", "");
  setFormBusy(true);
  const nonce = crypto.randomUUID();
  const frameName = `rsvp-response-${nonce}`;
  const responseFrame = document.createElement("iframe");
  responseFrame.name = frameName;
  responseFrame.title = "Resposta do serviço de confirmação";
  responseFrame.hidden = true;
  responseFrame.setAttribute("aria-hidden", "true");
  document.body.append(responseFrame);

  const fields = {
    name: nameInput.value.trim(),
    attendees: countInput.value,
    nonce,
    maxAttendees: String(EVENT_CONFIG.maxAttendees)
  };
  const hiddenForm = document.createElement("form");
  hiddenForm.method = "post";
  hiddenForm.action = EVENT_CONFIG.appsScriptUrl;
  hiddenForm.target = frameName;
  hiddenForm.hidden = true;
  Object.entries(fields).forEach(([key, value]) => {
    const field = document.createElement("input");
    field.type = "hidden";
    field.name = key;
    field.value = value;
    hiddenForm.append(field);
  });
  document.body.append(hiddenForm);

  let settled = false;
  const timeoutId = window.setTimeout(() => {
    if (settled) return;
    settled = true;
    showStatus("Não foi possível confirmar o recebimento. Verifique sua conexão e tente novamente.", "error");
    setFormBusy(false);
    cleanup();
  }, 25_000);

  function cleanup() {
    window.clearTimeout(timeoutId);
    window.removeEventListener("message", onResponse);
    hiddenForm.remove();
    responseFrame.remove();
  }

  function onResponse(messageEvent) {
    if (messageEvent.source !== responseFrame.contentWindow || settled) return;
    const result = messageEvent.data;
    if (!result || result.type !== "maria-helena-rsvp" || result.nonce !== nonce) return;
    settled = true;
    cleanup();
    setFormBusy(false);
    if (result.ok === true) {
      showStatus("Presença confirmada com sucesso! Obrigada por fazer parte desse dia especial. 💕", "success");
      form.reset();
      countInput.value = "1";
      document.querySelector("#confirmar").classList.add("celebrate");
      window.setTimeout(() => document.querySelector("#confirmar").classList.remove("celebrate"), 1200);
    } else {
      showStatus(typeof result.message === "string" && result.message
        ? result.message
        : "Não foi possível registrar sua confirmação. Tente novamente.", "error");
    }
  }

  window.addEventListener("message", onResponse);
  hiddenForm.submit();
});
