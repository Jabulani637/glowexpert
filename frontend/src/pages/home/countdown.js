import { $ } from '../../lib/dom.js';

export function setupCountdown() {
  const flashSaleSection = $('flashSale');
  const timerDays = $('timerDays');
  const timerHours = $('timerHours');
  const timerMins = $('timerMins');
  const timerSecs = $('timerSecs');

  if (!flashSaleSection || !timerDays) return;

  // TODO: Wire this to a real `sale_ends_at` field from /api/settings later
  const endTime = new Date().getTime() + 24 * 60 * 60 * 1000;

  function update() {
    const now = new Date().getTime();
    const distance = endTime - now;

    if (distance < 0) {
      flashSaleSection.style.display = 'none';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    timerDays.textContent = String(days).padStart(2, '0');
    timerHours.textContent = String(hours).padStart(2, '0');
    timerMins.textContent = String(minutes).padStart(2, '0');
    timerSecs.textContent = String(seconds).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}
